import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import { YieldRegistry } from '@civ-clone/core-yield/YieldRegistry';
import { Tile, IYieldMap } from './Tile';
import Player from '@civ-clone/core-player/Player';
import Yield from '@civ-clone/core-yield/Yield';
export interface ITileset extends IEntityRegistry<Tile> {
  push(...tiles: Tile[]): void;
  score(
    player: Player,
    values?: IYieldMap[],
    yieldEntries?: typeof Yield[],
    yieldRegistry?: YieldRegistry
  ): number;
  shift(): Tile;
  unregister(...entities: Tile[]): void;
  yields(
    player: Player,
    yields: typeof Yield[],
    yieldRegistry: YieldRegistry
  ): Yield[];
}
export declare class Tileset extends EntityRegistry implements ITileset {
  static from(...tiles: Tile[]): Tileset;
  static fromSurrounding(tile: Tile, radius?: number): Tileset;
  constructor(...tiles: Tile[]);
  push(...tiles: Tile[]): void;
  shift(): Tile;
  score(
    player: Player,
    values?: IYieldMap[],
    yieldEntries?: typeof Yield[],
    yieldRegistry?: YieldRegistry
  ): number;
  yields(
    player: Player,
    yields?: typeof Yield[],
    yieldRegistry?: YieldRegistry
  ): Yield[];
}
export default Tileset;
