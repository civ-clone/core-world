"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTopology = exports.topologyIds = void 0;
const HexOddRTopology_1 = require("./HexOddRTopology");
const SquareTopology_1 = require("./SquareTopology");
const StaggeredIsoTopology_1 = require("./StaggeredIsoTopology");
const builders = {
    square: (width, height) => new SquareTopology_1.default(width, height),
    // The staggered and hexagonal grids are always built to wrap north to south,
    // as the square grid does. `World.get` wraps both axes whatever the grid, so
    // a topology that did not would disagree with the world's own lookups; and
    // with wrapping asked for, an odd height (which cannot wrap on these grids)
    // is refused instead of quietly making a world that does not.
    'staggered-iso': (width, height) => new StaggeredIsoTopology_1.default(width, height, true),
    'hex-odd-r': (width, height) => new HexOddRTopology_1.default(width, height, true),
};
/** Every topology id `createTopology` knows, square first. */
exports.topologyIds = Object.freeze([
    'square',
    'staggered-iso',
    'hex-odd-r',
]);
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
const createTopology = (id, width, height) => {
    if (!Object.prototype.hasOwnProperty.call(builders, id)) {
        throw new Error(`createTopology: unknown topology '${id}': expected one of ${exports.topologyIds
            .map((knownId) => `'${knownId}'`)
            .join(', ')}.`);
    }
    const topology = builders[id](width, height);
    // The staggered and hexagonal grids validate as they are built; the square
    // grid does not, so check here and every id is checked the same way.
    topology.validate(width, height);
    return topology;
};
exports.createTopology = createTopology;
exports.default = exports.createTopology;
//# sourceMappingURL=topologies.js.map