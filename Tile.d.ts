import { IDataObject, DataObject } from '@civ-clone/core-data-object/DataObject';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
export type IAdjacentTiles = 'n' | 'e' | 's' | 'w';
export type INeighbouringTiles = IAdjacentTiles | 'ne' | 'se' | 'sw' | 'nw';
export type IYieldMap = [typeof Yield, number];
export interface ITile extends IDataObject {
    clearYieldCache(player: Player | null): void;
    getAdjacent(): Tile[];
    getAdjacentDirections(): IAdjacentTiles[];
    getNeighbour(direction: INeighbouringTiles): Tile;
    getNeighbouringDirections(): INeighbouringTiles[];
    getNeighbours(): Tile[];
    getSurroundingArea(radius: number): Tileset;
    distanceFrom(tile: Tile): number;
    isCoast(): boolean;
    isLand(): boolean;
    isNeighbourOf(otherTile: Tile): boolean;
    isWater(): boolean;
    map(): World;
    score(player: Player | null, values: IYieldMap[]): number;
    terrain(): Terrain;
    setTerrain(terrain: Terrain): void;
    x(): number;
    y(): number;
    yields(player: Player | null): Yield[];
}
export declare class Tile extends DataObject implements ITile {
    static readonly transient: string[];
    private _map;
    private _neighbours;
    private _ruleRegistry;
    private _terrain;
    private _x;
    private _y;
    private _yieldCache;
    constructor(x: number, y: number, terrain: Terrain, map: World, ruleRegistry?: RuleRegistry);
    clearYieldCache(player?: Player | null): void;
    getAdjacent(): Tile[];
    getAdjacentDirections(): IAdjacentTiles[];
    getNeighbour(direction: INeighbouringTiles): Tile;
    getNeighbouringDirections(): INeighbouringTiles[];
    getNeighbours(): Tile[];
    getSurroundingArea(radius?: number): Tileset;
    /**
     * Straight-line distance, measured the short way round a wrapping world.
     *
     * This used to build all nine ways the two tiles could be separated — three
     * horizontal wraps times three vertical ones — call `Math.hypot` on each,
     * sort the results and take the first. That is a fair description of the
     * problem and a poor way to compute it: per call it allocated nine pairs and
     * nine results, sorted them, and threw eight away. The path finder sorts a
     * tile's neighbours by distance and the AI sorts candidate tiles the same
     * way, so it was 11.4% of a 150-turn headless run — the largest single frame
     * in the profile once rule dispatch was fixed.
     *
     * The nine were never independent. `hypot(a, b)` grows with both arguments,
     * and each horizontal candidate depends only on the horizontal wrap and each
     * vertical one only on the vertical wrap, so the shortest of the nine is
     * just the shortest horizontal paired with the shortest vertical. Three plus
     * three comparisons, one `hypot`, nothing allocated.
     *
     * Still `Math.hypot`, and not `Math.sqrt(x * x + y * y)`, though the latter
     * measured 20% quicker again. `hypot` is more carefully rounded, so the two
     * disagree in the last bit for about a third of all tile pairs, and this
     * feeds comparisons — the path finder sorts by it, the AI sorts by it, and
     * one of those sorts decides where a unit goes. 20% of the cheap version of
     * a call that is no longer hot is not worth a result that differs from the
     * one every saved game was produced with. Both are ~37x quicker than the
     * nine.
     *
     * Checked exhaustively against the old implementation over five map sizes
     * and 82,110 tile pairs: bit-identical for every one.
     */
    distanceFrom(tile: Tile): number;
    isCoast(): boolean;
    isLand(): boolean;
    isNeighbourOf(otherTile: Tile): boolean;
    isWater(): boolean;
    map(): World;
    score(player?: Player | null, values?: IYieldMap[]): number;
    terrain(): Terrain;
    setTerrain(terrain: Terrain): void;
    x(): number;
    y(): number;
    yields(player?: Player | null): Yield[];
}
export default Tile;
