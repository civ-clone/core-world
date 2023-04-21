import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import LandMass from './LandMass';
import Tile from './Tile';
export interface ILandMassRegistry extends IEntityRegistry<LandMass> {
  getByTile(tile: Tile): LandMass | null;
}
export declare class LandMassRegistry
  extends EntityRegistry<LandMass>
  implements ILandMassRegistry
{
  constructor();
  getByTile(tile: Tile): LandMass | null;
}
export declare const instance: LandMassRegistry;
export default LandMassRegistry;
