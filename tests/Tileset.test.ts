import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tileset from '../Tileset';
import YieldRegistry from '@civ-clone/core-yield/YieldRegistry';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '../Rules/Yield';
import { expect } from 'chai';
import { generateGenerator, generateWorld } from './lib/buildWorld';

describe('Tileset', (): void => {
  const ruleRegistry = new RuleRegistry(),
    yieldRegistry = new YieldRegistry(),
    TestYield = class extends Yield {},
    AnotherYield = class extends Yield {};

  ruleRegistry.register(
    new YieldRule(
      new Criterion((tileYield) => tileYield instanceof TestYield),
      new Effect((tileYield) => tileYield.add(2))
    ),
    new YieldRule(
      new Criterion((tileYield) => tileYield instanceof AnotherYield),
      new Effect((tileYield) => tileYield.add(1))
    )
  );
  yieldRegistry.register(TestYield);

  it('should include the expected `Tile`s', (): void => {
    const world = generateWorld(),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      wrappedTile = world.get(8, 8),
      tileSurroundingArea2 = tile.getSurroundingArea(),
      tileSurroundingArea1 = tile.getSurroundingArea(1);

    expect(tileSurroundingArea2.includes(anotherTile)).to.true;
    expect(tileSurroundingArea2.includes(wrappedTile)).to.true;
    expect(tileSurroundingArea2.includes(world.get(5, 5))).to.false;
    expect(tileSurroundingArea1.includes(world.get(2, 2))).to.false;
  });

  it('should be the expected length', (): void => {
    const world = generateWorld(),
      tile = world.get(0, 0),
      tileSurroundingArea2 = tile.getSurroundingArea(),
      tileSurroundingArea0 = tile.getSurroundingArea(0),
      tileSurroundingArea4 = tile.getSurroundingArea(4);

    expect(tileSurroundingArea0.length).to.equal(1);
    expect(tileSurroundingArea2.length).to.equal(25);
    expect(tileSurroundingArea4.length).to.equal(81);
  });

  it('should be possible to mutate', (): void => {
    const world = generateWorld(),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile);

    expect(tileset.length).to.equal(1);
    expect(tileset.entries()).to.include(tile);

    tileset.push(tile);

    expect(tileset.length).to.equal(1);
    expect(tileset.entries()).to.include(tile);

    tileset.push(anotherTile);

    expect(tileset.length).to.equal(2);
    expect(tileset.entries()).to.include(tile);
    expect(tileset.entries()).to.include(anotherTile);

    tileset.shift();

    expect(tileset.length).to.equal(1);
    expect(tileset.entries()).not.include(tile);
    expect(tileset.entries()).to.include(anotherTile);
  });

  it('should correctly return a score for all the contained tiles', (): void => {
    const world = generateWorld(generateGenerator(), ruleRegistry),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile);

    expect(
      tileset.score(
        new Player(ruleRegistry),
        [[TestYield, 2]],
        [],
        yieldRegistry
      )
    ).to.equal(4);

    tileset.push(anotherTile);

    expect(
      tileset.score(
        new Player(ruleRegistry),
        [[TestYield, 2]],
        [],
        yieldRegistry
      )
    ).to.equal(8);
  });

  it('should correctly return a yields for all the contained tiles', (): void => {
    const world = generateWorld(generateGenerator(), ruleRegistry),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile),
      [tilesetYield] = tileset.yields(new Player(ruleRegistry), [TestYield]);

    expect(tilesetYield.value()).to.equal(2);

    tileset.push(anotherTile);

    const [updatedYield] = tileset.yields(new Player(ruleRegistry), [
      TestYield,
    ]);

    expect(updatedYield.value()).to.equal(4);

    const [unregisteredYield] = tileset.yields(new Player(ruleRegistry), [
      AnotherYield,
    ]);

    expect(unregisteredYield.value()).to.equal(2);
  });

  it('should use the yields from the `YieldRegistry` if none are specified', (): void => {
    const world = generateWorld(generateGenerator(), ruleRegistry),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile),
      [tilesetYield] = tileset.yields(
        new Player(ruleRegistry),
        [],
        yieldRegistry
      );

    expect(tilesetYield.value()).to.equal(2);

    tileset.push(anotherTile);

    const [updatedYield] = tileset.yields(new Player(ruleRegistry), [
      TestYield,
    ]);

    expect(updatedYield.value()).to.equal(4);

    const [unregisteredYield] = tileset.yields(new Player(ruleRegistry), [
      AnotherYield,
    ]);

    expect(unregisteredYield.value()).to.equal(2);
  });
});
