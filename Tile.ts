import {
  IDataObject,
  DataObject,
} from '@civ-clone/core-data-object/DataObject';
import { Land, Water } from '@civ-clone/core-terrain/Types';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import { Yield as YieldRule, IYieldRegistry } from './Rules/Yield';
import { YieldModifier, IYieldModifierRegistry } from './Rules/YieldModifier';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';

export type IAdjacentTiles = 'n' | 'e' | 's' | 'w';
export type INeighbouringTiles = IAdjacentTiles | 'ne' | 'se' | 'sw' | 'nw';
type IYieldCache = Map<Player | null, Yield[]>;
export type IYieldMap = [typeof Yield, number];

export interface ITile extends IDataObject {
  clearYieldCache(player: Player | null): void;
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
  score(player: Player | null, values: IYieldMap[]): number;
  terrain(): Terrain;
  setTerrain(terrain: Terrain): void;
  x(): number;
  y(): number;
  yields(player: Player | null): Yield[];
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
    this.#yieldCache.delete(player);
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

  score(
    player: Player | null = null,
    values: IYieldMap[] = [[Yield, 3]]
  ): number {
    const yields = this.yields(player);

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

  yields(player: Player | null = null): Yield[] {
    if (!this.#yieldCache.has(player)) {
      const tileYields = (this.#ruleRegistry as IYieldRegistry)
        .process(YieldRule, this, player)
        .flat();

      (this.#ruleRegistry as IYieldModifierRegistry)
        .process(YieldModifier, this, player, tileYields)
        .flat();

      this.#yieldCache.set(player, tileYields);
    }

    return this.#yieldCache.get(player)!;
  }
}

export default Tile;
