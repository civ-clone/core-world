import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tileset from '../Tileset';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRule from '../Rules/Yield';
import { expect } from 'chai';
import { generateGenerator, generateWorld } from './lib/buildWorld';

describe('Tileset', (): void => {
  const ruleRegistry = new RuleRegistry(),
    TestYield = class extends Yield {},
    AnotherYield = class extends Yield {};

  ruleRegistry.register(
    new YieldRule(new Effect(() => new TestYield(2))),
    new YieldRule(new Effect(() => new AnotherYield(1)))
  );

  it('should include the expected `Tile`s', async (): Promise<void> => {
    const world = await generateWorld(),
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

  it('should be the expected length', async (): Promise<void> => {
    const world = await generateWorld(),
      tile = world.get(0, 0),
      tileSurroundingArea2 = tile.getSurroundingArea(),
      tileSurroundingArea0 = tile.getSurroundingArea(0),
      tileSurroundingArea4 = tile.getSurroundingArea(4);

    expect(tileSurroundingArea0.length).to.equal(1);
    expect(tileSurroundingArea2.length).to.equal(25);
    expect(tileSurroundingArea4.length).to.equal(81);
  });

  it('should be possible to mutate', async (): Promise<void> => {
    const world = await generateWorld(),
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

  it('should correctly return a score for all the contained tiles', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(), ruleRegistry),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile);

    expect(tileset.score(new Player(ruleRegistry), [[TestYield, 2]])).to.equal(
      4
    );

    tileset.push(anotherTile);

    expect(tileset.score(new Player(ruleRegistry), [[TestYield, 2]])).to.equal(
      8
    );
  });

  it('should correctly return a yields for all the contained tiles', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(), ruleRegistry),
      tile = world.get(0, 0),
      anotherTile = world.get(1, 1),
      tileset = Tileset.from(tile),
      [tilesetYield] = tileset.yields(new Player(ruleRegistry));

    expect(tilesetYield.value()).to.equal(2);

    tileset.push(anotherTile);

    const updatedYield = tileset
      .yields(new Player(ruleRegistry))
      .filter((tilesetYield) => tilesetYield instanceof TestYield)
      .reduce(
        (total: number, tileYield: Yield) => total + tileYield.value(),
        0
      );

    expect(updatedYield).to.equal(4);

    const unregisteredYield = tileset
      .yields(new Player(ruleRegistry))
      .filter((tilesetYield) => tilesetYield instanceof AnotherYield)
      .reduce(
        (total: number, tileYield: Yield) => total + tileYield.value(),
        0
      );

    expect(unregisteredYield).to.equal(2);
  });
});
