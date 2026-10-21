import StaggeredIsoTopology, {
  StaggeredIsoDirection,
} from '../StaggeredIsoTopology';
import SquareTopology, { SquareDirection } from '../SquareTopology';
import { expect } from 'chai';

type Pair = [number, number];

const opposite: {
    [direction in StaggeredIsoDirection]: StaggeredIsoDirection;
  } = {
    n: 's',
    ne: 'sw',
    e: 'w',
    se: 'nw',
    s: 'n',
    sw: 'ne',
    w: 'e',
    nw: 'se',
  },
  // The square grid's direction for each iso one, once the grid is turned
  // into logical (a, b) coordinates: `se` is +a, `sw` is +b.
  rotated: { [direction in StaggeredIsoDirection]: SquareDirection } = {
    nw: 'w',
    n: 'nw',
    ne: 'n',
    e: 'ne',
    se: 'e',
    s: 'se',
    sw: 's',
    w: 'sw',
  },
  // The issue's mapping, written out independently of the class.
  logical = (x: number, y: number): Pair => {
    const d = 2 * x + (((y % 2) + 2) % 2);

    return [(d + y) / 2, (y - d) / 2];
  },
  // Every way two tiles can be separated, going round the world up to twice
  // in each direction it wraps.
  candidates = (
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
  shortestHypot = (deltas: Pair[]): number =>
    Math.min(...deltas.map(([da, db]) => Math.hypot(da, db))),
  shortestChebyshev = (deltas: Pair[]): number =>
    Math.min(...deltas.map(([da, db]) => Math.max(Math.abs(da), Math.abs(db)))),
  // Steps from (x, y) to every tile, walking `neighbour`.
  breadthFirst = (
    topology: StaggeredIsoTopology,
    width: number,
    height: number,
    x: number,
    y: number
  ): number[][] => {
    const steps: number[][] = Array.from({ length: width }, () =>
        new Array(height).fill(-1)
      ),
      queue: Pair[] = [[x, y]];

    steps[x][y] = 0;

    while (queue.length) {
      const [currentX, currentY] = queue.shift()!;

      topology.directions().forEach((direction) => {
        const next = topology.neighbour(currentX, currentY, direction);

        if (next === null || steps[next[0]][next[1]] !== -1) {
          return;
        }

        steps[next[0]][next[1]] = steps[currentX][currentY] + 1;
        queue.push(next);
      });
    }

    return steps;
  },
  key = ([x, y]: Pair): string => `${x},${y}`,
  // Seeded, so a failure can be reproduced.
  random = (
    (seed: number) => (): number =>
      (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648
  )(96),
  worlds: [number, number, boolean][] = [
    [10, 10, true],
    [7, 6, true],
    [7, 5, false],
    [8, 8, false],
    [9, 4, true],
  ];

describe('StaggeredIsoTopology', (): void => {
  it('should list every direction, then the edge directions, in order', (): void => {
    const topology = new StaggeredIsoTopology(10, 10);

    expect(topology.directions()).to.eql([
      'n',
      'ne',
      'e',
      'se',
      's',
      'sw',
      'w',
      'nw',
    ]);
    expect(topology.edgeDirections()).to.eql(['ne', 'se', 'sw', 'nw']);
  });

  it('should return shared, frozen offsets for even and odd rows', (): void => {
    const topology = new StaggeredIsoTopology(10, 10),
      other = new StaggeredIsoTopology(7, 5);

    expect(
      topology.directions().map((direction) => topology.offset(direction, 0, 0))
    ).to.eql([
      [0, -2],
      [0, -1],
      [1, 0],
      [0, 1],
      [0, 2],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ]);
    expect(
      topology.directions().map((direction) => topology.offset(direction, 0, 1))
    ).to.eql([
      [0, -2],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 2],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]);

    // The odd row's `nw` is the even row's `ne`, and so on.
    expect(topology.offset('nw', 0, 1)).to.equal(topology.offset('ne', 0, 0));
    expect(topology.offset('sw', 0, 1)).to.equal(topology.offset('se', 0, 0));

    [0, 1].forEach((y: number): void => {
      topology.directions().forEach((direction): void => {
        const offset = topology.offset(direction, 0, y);

        expect(Object.isFrozen(offset)).to.true;
        expect(topology.offset(direction, 0, y)).to.equal(offset);
        expect(topology.offset(direction, 5, y + 2)).to.equal(offset);
        expect(other.offset(direction, 3, y + 4)).to.equal(offset);
        // A row off the top edge has the parity it would have wrapped to.
        expect(topology.offset(direction, 0, y - 2)).to.equal(offset);
      });
    });
  });

  it('should reject a direction it does not have', (): void => {
    const topology = new StaggeredIsoTopology(10, 10);

    expect(() =>
      topology.offset('up' as unknown as StaggeredIsoDirection, 0, 0)
    ).to.throw("'up'");
  });

  it('should come back from every neighbour by the opposite direction', (): void => {
    worlds.forEach(([width, height, wrapY]): void => {
      const topology = new StaggeredIsoTopology(width, height, wrapY);

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          topology.directions().forEach((direction): void => {
            const label = `${width}x${height}: (${x}, ${y}) ${direction}`,
              neighbour = topology.neighbour(x, y, direction),
              [, dy] = topology.offset(direction, x, y);

            if (!wrapY && (y + dy < 0 || y + dy >= height)) {
              expect(neighbour, label).to.null;

              return;
            }

            expect(neighbour, label).not.to.null;
            expect(neighbour![0]).to.be.within(0, width - 1);
            expect(neighbour![1]).to.be.within(0, height - 1);
            expect(
              topology.neighbour(
                neighbour![0],
                neighbour![1],
                opposite[direction]
              ),
              label
            ).to.eql([x, y]);
          });
        }
      }
    });
  });

  it('should be a neighbour of each of its neighbours, across both seams', (): void => {
    worlds.forEach(([width, height, wrapY]): void => {
      const topology = new StaggeredIsoTopology(width, height, wrapY),
        neighbours = (x: number, y: number): string[] =>
          topology
            .directions()
            .map((direction) => topology.neighbour(x, y, direction))
            .filter((pair): pair is Pair => pair !== null)
            .map(key);

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          neighbours(x, y).forEach((neighbour: string): void => {
            const [neighbourX, neighbourY] = neighbour.split(',').map(Number);

            expect(
              neighbours(neighbourX, neighbourY),
              `${width}x${height}: (${x}, ${y}) and ${neighbour}`
            ).to.include(key([x, y]));
          });
        }
      }
    });
  });

  it('should wrap neighbours off each edge', (): void => {
    const topology = new StaggeredIsoTopology(7, 6),
      flat = new StaggeredIsoTopology(7, 5);

    // East to west, on an even and an odd row.
    expect(topology.neighbour(6, 2, 'e')).to.eql([0, 2]);
    expect(topology.neighbour(0, 2, 'w')).to.eql([6, 2]);
    expect(topology.neighbour(0, 2, 'nw')).to.eql([6, 1]);
    expect(topology.neighbour(6, 3, 'ne')).to.eql([0, 2]);
    expect(topology.neighbour(6, 3, 'se')).to.eql([0, 4]);
    expect(topology.neighbour(0, 4, 'sw')).to.eql([6, 5]);

    // North to south, and both at once at the corners.
    expect(topology.neighbour(3, 0, 'n')).to.eql([3, 4]);
    expect(topology.neighbour(3, 1, 'n')).to.eql([3, 5]);
    expect(topology.neighbour(3, 5, 's')).to.eql([3, 1]);
    expect(topology.neighbour(3, 0, 'ne')).to.eql([3, 5]);
    expect(topology.neighbour(0, 0, 'nw')).to.eql([6, 5]);
    expect(topology.neighbour(6, 5, 'se')).to.eql([0, 0]);
    expect(topology.neighbour(6, 5, 'ne')).to.eql([0, 4]);

    // An odd height does not wrap north to south, but still east to west.
    expect(flat.neighbour(3, 0, 'n')).to.null;
    expect(flat.neighbour(3, 1, 'n')).to.null;
    expect(flat.neighbour(3, 0, 'ne')).to.null;
    expect(flat.neighbour(3, 0, 'nw')).to.null;
    expect(flat.neighbour(3, 1, 'nw')).to.eql([3, 0]);
    expect(flat.neighbour(3, 4, 's')).to.null;
    expect(flat.neighbour(3, 3, 's')).to.null;
    expect(flat.neighbour(3, 4, 'se')).to.null;
    expect(flat.neighbour(3, 4, 'sw')).to.null;
    expect(flat.neighbour(0, 0, 'w')).to.eql([6, 0]);
    expect(flat.neighbour(0, 0, 'sw')).to.eql([6, 1]);
  });

  it('should put every neighbour 1 away along an edge and √2 across a corner', (): void => {
    worlds.forEach(([width, height, wrapY]): void => {
      const topology = new StaggeredIsoTopology(width, height, wrapY),
        edges = topology.edgeDirections() as readonly StaggeredIsoDirection[];

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          topology.directions().forEach((direction): void => {
            const neighbour = topology.neighbour(x, y, direction);

            if (neighbour === null) {
              return;
            }

            expect(
              topology.distance(x, y, neighbour[0], neighbour[1]),
              `${width}x${height}: (${x}, ${y}) ${direction}`
            ).to.equal(edges.includes(direction) ? 1 : Math.hypot(1, 1));
          });
        }
      }
    });
  });

  it('should measure the shortest way round, in steps and in a straight line', (): void => {
    worlds.forEach(([width, height, wrapY]): void => {
      const topology = new StaggeredIsoTopology(width, height, wrapY);

      for (let x1 = 0; x1 < width; x1++) {
        for (let y1 = 0; y1 < height; y1++) {
          const steps = breadthFirst(topology, width, height, x1, y1);

          for (let x2 = 0; x2 < width; x2++) {
            for (let y2 = 0; y2 < height; y2++) {
              const label = `${width}x${height}: (${x1}, ${y1}) to (${x2}, ${y2})`,
                deltas = candidates(width, height, wrapY, x1, y1, x2, y2);

              // Each step is one square-grid step in (a, b), so the walk is
              // the Chebyshev distance there.
              expect(steps[x2][y2], label).to.equal(shortestChebyshev(deltas));
              expect(topology.distance(x1, y1, x2, y2), label).to.equal(
                shortestHypot(deltas)
              );
              expect(topology.distance(x2, y2, x1, y1), label).to.equal(
                topology.distance(x1, y1, x2, y2)
              );
            }
          }
        }
      }
    });
  });

  it('should satisfy the triangle inequality', (): void => {
    worlds.forEach(([width, height, wrapY]): void => {
      const topology = new StaggeredIsoTopology(width, height, wrapY),
        tile = (): Pair => [
          Math.floor(random() * width),
          Math.floor(random() * height),
        ];

      for (let i = 0; i < 2000; i++) {
        const [x1, y1] = tile(),
          [x2, y2] = tile(),
          [x3, y3] = tile();

        expect(topology.distance(x1, y1, x3, y3)).to.be.at.most(
          topology.distance(x1, y1, x2, y2) +
            topology.distance(x2, y2, x3, y3) +
            1e-9
        );
      }
    });
  });

  it('should agree with SquareTopology over the same logical tiles', (): void => {
    const topology = new StaggeredIsoTopology(30, 30),
      // Big enough, and shifted far enough, that nothing below wraps.
      square = new SquareTopology(100, 100),
      toSquare = ([x, y]: Pair): Pair => {
        const [a, b] = logical(x, y);

        return [a, b + 50];
      },
      window: Pair[] = [];

    for (let x = 10; x < 20; x++) {
      for (let y = 10; y < 20; y++) {
        window.push([x, y]);
      }
    }

    window.forEach((tile: Pair): void => {
      const [x, y] = tile,
        [a, b] = toSquare(tile);

      topology.directions().forEach((direction): void => {
        expect(
          toSquare(topology.neighbour(x, y, direction)!),
          `(${x}, ${y}) ${direction}`
        ).to.eql(square.neighbour(a, b, rotated[direction]));
      });

      [0, 1, 2, 3].forEach((radius: number): void => {
        expect(
          topology.area(x, y, radius).map(toSquare),
          `(${x}, ${y}) radius ${radius}`
        ).to.eql(square.area(a, b, radius));
      });

      window.forEach((other: Pair): void => {
        const [otherA, otherB] = toSquare(other);

        expect(topology.distance(x, y, other[0], other[1])).to.equal(
          square.distance(a, b, otherA, otherB)
        );
      });
    });
  });

  it('should cut the logical box for an area, in a documented order', (): void => {
    const topology = new StaggeredIsoTopology(10, 10);

    expect(topology.area(5, 5, 0)).to.eql([[5, 5]]);
    // n nw w ne (centre) sw e se s
    expect(topology.area(5, 5, 1)).to.eql([
      [5, 3],
      [5, 4],
      [4, 5],
      [6, 4],
      [5, 5],
      [5, 6],
      [6, 5],
      [6, 6],
      [5, 7],
    ]);
    // The same shape from an even row.
    expect(topology.area(5, 4, 1)).to.eql([
      [5, 2],
      [4, 3],
      [4, 4],
      [5, 3],
      [5, 4],
      [4, 5],
      [6, 4],
      [5, 5],
      [5, 6],
    ]);
  });

  it('should have 9 and 25 tiles in an area, across the seams too', (): void => {
    (
      [
        [10, 10],
        [12, 10],
        [11, 12],
      ] as Pair[]
    ).forEach(([width, height]): void => {
      const topology = new StaggeredIsoTopology(width, height),
        tiles: Pair[] = [];

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          tiles.push([x, y]);
        }
      }

      tiles.forEach(([x, y]): void => {
        [1, 2].forEach((radius: number): void => {
          const area = topology.area(x, y, radius),
            label = `${width}x${height}: (${x}, ${y}) radius ${radius}`,
            expected = tiles.filter(
              ([otherX, otherY]) =>
                shortestChebyshev(
                  candidates(width, height, true, x, y, otherX, otherY)
                ) <= radius
            );

          expect(area.length, label).to.equal((2 * radius + 1) ** 2);
          expect(new Set(area.map(key)).size, label).to.equal(area.length);
          expect(area.map(key).sort(), label).to.eql(expected.map(key).sort());
        });
      });
    });
  });

  it('should leave out the tiles past an edge that does not wrap', (): void => {
    (
      [
        [new StaggeredIsoTopology(10, 9), 8],
        [new StaggeredIsoTopology(10, 10, false), 9],
      ] as [StaggeredIsoTopology, number][]
    ).forEach(([topology, bottom]): void => {
      expect(topology.area(5, 0, 1).length).to.equal(6);
      expect(topology.area(5, 0, 2).length).to.equal(15);
      expect(topology.area(5, 1, 1).length).to.equal(8);
      expect(topology.area(5, 1, 2).length).to.equal(19);
      expect(topology.area(0, bottom, 1).length).to.equal(6);
      expect(topology.area(9, bottom, 2).length).to.equal(15);
      expect(topology.area(5, bottom - 1, 2).length).to.equal(19);
      expect(topology.area(5, 4, 2).length).to.equal(25);

      [0, 1, bottom - 1, bottom].forEach((y: number): void => {
        topology.area(5, y, 2).forEach(([areaX, areaY]): void => {
          expect(areaX).to.be.within(0, 9);
          expect(areaY).to.be.within(0, bottom);
        });
      });
    });

    // The tiles that remain keep their order.
    expect(new StaggeredIsoTopology(10, 9).area(5, 0, 1)).to.eql([
      [4, 0],
      [5, 0],
      [4, 1],
      [6, 0],
      [5, 1],
      [5, 2],
    ]);
  });

  it('should repeat tiles in an area larger than the world', (): void => {
    const topology = new StaggeredIsoTopology(2, 2);

    expect(topology.area(0, 0, 1).length).to.equal(9);
    expect(topology.area(0, 0, 2).length).to.equal(25);
  });

  it('should wrap east to west always, and north to south when the height is even', (): void => {
    expect(new StaggeredIsoTopology(10, 10).wrapsX()).to.true;
    expect(new StaggeredIsoTopology(10, 10).wrapsY()).to.true;
    expect(new StaggeredIsoTopology(7, 5).wrapsX()).to.true;
    expect(new StaggeredIsoTopology(7, 5).wrapsY()).to.false;
    expect(new StaggeredIsoTopology(10, 10, false).wrapsY()).to.false;
    expect(new StaggeredIsoTopology(7, 6, true).wrapsY()).to.true;
  });

  it('should refuse to be built for dimensions it cannot make', (): void => {
    expect(() => new StaggeredIsoTopology(7, 5, true)).to.throw('7x5');
    expect(() => new StaggeredIsoTopology(0, 6)).to.throw('0x6');
    expect(() => new StaggeredIsoTopology(7, 5)).not.to.throw();
    expect(() => new StaggeredIsoTopology(7, 6)).not.to.throw();
  });

  it('should validate the dimensions it can make', (): void => {
    const wrapping = new StaggeredIsoTopology(80, 50),
      flat = new StaggeredIsoTopology(7, 5);

    expect(() => wrapping.validate(80, 50)).not.to.throw();
    expect(() => wrapping.validate(1, 2)).not.to.throw();
    expect(() => wrapping.validate(7, 5)).to.throw('7x5');
    expect(() => wrapping.validate(7, 5)).to.throw('even');
    expect(() => flat.validate(7, 5)).not.to.throw();
    expect(() => flat.validate(1, 1)).not.to.throw();
    expect(() => flat.validate(80, 50)).not.to.throw();
    expect(() => new StaggeredIsoTopology(7, 5, true).validate(7, 5)).to.throw(
      '7x5'
    );
    [wrapping, flat].forEach((topology: StaggeredIsoTopology): void => {
      expect(() => topology.validate(0, 6)).to.throw('0x6');
      expect(() => topology.validate(6, 0)).to.throw('6x0');
      expect(() => topology.validate(2.5, 6)).to.throw('2.5x6');
      expect(() => topology.validate(6, -2)).to.throw('6x-2');
    });
  });
});
