import { Land, Water } from '@civ-clone/core-terrain/Types';
import { generateGenerator, generateWorld } from './lib/buildWorld';
import Built from '../Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import World from '../World';
import WrappingFixedWorldGenerator from './lib/WrappingFixedWorldGenerator';
import * as chai from 'chai';
import * as spies from 'chai-spies';
import LandMassRegistry from '../LandMassRegistry';

const { expect, use } = chai;

use(spies);

describe('World', (): void => {
  it('should extract dimensions from the `Generator`', async (): Promise<void> => {
    const world = new World(new Generator(11, 12));

    expect(world.height()).to.equal(11);
    expect(world.width()).to.equal(12);
  });

  it('should return the expected `Tile`s', async (): Promise<void> => {
    const world = await generateWorld();

    expect(world.get(9, 9).x()).to.equal(9);
    expect(world.get(9, 9).y()).to.equal(9);
    expect(world.get(5, 4).x()).to.equal(5);
    expect(world.get(5, 4).y()).to.equal(4);
  });

  it('should process `Built` `Rule`s when built', async (): Promise<void> => {
    const ruleRegistry = new RuleRegistry(),
      world = new World(generateGenerator(), ruleRegistry),
      worldBuiltSpy = chai.spy();

    ruleRegistry.register(
      new Built(
        new Effect((world) => {
          expect(world).instanceof(World);

          worldBuiltSpy();
        })
      )
    );

    await world.build();

    expect(worldBuiltSpy).called.once;
  });

  it('should generate the expected number of `LandMass`es', async (): Promise<void> => {
    const landMassRegistry = new LandMassRegistry();

    const world = await generateWorld(
      new WrappingFixedWorldGenerator([
        [
          new Land(),
          new Water(),
          new Water(),
          new Land(),
          new Water(),
          new Water(),
        ],
        [
          new Water(),
          new Water(),
          new Water(),
          new Land(),
          new Water(),
          new Water(),
        ],
        [
          new Land(),
          new Water(),
          new Land(),
          new Water(),
          new Water(),
          new Water(),
        ],
        [
          new Water(),
          new Water(),
          new Water(),
          new Water(),
          new Water(),
          new Water(),
        ],
        [
          new Land(),
          new Water(),
          new Land(),
          new Land(),
          new Water(),
          new Land(),
        ],
        [
          new Land(),
          new Water(),
          new Water(),
          new Water(),
          new Water(),
          new Water(),
        ],
      ]),
      undefined,
      landMassRegistry
    );

    expect(landMassRegistry.length).eq(4);
    expect(landMassRegistry.getByTile(world.get(0, 0))).eq(
      landMassRegistry.getByTile(world.get(0, 5))
    );
    expect(landMassRegistry.getByTile(world.get(0, 0))).not.eq(
      landMassRegistry.getByTile(world.get(3, 0))
    );
    expect(landMassRegistry.getByTile(world.get(0, 1))).null;
  });
});
