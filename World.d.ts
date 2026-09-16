import {
  DataObject,
  IDataObject,
} from '@civ-clone/core-data-object/DataObject';
import { LandMassRegistry } from './LandMassRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { IRegistryIterator } from '@civ-clone/core-registry/Registry';
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
export declare class World extends DataObject implements IWorld {
  static readonly transient: string[];
  private _generator;
  private _height;
  private _landMassRegistry;
  private _ruleRegistry;
  private _tiles;
  private _width;
  constructor(
    generator: Generator,
    ruleRegistry?: RuleRegistry,
    landMassRegistry?: LandMassRegistry
  );
  build(): Promise<World>;
  entries(): Tile[];
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
  /**
   * Put the registry back around the restored tiles.
   *
   * `_tiles` is an `EntityRegistry` held as a field, and `core-save-game`
   * writes one as an array of its members: the class around a collection is
   * the one thing the format cannot record. So a loaded world arrives with a
   * plain `Tile[]` here, and `tiles()` — `this._tiles.entries()` — hands back
   * an array iterator. Nothing fails at load; the first thing to notice is
   * `Tileset.from` choking on pairs when something asks a tile for its
   * surroundings, several turns into a game that was loaded successfully.
   *
   * The tiles themselves are saved entities and are restored before this runs,
   * so only the container has to be rebuilt.
   */
  onHydrated(): void;
}
export default World;
