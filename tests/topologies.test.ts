import createTopology, { topologyIds } from '../topologies';
import HexOddRTopology from '../HexOddRTopology';
import SquareTopology from '../SquareTopology';
import StaggeredIsoTopology from '../StaggeredIsoTopology';
import { expect } from 'chai';

describe('topologies', (): void => {
  it('should list every topology id, square first', (): void => {
    expect(topologyIds).to.deep.equal(['square', 'staggered-iso', 'hex-odd-r']);
    expect(Object.isFrozen(topologyIds)).to.be.true;
  });

  it('should give each topology its own id', (): void => {
    expect(new SquareTopology(4, 4).id()).to.equal('square');
    expect(new StaggeredIsoTopology(4, 4).id()).to.equal('staggered-iso');
    expect(new HexOddRTopology(4, 4).id()).to.equal('hex-odd-r');
  });

  it('should build the topology each id names, of the size asked for', (): void => {
    const classes = {
      square: SquareTopology,
      'staggered-iso': StaggeredIsoTopology,
      'hex-odd-r': HexOddRTopology,
    };

    topologyIds.forEach((id): void => {
      const topology = createTopology(id, 8, 6);

      expect(topology).instanceof(classes[id]);
      expect(topology.id()).to.equal(id);
      // A neighbour off the right edge wraps to column 0 and one off the
      // bottom to row 0, so the topology is 8 wide and 6 tall.
      expect(topology.neighbour(7, 2, 'e')).to.deep.equal([0, 2]);
      expect(topology.wrapsX()).to.be.true;
      expect(topology.wrapsY()).to.be.true;
      expect(
        topology.directions().some((direction): boolean => {
          const neighbour = topology.neighbour(3, 5, direction);

          return neighbour !== null && neighbour[1] === 0;
        })
      ).to.be.true;
    });
  });

  it('should throw for an id it does not know', (): void => {
    expect((): unknown => createTopology('triangle', 8, 6)).to.throw(
      Error,
      "createTopology: unknown topology 'triangle': expected one of 'square', 'staggered-iso', 'hex-odd-r'."
    );
    expect((): unknown => createTopology('toString', 8, 6)).to.throw(
      Error,
      "unknown topology 'toString'"
    );
    expect((): unknown => createTopology('', 8, 6)).to.throw(
      Error,
      "unknown topology ''"
    );
  });

  it('should refuse an odd height for the grids that always wrap north to south, and not for square', (): void => {
    expect((): unknown => createTopology('staggered-iso', 8, 5)).to.throw(
      Error,
      'StaggeredIsoTopology: cannot make a 8x5 world that wraps north to south: the height must be even'
    );
    expect((): unknown => createTopology('hex-odd-r', 8, 5)).to.throw(
      Error,
      'HexOddRTopology: cannot make a 8x5 world that wraps vertically: the height must be even.'
    );

    const square = createTopology('square', 8, 5);

    expect(square.id()).to.equal('square');
    expect(square.wrapsY()).to.be.true;
  });

  it('should validate the dimensions for every id, square included', (): void => {
    topologyIds.forEach((id): void => {
      expect((): unknown => createTopology(id, 0, 6)).to.throw(
        Error,
        'cannot make a 0x6 world'
      );
      expect((): unknown => createTopology(id, 8, 2.5)).to.throw(
        Error,
        'cannot make a 8x2.5 world'
      );
    });

    expect(createTopology('square', 1, 1).id()).to.equal('square');
  });
});
