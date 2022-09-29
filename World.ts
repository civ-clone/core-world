import { Built, IBuiltRegistry } from './Rules/Built';
import {
  DataObject,
  IDataObject,
} from '@civ-clone/core-data-object/DataObject';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import EntityRegistry from '@civ-clone/core-registry/EntityRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { IRegistryIterator } from '@civ-clone/core-registry/Registry';
import Terrain from '@civ-clone/core-terrain/Terrain';
import Tile from './Tile';

export interface IWorld extends IDataObject {
  build(ruleRegistry: RuleRegistry): Promise<World>;
  get(x: number, y: number): Tile;
  height(): number;
  width(): number;
}

export class World extends DataObject implements IWorld {
  #generator: Generator;
  #height: number;
  #tiles: EntityRegistry<Tile> = new EntityRegistry(Tile);
  #width: number;

  constructor(generator: Generator) {
    super();

    this.#generator = generator;
    this.#height = generator.height();
    this.#width = generator.width();

    this.addKey('height', 'tiles', 'width');
  }

  build(ruleRegistry: RuleRegistry = ruleRegistryInstance): Promise<World> {
    return new Promise<World>((resolve) => {
      this.#generator.generate().then((tiles: Terrain[]) => {
        tiles.forEach((terrain: Terrain, i: number): void => {
          const tile = new Tile(
            i % this.#width,
            Math.floor(i / this.#width),
            terrain,
            this,
            ruleRegistry
          );

          this.#tiles.register(tile);
        });

        (ruleRegistry as IBuiltRegistry).process(Built, this);

        resolve(this);
      });
    });
  }

  entries(): Tile[] {
    return this.#tiles.entries();
  }

  filter(iterator: IRegistryIterator<Tile>): Tile[] {
    return this.entries().filter(iterator);
  }

  forEach(iterator: (item: Tile, i: number) => void): void {
    return this.#tiles.forEach(iterator);
  }

  get(x: number, y: number): Tile {
    return this.entries()[this.#generator.coordsToIndex(x, y)];
  }

  height(): number {
    return this.#height;
  }

  includes(tile: Tile): boolean {
    return this.#tiles.includes(tile);
  }

  map(iterator: (item: Tile, i: number) => any): any[] {
    return this.#tiles.map(iterator);
  }

  register(...tiles: Tile[]): void {
    this.#tiles.register(...tiles);
  }

  tiles(): Tile[] {
    return this.entries();
  }

  width(): number {
    return this.#width;
  }
}

export default World;
