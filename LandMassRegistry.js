"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instance = exports.LandMassRegistry = void 0;
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const LandMass_1 = require("./LandMass");
class LandMassRegistry extends EntityRegistry_1.EntityRegistry {
    constructor() {
        super(LandMass_1.default);
    }
    getByTile(tile) {
        const [landMass] = this.entries().filter((landMass) => landMass.hasTile(tile));
        return landMass !== null && landMass !== void 0 ? landMass : null;
    }
}
exports.LandMassRegistry = LandMassRegistry;
exports.instance = new LandMassRegistry();
exports.default = LandMassRegistry;
//# sourceMappingURL=LandMassRegistry.js.map