import { Land, Water } from '@civ-clone/core-terrain/Types';
import { generateGenerator, generateWorld } from './lib/buildWorld';
import Built from '../Rules/Built';
import Effect from '@civ-clone/core-rule/Effect';
import FillGenerator from './lib/FillGenerator';
import Generator from '@civ-clone/core-world-generator/Generator';
import HexOddRTopology from '../HexOddRTopology';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import SquareTopology from '../SquareTopology';
import World from '../World';
import WrappingFixedWorldGenerator from './lib/WrappingFixedWorldGenerator';
import * as chai from 'chai';
import * as spies from 'chai-spies';
import LandMassRegistry from '../LandMassRegistry';
import StaggeredIsoTopology from '../StaggeredIsoTopology';

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

  it('should own one square topology, rebuilt after hydration', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(5, 7)),
      topology = world.topology();

    expect(topology).instanceof(SquareTopology);
    expect(world.topology()).equal(topology);
    expect(topology.distance(0, 0, 6, 0)).to.equal(1);
    expect(topology.distance(0, 0, 0, 4)).to.equal(1);
    expect(World.transient).to.include('_topology');

    world.onHydrated();

    expect(world.topology()).not.equal(topology);
    expect(world.topology()).instanceof(SquareTopology);
  });

  it('should record the square topology id of a default generator, as a saved field', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(5, 7));

    expect(new World(new Generator(11, 12)).topologyId()).to.equal('square');
    expect(world.topologyId()).to.equal('square');
    expect(world.topology().id()).to.equal('square');
    expect(world.stateKeys()).to.include('_topologyId');
    expect(World.transient).not.to.include('_topologyId');
  });

  it("should take the id of its generator's topology and build its own topology from it", async (): Promise<void> => {
    const generatorTopology = new HexOddRTopology(6, 4),
      world = await generateWorld(
        new FillGenerator(4, 6, Land, { topology: generatorTopology })
      ),
      topology = world.topology();

    expect(world.topologyId()).to.equal('hex-odd-r');
    expect(topology).instanceof(HexOddRTopology);
    expect(topology).not.equal(generatorTopology);
    expect(topology.wrapsY()).to.be.true;
    expect(world.get(2, 2).getNeighbours()).length(6);
    // Odd row 1, column 5: its north-east neighbour wraps round to column 0
    // of row 0.
    expect(world.get(5, 1).isNeighbourOf(world.get(0, 0))).to.be.true;

    world.onHydrated();

    expect(world.topologyId()).to.equal('hex-odd-r');
    expect(world.topology()).not.equal(topology);
    expect(world.topology()).instanceof(HexOddRTopology);
  });

  it('should refuse, when first asked for its topology, a staggered or hexagonal world of odd height', async (): Promise<void> => {
    const world = new World(
      new FillGenerator(5, 6, Land, {
        // Built without asking to wrap, so an odd height is allowed here; the
        // world's own topology always wraps north to south.
        topology: new StaggeredIsoTopology(6, 5),
      })
    );

    expect(world.topologyId()).to.equal('staggered-iso');
    expect((): unknown => world.topology()).to.throw(
      Error,
      'StaggeredIsoTopology: cannot make a 6x5 world that wraps north to south: the height must be even'
    );
  });

  it('should treat a generator topology without an id as square only when its class is a `SquareTopology`', async (): Promise<void> => {
    // A topology from a copy of `core-world` from before `id()`: its class is
    // not this copy's, so only its name can be compared.
    const fromOldCopy = (name: string): object => {
        const Class = class {};

        Object.defineProperty(Class, 'name', { value: name });

        return new Class();
      },
      worldOn = (topology: object): World => {
        const generator = generateGenerator(4, 4);

        generator.topology = (): any => topology;

        return new World(generator);
      };

    expect(worldOn(fromOldCopy('SquareTopology')).topologyId()).to.equal(
      'square'
    );
    expect((): unknown => worldOn(fromOldCopy('HexOddRTopology'))).to.throw(
      Error,
      "World: the generator's topology (HexOddRTopology) has no id(): the copy of core-world that core-world-generator uses predates topology ids"
    );
    expect((): unknown => worldOn({})).to.throw(
      Error,
      "World: the generator's topology (Object) has no id()"
    );
  });

  it('should load a world saved without a topology id as square, and save it from then on', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(5, 7)),
      fields = world as unknown as { [key: string]: unknown };

    // `hydrate` restores only the saved fields, without running the
    // constructor, so a save from before the id was recorded leaves it unset.
    delete fields._topologyId;

    expect(world.stateKeys()).not.to.include('_topologyId');

    world.onHydrated();

    expect(world.topologyId()).to.equal('square');
    expect(world.topology()).instanceof(SquareTopology);
    expect(world.stateKeys()).to.include('_topologyId');
  });

  it('should throw, when first asked for its topology, for a saved id it does not know', async (): Promise<void> => {
    const world = await generateWorld(generateGenerator(5, 7));

    (world as unknown as { [key: string]: unknown })._topologyId = 'triangle';
    world.onHydrated();

    expect(world.topologyId()).to.equal('triangle');
    expect((): unknown => world.topology()).to.throw(
      Error,
      "createTopology: unknown topology 'triangle'"
    );
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
