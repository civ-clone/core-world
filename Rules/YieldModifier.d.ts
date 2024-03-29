import Player from '@civ-clone/core-player/Player';
import Rule from '@civ-clone/core-rule/Rule';
import Tile from '../Tile';
import YieldValue from '@civ-clone/core-yield/Yield';
type YieldModifierArgs = [Tile, Player | null, YieldValue[]];
export declare class YieldModifier extends Rule<YieldModifierArgs, void> {}
export default YieldModifier;
