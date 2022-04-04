"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _FillGenerator_TerrainType;
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTile = exports.generateWorld = exports.generateGenerator = exports.FillGenerator = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Generator_1 = require("@civ-clone/core-world-generator/Generator");
const Types_1 = require("@civ-clone/core-terrain/Types");
const Terrain_1 = require("@civ-clone/core-terrain/Terrain");
const World_1 = require("../../World");
class FillGenerator extends Generator_1.default {
    constructor(height, width, TerrainType) {
        super(height, width);
        _FillGenerator_TerrainType.set(this, void 0);
        __classPrivateFieldSet(this, _FillGenerator_TerrainType, TerrainType, "f");
    }
    generate() {
        return new Promise((resolve) => resolve(new Array(this.height() * this.width())
            .fill(0)
            .map(() => new (__classPrivateFieldGet(this, _FillGenerator_TerrainType, "f"))())));
    }
}
exports.FillGenerator = FillGenerator;
_FillGenerator_TerrainType = new WeakMap();
const generateGenerator = (height = 10, width = 10, TerrainType = Terrain_1.default) => new FillGenerator(height, width, TerrainType);
exports.generateGenerator = generateGenerator;
const generateWorld = (generator = (0, exports.generateGenerator)(10, 10, Types_1.Land), ruleRegistry = RuleRegistry_1.instance) => {
    const world = new World_1.default(generator);
    return world.build(ruleRegistry);
};
exports.generateWorld = generateWorld;
const generateTile = (ruleRegistry = RuleRegistry_1.instance) => new Promise((resolve) => (0, exports.generateWorld)((0, exports.generateGenerator)(1, 1), ruleRegistry).then((world) => resolve(world.get(0, 0))));
exports.generateTile = generateTile;
//# sourceMappingURL=buildWorld.js.map