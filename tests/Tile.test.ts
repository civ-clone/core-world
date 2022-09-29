import { Land, Water } from '@civ-clone/core-terrain/Types';
import {
  generateGenerator,
  generateTile,
  generateWorld,
} from './lib/buildWorld';
import Effect from '@civ-clone/core-rule/Effect';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '../Tile';
import Yield from '@civ-clone/core-yield/Yield';
import YieldRegistry from '@civ-clone/core-yield/YieldRegistry';
import YieldRule from '../Rules/Yield';
import { expect } from 'chai';

describe('Tile', (): void => {
  const ruleRegistry = new RuleRegistry(),
    yieldRegistry = new YieldRegistry(),
    TestYield = class extends Yield {};

  ruleRegistry.register(new YieldRule(new Effect(() => new TestYield(2))));
  yieldRegistry.register(TestYield);

  it('should return expected distances for other `Tile`s', async (): Promise<void> => {
    const world = await generateWorld(),
      tile = world.get(0, 0);

    expect(tile.distanceFrom(world.get(0, 0))).to.equal(0);
    expect(tile.distanceFrom(world.get(4, 0))).to.equal(4);
    expect(world.get(5, 0).distanceFrom(world.get(5, 4))).to.equal(4);
    expect(world.get(5, 0).distanceFrom(world.get(9, 0))).to.equal(4);
  });

  it('should correctly wrap when checking distances', async (): Promise<void> => {
    const world = await generateWorld(),
      tile = world.get(0, 0);

    expect(tile.distanceFrom(world.get(0, 9))).to.equal(1);
    expect(tile.distanceFrom(world.get(9, 0))).to.equal(1);
    expect(tile.distanceFrom(world.get(9, 9))).to.equal(Math.hypot(1, 1));
    expect(tile.distanceFrom(world.get(8, 8))).to.equal(Math.hypot(2, 2));
  });

  it('should correctly return neighbouring tiles', async (): Promise<void> => {
    const world = await generateWorld(),
      tile = world.get(0, 0);

    expect(tile.getNeighbours().length).to.equal(8);
    (
      [
        world.get(0, 9),
        world.get(1, 9),
        world.get(1, 0),
        world.get(1, 1),
        world.get(0, 1),
        world.get(9, 1),
        world.get(9, 0),
        world.get(9, 1),
      ] as Tile[]
    ).forEach((neighbouringTile: Tile) =>
      expect(tile.getNeighbours()).to.include(neighbouringTile)
    );
  });

  it('should be able to identify the underlying terrain', async (): Promise<void> => {
    const tile = await generateTile();

    tile.setTerrain(new Water());

    expect(tile.terrain()).to.instanceof(Water);
    expect(tile.isLand()).to.false;
    expect(tile.isWater()).to.true;

    tile.setTerrain(new Land());

    expect(tile.terrain()).to.instanceof(Land);
    expect(tile.isLand()).to.true;
    expect(tile.isWater()).to.false;
  });

  it('should correctly calculate score', async (): Promise<void> => {
    const tile = await generateTile(ruleRegistry);

    expect(tile.score(new Player(ruleRegistry), [[TestYield, 2]])).to.equal(4);

    expect(
      tile.score(new Player(ruleRegistry), [[TestYield, 0]]),
      'Should default the score to 1 for `Yield`s marked with `0`'
    ).to.equal(2);

    expect(
      tile.score(new Player(ruleRegistry), [
        [TestYield, 0],
        [class extends Yield {}, 0],
      ]),
      'Should not return a score of 0 for tiles missing some of the rated `Yield`s if they are scored at `0`.'
    ).to.equal(2);
  });

  it('should cache yields for a player', async (): Promise<void> => {
    const tile = await generateTile(ruleRegistry),
      player = new Player(ruleRegistry),
      [testYield] = tile.yields(player);

    expect(testYield.value()).to.equal(2);

    const [cachedYield] = tile.yields(player);

    expect(cachedYield).equal(testYield);
    expect(cachedYield.value()).to.equal(testYield.value());

    tile.clearYieldCache(player);

    const [freshYield] = tile.yields(player);

    // this no longer returns the same object
    expect(cachedYield).not.equal(freshYield);
    expect(freshYield.value()).to.equal(cachedYield.value());
  });

  it('should correctly identify and return surrounding tiles', async (): Promise<void> => {
    const world = await generateWorld(),
      tile = world.get(0, 0);

    expect(tile.getAdjacentDirections()).to.eql(['n', 'e', 's', 'w']);

    expect(
      tile.getAdjacent().map((tile: Tile) => ({
        x: tile.x(),
        y: tile.y(),
      }))
    ).to.eql(
      [
        world.get(tile.x(), tile.y() - 1),
        world.get(tile.x() + 1, tile.y()),
        world.get(tile.x(), tile.y() + 1),
        world.get(tile.x() - 1, tile.y()),
      ].map((tile: Tile) => ({
        x: tile.x(),
        y: tile.y(),
      }))
    );

    expect(tile.getNeighbouringDirections()).to.eql([
      'n',
      'ne',
      'e',
      'se',
      's',
      'sw',
      'w',
      'nw',
    ]);

    expect(
      tile.getNeighbours().map((tile: Tile) => ({
        x: tile.x(),
        y: tile.y(),
      }))
    ).to.eql(
      [
        world.get(tile.x(), tile.y() - 1),
        world.get(tile.x() + 1, tile.y() - 1),
        world.get(tile.x() + 1, tile.y()),
        world.get(tile.x() + 1, tile.y() + 1),
        world.get(tile.x(), tile.y() + 1),
        world.get(tile.x() - 1, tile.y() + 1),
        world.get(tile.x() - 1, tile.y()),
        world.get(tile.x() - 1, tile.y() - 1),
      ].map((tile: Tile) => ({
        x: tile.x(),
        y: tile.y(),
      }))
    );

    expect(tile.isNeighbourOf(tile)).to.false;

    tile.getNeighbours().forEach((neighbouringTile: Tile): void => {
      expect(tile.isNeighbourOf(neighbouringTile)).to.true;
    });

    expect(tile.isNeighbourOf(world.get(80, 50))).to.false;
  });

  it('should correctly identify coastal tiles', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(10, 10, Land)),
      tile = world.get(0, 0);

    tile.setTerrain(new Water());

    expect(tile.isCoast()).to.true;

    tile.getNeighbours().forEach((tile: Tile): void => {
      expect(tile.isCoast()).to.true;
    });

    tile.setTerrain(new Land());

    expect(tile.isCoast()).to.false;

    tile.getNeighbours().forEach((tile: Tile): void => {
      expect(tile.isCoast()).to.false;
    });
  });
});
