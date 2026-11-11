import HexOddRTopology from '../HexOddRTopology';
import SquareTopology from '../SquareTopology';
import StaggeredIsoTopology from '../StaggeredIsoTopology';
import { ITopology } from '../Topology';
import { expect } from 'chai';

type Pair = [number, number];

const wrap = (value: number, size: number): number =>
    ((value % size) + size) % size,
  // Walk `delta` from (x, y) by `offset` alone, without wrapping on the way,
  // `along` for each positive step on the first axis and `back` for each
  // negative one (and the same for the second axis), then wrap the end into
  // range on the axes the topology wraps. `null` if the end is off an edge
  // that does not wrap.
  walk = (
    topology: ITopology,
    width: number,
    height: number,
    x: number,
    y: number,
    [first, second]: Pair,
    [firstAlong, firstBack, secondAlong, secondBack]: [
      string,
      string,
      string,
      string
    ]
  ): Pair | null => {
    let walkX = x,
      walkY = y;

    const step = (direction: string, count: number): void => {
      for (let i = 0; i < count; i++) {
        const [dx, dy] = topology.offset(direction, walkX, walkY);

        walkX += dx;
        walkY += dy;
      }
    };

    step(first < 0 ? firstBack : firstAlong, Math.abs(first));
    step(second < 0 ? secondBack : secondAlong, Math.abs(second));

    if (!topology.wrapsY() && (walkY < 0 || walkY >= height)) {
      return null;
    }

    return [
      wrap(walkX, width),
      topology.wrapsY() ? wrap(walkY, height) : walkY,
    ];
  },
  // The issue's mapping from storage to logical coordinates, written out
  // independently of the class.
  logical = (x: number, y: number): Pair => {
    const d = 2 * x + (((y % 2) + 2) % 2);

    return [(d + y) / 2, (y - d) / 2];
  },
  // Every logical delta from (x1, y1) to a copy of (x2, y2), going round the
  // world up to twice in each direction it wraps.
  isoCandidates = (
    width: number,
    height: number,
    wrapY: boolean,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Pair[] => {
    const [a1, b1] = logical(x1, y1),
      deltas: Pair[] = [];

    for (let i = -2; i <= 2; i++) {
      for (let j = wrapY ? -2 : 0; j <= (wrapY ? 2 : 0); j++) {
        const [a2, b2] = logical(x2 + i * width, y2 + j * height);

        deltas.push([a2 - a1, b2 - b1]);
      }
    }

    return deltas;
  },
  squareCandidates = (
    width: number,
    height: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): Pair[] => {
    const deltas: Pair[] = [];

    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        deltas.push([x2 + i * width - x1, y2 + j * height - y1]);
      }
    }

    return deltas;
  },
  chebyshev = ([a, b]: Pair): number => Math.max(Math.abs(a), Math.abs(b)),
  hypot = ([a, b]: Pair): number => Math.hypot(a, b),
  // The longer axis plus half the shorter, rounded down.
  longerPlusHalf = ([a, b]: Pair): number =>
    Math.max(Math.abs(a), Math.abs(b)) +
    Math.floor(Math.min(Math.abs(a), Math.abs(b)) / 2),
  shortest = (deltas: Pair[], measure: (delta: Pair) => number): number =>
    Math.min(...deltas.map(measure)),
  isoWorlds: [number, number, boolean][] = [
    [1, 2, true],
    [3, 2, true],
    [4, 4, true],
    [5, 6, true],
    [6, 8, true],
    [7, 10, true],
    [3, 10, true],
    [2, 12, true],
    [4, 5, false],
    [5, 7, false],
    [6, 6, false],
  ],
  squareWorlds: Pair[] = [
    [1, 1],
    [2, 3],
    [5, 4],
    [6, 6],
    [7, 9],
  ];

describe('logicalDelta', (): void => {
  describe('SquareTopology', (): void => {
    it('should give the shortest signed x and y gaps, and walk there, for every pair', (): void => {
      squareWorlds.forEach(([width, height]): void => {
        const topology = new SquareTopology(width, height);

        for (let x1 = 0; x1 < width; x1++) {
          for (let y1 = 0; y1 < height; y1++) {
            for (let x2 = 0; x2 < width; x2++) {
              for (let y2 = 0; y2 < height; y2++) {
                const delta = topology.logicalDelta(x1, y1, x2, y2),
                  [dx, dy] = delta,
                  candidates = squareCandidates(width, height, x1, y1, x2, y2);

                expect(Object.is(dx, -0) || Object.is(dy, -0)).to.equal(false);
                expect(Math.abs(dx)).to.equal(
                  shortest(
                    candidates.map(([cx]): Pair => [cx, 0]),
                    chebyshev
                  )
                );
                expect(Math.abs(dy)).to.equal(
                  shortest(
                    candidates.map(([, cy]): Pair => [0, cy]),
                    chebyshev
                  )
                );
                expect(
                  walk(topology, width, height, x1, y1, delta, [
                    'e',
                    'w',
                    's',
                    'n',
                  ])
                ).to.deep.equal([x2, y2]);
                expect(chebyshev(delta)).to.equal(
                  topology.steps(x1, y1, x2, y2)
                );
                expect(hypot(delta)).to.equal(
                  topology.distance(x1, y1, x2, y2)
                );
              }
            }
          }
        }
      });
    });

    it('should go the short way round across both seams, and not cross one for a tie', (): void => {
      const topology = new SquareTopology(80, 50);

      expect(topology.logicalDelta(79, 10, 1, 10)).to.deep.equal([2, 0]);
      expect(topology.logicalDelta(1, 10, 79, 13)).to.deep.equal([-2, 3]);
      expect(topology.logicalDelta(10, 1, 10, 49)).to.deep.equal([0, -2]);
      expect(topology.logicalDelta(10, 48, 10, 0)).to.deep.equal([0, 2]);
      expect(topology.logicalDelta(0, 0, 40, 25)).to.deep.equal([40, 25]);
      expect(topology.logicalDelta(40, 25, 0, 0)).to.deep.equal([-40, -25]);
    });
  });

  describe('StaggeredIsoTopology', (): void => {
    it('should give the logical delta of the shortest way round, and walk there, for every pair', (): void => {
      isoWorlds.forEach(([width, height, wrapY]): void => {
        const topology = new StaggeredIsoTopology(width, height, wrapY);

        expect(topology.wrapsY()).to.equal(wrapY);

        for (let x1 = 0; x1 < width; x1++) {
          for (let y1 = 0; y1 < height; y1++) {
            for (let x2 = 0; x2 < width; x2++) {
              for (let y2 = 0; y2 < height; y2++) {
                const delta = topology.logicalDelta(x1, y1, x2, y2),
                  candidates = isoCandidates(
                    width,
                    height,
                    wrapY,
                    x1,
                    y1,
                    x2,
                    y2
                  );

                expect(
                  Object.is(delta[0], -0) || Object.is(delta[1], -0)
                ).to.equal(false);
                expect(Number.isInteger(delta[0])).to.equal(true);
                expect(Number.isInteger(delta[1])).to.equal(true);
                // It is one of the ways round...
                expect(candidates).to.deep.include(delta);
                // ...and `se` is +a, `sw` is +b, so it walks there.
                expect(
                  walk(topology, width, height, x1, y1, delta, [
                    'se',
                    'nw',
                    'sw',
                    'ne',
                  ])
                ).to.deep.equal([x2, y2]);
                // The shortest of them, by every measure that grows with both
                // gaps.
                expect(chebyshev(delta)).to.equal(
                  shortest(candidates, chebyshev)
                );
                expect(hypot(delta)).to.equal(shortest(candidates, hypot));
                expect(longerPlusHalf(delta)).to.equal(
                  shortest(candidates, longerPlusHalf)
                );
                // And what the topology already measures.
                expect(chebyshev(delta)).to.equal(
                  topology.steps(x1, y1, x2, y2)
                );
                expect(hypot(delta)).to.equal(
                  topology.distance(x1, y1, x2, y2)
                );
              }
            }
          }
        }
      });
    });

    it('should turn each neighbour into one king move', (): void => {
      const topology = new StaggeredIsoTopology(6, 8),
        expected: { [direction: string]: Pair } = {
          n: [-1, -1],
          ne: [0, -1],
          e: [1, -1],
          se: [1, 0],
          s: [1, 1],
          sw: [0, 1],
          w: [-1, 1],
          nw: [-1, 0],
        };

      [
        [2, 3],
        [2, 4],
        [0, 0],
        [5, 7],
      ].forEach(([x, y]): void =>
        topology.directions().forEach((direction): void => {
          const [nx, ny] = topology.neighbour(x, y, direction) as Pair;

          expect(topology.logicalDelta(x, y, nx, ny)).to.deep.equal(
            expected[direction]
          );
        })
      );
    });

    it('should go the short way round across both seams', (): void => {
      const topology = new StaggeredIsoTopology(40, 50);

      // East to west: column 39 to column 0 on the same row is one `e`.
      expect(topology.logicalDelta(39, 10, 0, 10)).to.deep.equal([1, -1]);
      // North to south: row 49 (odd) to row 0 is one `se` from column 39.
      expect(topology.logicalDelta(39, 49, 0, 0)).to.deep.equal([1, 0]);
      // Row 0 to row 48 is one `n`.
      expect(topology.logicalDelta(5, 0, 5, 48)).to.deep.equal([-1, -1]);
    });
  });

  describe('HexOddRTopology', (): void => {
    it('should refuse with null, having no square axes', (): void => {
      const topology = new HexOddRTopology(6, 6);

      expect(topology.logicalDelta(0, 0, 0, 0)).to.equal(null);
      expect(topology.logicalDelta(1, 2, 4, 5)).to.equal(null);
    });
  });
});
