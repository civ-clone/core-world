import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { Land } from '@civ-clone/core-terrain/Types';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from '../../Tile';
import World from '../../World';
import Built from '../../Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';

export class FillGenerator extends Generator {
  #TerrainType: typeof Terrain;

  constructor(height: number, width: number, TerrainType: typeof Terrain) {
    super(height, width);

    this.#TerrainType = TerrainType;
  }

  generate(): Promise<Terrain[]> {
    return new Promise<Terrain[]>((resolve): void =>
      resolve(
        new Array(this.height() * this.width())
          .fill(0)
          .map((): Terrain => new this.#TerrainType())
      )
    );
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
) => Promise<World> = (
  generator: Generator = generateGenerator(10, 10, Land),
  ruleRegistry: RuleRegistry = ruleRegistryInstance
) => {
  return new Promise<World>((resolve) => {
    const world = new World(generator),
      onBuilt = new Built(
        new Effect((world) => {
          ruleRegistry.unregister(onBuilt);

          resolve(world);
        })
      );

    ruleRegistry.register(onBuilt);

    world.build(ruleRegistry);
  });
};

export const generateTile: (ruleRegistry?: RuleRegistry) => Promise<Tile> = (
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): Promise<Tile> =>
  new Promise((resolve) =>
    generateWorld(generateGenerator(1, 1), ruleRegistry).then((world) =>
      resolve(world.get(0, 0))
    )
  );
