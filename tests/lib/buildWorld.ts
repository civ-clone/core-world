import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { Land } from '@civ-clone/core-terrain/Types';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '../../Tile';
import World from '../../World';

export class FillGenerator extends Generator {
  #TerrainType: typeof Terrain;

  constructor(height: number, width: number, TerrainType: typeof Terrain) {
    super(height, width);

    this.#TerrainType = TerrainType;
  }

  generate(): Terrain[] {
    return new Array(this.height() * this.width())
      .fill(0)
      .map((): Terrain => new this.#TerrainType());
  }
}

export const generateGenerator: (
  height?: number,
  width?: number,
  TerrainType?: typeof Terrain
) => Generator = (
  height: number = 10,
  width: number = 10,
  TerrainType: typeof Terrain = Terrain
): Generator => new FillGenerator(height, width, TerrainType);

export const generateWorld: (
  generator?: Generator,
  ruleRegistry?: RuleRegistry
) => World = (
  generator: Generator = generateGenerator(10, 10, Land),
  ruleRegistry: RuleRegistry = ruleRegistryInstance
) => {
  const world = new World(generator);

  world.build(ruleRegistry);

  return world;
};

export const generateTile: (ruleRegistry?: RuleRegistry) => Tile = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): Tile => generateWorld(generateGenerator(1, 1), ruleRegistry).get(0, 0);
