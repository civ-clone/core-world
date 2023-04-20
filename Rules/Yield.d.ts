import Player from '@civ-clone/core-player/Player';
import Rule from '@civ-clone/core-rule/Rule';
import Tile from '../Tile';
import YieldValue from '@civ-clone/core-yield/Yield';
type YieldArgs = [Tile, Player | null];
export declare class Yield extends Rule<YieldArgs, YieldValue | YieldValue[]> {}
export default Yield;
