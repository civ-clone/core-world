import { IRuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Rule from '@civ-clone/core-rule/Rule';
import World from '../World';

type BuiltArgs = [World];

export class Built extends Rule<BuiltArgs, void> {}

export default Built;

export interface IBuiltRegistry extends IRuleRegistry<Built, BuiltArgs, void> {}
