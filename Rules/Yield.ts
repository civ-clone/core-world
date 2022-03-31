import { IRuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import Rule from '@civ-clone/core-rule/Rule';
import Tile from '../Tile';
import YieldValue from '@civ-clone/core-yield/Yield';

type YieldArgs = [Tile, Player | null];

export class Yield extends Rule<YieldArgs, YieldValue | YieldValue[]> {}

export default Yield;

export interface IYieldRegistry
  extends IRuleRegistry<Yield, YieldArgs, YieldValue | YieldValue[]> {}
