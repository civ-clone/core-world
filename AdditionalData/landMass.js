"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdditionalData = void 0;
const LandMassRegistry_1 = require("../LandMassRegistry");
const AdditionalData_1 = require("@civ-clone/core-data-object/AdditionalData");
const Tile_1 = require("../Tile");
const getAdditionalData = (landMassRegistry = LandMassRegistry_1.instance) => [
    new AdditionalData_1.default(Tile_1.default, 'landMass', (tile) => landMassRegistry.getByTile(tile)),
];
exports.getAdditionalData = getAdditionalData;
exports.default = exports.getAdditionalData;
//# sourceMappingURL=landMass.js.map