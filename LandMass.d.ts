import DataObject from '@civ-clone/core-data-object/DataObject';
import { Land } from '@civ-clone/core-terrain/Types';
export interface ILandMass extends DataObject {
  addTiles(tiles: Land[]): void;
  hasTile(tile: Land): boolean;
}
export declare class LandMass extends DataObject implements ILandMass {
  #private;
  addTiles(tiles: Land[]): void;
  hasTile(tile: Land): boolean;
}
export default LandMass;
