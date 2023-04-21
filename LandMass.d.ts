import DataObject from '@civ-clone/core-data-object/DataObject';
import Tile from './Tile';
export interface ILandMass extends DataObject {
  hasTile(tile: Tile): boolean;
  tiles(): Tile[];
}
export declare class LandMass extends DataObject implements ILandMass {
  #private;
  constructor(tiles: Tile[]);
  hasTile(tile: Tile): boolean;
  tiles(): Tile[];
}
export default LandMass;
