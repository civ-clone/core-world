import {
  EntityRegistry,
  IEntityRegistry,
} from '@civ-clone/core-registry/EntityRegistry';
import { Land } from '@civ-clone/core-terrain/Types';
import LandMass from './LandMass';
export interface ILandMassRegistry extends IEntityRegistry<LandMass> {
  getByTile(tile: Land): LandMass | null;
}
export declare class LandMassRegistry
  extends EntityRegistry<LandMass>
  implements ILandMassRegistry
{
  getByTile(tile: Land): LandMass;
}
export declare const instance: LandMassRegistry;
export default LandMassRegistry;
