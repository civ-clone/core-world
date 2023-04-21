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
exports.FillGenerator = void 0;
const Generator_1 = require("@civ-clone/core-world-generator/Generator");
class FillGenerator extends Generator_1.default {
    constructor(height, width, TerrainType) {
        super(height, width);
        _FillGenerator_TerrainType.set(this, void 0);
        __classPrivateFieldSet(this, _FillGenerator_TerrainType, TerrainType, "f");
    }
    async generate() {
        return new Array(this.height() * this.width())
            .fill(0)
            .map(() => new (__classPrivateFieldGet(this, _FillGenerator_TerrainType, "f"))());
    }
}
exports.FillGenerator = FillGenerator;
_FillGenerator_TerrainType = new WeakMap();
exports.default = FillGenerator;
//# sourceMappingURL=FillGenerator.js.map