import {
  LandMassRegistry,
  instance as landMassRegistryInstance,
} from '../LandMassRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import LandMass from '../LandMass';
import Tile from '../Tile';

export const getAdditionalData = (
  landMassRegistry: LandMassRegistry = landMassRegistryInstance
): AdditionalData[] => [
  new AdditionalData(Tile, 'landMass', (tile: Tile): LandMass | null =>
    landMassRegistry.getByTile(tile)
  ),
];

export default getAdditionalData;
