import { generateGenerator, generateWorld } from './lib/buildWorld';
import Built from '../Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';
import Generator from '@civ-clone/core-world-generator/Generator';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import World from '../World';
import * as chai from 'chai';
import * as spies from 'chai-spies';

const { expect, use } = chai;

use(spies);

describe('World', (): void => {
  it('should extract dimensions from the `Generator`', (): void => {
    const world = new World(new Generator(11, 12));

    expect(world.height()).to.equal(11);
    expect(world.width()).to.equal(12);
  });

  it('should return the expected `Tile`s', (): void => {
    const world = generateWorld();

    expect(world.get(9, 9).x()).to.equal(9);
    expect(world.get(9, 9).y()).to.equal(9);
    expect(world.get(5, 4).x()).to.equal(5);
    expect(world.get(5, 4).y()).to.equal(4);
  });

  it('should process `Built` `Rule`s when built', (): void => {
    const world = new World(generateGenerator()),
      ruleRegistry = new RuleRegistry(),
      spy = chai.spy();

    ruleRegistry.register(new Built(new Effect(spy)));

    world.build(ruleRegistry);

    expect(spy).to.called.once;
  });
});
