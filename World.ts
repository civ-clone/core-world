import Generator from '@civ-clone/core-world-generator/Generator';
import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from './Tile';
import Built, { IBuiltRegistry } from './Rules/Built';

export interface IWorld extends IEntityRegistry<Tile> {
  build(ruleRegistry: RuleRegistry): void;
  get(x: number, y: number): Tile;
  height(): number;
  width(): number;
}

export class World extends EntityRegistry<Tile> implements IWorld {
  #generator: Generator;
  #height: number;
  #width: number;

  constructor(generator: Generator) {
    super(Tile);

    this.#generator = generator;
    this.#height = generator.height();
    this.#width = generator.width();
  }

  build(ruleRegistry: RuleRegistry = ruleRegistryInstance): void {
    this.#generator.generate().forEach((terrain: Terrain, i: number): void => {
      const tile = new Tile(
        i % this.#width,
        Math.floor(i / this.#width),
        terrain,
        this,
        ruleRegistry
      );

      this.register(tile);
    });

    (ruleRegistry as IBuiltRegistry).process(Built, this);
  }

  get(x: number, y: number): Tile {
    return this.entries()[this.#generator.coordsToIndex(x, y)];
  }

  height(): number {
    return this.#height;
  }
  width(): number {
    return this.#width;
  }
}

export default World;
