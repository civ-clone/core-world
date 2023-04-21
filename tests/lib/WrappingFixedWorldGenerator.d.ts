import Generator from '@civ-clone/core-world-generator/Generator';
import Terrain from '@civ-clone/core-terrain/Terrain';
export declare class WrappingFixedWorldGenerator extends Generator {
  #private;
  constructor(
    map: Terrain[][],
    options?: {
      [key: string]: any;
    }
  );
  generate(): Promise<Terrain[]>;
}
export default WrappingFixedWorldGenerator;
