import Generator from '@civ-clone/core-world-generator/Generator';
import Terrain from '@civ-clone/core-terrain/Terrain';

export class WrappingFixedWorldGenerator extends Generator {
  #map: Terrain[][];

  constructor(map: Terrain[][], options: { [key: string]: any } = {}) {
    super(map.length, Math.max(...map.map((row) => row.length)), options);

    this.#map = map;
  }

  async generate(): Promise<Terrain[]> {
    return new Array(this.height())
      .fill(0)
      .map((_, rowIndex) =>
        new Array(this.width())
          .fill(0)
          .map(
            (_, colIndex) =>
              this.#map[rowIndex][colIndex % this.#map[rowIndex].length]
          )
      )
      .flat();
  }
}

export default WrappingFixedWorldGenerator;
