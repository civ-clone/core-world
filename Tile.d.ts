import { IDataObject, DataObject } from '@civ-clone/core-data-object/DataObject';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Player from '@civ-clone/core-player/Player';
import { SquareDirection, SquareEdgeDirection } from './SquareTopology';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tileset from './Tileset';
import World from './World';
import Yield from '@civ-clone/core-yield/Yield';
/** The square grid's edge directions: an alias kept for consumers. */
export type IAdjacentTiles = SquareEdgeDirection;
/** The square grid's directions: an alias kept for consumers. */
export type INeighbouringTiles = SquareDirection;
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
    /**
     * The world's edge directions, as a new array each call: a caller may sort
     * or splice what it gets.
     *
     * Typed as the square grid's until the consumers that name these types move
     * to the topology's own.
     */
    getAdjacentDirections(): IAdjacentTiles[];
    getNeighbour(direction: INeighbouringTiles): Tile;
    /**
     * The world's directions, as a new array each call: a caller may sort or
     * splice what it gets.
     */
    getNeighbouringDirections(): INeighbouringTiles[];
    getNeighbours(): Tile[];
    getSurroundingArea(radius?: number): Tileset;
    /**
     * The distance to `tile`, measured the short way round a wrapping world, as
     * the world's topology measures it. `SquareTopology.distance` has the history.
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
