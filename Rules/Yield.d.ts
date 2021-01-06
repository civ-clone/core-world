import { IRuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import Rule from '@civ-clone/core-rule/Rule';
import Tile from '../Tile';
import YieldValue from '@civ-clone/core-yield/Yield';
export declare class Yield extends Rule<[YieldValue, Tile, Player], void> {}
export default Yield;
export interface IYieldRegistry
  extends IRuleRegistry<Yield, [YieldValue, Tile, Player], void> {}
