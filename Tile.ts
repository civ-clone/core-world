import {
  IDataObject,
  DataObject,
} from '@civ-clone/core-data-object/DataObject';
import { Land, Water } from '@civ-clone/core-terrain/Types';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  YieldRegistry,
  instance as yieldRegistryInstance,
} from '@civ-clone/core-yield/YieldRegistry';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule, { IYieldRegistry } from './Rules/Yield';

export type IYieldMap = [typeof Yield, number];
type IYieldEntry = Map<typeof Yield, number>;
type IYieldCache = Map<Player | null, IYieldEntry>;
export type IAdjacentTiles = 'n' | 'e' | 's' | 'w';
export type INeighbouringTiles = IAdjacentTiles | 'ne' | 'se' | 'sw' | 'nw';

export interface ITile extends IDataObject {
  clearYieldCache(player: Player | null): void;
  getYieldCache(player: Player | null): IYieldEntry;
  getAdjacent(): Tile[];
  getAdjacentDirections(): IAdjacentTiles[];
  getNeighbour(direction: INeighbouringTiles): Tile;
  getNeighbouringDirections(): INeighbouringTiles[];
  getNeighbours(): Tile[];
  getSurroundingArea(radius: number): Tileset;
  distanceFrom(tile: Tile): number;
  isCoast(): boolean;
  isLand(): boolean;
  isNeighbourOf(otherTile: Tile): boolean;
  isWater(): boolean;
  map(): World;
  resource(type: Yield, player: Player | null): Yield;
  score(player: Player | null, values: IYieldMap[]): number;
  terrain(): Terrain;
  setTerrain(terrain: Terrain): void;
  x(): number;
  y(): number;
  yields(
    player: Player | null,
    yields: typeof Yield[],
    yieldRegistry: YieldRegistry
  ): Yield[];
}

export class Tile extends DataObject implements ITile {
  #map: World;
  #neighbours: Tile[] = [];
  #ruleRegistry: RuleRegistry;
  #terrain: Terrain;
  #x: number;
  #y: number;
  #yieldCache: IYieldCache = new Map();

  constructor(
    x: number,
    y: number,
    terrain: Terrain,
    map: World,
    ruleRegistry: RuleRegistry = ruleRegistryInstance
  ) {
    super();

    this.#x = x;
    this.#y = y;
    this.#terrain = terrain;
    this.#map = map;
    this.#ruleRegistry = ruleRegistry;

    this.addKey('terrain', 'isCoast', 'isLand', 'isWater', 'x', 'y', 'yields');
  }

  clearYieldCache(player: Player | null = null): void {
    if (player === null) {
      this.#yieldCache.clear();

      return;
    }

    this.#yieldCache.set(player, new Map());
  }

  getYieldCache(player: Player | null = null): IYieldEntry {
    const cacheCheck = this.#yieldCache.get(player);

    if (cacheCheck) {
      return cacheCheck;
    }

    const cache: IYieldEntry = new Map();

    this.#yieldCache.set(player, cache);

    return cache;
  }

  getAdjacent(): Tile[] {
    return this.getAdjacentDirections().map(
      (direction: IAdjacentTiles): Tile => this.getNeighbour(direction)
    );
  }

  getAdjacentDirections(): IAdjacentTiles[] {
    return ['n', 'e', 's', 'w'];
  }

  getNeighbour(direction: INeighbouringTiles): Tile {
    if (direction === 'n') {
      return this.#map.get(this.#x, this.#y - 1);
    }

    if (direction === 'ne') {
      return this.#map.get(this.#x + 1, this.#y - 1);
    }

    if (direction === 'e') {
      return this.#map.get(this.#x + 1, this.#y);
    }

    if (direction === 'se') {
      return this.#map.get(this.#x + 1, this.#y + 1);
    }

    if (direction === 's') {
      return this.#map.get(this.#x, this.#y + 1);
    }

    if (direction === 'sw') {
      return this.#map.get(this.#x - 1, this.#y + 1);
    }

    if (direction === 'w') {
      return this.#map.get(this.#x - 1, this.#y);
    }

    return this.#map.get(this.#x - 1, this.#y - 1);
  }

  getNeighbouringDirections(): INeighbouringTiles[] {
    return ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  }

  getNeighbours(): Tile[] {
    if (!this.#neighbours.length) {
      this.#neighbours = this.getNeighbouringDirections().map(
        (direction: INeighbouringTiles): Tile => this.getNeighbour(direction)
      );
    }

    return this.#neighbours;
  }

  getSurroundingArea(radius: number = 2): Tileset {
    return Tileset.fromSurrounding(this, radius);
  }

  distanceFrom(tile: Tile): number {
    const map: [number, number][] = [
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, 1],
        [0, 0],
        [0, -1],
        [1, 1],
        [1, 0],
        [1, -1],
      ],
      [shortestDistance] = map
        .map(([x, y]: [number, number]): number =>
          Math.hypot(
            this.#x - tile.x() + x * this.#map.width(),
            this.#y - tile.y() + y * this.#map.height()
          )
        )
        .sort((a: number, b: number): number => a - b);
    return shortestDistance;
  }

  isCoast(): boolean {
    const tile = this;

    return (
      (tile.isWater() &&
        tile.getNeighbours().some((tile: Tile): boolean => tile.isLand())) ||
      (tile.isLand() &&
        tile.getNeighbours().some((tile: Tile): boolean => tile.isWater()))
    );
  }

  isLand(): boolean {
    return this.#terrain instanceof Land;
  }

  isNeighbourOf(otherTile: Tile): boolean {
    return this.getNeighbours().includes(otherTile);
  }

  isWater(): boolean {
    return this.#terrain instanceof Water;
  }

  map(): World {
    return this.#map;
  }

  resource(type: Yield, player: Player): Yield {
    const yieldCache = this.getYieldCache(player);

    if (yieldCache.has(<typeof Yield>type.constructor)) {
      const cachedYield = yieldCache.get(<typeof Yield>type.constructor);

      if (typeof cachedYield === 'number') {
        type.add(cachedYield);

        return type;
      }
    }

    (this.#ruleRegistry as IYieldRegistry).process(
      YieldRule,
      type,
      this,
      player
    );

    yieldCache.set(<typeof Yield>type.constructor, type.value());

    return type;
  }

  score(
    player: Player,
    values: IYieldMap[] = [[Yield, 3]],
    yieldEntries: typeof Yield[] = [],
    yieldRegistry: YieldRegistry = yieldRegistryInstance
  ): number {
    const yields = this.yields(player, yieldEntries, yieldRegistry);

    return (
      yields
        .map((tileYield: Yield): number => {
          const [value]: IYieldMap[] = values.filter(
              ([YieldType]: IYieldMap): boolean =>
                tileYield instanceof YieldType
            ),
            weight: number = value ? value[1] || 1 : 0;

          return tileYield.value() * weight;
        })
        .reduce((total: number, value: number): number => total + value, 0) *
      // Ensure we have some of each scored yield
      (values.every(
        ([YieldType, value]: IYieldMap) =>
          value < 1 ||
          yields.some(
            (tileYield: Yield): boolean => tileYield instanceof YieldType
          )
      )
        ? 1
        : 0)
    );
  }

  terrain(): Terrain {
    return this.#terrain;
  }

  setTerrain(terrain: Terrain): void {
    this.#terrain = terrain;
  }

  x(): number {
    return this.#x;
  }

  y(): number {
    return this.#y;
  }

  yields(
    player: Player,
    yields: typeof Yield[] = [],
    yieldRegistry: YieldRegistry = yieldRegistryInstance
  ): Yield[] {
    if (yields.length === 0) {
      yields = yieldRegistry.entries();
    }

    return yields.map(
      (YieldType: typeof Yield): Yield => this.resource(new YieldType(), player)
    );
  }
}

export default Tile;
