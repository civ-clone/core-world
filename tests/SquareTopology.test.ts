import SquareTopology, { SquareDirection } from '../SquareTopology';
import { expect } from 'chai';

const opposite: { [direction in SquareDirection]: SquareDirection } = {
  n: 's',
  ne: 'sw',
  e: 'w',
  se: 'nw',
  s: 'n',
  sw: 'ne',
  w: 'e',
  nw: 'se',
};

// The x-major box `Tileset.fromSurrounding` built before the topology existed,
// wrapped into range the way `coordsToIndex` wraps.
const box = (
  x: number,
  y: number,
  radius: number,
  width: number,
  height: number
): [number, number][] => {
  const pairs: [number, number][] = [];

  for (let boxX = x - radius; boxX <= x + radius; boxX++) {
    for (let boxY = y - radius; boxY <= y + radius; boxY++) {
      pairs.push([
        ((boxX % width) + width) % width,
        ((boxY % height) + height) % height,
      ]);
    }
  }

  return pairs;
};

// The fewest moves from (x, y) to every tile, by breadth-first search over
// `neighbour`.
const breadthFirst = (
  topology: SquareTopology,
  width: number,
  height: number,
  x: number,
  y: number
): number[][] => {
  const steps: number[][] = Array.from({ length: width }, () =>
      new Array(height).fill(-1)
    ),
    queue: [number, number][] = [[x, y]];

  steps[x][y] = 0;

  while (queue.length) {
    const [currentX, currentY] = queue.shift()!;

    topology.directions().forEach((direction: SquareDirection): void => {
      const [nextX, nextY] = topology.neighbour(currentX, currentY, direction);

      if (steps[nextX][nextY] !== -1) {
        return;
      }

      steps[nextX][nextY] = steps[currentX][currentY] + 1;
      queue.push([nextX, nextY]);
    });
  }

  return steps;
};

// The Chebyshev distance, `max(|dx|, |dy|)`, over every way two tiles can be
// separated, going round the world up to twice in each direction.
const chebyshev = (
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  let shortest = Infinity;

  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      shortest = Math.min(
        shortest,
        Math.max(Math.abs(x2 + i * width - x1), Math.abs(y2 + j * height - y1))
      );
    }
  }

  return shortest;
};

// simple-ai-client's `movesBetween` (`lib/movesBetween.ts`), which `steps` is
// to replace, as it is written there but taking coordinates for tiles.
const movesBetween = (
  width: number,
  height: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => {
  const onAxis = (delta: number, size: number): number => {
    const direct = Math.abs(delta);

    return Math.min(direct, Math.abs(size - direct));
  };

  return Math.max(onAxis(x1 - x2, width), onAxis(y1 - y2, height));
};

describe('SquareTopology', (): void => {
  it('should list every direction, then the edge directions, in order', (): void => {
    const topology = new SquareTopology(10, 10);

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
    expect(topology.edgeDirections()).to.eql(['n', 'e', 's', 'w']);
  });

  it('should return shared, frozen offsets', (): void => {
    const topology = new SquareTopology(10, 10),
      other = new SquareTopology(7, 5);

    expect(
      topology.directions().map((direction) => topology.offset(direction, 0, 0))
    ).to.eql([
      [0, -1],
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ]);

    topology.directions().forEach((direction: SquareDirection): void => {
      const offset = topology.offset(direction, 0, 0);

      expect(Object.isFrozen(offset)).to.true;
      expect(topology.offset(direction, 3, 4)).to.equal(offset);
      expect(other.offset(direction, 0, 0)).to.equal(offset);
    });
  });

  it('should reject a direction it does not have', (): void => {
    const topology = new SquareTopology(10, 10);

    expect(() =>
      topology.offset('up' as unknown as SquareDirection, 0, 0)
    ).to.throw("'up'");
  });

  it('should wrap neighbours symmetrically across both seams', (): void => {
    (
      [
        [10, 10],
        [7, 5],
      ] as [number, number][]
    ).forEach(([width, height]): void => {
      const topology = new SquareTopology(width, height);

      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          topology.directions().forEach((direction: SquareDirection): void => {
            const neighbour = topology.neighbour(x, y, direction);

            expect(neighbour[0]).to.be.within(0, width - 1);
            expect(neighbour[1]).to.be.within(0, height - 1);
            expect(
              topology.neighbour(
                neighbour[0],
                neighbour[1],
                opposite[direction]
              ),
              `${width}x${height}: (${x}, ${y}) ${direction}`
            ).to.eql([x, y]);
          });
        }
      }
    });
  });

  it('should wrap neighbours off each edge', (): void => {
    const topology = new SquareTopology(7, 5);

    expect(topology.neighbour(0, 0, 'nw')).to.eql([6, 4]);
    expect(topology.neighbour(6, 4, 'se')).to.eql([0, 0]);
    expect(topology.neighbour(6, 0, 'ne')).to.eql([0, 4]);
    expect(topology.neighbour(0, 4, 'sw')).to.eql([6, 0]);
  });

  it('should return the x-major box for an area', (): void => {
    const topology = new SquareTopology(10, 10),
      seam = new SquareTopology(7, 5);

    expect(topology.area(5, 5, 1).length).to.equal(9);
    expect(topology.area(5, 5, 2).length).to.equal(25);
    expect(topology.area(5, 5, 0)).to.eql([[5, 5]]);
    expect(topology.area(5, 5, 1)).to.eql(box(5, 5, 1, 10, 10));
    expect(topology.area(5, 5, 2)).to.eql(box(5, 5, 2, 10, 10));
    expect(topology.area(0, 0, 1)).to.eql([
      [9, 9],
      [9, 0],
      [9, 1],
      [0, 9],
      [0, 0],
      [0, 1],
      [1, 9],
      [1, 0],
      [1, 1],
    ]);
    expect(seam.area(0, 4, 1)).to.eql(box(0, 4, 1, 7, 5));
    expect(seam.area(6, 0, 2)).to.eql(box(6, 0, 2, 7, 5));
    expect(seam.area(6, 0, 2).length).to.equal(25);
  });

  it('should repeat tiles in an area larger than the world', (): void => {
    const topology = new SquareTopology(2, 2);

    expect(topology.area(0, 0, 1)).to.eql(box(0, 0, 1, 2, 2));
    expect(topology.area(0, 0, 1).length).to.equal(9);
  });

  it('should measure distance the short way round', (): void => {
    const topology = new SquareTopology(10, 10);

    expect(topology.distance(0, 0, 0, 0)).to.equal(0);
    expect(topology.distance(0, 0, 4, 0)).to.equal(4);
    expect(topology.distance(0, 0, 9, 0)).to.equal(1);
    expect(topology.distance(0, 0, 0, 9)).to.equal(1);
    expect(topology.distance(0, 0, 9, 9)).to.equal(Math.hypot(1, 1));
    expect(topology.distance(0, 0, 8, 8)).to.equal(Math.hypot(2, 2));
  });

  it("should count king's moves the short way round, as a breadth-first search does", (): void => {
    (
      [
        [10, 10],
        [7, 5],
        [5, 8],
        [13, 11],
        [1, 1],
        [2, 3],
        [1, 6],
        [4, 1],
      ] as [number, number][]
    ).forEach(([width, height]): void => {
      const topology = new SquareTopology(width, height);

      for (let x1 = 0; x1 < width; x1++) {
        for (let y1 = 0; y1 < height; y1++) {
          const steps = breadthFirst(topology, width, height, x1, y1);

          for (let x2 = 0; x2 < width; x2++) {
            for (let y2 = 0; y2 < height; y2++) {
              const label = `${width}x${height}: (${x1}, ${y1}) to (${x2}, ${y2})`;

              expect(topology.steps(x1, y1, x2, y2), label).to.equal(
                steps[x2][y2]
              );
              expect(topology.steps(x1, y1, x2, y2), label).to.equal(
                chebyshev(width, height, x1, y1, x2, y2)
              );
              expect(topology.steps(x2, y2, x1, y1), label).to.equal(
                topology.steps(x1, y1, x2, y2)
              );
            }
          }
        }
      }
    });
  });

  it("should count the same moves as simple-ai-client's movesBetween, for every pair of tiles", (): void => {
    (
      [
        [80, 50],
        [40, 25],
        [10, 10],
        [7, 5],
        [1, 1],
      ] as [number, number][]
    ).forEach(([width, height]): void => {
      const topology = new SquareTopology(width, height),
        differences: string[] = [];
      let pairs = 0;

      // Millions of pairs on the larger worlds, so collected rather than
      // asserted one at a time.
      for (let x1 = 0; x1 < width; x1++) {
        for (let y1 = 0; y1 < height; y1++) {
          for (let x2 = 0; x2 < width; x2++) {
            for (let y2 = 0; y2 < height; y2++) {
              pairs++;

              if (
                topology.steps(x1, y1, x2, y2) !==
                movesBetween(width, height, x1, y1, x2, y2)
              ) {
                differences.push(`(${x1}, ${y1}) to (${x2}, ${y2})`);
              }
            }
          }
        }
      }

      expect(pairs).to.equal((width * height) ** 2);
      expect(differences.slice(0, 10), `${width}x${height}`).to.eql([]);
    });
  });

  it('should count steps, not the straight line, the short way round', (): void => {
    const topology = new SquareTopology(10, 10);

    expect(topology.steps(0, 0, 0, 0)).to.equal(0);
    expect(topology.steps(0, 0, 4, 0)).to.equal(4);
    expect(topology.steps(0, 0, 3, 3)).to.equal(3);
    expect(topology.distance(0, 0, 3, 3)).to.equal(Math.hypot(3, 3));
    expect(topology.steps(0, 0, 9, 0)).to.equal(1);
    expect(topology.steps(0, 0, 9, 9)).to.equal(1);
    expect(topology.steps(0, 0, 4, 7)).to.equal(4);
    expect(topology.steps(0, 0, 5, 5)).to.equal(5);
    expect(topology.steps(2, 8, 8, 2)).to.equal(4);
  });

  it('should wrap both axes', (): void => {
    const topology = new SquareTopology(10, 10);

    expect(topology.wrapsX()).to.true;
    expect(topology.wrapsY()).to.true;
  });

  it('should validate the dimensions it can make', (): void => {
    const topology = new SquareTopology(1, 1);

    expect(() => topology.validate(1, 1)).not.to.throw();
    expect(() => topology.validate(80, 50)).not.to.throw();
    expect(() => topology.validate(7, 5)).not.to.throw();
    expect(() => topology.validate(0, 5)).to.throw('0x5');
    expect(() => topology.validate(5, 0)).to.throw('5x0');
    expect(() => topology.validate(2.5, 5)).to.throw('2.5x5');
  });
});
