import HexOddRTopology, { HexDirection } from '../HexOddRTopology';
import { expect } from 'chai';

const opposite: { [direction in HexDirection]: HexDirection } = {
  ne: 'sw',
  e: 'w',
  se: 'nw',
  sw: 'ne',
  w: 'e',
  nw: 'se',
};

const key = (x: number, y: number): string => `${x},${y}`;

// Every tile of a `width × height` world.
const tiles = (width: number, height: number): [number, number][] => {
  const all: [number, number][] = [];

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      all.push([x, y]);
    }
  }

  return all;
};

// The neighbours of (x, y) that exist, as keys.
const neighbourKeys = (
  topology: HexOddRTopology,
  x: number,
  y: number
): string[] =>
  topology
    .directions()
    .map((direction) => topology.neighbour(x, y, direction))
    .filter((neighbour): neighbour is [number, number] => neighbour !== null)
    .map(([neighbourX, neighbourY]) => key(neighbourX, neighbourY));

// Steps from (x, y) to every tile, by breadth-first search over `neighbour`.
const stepsFrom = (
  topology: HexOddRTopology,
  x: number,
  y: number
): Map<string, number> => {
  const steps = new Map<string, number>([[key(x, y), 0]]),
    queue: [number, number][] = [[x, y]];

  while (queue.length) {
    const [currentX, currentY] = queue.shift() as [number, number],
      current = steps.get(key(currentX, currentY)) as number;

    topology.directions().forEach((direction: HexDirection): void => {
      const neighbour = topology.neighbour(currentX, currentY, direction);

      if (neighbour === null || steps.has(key(...neighbour))) {
        return;
      }

      steps.set(key(...neighbour), current + 1);
      queue.push(neighbour);
    });
  }

  return steps;
};

// The issue's formula, literally: axial coordinates, and the smallest
// `(|Δq| + |Δr| + |Δq + Δr|) / 2` over the three horizontal candidates, times
// the three vertical ones when the world wraps vertically.
const axialDistance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  height: number,
  wrapY: boolean
): number => {
  const q = (x: number, y: number): number => x - (y - (y & 1)) / 2,
    verticals = wrapY ? [-height, 0, height] : [0];
  let shortest = Infinity;

  [-width, 0, width].forEach((horizontal: number): void => {
    verticals.forEach((vertical: number): void => {
      const deltaQ = q(x2 + horizontal, y2 + vertical) - q(x1, y1),
        deltaR = y2 + vertical - y1;

      shortest = Math.min(
        shortest,
        (Math.abs(deltaQ) + Math.abs(deltaR) + Math.abs(deltaQ + deltaR)) / 2
      );
    });
  });

  return shortest;
};

// Worlds with odd and even widths, wrapping vertically (even heights) and not
// (odd heights).
const worlds: [number, number][] = [
  [10, 10],
  [7, 6],
  [7, 5],
  [8, 5],
  [5, 4],
  [3, 2],
];

describe('HexOddRTopology', (): void => {
  it('should list every direction, and every one as an edge direction', (): void => {
    const topology = new HexOddRTopology(10, 10);

    expect(topology.directions()).to.eql(['ne', 'e', 'se', 'sw', 'w', 'nw']);
    expect(topology.edgeDirections()).to.eql([
      'ne',
      'e',
      'se',
      'sw',
      'w',
      'nw',
    ]);
  });

  it('should step by the even or odd row', (): void => {
    const topology = new HexOddRTopology(10, 10);

    expect(
      topology.directions().map((direction) => topology.offset(direction, 0, 0))
    ).to.eql([
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [-1, -1],
    ]);
    expect(
      topology.directions().map((direction) => topology.offset(direction, 0, 1))
    ).to.eql([
      [1, -1],
      [1, 0],
      [1, 1],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]);
  });

  it('should return shared, frozen offsets', (): void => {
    const topology = new HexOddRTopology(10, 10),
      other = new HexOddRTopology(7, 5);

    topology.directions().forEach((direction: HexDirection): void => {
      [0, 1].forEach((row: number): void => {
        const offset = topology.offset(direction, 0, row);

        expect(Object.isFrozen(offset)).to.true;
        expect(topology.offset(direction, 3, row + 4)).to.equal(offset);
        expect(topology.offset(direction, 0, row - 2)).to.equal(offset);
        expect(other.offset(direction, 0, row)).to.equal(offset);
      });
    });
  });

  it('should reject a direction it does not have', (): void => {
    const topology = new HexOddRTopology(10, 10);

    expect(() =>
      topology.offset('n' as unknown as HexDirection, 0, 0)
    ).to.throw("'n'");
  });

  it('should come back by the opposite direction from every tile', (): void => {
    (
      [
        [10, 10],
        [7, 6],
        [7, 5],
      ] as [number, number][]
    ).forEach(([width, height]): void => {
      const topology = new HexOddRTopology(width, height);

      tiles(width, height).forEach(([x, y]): void => {
        topology.directions().forEach((direction: HexDirection): void => {
          const neighbour = topology.neighbour(x, y, direction),
            label = `${width}x${height}: (${x}, ${y}) ${direction}`;

          if (neighbour === null) {
            // Only off the top or bottom of a world that does not wrap.
            expect(topology.wrapsY(), label).to.false;
            expect(y + topology.offset(direction, x, y)[1], label).to.be.oneOf([
              -1,
              height,
            ]);

            return;
          }

          expect(neighbour[0]).to.be.within(0, width - 1);
          expect(neighbour[1]).to.be.within(0, height - 1);
          expect(
            topology.neighbour(neighbour[0], neighbour[1], opposite[direction]),
            label
          ).to.eql([x, y]);
        });
      });
    });
  });

  it('should only leave nulls at the poles of a world that does not wrap vertically', (): void => {
    const topology = new HexOddRTopology(7, 5);

    tiles(7, 5).forEach(([x, y]): void => {
      expect(neighbourKeys(topology, x, y).length).to.equal(
        y === 0 || y === 4 ? 4 : 6
      );
    });

    expect(topology.neighbour(3, 0, 'ne')).to.null;
    expect(topology.neighbour(3, 0, 'nw')).to.null;
    expect(topology.neighbour(3, 4, 'se')).to.null;
    expect(topology.neighbour(3, 4, 'sw')).to.null;
    expect(topology.neighbour(3, 0, 'e')).to.eql([4, 0]);
    expect(topology.neighbour(3, 4, 'w')).to.eql([2, 4]);
  });

  it('should be a neighbour of each of its neighbours, across both seams', (): void => {
    worlds.forEach(([width, height]): void => {
      const topology = new HexOddRTopology(width, height);

      tiles(width, height).forEach(([a, b]): void => {
        const ofA = neighbourKeys(topology, a, b);

        tiles(width, height).forEach(([c, d]): void => {
          expect(
            neighbourKeys(topology, c, d).includes(key(a, b)),
            `${width}x${height}: (${a}, ${b}) and (${c}, ${d})`
          ).to.equal(ofA.includes(key(c, d)));
        });
      });
    });
  });

  it('should wrap neighbours off each edge', (): void => {
    const topology = new HexOddRTopology(7, 6);

    expect(topology.neighbour(6, 3, 'e')).to.eql([0, 3]);
    expect(topology.neighbour(0, 3, 'w')).to.eql([6, 3]);
    expect(topology.neighbour(6, 1, 'ne')).to.eql([0, 0]);
    expect(topology.neighbour(0, 0, 'sw')).to.eql([6, 1]);
    expect(topology.neighbour(0, 0, 'nw')).to.eql([6, 5]);
    expect(topology.neighbour(6, 5, 'se')).to.eql([0, 0]);
    expect(topology.neighbour(3, 0, 'ne')).to.eql([3, 5]);
    expect(topology.neighbour(3, 5, 'sw')).to.eql([3, 0]);
  });

  it('should measure one step to every neighbour', (): void => {
    worlds.forEach(([width, height]): void => {
      const topology = new HexOddRTopology(width, height);

      tiles(width, height).forEach(([x, y]): void => {
        expect(topology.distance(x, y, x, y)).to.equal(0);

        topology.directions().forEach((direction: HexDirection): void => {
          const neighbour = topology.neighbour(x, y, direction);

          if (neighbour === null) {
            return;
          }

          // A world two tiles wide or high can be its own neighbour's
          // neighbour, but never its own.
          expect(
            topology.distance(x, y, neighbour[0], neighbour[1]),
            `${width}x${height}: (${x}, ${y}) ${direction}`
          ).to.equal(1);
        });
      });
    });
  });

  it('should measure the same steps as a breadth-first search', (): void => {
    [...worlds, [6, 6], [9, 8], [1, 2], [2, 2], [1, 1], [4, 1]].forEach(
      ([width, height]): void => {
        const topology = new HexOddRTopology(width, height);

        tiles(width, height).forEach(([x1, y1]): void => {
          const steps = stepsFrom(topology, x1, y1);

          tiles(width, height).forEach(([x2, y2]): void => {
            expect(
              topology.distance(x1, y1, x2, y2),
              `${width}x${height}: (${x1}, ${y1}) to (${x2}, ${y2})`
            ).to.equal(steps.get(key(x2, y2)));
          });
        });
      }
    );
  });

  it("should agree with the issue's axial formula over every candidate", (): void => {
    (
      [
        [10, 10, true],
        [9, 8, true],
        [9, 8, false],
        [9, 7, false],
        [12, 7, false],
        [4, 6, true],
      ] as [number, number, boolean][]
    ).forEach(([width, height, wrapY]): void => {
      const topology = new HexOddRTopology(width, height, wrapY);

      tiles(width, height).forEach(([x1, y1]): void => {
        tiles(width, height).forEach(([x2, y2]): void => {
          expect(
            topology.distance(x1, y1, x2, y2),
            `${width}x${height}: (${x1}, ${y1}) to (${x2}, ${y2})`
          ).to.equal(axialDistance(x1, y1, x2, y2, width, height, wrapY));
        });
      });
    });
  });

  it('should satisfy the triangle inequality, both ways round', (): void => {
    (
      [
        [7, 6],
        [7, 5],
      ] as [number, number][]
    ).forEach(([width, height]): void => {
      const topology = new HexOddRTopology(width, height),
        all = tiles(width, height);

      all.forEach(([x1, y1]): void => {
        all.forEach(([x2, y2]): void => {
          const direct = topology.distance(x1, y1, x2, y2);

          expect(topology.distance(x2, y2, x1, y1)).to.equal(direct);

          all.forEach(([x3, y3]): void => {
            expect(
              direct <=
                topology.distance(x1, y1, x3, y3) +
                  topology.distance(x3, y3, x2, y2),
              `${width}x${height}: (${x1}, ${y1}), (${x2}, ${y2}) via (${x3}, ${y3})`
            ).to.true;
          });
        });
      });
    });
  });

  it('should measure distance the short way round', (): void => {
    const topology = new HexOddRTopology(10, 10),
      flat = new HexOddRTopology(10, 9);

    expect(topology.distance(0, 0, 4, 0)).to.equal(4);
    expect(topology.distance(0, 0, 9, 0)).to.equal(1);
    expect(topology.distance(0, 0, 0, 9)).to.equal(1);
    expect(topology.distance(0, 0, 9, 9)).to.equal(1);
    expect(topology.distance(0, 0, 0, 4)).to.equal(4);
    expect(topology.distance(0, 0, 5, 5)).to.equal(7);
    expect(flat.distance(0, 0, 0, 8)).to.equal(8);
    expect(flat.distance(0, 0, 9, 8)).to.equal(8);
  });

  it('should return rings outward, each clockwise from the east', (): void => {
    const topology = new HexOddRTopology(10, 10);

    expect(topology.area(5, 5, 0)).to.eql([[5, 5]]);
    expect(topology.area(5, 5, 1)).to.eql([
      [5, 5],
      [6, 5],
      [6, 6],
      [5, 6],
      [4, 5],
      [5, 4],
      [6, 4],
    ]);
    expect(topology.area(4, 4, 1)).to.eql([
      [4, 4],
      [5, 4],
      [4, 5],
      [3, 5],
      [3, 4],
      [3, 3],
      [4, 3],
    ]);
    expect(topology.area(4, 4, 2).slice(7, 10)).to.eql([
      [6, 4],
      [5, 5],
      [5, 6],
    ]);

    [
      [5, 5],
      [4, 4],
    ].forEach(([x, y]): void => {
      const area = topology.area(x, y, 3);
      let previous = area[area.length - 1];

      expect(area.length).to.equal(37);
      expect(new Set(area.map(([x, y]) => key(x, y))).size).to.equal(37);

      area.forEach(([areaX, areaY], index: number): void => {
        const ring = index === 0 ? 0 : index < 7 ? 1 : index < 19 ? 2 : 3,
          first = [0, 1, 7, 19][ring];

        expect(topology.distance(x, y, areaX, areaY)).to.equal(ring);

        if (index === first && ring > 0) {
          // Each ring starts `ring` steps due east.
          expect([areaX, areaY]).to.eql([(x + ring) % 10, y]);
        }

        if (index > first) {
          // Each tile in a ring neighbours the one before it.
          expect(neighbourKeys(topology, areaX, areaY)).to.include(
            key(previous[0], previous[1])
          );
        }

        previous = [areaX, areaY];
      });
    });
  });

  it('should return every tile within the radius, and no others', (): void => {
    [
      [10, 10],
      [11, 9],
    ].forEach(([width, height]): void => {
      const topology = new HexOddRTopology(width, height);

      tiles(width, height).forEach(([x, y]): void => {
        [1, 2].forEach((radius: number): void => {
          const area = topology.area(x, y, radius).map(([x, y]) => key(x, y)),
            within = tiles(width, height)
              .filter(
                ([otherX, otherY]) =>
                  topology.distance(x, y, otherX, otherY) <= radius
              )
              .map(([x, y]) => key(x, y));

          expect(area.slice().sort()).to.eql(within.sort());
          expect(area[0]).to.equal(key(x, y));
        });
      });
    });
  });

  it('should size an area 7 and 19, at the seams too', (): void => {
    const topology = new HexOddRTopology(10, 10),
      odd = new HexOddRTopology(9, 8);

    [
      [5, 5],
      [4, 4],
      [0, 0],
      [9, 0],
      [0, 9],
      [9, 9],
      [0, 5],
      [9, 4],
    ].forEach(([x, y]): void => {
      expect(topology.area(x, y, 1).length).to.equal(7);
      expect(topology.area(x, y, 2).length).to.equal(19);
      expect(odd.area(x % 9, y % 8, 1).length).to.equal(7);
      expect(odd.area(x % 9, y % 8, 2).length).to.equal(19);
    });

    expect(topology.area(0, 0, 1)).to.eql([
      [0, 0],
      [1, 0],
      [0, 1],
      [9, 1],
      [9, 0],
      [9, 9],
      [0, 9],
    ]);
    expect(topology.area(9, 9, 1)).to.eql([
      [9, 9],
      [0, 9],
      [0, 0],
      [9, 0],
      [8, 9],
      [9, 8],
      [0, 8],
    ]);
  });

  it('should leave out what falls off a pole that does not wrap', (): void => {
    const topology = new HexOddRTopology(10, 9);

    expect(topology.area(5, 4, 1).length).to.equal(7);
    expect(topology.area(5, 4, 2).length).to.equal(19);
    expect(topology.area(5, 0, 1).length).to.equal(5);
    expect(topology.area(5, 0, 2).length).to.equal(12);
    expect(topology.area(5, 8, 1).length).to.equal(5);
    expect(topology.area(5, 8, 2).length).to.equal(12);
    expect(topology.area(5, 1, 2).length).to.equal(16);
    expect(topology.area(0, 0, 1)).to.eql([
      [0, 0],
      [1, 0],
      [0, 1],
      [9, 1],
      [9, 0],
    ]);
  });

  it('should repeat tiles in an area larger than the world', (): void => {
    const topology = new HexOddRTopology(2, 2);

    expect(topology.area(0, 0, 1).length).to.equal(7);
    expect(topology.area(0, 0, 2).length).to.equal(19);
  });

  it('should wrap vertically only with an even height, by default', (): void => {
    expect(new HexOddRTopology(10, 10).wrapsX()).to.true;
    expect(new HexOddRTopology(7, 5).wrapsX()).to.true;
    expect(new HexOddRTopology(10, 10).wrapsY()).to.true;
    expect(new HexOddRTopology(10, 9).wrapsY()).to.false;
    expect(new HexOddRTopology(10, 10, false).wrapsY()).to.false;
    expect(new HexOddRTopology(10, 10, true).wrapsY()).to.true;
  });

  it('should refuse to be built for dimensions it cannot make', (): void => {
    expect(() => new HexOddRTopology(7, 5, true)).to.throw('7x5');
    expect(() => new HexOddRTopology(0, 6)).to.throw('0x6');
    expect(() => new HexOddRTopology(7, 5)).not.to.throw();
    expect(() => new HexOddRTopology(7, 6)).not.to.throw();
  });

  it('should validate the dimensions it can make', (): void => {
    const wrapping = new HexOddRTopology(1, 2, true),
      flat = new HexOddRTopology(1, 1, false);

    expect(() => wrapping.validate(80, 50)).not.to.throw();
    expect(() => wrapping.validate(7, 6)).not.to.throw();
    expect(() => wrapping.validate(1, 2)).not.to.throw();
    expect(() => wrapping.validate(7, 5)).to.throw('7x5');
    expect(() => wrapping.validate(1, 1)).to.throw('1x1');
    expect(() => flat.validate(7, 5)).not.to.throw();
    expect(() => flat.validate(1, 1)).not.to.throw();
    expect(() => flat.validate(80, 50)).not.to.throw();

    [wrapping, flat].forEach((topology: HexOddRTopology): void => {
      expect(() => topology.validate(0, 6)).to.throw('0x6');
      expect(() => topology.validate(6, 0)).to.throw('6x0');
      expect(() => topology.validate(2.5, 6)).to.throw('2.5x6');
      expect(() => topology.validate(6, 2.5)).to.throw('6x2.5');
    });

    expect(() => new HexOddRTopology(7, 5).validate(7, 5)).not.to.throw();
    expect(() => new HexOddRTopology(7, 5, true).validate(7, 5)).to.throw(
      'even'
    );
  });
});
