import Generator from '@civ-clone/core-world-generator/Generator';
import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Tile from './Tile';
export interface IWorld extends IEntityRegistry<Tile> {
  build(ruleRegistry: RuleRegistry): void;
  get(x: number, y: number): Tile;
  height(): number;
  width(): number;
}
export declare class World extends EntityRegistry<Tile> implements IWorld {
  #private;
  constructor(generator: Generator);
  build(ruleRegistry?: RuleRegistry): void;
  get(x: number, y: number): Tile;
  height(): number;
  width(): number;
}
export default World;
