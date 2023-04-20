import {
  IDataObject,
  DataObject,
} from '@civ-clone/core-data-object/DataObject';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
export type IAdjacentTiles = 'n' | 'e' | 's' | 'w';
export type INeighbouringTiles = IAdjacentTiles | 'ne' | 'se' | 'sw' | 'nw';
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
  score(player?: Player | null, values?: IYieldMap[]): number;
  terrain(): Terrain;
  setTerrain(terrain: Terrain): void;
  x(): number;
  y(): number;
  yields(player?: Player | null): Yield[];
}
export default Tile;
