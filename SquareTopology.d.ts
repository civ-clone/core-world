import { ITopology } from './Topology';
export type SquareEdgeDirection = 'n' | 'e' | 's' | 'w';
export type SquareDirection = SquareEdgeDirection | 'ne' | 'se' | 'sw' | 'nw';
type Offset = readonly [number, number];
/**
 * The square grid every world has used so far: eight neighbours, four of them
 * sharing an edge, and both axes wrapping, so the world is a torus.
 */
export declare class SquareTopology implements ITopology<SquareDirection> {
    private _height;
    private _width;
    constructor(width: number, height: number);
    /**
     * The square of side `2 * radius + 1` centred on (`x`, `y`), x-major: every
     * `y` from top to bottom for the leftmost column, then the next column, and
     * so on. Coordinates are wrapped into range. A world narrower or shorter
     * than the square repeats tiles rather than dropping them.
     *
     * This is the order `Tileset.fromSurrounding` has always produced, and the
     * order a city's fat cross is currently cut from.
     */
    area(x: number, y: number, radius: number): [number, number][];
    /** `n ne e se s sw w nw`. */
    directions(): readonly SquareDirection[];
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
     * and 82,110 tile pairs: bit-identical for every one. (This was
     * `Tile.distanceFrom` until the grid's geometry moved behind `ITopology`;
     * that move was checked the same way.)
     */
    distance(x1: number, y1: number, x2: number, y2: number): number;
    /** `n e s w`. */
    edgeDirections(): readonly SquareEdgeDirection[];
    /** Never `null`: both axes wrap. */
    neighbour(x: number, y: number, direction: SquareDirection): [number, number];
    /**
     * A `switch` over shared, frozen tuples: the same handful of comparisons the
     * `if` chain in `Tile.getNeighbour` used to make, and nothing allocated.
     * `x` and `y` are unused — every row of a square grid steps the same way.
     */
    offset(direction: SquareDirection, x: number, y: number): Offset;
    /**
     * King's moves: diagonals count as one, so this is the larger of the two
     * axes' gaps (the Chebyshev distance), each measured the short way round as
     * `distance` measures it. The larger of two values grows with both, so, as
     * there, the shortest of the nine ways round is the shortest horizontal
     * paired with the shortest vertical, and nothing is allocated.
     */
    steps(x1: number, y1: number, x2: number, y2: number): number;
    /** Any whole width and height of at least one. */
    validate(width: number, height: number): void;
    wrapsX(): boolean;
    wrapsY(): boolean;
}
export default SquareTopology;
