/**
 * The name of each kind of grid, which a `World` records in its save so that a
 * loaded world is rebuilt on the grid it was made on. `createTopology` (in
 * `topologies`) turns one back into a topology.
 *
 * These are written into saved games, so an id, once added, is never renamed
 * or reused: add a new one instead.
 */
export type TopologyId = 'square' | 'staggered-iso' | 'hex-odd-r';
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
     * Which kind of grid this is: the id `createTopology` builds it from, and
     * the one a `World` on it saves.
     */
    id(): TopologyId;
    /**
     * The step from (`x1`, `y1`) to (`x2`, `y2`) the short way round any wrap,
     * in the grid's *logical* square axes: the axes in which the eight
     * neighbours of a tile are the eight king's moves of a square grid, so a
     * rule written for the square grid (a distance, a radius, a box) means the
     * same thing when given these numbers. `null` on a grid that has no such
     * axes.
     *
     * - Signed, measured from the first tile to the second: walking the first
     *   number along the first axis and the second along the second reaches
     *   (`x2`, `y2`).
     * - The short way round: of every way round the wraps, the one that goes
     *   least far east or west and least far north or south. The straight line
     *   (`distance`), king's moves (`steps`) and the longer axis plus half the
     *   shorter are each smallest for it. (Not every measure is: on a staggered
     *   isometric grid the *shorter* logical gap alone can be smaller another
     *   way round.)
     * - When the two tiles are exactly half the world apart east to west, or
     *   north to south, the way that does not cross the seam.
     * - Whole numbers, never `-0`, in a new array each call.
     *
     * On the square grid the axes are `x` and `y`. On the staggered isometric
     * grid they are its logical (`a`, `b`): `se` is `+a` and `sw` is `+b`. A
     * hexagonal grid has six neighbours, not eight, and returns `null`: its
     * axial coordinates are not a square lattice, and a square-grid rule given
     * them would measure the wrong thing.
     */
    logicalDelta(x1: number, y1: number, x2: number, y2: number): [number, number] | null;
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
     * The fewest moves from one tile to a neighbour, then that neighbour's
     * neighbour and so on, that it takes to get from (`x1`, `y1`) to
     * (`x2`, `y2`), the short way round any wrap: a whole number, `0` for the
     * same tile and `1` for any neighbour.
     *
     * Unlike `distance`, this means the same thing on every grid. `distance` is
     * the straight line on a square grid but a step count on a hexagonal one;
     * anything that counts moves (how far a unit can get on the moves or fuel it
     * has left) wants `steps`.
     */
    steps(x1: number, y1: number, x2: number, y2: number): number;
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
