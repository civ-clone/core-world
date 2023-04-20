"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LandMass_tiles;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandMass = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
class LandMass extends DataObject_1.default {
    constructor() {
        super(...arguments);
        _LandMass_tiles.set(this, []);
    }
    addTiles(tiles) {
        tiles.forEach((tile) => __classPrivateFieldGet(this, _LandMass_tiles, "f").push(tile));
    }
    hasTile(tile) {
        return __classPrivateFieldGet(this, _LandMass_tiles, "f").includes(tile);
    }
}
exports.LandMass = LandMass;
_LandMass_tiles = new WeakMap();
exports.default = LandMass;
//# sourceMappingURL=LandMass.js.map