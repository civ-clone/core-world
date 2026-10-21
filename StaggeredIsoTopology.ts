import { ITopology } from './Topology';

export type StaggeredIsoEdgeDirection = 'ne' | 'se' | 'sw' | 'nw';
export type StaggeredIsoDirection =
  | StaggeredIsoEdgeDirection
  | 'n'
  | 'e'
  | 's'
  | 'w';

type Offset = readonly [number, number];

const directions: readonly StaggeredIsoDirection[] = Object.freeze([
    'n',
    'ne',
    'e',
    'se',
    's',
    'sw',
    'w',
    'nw',
  ] as StaggeredIsoDirection[]),
  edgeDirections: readonly StaggeredIsoEdgeDirection[] = Object.freeze([
    'ne',
    'se',
    'sw',
    'nw',
  ] as StaggeredIsoEdgeDirection[]),
  offset = (dx: number, dy: number): Offset =>
    Object.freeze([dx, dy] as [number, number]),
  // The four corner neighbours step the same way from every row.
  north = offset(0, -2),
  east = offset(1, 0),
  south = offset(0, 2),
  west = offset(-1, 0),
  // The four edge neighbours are on the rows above and below, and which
  // columns those are depends on whether this row is shifted: an even row's
  // `ne` is an odd row's `nw`, and so on. Each step is shared by both rows'
  // tables.
  upLeft = offset(-1, -1),
  up = offset(0, -1),
  upRight = offset(1, -1),
  downLeft = offset(-1, 1),
  down = offset(0, 1),
  downRight = offset(1, 1);

/**
 * Bring a coordinate back into `0 .. size - 1` on a wrapping axis, the same way
 * `core-world-generator`'s `coordsToIndex` does. (A copy of `SquareTopology`'s,
 * which is not exported.)
 */
const wrap = (value: number, size: number): number => {
  while (value < 0) {
    value += size;
  }

  return value % size;
};

/**
 * The magnitude of the shortest of `delta`, `delta - size` and `delta + size`.
 * (A copy of `SquareTopology`'s, which is not exported; it has the reasons it
 * is written out.)
 */
const shortestOnAxis = (delta: number, size: number): number => {
  const direct = delta < 0 ? -delta : delta,
    under = delta - size < 0 ? size - delta : delta - size,
    over = delta + size < 0 ? -delta - size : delta + size;

  return direct < under
    ? direct < over
      ? direct
      : over
    : under < over
    ? under
    : over;
};

/**
 * A staggered isometric grid, the way Civ2 and Freeciv store one: diamond
 * tiles in rows, every odd row shifted half a tile right, so the world is
 * still a rectangle on screen and still wraps east to west.
 *
 * Storage is `width × height` as for the square grid, but a tile's storage
 * neighbours depend on its row:
 *
 * ```
 * e  (x + 1, y)              w  (x - 1, y)              share a corner
 * n  (x, y - 2)              s  (x, y + 2)              share a corner
 * ne (x + (y & 1), y - 1)    nw (x - 1 + (y & 1), y - 1)  share an edge
 * se (x + (y & 1), y + 1)    sw (x - 1 + (y & 1), y + 1)  share an edge
 * ```
 *
 * Directions are named as they look on screen. The four that share an edge
 * are the diagonals, `ne se sw nw`, which is why anything that wants the tiles
 * sharing an edge must ask for `edgeDirections()` rather than assume `n e s w`.
 *
 * Two coordinate frames make the rest simple:
 *
 * - `d = 2x + (y & 1)` is the tile's column in half-tile steps, so (`d`, `y`)
 *   is where its centre is drawn.
 * - `a = (d + y) / 2` and `b = (y - d) / 2` are its *logical* coordinates. In
 *   (`a`, `b`) this is exactly the square grid turned through 45°: `se` is
 *   `+a`, `sw` is `+b`, `e` is `+a -b`, `s` is `+a +b`, and so on. So
 *   neighbours, areas and distances mean what they mean on the square grid,
 *   and every rule written for it carries over unchanged.
 *
 * The world always wraps east to west. It wraps north to south only when its
 * height is even (the default when `wrapY` is not given), because a seam
 * between two rows of the same parity would leave the stagger out of step;
 * `validate` refuses an odd height that is asked to wrap. Off a top or bottom
 * edge that does not wrap there is nothing: `neighbour` returns `null` and
 * `area` leaves those tiles out.
 */
export class StaggeredIsoTopology implements ITopology<StaggeredIsoDirection> {
  private _height: number;
  private _width: number;
  private _wrapY: boolean;

  constructor(
    width: number,
    height: number,
    wrapY: boolean = height % 2 === 0
  ) {
    this._height = height;
    this._width = width;
    this._wrapY = wrapY;
  }

  /**
   * The Chebyshev box of side `2 * radius + 1` in logical coordinates centred
   * on (`x`, `y`) — the square grid's box, so 9 tiles at radius 1 and 25 at
   * radius 2 — on screen a diamond of diamonds.
   *
   * Ordered `a`-major like `SquareTopology.area`, so the same logical tiles
   * come in the same order: `a` outer, `b` inner, each from `-radius` to
   * `+radius`. On screen that is one line of the box at a time, the lines
   * taken from its north-west side to its south-east side and each walked
   * from its north-east end to its south-west end. At radius 1 that is
   * `n nw w ne (centre) sw e se s`.
   *
   * Coordinates are wrapped into range as `neighbour` wraps them. Rows off a
   * top or bottom edge that does not wrap are left out, so an area near a
   * pole has fewer tiles. A world narrower or shorter than the box repeats
   * tiles rather than dropping them.
   */
  area(x: number, y: number, radius: number): [number, number][] {
    const pairs: [number, number][] = [],
      d = 2 * x + (y & 1);

    for (let areaA: number = -radius; areaA <= radius; areaA++) {
      for (let areaB: number = -radius; areaB <= radius; areaB++) {
        // Back from logical to storage: `d` moves by `a - b`, the row by
        // `a + b`, and `d` and the row always have the same parity, so the
        // halving is exact.
        const row = y + areaA + areaB,
          column = (d + areaA - areaB - (row & 1)) / 2;

        if (this._wrapY) {
          pairs.push([wrap(column, this._width), wrap(row, this._height)]);

          continue;
        }

        if (row < 0 || row >= this._height) {
          continue;
        }

        pairs.push([wrap(column, this._width), row]);
      }
    }

    return pairs;
  }

  /** `n ne e se s sw w nw`, as they look on screen. */
  directions(): readonly StaggeredIsoDirection[] {
    return directions;
  }

  /**
   * Straight-line distance in logical coordinates, `hypot(Δa, Δb)`, measured
   * the short way round: the same measure, and for tiles away from the seams
   * the same number, as `SquareTopology.distance` over the logical tiles.
   *
   * Wrapping is less tidy than on the square grid in (`a`, `b`): going `width`
   * columns round the world moves `a` by `+width` and `b` by `-width`
   * together, so the shortest horizontal and the shortest vertical cannot be
   * picked one axis at a time there. They can in (`d`, `y`) — the centres'
   * half-tile column and the row. `Δa² + Δb²` is `(Δd² + Δy²) / 2`, wrapping
   * east to west moves only `d` (by `2 * width`), and wrapping north to south
   * (an even height, so parity is kept) moves only `y`. So the shortest of
   * the three horizontal candidates times the three vertical ones is the
   * shortest `Δd` paired with the shortest `Δy`, then turned back into
   * (`Δa`, `Δb`) for the `hypot` — as magnitudes, so possibly swapped and with
   * their signs lost, neither of which `hypot` sees. Nothing allocated, as on
   * the square grid.
   *
   * `Math.hypot` of the logical deltas, not `Math.sqrt` of the half-tile
   * ones, so that the number is bit-identical to the square grid's for the
   * same logical tiles.
   */
  distance(x1: number, y1: number, x2: number, y2: number): number {
    const deltaD = shortestOnAxis(
        2 * (x1 - x2) + (y1 & 1) - (y2 & 1),
        2 * this._width
      ),
      deltaY = this._wrapY
        ? shortestOnAxis(y1 - y2, this._height)
        : y1 < y2
        ? y2 - y1
        : y1 - y2;

    return Math.hypot((deltaD + deltaY) / 2, (deltaY - deltaD) / 2);
  }

  /** `ne se sw nw`: the diagonals are the directions that share an edge. */
  edgeDirections(): readonly StaggeredIsoEdgeDirection[] {
    return edgeDirections;
  }

  /**
   * Wraps east to west always, and north to south when `wrapsY()`; `null` off
   * a top or bottom edge that does not.
   */
  neighbour(
    x: number,
    y: number,
    direction: StaggeredIsoDirection
  ): [number, number] | null {
    const [dx, dy] = this.offset(direction, x, y),
      row = y + dy;

    if (this._wrapY) {
      return [wrap(x + dx, this._width), wrap(row, this._height)];
    }

    if (row < 0 || row >= this._height) {
      return null;
    }

    return [wrap(x + dx, this._width), row];
  }

  /**
   * A `switch` over shared, frozen tuples, as `SquareTopology.offset`; the
   * edge directions pick between the even-row and the odd-row step. `x` is
   * unused.
   */
  offset(direction: StaggeredIsoDirection, x: number, y: number): Offset {
    const odd = (y & 1) === 1;

    switch (direction) {
      case 'n':
        return north;
      case 'ne':
        return odd ? upRight : up;
      case 'e':
        return east;
      case 'se':
        return odd ? downRight : down;
      case 's':
        return south;
      case 'sw':
        return odd ? down : downLeft;
      case 'w':
        return west;
      case 'nw':
        return odd ? up : upLeft;
    }

    throw new Error(`StaggeredIsoTopology: '${direction}' is not a direction.`);
  }

  /**
   * Any whole width and height of at least one, and an even height if the
   * world is to wrap north to south.
   */
  validate(width: number, height: number): void {
    if (
      !Number.isInteger(width) ||
      width < 1 ||
      !Number.isInteger(height) ||
      height < 1
    ) {
      throw new Error(
        `StaggeredIsoTopology: cannot make a ${width}x${height} world: the width and height must be whole numbers of at least 1.`
      );
    }

    if (this._wrapY && height % 2 !== 0) {
      throw new Error(
        `StaggeredIsoTopology: cannot make a ${width}x${height} world that wraps north to south: the height must be even, so that the staggered rows line up across the seam.`
      );
    }
  }

  wrapsX(): boolean {
    return true;
  }

  wrapsY(): boolean {
    return this._wrapY;
  }
}

export default StaggeredIsoTopology;
