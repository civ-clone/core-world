import {
  DataObject,
  IDataObject,
} from '@civ-clone/core-data-object/DataObject';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { IRegistryIterator } from '@civ-clone/core-registry/Registry';
import Tile from './Tile';
export interface IWorld extends IDataObject {
  build(): Promise<World>;
  get(x: number, y: number): Tile;
  height(): number;
  width(): number;
}
export declare class World extends DataObject implements IWorld {
  #private;
  constructor(generator: Generator, ruleRegistry?: RuleRegistry);
  build(): Promise<World>;
  entries(): Tile[];
  filter(iterator: IRegistryIterator<Tile>): Tile[];
  forEach(iterator: (item: Tile, i: number) => void): void;
  get(x: number, y: number): Tile;
  height(): number;
  includes(tile: Tile): boolean;
  map(iterator: (item: Tile, i: number) => any): any[];
  register(...tiles: Tile[]): void;
  tiles(): Tile[];
  width(): number;
}
export default World;
