import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from '../../LandMassRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import FillGenerator from './FillGenerator';
import Generator from '@civ-clone/core-world-generator/Generator';
import { Land } from '@civ-clone/core-terrain/Types';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '../../Tile';
import World from '../../World';

export const generateGenerator: (
  height?: number,
  width?: number,
  TerrainType?: typeof Terrain
) => Generator = (
  height: number = 10,
  width: number = 10,
  TerrainType: typeof Terrain = Terrain
): Generator => new FillGenerator(height, width, TerrainType);

export const generateWorld = (
  generator: Generator = generateGenerator(10, 10, Land),
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  landMassRegistry: LandMassRegistry = landMassRegistryInstance
) => {
  const world = new World(generator, ruleRegistry, landMassRegistry);

  return world.build();
};

export const generateTile = async (
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  landMassRegistry: LandMassRegistry = landMassRegistryInstance
): Promise<Tile> => {
  const world = await generateWorld(
    generateGenerator(1, 1),
    ruleRegistry,
    landMassRegistry
  );

  return world.get(0, 0);
};
