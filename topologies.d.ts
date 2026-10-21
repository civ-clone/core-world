import { ITopology, TopologyId } from './Topology';
export type { TopologyId } from './Topology';
/** Every topology id `createTopology` knows, square first. */
export declare const topologyIds: readonly TopologyId[];
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
export declare const createTopology: (id: string, width: number, height: number) => ITopology;
export default createTopology;
