import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import LandMass from './LandMass';
import Tile from './Tile';

export interface ILandMassRegistry extends IEntityRegistry<LandMass> {
  getByTile(tile: Tile): LandMass | null;
}

export class LandMassRegistry
  extends EntityRegistry<LandMass>
  implements ILandMassRegistry
{
  constructor() {
    super(LandMass);
  }

  getByTile(tile: Tile): LandMass | null {
    const [landMass] = this.entries().filter((landMass) =>
      landMass.hasTile(tile)
    );

    return landMass ?? null;
  }
}

export const instance = new LandMassRegistry();

export default LandMassRegistry;
