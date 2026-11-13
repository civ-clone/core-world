"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerrainChanged = void 0;
const Rule_1 = require("@civ-clone/core-rule/Rule");
/**
 * Processed by `Tile.setTerrain` after the tile takes its new terrain, as
 * `(tile, from, to)`.
 *
 * Anything bound to a `Terrain` instance (its features, for one) stays with
 * `from` unless a rule moves it, so a rule set decides here what follows the
 * square onto `to`.
 */
class TerrainChanged extends Rule_1.default {
}
exports.TerrainChanged = TerrainChanged;
exports.default = TerrainChanged;
//# sourceMappingURL=TerrainChanged.js.map