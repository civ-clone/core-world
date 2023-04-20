import DataObject from '@civ-clone/core-data-object/DataObject';
import { Land } from '@civ-clone/core-terrain/Types';

export interface ILandMass extends DataObject {
  addTiles(tiles: Land[]): void;
  hasTile(tile: Land): boolean;
}

export class LandMass extends DataObject implements ILandMass {
  #tiles: Land[] = [];

  addTiles(tiles: Land[]): void {
    tiles.forEach((tile) => this.#tiles.push(tile));
  }

  hasTile(tile: Land): boolean {
    return this.#tiles.includes(tile);
  }
}

export default LandMass;
