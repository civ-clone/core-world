"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var _TerrainType;
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
        _TerrainType.set(this, void 0);
        __classPrivateFieldSet(this, _TerrainType, TerrainType);
    }
    generate() {
        return new Promise((resolve) => resolve(new Array(this.height() * this.width())
            .fill(0)
            .map(() => new (__classPrivateFieldGet(this, _TerrainType))())));
    }
}
exports.FillGenerator = FillGenerator;
_TerrainType = new WeakMap();
const generateGenerator = (height = 10, width = 10, TerrainType = Terrain_1.default) => new FillGenerator(height, width, TerrainType);
exports.generateGenerator = generateGenerator;
const generateWorld = (generator = exports.generateGenerator(10, 10, Types_1.Land), ruleRegistry = RuleRegistry_1.instance) => {
    const world = new World_1.default(generator);
    return world.build(ruleRegistry);
};
exports.generateWorld = generateWorld;
const generateTile = (ruleRegistry = RuleRegistry_1.instance) => new Promise((resolve) => exports.generateWorld(exports.generateGenerator(1, 1), ruleRegistry).then((world) => resolve(world.get(0, 0))));
exports.generateTile = generateTile;
//# sourceMappingURL=buildWorld.js.map