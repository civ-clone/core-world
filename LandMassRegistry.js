"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandMassRegistry = void 0;
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
class LandMassRegistry extends EntityRegistry_1.EntityRegistry {
    getByTile(tile) {
        const [landMass] = this.entries().filter((landMass) => landMass.hasTile(tile));
        return landMass !== null && landMass !== void 0 ? landMass : null;
    }
}
exports.LandMassRegistry = LandMassRegistry;
exports.default = LandMassRegistry;
//# sourceMappingURL=LandMassRegistry.js.map