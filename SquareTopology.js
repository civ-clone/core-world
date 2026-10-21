"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SquareTopology = void 0;
const directions = Object.freeze([
    'n',
    'ne',
    'e',
    'se',
    's',
    'sw',
    'w',
    'nw',
]), edgeDirections = Object.freeze([
    'n',
    'e',
    's',
    'w',
]), offset = (dx, dy) => Object.freeze([dx, dy]), north = offset(0, -1), northEast = offset(1, -1), east = offset(1, 0), southEast = offset(1, 1), south = offset(0, 1), southWest = offset(-1, 1), west = offset(-1, 0), northWest = offset(-1, -1);
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
 * How far apart two coordinates are on one wrapping axis.
 *
 * The world joins to itself, so a tile near the left edge is close to one near
 * the right edge. There are three ways to measure that — going straight there,
 * or off one edge and back on the other — and the shortest wins.
 *
 * Written out rather than `Math.min(...[…].map(Math.abs))` because `distance`
 * is called a few million times in a game: see the note there.
 * `delta < 0 ? -delta : delta` for the same reason — it is `Math.abs` without
 * the call.
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
 * The square grid every world has used so far: eight neighbours, four of them
 * sharing an edge, and both axes wrapping, so the world is a torus.
 */
class SquareTopology {
    constructor(width, height) {
        this._height = height;
        this._width = width;
    }
    /**
     * The square of side `2 * radius + 1` centred on (`x`, `y`), x-major: every
     * `y` from top to bottom for the leftmost column, then the next column, and
     * so on. Coordinates are wrapped into range. A world narrower or shorter
     * than the square repeats tiles rather than dropping them.
     *
     * This is the order `Tileset.fromSurrounding` has always produced, and the
     * order a city's fat cross is currently cut from.
     */
    area(x, y, radius) {
        const pairs = [];
        for (let areaX = x - radius; areaX <= x + radius; areaX++) {
            for (let areaY = y - radius; areaY <= y + radius; areaY++) {
                pairs.push([wrap(areaX, this._width), wrap(areaY, this._height)]);
            }
        }
        return pairs;
    }
    /** `n ne e se s sw w nw`. */
    directions() {
        return directions;
    }
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
    distance(x1, y1, x2, y2) {
        return Math.hypot(shortestOnAxis(x1 - x2, this._width), shortestOnAxis(y1 - y2, this._height));
    }
    /** `n e s w`. */
    edgeDirections() {
        return edgeDirections;
    }
    /** `'square'`. */
    id() {
        return 'square';
    }
    /** Never `null`: both axes wrap. */
    neighbour(x, y, direction) {
        const [dx, dy] = this.offset(direction, x, y);
        return [wrap(x + dx, this._width), wrap(y + dy, this._height)];
    }
    /**
     * A `switch` over shared, frozen tuples: the same handful of comparisons the
     * `if` chain in `Tile.getNeighbour` used to make, and nothing allocated.
     * `x` and `y` are unused — every row of a square grid steps the same way.
     */
    offset(direction, x, y) {
        switch (direction) {
            case 'n':
                return north;
            case 'ne':
                return northEast;
            case 'e':
                return east;
            case 'se':
                return southEast;
            case 's':
                return south;
            case 'sw':
                return southWest;
            case 'w':
                return west;
            case 'nw':
                return northWest;
        }
        throw new Error(`SquareTopology: '${direction}' is not a direction.`);
    }
    /**
     * King's moves: diagonals count as one, so this is the larger of the two
     * axes' gaps (the Chebyshev distance), each measured the short way round as
     * `distance` measures it. The larger of two values grows with both, so, as
     * there, the shortest of the nine ways round is the shortest horizontal
     * paired with the shortest vertical, and nothing is allocated.
     */
    steps(x1, y1, x2, y2) {
        const deltaX = shortestOnAxis(x1 - x2, this._width), deltaY = shortestOnAxis(y1 - y2, this._height);
        return deltaX > deltaY ? deltaX : deltaY;
    }
    /** Any whole width and height of at least one. */
    validate(width, height) {
        if (Number.isInteger(width) &&
            width >= 1 &&
            Number.isInteger(height) &&
            height >= 1) {
            return;
        }
        throw new Error(`SquareTopology: cannot make a ${width}x${height} world: the width and height must be whole numbers of at least 1.`);
    }
    wrapsX() {
        return true;
    }
    wrapsY() {
        return true;
    }
}
exports.SquareTopology = SquareTopology;
exports.default = SquareTopology;
//# sourceMappingURL=SquareTopology.js.map