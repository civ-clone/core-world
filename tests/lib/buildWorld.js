"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTile = exports.generateWorld = exports.generateGenerator = void 0;
const LandMassRegistry_1 = require("../../LandMassRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const FillGenerator_1 = require("./FillGenerator");
const Types_1 = require("@civ-clone/core-terrain/Types");
const Terrain_1 = require("@civ-clone/core-terrain/Terrain");
const World_1 = require("../../World");
const generateGenerator = (height = 10, width = 10, TerrainType = Terrain_1.default) => new FillGenerator_1.default(height, width, TerrainType);
exports.generateGenerator = generateGenerator;
const generateWorld = (generator = (0, exports.generateGenerator)(10, 10, Types_1.Land), ruleRegistry = RuleRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance) => {
    const world = new World_1.default(generator, ruleRegistry, landMassRegistry);
    return world.build();
};
exports.generateWorld = generateWorld;
const generateTile = async (ruleRegistry = RuleRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance) => {
    const world = await (0, exports.generateWorld)((0, exports.generateGenerator)(1, 1), ruleRegistry, landMassRegistry);
    return world.get(0, 0);
};
exports.generateTile = generateTile;
//# sourceMappingURL=buildWorld.js.map