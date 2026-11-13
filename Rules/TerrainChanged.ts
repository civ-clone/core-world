import Rule from '@civ-clone/core-rule/Rule';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '../Tile';

/** The tile whose terrain changed, its terrain before and its terrain now. */
type TerrainChangedArgs = [Tile, Terrain, Terrain];

/**
 * Processed by `Tile.setTerrain` after the tile takes its new terrain, as
 * `(tile, from, to)`.
 *
 * Anything bound to a `Terrain` instance (its features, for one) stays with
 * `from` unless a rule moves it, so a rule set decides here what follows the
 * square onto `to`.
 */
export class TerrainChanged extends Rule<TerrainChangedArgs, void> {}

export default TerrainChanged;
