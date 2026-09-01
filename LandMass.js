"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandMass = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
class LandMass extends DataObject_1.default {
    constructor(tiles) {
        super();
        this._tiles = [];
        tiles.forEach((tile) => this._tiles.push(tile));
    }
    hasTile(tile) {
        return this._tiles.includes(tile);
    }
    tiles() {
        return this._tiles;
    }
}
exports.LandMass = LandMass;
exports.default = LandMass;
//# sourceMappingURL=LandMass.js.map