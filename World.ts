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
  width(): number;
}

export class World extends DataObject implements IWorld {
  #generator: Generator;
  #height: number;
  #landMassRegistry: LandMassRegistry;
  #ruleRegistry: RuleRegistry;
  #tiles: EntityRegistry<Tile> = new EntityRegistry(Tile);
  #width: number;

  constructor(
    generator: Generator,
    ruleRegistry: RuleRegistry = ruleRegistryInstance,
    landMassRegistry: LandMassRegistry = landMassRegistryInstance
  ) {
    super();

    this.#generator = generator;
    this.#height = generator.height();
    this.#landMassRegistry = landMassRegistry;
    this.#width = generator.width();
    this.#ruleRegistry = ruleRegistry;

    this.addKey('height', 'tiles', 'width');
  }

  async build(): Promise<World> {
    const tiles = await this.#generator.generate(),
      landTiles: Tile[] = [];

    tiles.forEach((terrain: Terrain, i: number): void => {
      const tile = new Tile(
        i % this.#width,
        Math.floor(i / this.#width),
        terrain,
        this,
        this.#ruleRegistry
      );

      this.#tiles.register(tile);

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

      this.#landMassRegistry.register(new LandMass(continent));
    }

    this.#ruleRegistry.process(Built, this);

    return this;
  }

  entries(): Tile[] {
    return this.#tiles.entries();
  }

  filter(iterator: IRegistryIterator<Tile>): Tile[] {
    return this.entries().filter(iterator);
  }

  forEach(iterator: (item: Tile, i: number) => void): void {
    return this.#tiles.forEach(iterator);
  }

  get(x: number, y: number): Tile {
    return this.entries()[this.#generator.coordsToIndex(x, y)];
  }

  height(): number {
    return this.#height;
  }

  includes(tile: Tile): boolean {
    return this.#tiles.includes(tile);
  }

  landMasses(): LandMass[] {
    return this.#landMassRegistry.entries();
  }

  map(iterator: (item: Tile, i: number) => any): any[] {
    return this.#tiles.map(iterator);
  }

  register(...tiles: Tile[]): void {
    this.#tiles.register(...tiles);
  }

  tiles(): Tile[] {
    return this.entries();
  }

  width(): number {
    return this.#width;
  }
}

export default World;
