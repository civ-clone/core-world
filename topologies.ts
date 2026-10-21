import { ITopology, TopologyId } from './Topology';
import HexOddRTopology from './HexOddRTopology';
import SquareTopology from './SquareTopology';
import StaggeredIsoTopology from './StaggeredIsoTopology';

export type { TopologyId } from './Topology';

const builders: {
  [id in TopologyId]: (width: number, height: number) => ITopology;
} = {
  square: (width: number, height: number): ITopology =>
    new SquareTopology(width, height),
  // The staggered and hexagonal grids are always built to wrap north to south,
  // as the square grid does. `World.get` wraps both axes whatever the grid, so
  // a topology that did not would disagree with the world's own lookups; and
  // with wrapping asked for, an odd height (which cannot wrap on these grids)
  // is refused instead of quietly making a world that does not.
  'staggered-iso': (width: number, height: number): ITopology =>
    new StaggeredIsoTopology(width, height, true),
  'hex-odd-r': (width: number, height: number): ITopology =>
    new HexOddRTopology(width, height, true),
};

/** Every topology id `createTopology` knows, square first. */
export const topologyIds: readonly TopologyId[] = Object.freeze([
  'square',
  'staggered-iso',
  'hex-odd-r',
] as TopologyId[]);

/**
 * The topology `id` names, for a world `width` tiles wide and `height` tall.
 *
 * Throws an `Error` for an id it does not know (a saved game is the usual
 * source of one), and the topology's own `validate` error for dimensions it
 * cannot make a world of: any size of at least 1 by 1 for `square`, and an
 * even height as well for `staggered-iso` and `hex-odd-r`, which always wrap
 * north to south.
 *
 * Pure: it reads nothing but its arguments, so the UI can use it as well.
 */
export const createTopology = (
  id: string,
  width: number,
  height: number
): ITopology => {
  if (!Object.prototype.hasOwnProperty.call(builders, id)) {
    throw new Error(
      `createTopology: unknown topology '${id}': expected one of ${topologyIds
        .map((knownId) => `'${knownId}'`)
        .join(', ')}.`
    );
  }

  const topology = builders[id as TopologyId](width, height);

  // The staggered and hexagonal grids validate as they are built; the square
  // grid does not, so check here and every id is checked the same way.
  topology.validate(width, height);

  return topology;
};

export default createTopology;
