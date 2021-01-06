import { IRuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Rule from '@civ-clone/core-rule/Rule';
import World from '../World';
declare type BuiltArgs = [World];
export declare class Built extends Rule<BuiltArgs, void> {}
export default Built;
export interface IBuiltRegistry extends IRuleRegistry<Built, BuiltArgs, void> {}
