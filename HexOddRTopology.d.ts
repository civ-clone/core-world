import { ITopology } from './Topology';
export type HexDirection = 'ne' | 'e' | 'se' | 'sw' | 'w' | 'nw';
type Offset = readonly [number, number];
/**
 * Pointy-topped hexagons, stored as offset rows with every odd row shifted half
 * a hex to the right ("odd-r"). Storage is still a `width × height` rectangle,
 * so `coordsToIndex`, `World.get` and the `x, y` in saved games mean what they
 * always have; only which tiles neighbour which changes.
 *
 * Each tile has six neighbours, all sharing an edge. The world is an east–west
 * cylinder: `x` always wraps. `y` wraps as well when `wrapY` is set, which
 * needs an even `height` so that the rows either side of the seam keep the
 * parity the offsets depend on; by default it is set exactly when `height` is
 * even.
 */
export declare class HexOddRTopology implements ITopology<HexDirection> {
    private _height;
    private _width;
    private _wrapY;
    constructor(width: number, height: number, wrapY?: boolean);
    /**
     * Every tile within `radius` hex steps of (`x`, `y`), as rings outward from
     * the centre: ring 0 is the centre itself, so it is always first, then each
     * ring of `6 * ring` tiles is walked clockwise (as drawn, `y` growing down)
     * starting from its corner due east of the centre, `ring` steps in the `e`
     * direction. That is 7 tiles at radius 1 and 19 at radius 2.
     *
     * Coordinates are wrapped into range as `neighbour` wraps them. A tile that
     * falls off the top or bottom of a world that does not wrap vertically is
     * left out, so an area near a pole has fewer tiles. A world narrower or
     * shorter than the area repeats tiles rather than dropping them, as
     * `SquareTopology.area` does.
     */
    area(x: number, y: number, radius: number): [number, number][];
    /** `ne e se sw w nw`. */
    directions(): readonly HexDirection[];
    /**
     * Whole hex steps between the two tiles, the short way round any wrap: the
     * fewest moves between neighbours it takes to get from one to the other.
     * Steps rather than the straight line between the hexes' centres, because
     * the rules compare distance with whole-tile thresholds and the path finder
     * wants an estimate that never overstates the steps left.
     *
     * The textbook formula converts to axial coordinates (`q = x - (y - (y & 1))
     * / 2`) and takes `(|Δq| + |Δr| + |Δq + Δr|) / 2`, and wrapping would mean
     * taking the smallest of that over the three horizontal candidates, times
     * the three vertical ones when `y` wraps. Axial `q` and `r` are not
     * independent, so that minimum cannot be split by axis.
     *
     * Measuring across in half-hexes instead (`2 * x` plus one on an odd row,
     * so `dx` is the gap between the centres in half-hex widths) gives an
     * equivalent formula in which the axes do split: `dy` rows plus however far
     * `dx` reaches beyond the `dy` half-hexes those rows cover diagonally,
     * `dy + max(0, (dx - dy) / 2)`. That grows with both `dx` and `dy`, and a
     * wrap changes only one of them each (a vertical wrap moves an even number
     * of rows, so it keeps every column where it was), so the shortest of the
     * nine is the shortest `dx` paired with the shortest `dy`, as in
     * `SquareTopology.distance`. Nothing is allocated. The tests check it
     * against the axial formula over every candidate and against a
     * breadth-first search over `neighbour`.
     */
    distance(x1: number, y1: number, x2: number, y2: number): number;
    /** `ne e se sw w nw`: every neighbour of a hex shares an edge with it. */
    edgeDirections(): readonly HexDirection[];
    /** `null` off the top or bottom when `y` does not wrap. */
    neighbour(x: number, y: number, direction: HexDirection): [number, number] | null;
    /**
     * A `switch` over shared, frozen tuples, picking the even- or odd-row step
     * for the diagonals. `x` is unused.
     */
    offset(direction: HexDirection, x: number, y: number): Offset;
    /**
     * The same as `distance`, which on a hexagonal grid is already the fewest
     * steps between the two tiles.
     */
    steps(x1: number, y1: number, x2: number, y2: number): number;
    /**
     * Any whole width and height of at least one, except an odd height when `y`
     * wraps: the rows either side of the seam would have the same parity, so
     * their diagonal neighbours would not line up.
     */
    validate(width: number, height: number): void;
    wrapsX(): boolean;
    wrapsY(): boolean;
    private pushTile;
}
export default HexOddRTopology;
