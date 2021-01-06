import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import {
  YieldRegistry,
  instance as yieldRegistryInstance,
} from '@civ-clone/core-yield/YieldRegistry';
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

export class Tileset extends EntityRegistry implements ITileset {
  static from(...tiles: Tile[]): Tileset {
    return new this(...tiles);
  }

  static fromSurrounding(tile: Tile, radius: number = 2): Tileset {
    const gen = (radius: number): [number, number][] => {
      const pairs: [number, number][] = [];

      for (let x: number = tile.x() - radius; x <= tile.x() + radius; x++) {
        for (let y: number = tile.y() - radius; y <= tile.y() + radius; y++) {
          pairs.push([x, y]);
        }
      }

      return pairs;
    };

    return this.from(
      ...gen(radius).map(
        ([x, y]: [number, number]): Tile => tile.map().get(x, y)
      )
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

  score(
    player: Player,
    values: IYieldMap[] = [],
    yieldEntries: typeof Yield[] = [],
    yieldRegistry: YieldRegistry = yieldRegistryInstance
  ): number {
    return this.map((tile: Tile): number =>
      tile.score(player, values, yieldEntries, yieldRegistry)
    ).reduce((total: number, score: number): number => total + score, 0);
  }

  yields(
    player: Player,
    yields: typeof Yield[] = [],
    yieldRegistry: YieldRegistry = yieldRegistryInstance
  ): Yield[] {
    if (yields.length === 0) {
      yields = yieldRegistry.entries();
    }

    return this.entries().reduce(
      (tilesetYields: Yield[], tile: Tile): Yield[] =>
        tile.yields(player, yields, yieldRegistry).map(
          (tileYield: Yield): Yield => {
            const [existingYield] = tilesetYields.filter(
              (existingYield: Yield): boolean =>
                existingYield instanceof tileYield.constructor
            );

            if (existingYield instanceof Yield) {
              tileYield.add(existingYield, `tile-${tile.x()},${tile.y()}`);
            }

            return tileYield;
          }
        ),
      yields.map((YieldType: typeof Yield): Yield => new YieldType())
    );
  }
}

export default Tileset;
