import {
  IDataObject,
  DataObject,
} from '@civ-clone/core-data-object/DataObject';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { YieldRegistry } from '@civ-clone/core-yield/YieldRegistry';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
export declare type IYieldMap = [typeof Yield, number];
declare type IYieldEntry = Map<typeof Yield, number>;
export declare type IAdjacentTiles = 'n' | 'e' | 's' | 'w';
export declare type INeighbouringTiles =
  | IAdjacentTiles
  | 'ne'
  | 'se'
  | 'sw'
  | 'nw';
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
export declare class Tile extends DataObject implements ITile {
  #private;
  constructor(
    x: number,
    y: number,
    terrain: Terrain,
    map: World,
    ruleRegistry?: RuleRegistry
  );
  clearYieldCache(player?: Player | null): void;
  getYieldCache(player?: Player | null): IYieldEntry;
  getAdjacent(): Tile[];
  getAdjacentDirections(): IAdjacentTiles[];
  getNeighbour(direction: INeighbouringTiles): Tile;
  getNeighbouringDirections(): INeighbouringTiles[];
  getNeighbours(): Tile[];
  getSurroundingArea(radius?: number): Tileset;
  distanceFrom(tile: Tile): number;
  isCoast(): boolean;
  isLand(): boolean;
  isNeighbourOf(otherTile: Tile): boolean;
  isWater(): boolean;
  map(): World;
  resource(type: Yield, player: Player): Yield;
  score(
    player: Player,
    values?: IYieldMap[],
    yieldEntries?: typeof Yield[],
    yieldRegistry?: YieldRegistry
  ): number;
  terrain(): Terrain;
  setTerrain(terrain: Terrain): void;
  x(): number;
  y(): number;
  yields(
    player: Player,
    yields?: typeof Yield[],
    yieldRegistry?: YieldRegistry
  ): Yield[];
}
export default Tile;
