/**
 * The shape of a world's grid: which tiles neighbour which, how far apart two
 * tiles are, and which tiles lie within a radius of one.
 *
 * Every method works in *storage* coordinates — the `x` and `y` a `Tile` is
 * built with, which index the generator's flat array — so a `World` can keep
 * storing its tiles as it always has whatever shape it draws them in. For a
 * square grid storage and screen are the same thing; for a staggered isometric
 * or an offset hexagonal grid they are not, and the difference lives entirely
 * behind this interface.
 *
 * `D` is the topology's own direction type: the square grid's is the eight
 * compass points, a hexagonal grid has six.
 */
export interface ITopology<D extends string = string> {
    /**
     * The storage coordinates of every tile within `radius` of (`x`, `y`),
     * wrapped into range, in the order the implementation documents. That order
     * matters to callers that keep the first tiles they are given.
     */
    area(x: number, y: number, radius: number): [number, number][];
    /** Every neighbouring direction, in a stable order. */
    directions(): readonly D[];
    /** The shortest distance between two tiles, the short way round any wrap. */
    distance(x1: number, y1: number, x2: number, y2: number): number;
    /** The directions whose neighbour shares an edge, in a stable order. */
    edgeDirections(): readonly D[];
    /**
     * The storage coordinates of the neighbour in `direction`, wrapped into
     * range, or `null` off the edge of an axis that does not wrap.
     */
    neighbour(x: number, y: number, direction: D): [number, number] | null;
    /**
     * The storage-coordinate step from (`x`, `y`) to its neighbour in
     * `direction`, before any wrapping. `x` and `y` are parameters because a
     * staggered or offset grid's steps depend on the row; a square grid's do
     * not.
     *
     * Implementations return a shared, frozen tuple rather than a new one:
     * this is on the path of every neighbour lookup in the game.
     */
    offset(direction: D, x: number, y: number): readonly [number, number];
    /**
     * Throw an `Error` naming the dimensions if this topology cannot make a
     * world of them, for example one it cannot wrap.
     */
    validate(width: number, height: number): void;
    /** Whether moving off the left or right edge comes back on the other. */
    wrapsX(): boolean;
    /** Whether moving off the top or bottom edge comes back on the other. */
    wrapsY(): boolean;
}
