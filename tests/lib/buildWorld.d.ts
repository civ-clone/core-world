import { LandMassRegistry } from '../../LandMassRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '../../Tile';
import World from '../../World';
export declare const generateGenerator: (
  height?: number,
  width?: number,
  TerrainType?: typeof Terrain
) => Generator;
export declare const generateWorld: (
  generator?: Generator,
  ruleRegistry?: RuleRegistry,
  landMassRegistry?: LandMassRegistry
) => Promise<World>;
export declare const generateTile: (
  ruleRegistry?: RuleRegistry,
  landMassRegistry?: LandMassRegistry
) => Promise<Tile>;
