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

export class Tileset extends EntityRegistry implements ITileset {
  static from(...tiles: Tile[]): Tileset {
    return new this(...tiles);
  }

  /**
   * The tiles within `radius` of `tile`, in the order the world's topology
   * documents for `area` — for the square grid, the x-major box.
   */
  static fromSurrounding(tile: Tile, radius: number = 2): Tileset {
    const map = tile.map();

    return this.from(
      ...map
        .topology()
        .area(tile.x(), tile.y(), radius)
        .map(([x, y]: [number, number]): Tile => map.get(x, y))
    );
  }

  constructor(...tiles: Tile[]) {
    super(Tile);

    this.register(...tiles);
  }

  push(...tiles: Tile[]): void {
    this.register(...tiles);
  }

  shift(): Tile {
    const [first] = this.entries();

    this.unregister(first);

    return first;
  }

  score(player: Player | null = null, values: IYieldMap[] = []): number {
    return this.entries().reduce(
      (total: number, tile: Tile): number => total + tile.score(player, values),
      0
    );
  }

  yields(player: Player | null = null): Yield[] {
    return this.entries().flatMap((tile) => tile.yields(player));
  }
}

export default Tileset;
