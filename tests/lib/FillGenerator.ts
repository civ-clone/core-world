import Generator from '@civ-clone/core-world-generator/Generator';
import Terrain from '@civ-clone/core-terrain/Terrain';

export class FillGenerator extends Generator {
  #TerrainType: typeof Terrain;

  constructor(height: number, width: number, TerrainType: typeof Terrain) {
    super(height, width);

    this.#TerrainType = TerrainType;
  }

  async generate(): Promise<Terrain[]> {
    return new Array(this.height() * this.width())
      .fill(0)
      .map((): Terrain => new this.#TerrainType());
  }
}

export default FillGenerator;
