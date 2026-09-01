import {
  IDataObject,
  DataObject,
} from '@civ-clone/core-data-object/DataObject';
import { Land, Water } from '@civ-clone/core-terrain/Types';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
import YieldModifier from './Rules/YieldModifier';
import YieldRule from './Rules/Yield';

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
  private _map: World;
  private _neighbours: Tile[] = [];
  private _ruleRegistry: RuleRegistry;
  private _terrain: Terrain;
  private _x: number;
  private _y: number;
  private _yieldCache: IYieldCache = new Map();

  constructor(
    x: number,
    y: number,
    terrain: Terrain,
    map: World,
    ruleRegistry: RuleRegistry = ruleRegistryInstance
  ) {
    super();

    this._x = x;
    this._y = y;
    this._terrain = terrain;
    this._map = map;
    this._ruleRegistry = ruleRegistry;

    this.addKey('terrain', 'isCoast', 'isLand', 'isWater', 'x', 'y', 'yields');
  }

  clearYieldCache(player: Player | null = null): void {
    this._yieldCache.delete(player);
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
      return this._map.get(this._x, this._y - 1);
    }

    if (direction === 'ne') {
      return this._map.get(this._x + 1, this._y - 1);
    }

    if (direction === 'e') {
      return this._map.get(this._x + 1, this._y);
    }

    if (direction === 'se') {
      return this._map.get(this._x + 1, this._y + 1);
    }

    if (direction === 's') {
      return this._map.get(this._x, this._y + 1);
    }

    if (direction === 'sw') {
      return this._map.get(this._x - 1, this._y + 1);
    }

    if (direction === 'w') {
      return this._map.get(this._x - 1, this._y);
    }

    return this._map.get(this._x - 1, this._y - 1);
  }

  getNeighbouringDirections(): INeighbouringTiles[] {
    return ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
  }

  getNeighbours(): Tile[] {
    if (!this._neighbours.length) {
      this._neighbours = this.getNeighbouringDirections().map(
        (direction: INeighbouringTiles): Tile => this.getNeighbour(direction)
      );
    }

    return this._neighbours;
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
            this._x - tile.x() + x * this._map.width(),
            this._y - tile.y() + y * this._map.height()
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
    return this._terrain instanceof Land;
  }

  isNeighbourOf(otherTile: Tile): boolean {
    return this.getNeighbours().includes(otherTile);
  }

  isWater(): boolean {
    return this._terrain instanceof Water;
  }

  map(): World {
    return this._map;
  }

  score(
    player: Player | null = null,
    values: IYieldMap[] = [[Yield, 3]]
  ): number {
    const yields = this.yields(player);

    return yields
      .map((tileYield: Yield): number => {
        const [value]: IYieldMap[] = values.filter(
            ([YieldType]: IYieldMap): boolean => tileYield instanceof YieldType
          ),
          weight: number = value ? value[1] || 1 : 0;

        return tileYield.value() * weight;
      })
      .reduce((total: number, value: number): number => total + value, 0);
  }

  terrain(): Terrain {
    return this._terrain;
  }

  setTerrain(terrain: Terrain): void {
    this._terrain = terrain;
  }

  x(): number {
    return this._x;
  }

  y(): number {
    return this._y;
  }

  yields(player: Player | null = null): Yield[] {
    if (!this._yieldCache.has(player)) {
      const tileYields = this._ruleRegistry
        .process(YieldRule, this, player)
        .flat();

      this._ruleRegistry
        .process(YieldModifier, this, player, tileYields)
        .flat();

      this._yieldCache.set(player, tileYields);
    }

    return this._yieldCache.get(player)!;
  }
}

export default Tile;
