import DataObject from '@civ-clone/core-data-object/DataObject';
import Tile from './Tile';

export interface ILandMass extends DataObject {
  hasTile(tile: Tile): boolean;
  tiles(): Tile[];
}

export class LandMass extends DataObject implements ILandMass {
  private _tiles: Tile[] = [];

  constructor(tiles: Tile[]) {
    super();

    tiles.forEach((tile) => this._tiles.push(tile));
  }

  hasTile(tile: Tile): boolean {
    return this._tiles.includes(tile);
  }

  tiles(): Tile[] {
    return this._tiles;
  }
}

export default LandMass;
