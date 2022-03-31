import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import { Tile, IYieldMap } from './Tile';
import Player from '@civ-clone/core-player/Player';
import Yield from '@civ-clone/core-yield/Yield';
export interface ITileset extends IEntityRegistry<Tile> {
  push(...tiles: Tile[]): void;
  score(player: Player, values?: IYieldMap[]): number;
  shift(): Tile;
  unregister(...entities: Tile[]): void;
  yields(player: Player): Yield[];
}
export declare class Tileset extends EntityRegistry implements ITileset {
  static from(...tiles: Tile[]): Tileset;
  static fromSurrounding(tile: Tile, radius?: number): Tileset;
  constructor(...tiles: Tile[]);
  push(...tiles: Tile[]): void;
  shift(): Tile;
  score(player?: Player | null, values?: IYieldMap[]): number;
  yields(player?: Player | null): Yield[];
}
export default Tileset;
