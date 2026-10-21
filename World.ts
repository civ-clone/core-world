import {
  DataObject,
  IDataObject,
} from '@civ-clone/core-data-object/DataObject';
import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from './LandMassRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Built from './Rules/Built';
import EntityRegistry from '@civ-clone/core-registry/EntityRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { IRegistryIterator } from '@civ-clone/core-registry/Registry';
import { ITopology } from './Topology';
import SquareTopology from './SquareTopology';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from './Tile';
import LandMass from './LandMass';

export interface IWorld extends IDataObject {
  build(): Promise<World>;
  filter(iterator: IRegistryIterator<Tile>): Tile[];
  forEach(iterator: (item: Tile, i: number) => void): void;
  get(x: number, y: number): Tile;
  height(): number;
  includes(tile: Tile): boolean;
  landMasses(): LandMass[];
  map(iterator: (item: Tile, i: number) => any): any[];
  register(...tiles: Tile[]): void;
  tiles(): Tile[];
  topology(): ITopology;
  width(): number;
}

export class World extends DataObject implements IWorld {
  static readonly transient = [
    '_generator',
    '_landMassRegistry',
    '_ruleRegistry',
    '_tileCache',
    '_topology',
  ];
  private _generator: Generator;
  private _height: number;
  private _landMassRegistry: LandMassRegistry;
  private _ruleRegistry: RuleRegistry;
  private _tiles: EntityRegistry<Tile> = new EntityRegistry(Tile);
  /**
   * The registry's tiles in registration order, for `get`.
   *
   * `EntityRegistry.entries()` hands back a defensive copy, which is right for
   * a caller that might sort or splice what it gets and ruinous for a caller
   * that wants one element: `get` copied all 2,400 tiles of a 60x40 world to
   * index one of them, and `Tile.getNeighbour` calls it eight times per tile.
   * Counting the copies over thirty turns found 204,552 calls moving **490
   * million** tile references, 98.5% of all registry copying in the run.
   *
   * Rebuilt lazily and dropped whenever a tile is registered, which is the
   * only way `_tiles` changes — nothing unregisters a tile from the world.
   * Transient: a saved world carries its tiles, and `onHydrated` rebuilds the
   * registry around them.
   */
  private _tileCache: Tile[] | null = null;
  /**
   * The shape of the grid: neighbours, distance and surrounding areas, which
   * `Tile` and `Tileset` ask for rather than working out themselves.
   *
   * Built lazily from the dimensions, so it is configuration rather than
   * state and is not saved — a loaded world rebuilds it on first use. Every
   * world is square for now; recording which topology a world uses in its
   * save is web-renderer#89.
   */
  private _topology: ITopology | null = null;
  private _width: number;

  constructor(
    generator: Generator,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    landMassRegistry: LandMassRegistry = landMassRegistryInstance
  ) {
    super();

    this._generator = generator;
    this._height = generator.height();
    this._landMassRegistry = landMassRegistry;
    this._width = generator.width();
    this._ruleRegistry = ruleRegistry;

    this.addKey('height', 'tiles', 'width');
  }

  async build(): Promise<World> {
    const tiles = await this._generator.generate(),
      landTiles: Tile[] = [];

    tiles.forEach((terrain: Terrain, i: number): void => {
      const tile = new Tile(
        i % this._width,
        Math.floor(i / this._width),
        terrain,
        this,
        this._ruleRegistry
      );

      this.register(tile);

      if (tile.isLand()) {
        landTiles.push(tile);
      }
    });

    while (landTiles.length) {
      const currentQueue = landTiles.slice(0, 1),
        continent = [];

      while (currentQueue.length) {
        const currentTile = currentQueue.shift()!;

        // This should never be hit
        if (!landTiles.includes(currentTile)) {
          continue;
        }

        landTiles.splice(landTiles.indexOf(currentTile), 1);
        continent.push(currentTile);

        currentTile.getNeighbours().forEach((tile) => {
          if (!landTiles.includes(tile) || !tile.isLand()) {
            return;
          }

          currentQueue.push(tile);
        });
      }

      this._landMassRegistry.register(new LandMass(continent));
    }

    this._ruleRegistry.process(Built, this);

    return this;
  }

  entries(): Tile[] {
    return this._tiles.entries();
  }

  filter(iterator: IRegistryIterator<Tile>): Tile[] {
    return this.entries().filter(iterator);
  }

  forEach(iterator: (item: Tile, i: number) => void): void {
    return this._tiles.forEach(iterator);
  }

  get(x: number, y: number): Tile {
    // Falsy rather than `=== null`: `Game.inject` is what puts a transient
    // field back after a load, and one it has no entry for arrives as
    // `undefined`. That is asserted against — `tests/engine/inject.ts` caught
    // exactly this, before `_tileCache` was added to `Game.inject`'s caches —
    // but the guard costs nothing and what it prevents is `undefined[index]`
    // deep inside a loaded game.
    if (!this._tileCache) {
      this._tileCache = this._tiles.entries();
    }

    return this._tileCache[this._generator.coordsToIndex(x, y)];
  }

  height(): number {
    return this._height;
  }

  includes(tile: Tile): boolean {
    return this._tiles.includes(tile);
  }

  landMasses(): LandMass[] {
    return this._landMassRegistry.entries();
  }

  map(iterator: (item: Tile, i: number) => any): any[] {
    return this._tiles.map(iterator);
  }

  register(...tiles: Tile[]): void {
    this._tiles.register(...tiles);
    this._tileCache = null;
  }

  tiles(): Tile[] {
    return this.entries();
  }

  topology(): ITopology {
    // Falsy rather than `=== null`, for the reason given in `get`.
    if (!this._topology) {
      const topology = new SquareTopology(this._width, this._height);

      topology.validate(this._width, this._height);

      this._topology = topology;
    }

    return this._topology;
  }

  width(): number {
    return this._width;
  }

  /**
   * Put the registry back around the restored tiles.
   *
   * `_tiles` is an `EntityRegistry` held as a field, and `core-save-game`
   * writes one as an array of its members: the class around a collection is
   * the one thing the format cannot record. So a loaded world arrives with a
   * plain `Tile[]` here, and `tiles()` — `this._tiles.entries()` — hands back
   * an array iterator. Nothing fails at load; the first thing to notice is
   * `Tileset.from` choking on pairs when something asks a tile for its
   * surroundings, several turns into a game that was loaded successfully.
   *
   * The tiles themselves are saved entities and are restored before this runs,
   * so only the container has to be rebuilt.
   *
   * `_topology` is reset here as well. It is transient, and `Game.inject`
   * fails a load that leaves a transient field `undefined`; it has no entry
   * for this one, and needs none, because `topology()` rebuilds it from the
   * restored dimensions on first use. A hook runs before that check.
   */
  onHydrated(): void {
    const tiles = this._tiles as unknown;

    this._topology = null;

    if (!Array.isArray(tiles)) {
      return;
    }

    this._tiles = new EntityRegistry(Tile);
    this.register(...(tiles as Tile[]));
  }
}

export default World;
