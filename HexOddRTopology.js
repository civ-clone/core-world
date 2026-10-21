"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HexOddRTopology = void 0;
const directions = Object.freeze([
    'ne',
    'e',
    'se',
    'sw',
    'w',
    'nw',
]), offset = (dx, dy) => Object.freeze([dx, dy]), east = offset(1, 0), west = offset(-1, 0), 
// An even row sits half a hex to the left of the odd rows either side of it,
// so its diagonal neighbours are at its own column and the one to the left.
evenNorthEast = offset(0, -1), evenSouthEast = offset(0, 1), evenSouthWest = offset(-1, 1), evenNorthWest = offset(-1, -1), 
// An odd row sits half a hex to the right: its own column and the one to
// the right. The odd row's north-west is the even row's north-east, and so
// on, so those tuples are shared.
oddNorthEast = offset(1, -1), oddSouthEast = offset(1, 1), oddSouthWest = evenSouthEast, oddNorthWest = evenNorthEast, 
// The order `area` walks each ring in: starting at the ring's corner due
// east of the centre, round clockwise (as drawn, with `y` growing down).
ringWalk = Object.freeze([
    'sw',
    'w',
    'nw',
    'ne',
    'e',
    'se',
]);
/**
 * Bring a coordinate back into `0 .. size - 1` on a wrapping axis, the same way
 * `core-world-generator`'s `coordsToIndex` does, so a coordinate from here and
 * the one `World.get` would have wrapped itself always name the same tile.
 */
const wrap = (value, size) => {
    while (value < 0) {
        value += size;
    }
    return value % size;
};
/**
 * The shortest of `delta`, `delta - size` and `delta + size`, as a magnitude:
 * how far apart two coordinates are on one wrapping axis, going straight there
 * or off one edge and back on the other. Written out, without `Math.abs` or an
 * array, for the reason `SquareTopology`'s `shortestOnAxis` gives.
 */
const shortestOnAxis = (delta, size) => {
    const direct = delta < 0 ? -delta : delta, under = delta - size < 0 ? size - delta : delta - size, over = delta + size < 0 ? -delta - size : delta + size;
    return direct < under
        ? direct < over
            ? direct
            : over
        : under < over
            ? under
            : over;
};
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
class HexOddRTopology {
    constructor(width, height, wrapY = height % 2 === 0) {
        this._height = height;
        this._width = width;
        this._wrapY = wrapY;
        // An odd height asked to wrap north to south has no consistent geometry
        // (row parity cannot line up across the seam), so refuse to exist rather
        // than rely on every caller remembering `validate`.
        this.validate(width, height);
    }
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
    area(x, y, radius) {
        const pairs = [];
        this.pushTile(pairs, x, y);
        for (let ring = 1; ring <= radius; ring++) {
            // The walk stays in unwrapped coordinates, so every step takes its
            // offset from the parity of the row it is really on. Wrapping only
            // happens as a tile is recorded, and with `wrapY` the height is even,
            // so the parity survives the vertical wrap too.
            let ringX = x, ringY = y;
            for (let step = 0; step < ring; step++) {
                const [dx, dy] = this.offset('e', ringX, ringY);
                ringX += dx;
                ringY += dy;
            }
            for (let side = 0; side < 6; side++) {
                const direction = ringWalk[side];
                for (let step = 0; step < ring; step++) {
                    this.pushTile(pairs, ringX, ringY);
                    const [dx, dy] = this.offset(direction, ringX, ringY);
                    ringX += dx;
                    ringY += dy;
                }
            }
        }
        return pairs;
    }
    /** `ne e se sw w nw`. */
    directions() {
        return directions;
    }
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
    distance(x1, y1, x2, y2) {
        const dx = shortestOnAxis(2 * (x1 - x2) + (y1 & 1) - (y2 & 1), 2 * this._width), dy = this._wrapY
            ? shortestOnAxis(y1 - y2, this._height)
            : y1 - y2 < 0
                ? y2 - y1
                : y1 - y2;
        return dx > dy ? dy + (dx - dy) / 2 : dy;
    }
    /** `ne e se sw w nw`: every neighbour of a hex shares an edge with it. */
    edgeDirections() {
        return directions;
    }
    /** `null` off the top or bottom when `y` does not wrap. */
    neighbour(x, y, direction) {
        const [dx, dy] = this.offset(direction, x, y), neighbourY = y + dy;
        if (!this._wrapY && (neighbourY < 0 || neighbourY >= this._height)) {
            return null;
        }
        return [wrap(x + dx, this._width), wrap(neighbourY, this._height)];
    }
    /**
     * A `switch` over shared, frozen tuples, picking the even- or odd-row step
     * for the diagonals. `x` is unused.
     */
    offset(direction, x, y) {
        switch (direction) {
            case 'ne':
                return y & 1 ? oddNorthEast : evenNorthEast;
            case 'e':
                return east;
            case 'se':
                return y & 1 ? oddSouthEast : evenSouthEast;
            case 'sw':
                return y & 1 ? oddSouthWest : evenSouthWest;
            case 'w':
                return west;
            case 'nw':
                return y & 1 ? oddNorthWest : evenNorthWest;
        }
        throw new Error(`HexOddRTopology: '${direction}' is not a direction.`);
    }
    /**
     * Any whole width and height of at least one, except an odd height when `y`
     * wraps: the rows either side of the seam would have the same parity, so
     * their diagonal neighbours would not line up.
     */
    validate(width, height) {
        if (!(Number.isInteger(width) &&
            width >= 1 &&
            Number.isInteger(height) &&
            height >= 1)) {
            throw new Error(`HexOddRTopology: cannot make a ${width}x${height} world: the width and height must be whole numbers of at least 1.`);
        }
        if (this._wrapY && height % 2 !== 0) {
            throw new Error(`HexOddRTopology: cannot make a ${width}x${height} world that wraps vertically: the height must be even.`);
        }
    }
    wrapsX() {
        return true;
    }
    wrapsY() {
        return this._wrapY;
    }
    pushTile(pairs, x, y) {
        if (!this._wrapY && (y < 0 || y >= this._height)) {
            return;
        }
        pairs.push([wrap(x, this._width), wrap(y, this._height)]);
    }
}
exports.HexOddRTopology = HexOddRTopology;
exports.default = HexOddRTopology;
//# sourceMappingURL=HexOddRTopology.js.map