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
var _WrappingFixedWorldGenerator_map;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrappingFixedWorldGenerator = void 0;
const Generator_1 = require("@civ-clone/core-world-generator/Generator");
class WrappingFixedWorldGenerator extends Generator_1.default {
    constructor(map, options = {}) {
        super(map.length, Math.max(...map.map((row) => row.length)), options);
        _WrappingFixedWorldGenerator_map.set(this, void 0);
        __classPrivateFieldSet(this, _WrappingFixedWorldGenerator_map, map, "f");
    }
    async generate() {
        return new Array(this.height())
            .fill(0)
            .map((_, rowIndex) => new Array(this.width())
            .fill(0)
            .map((_, colIndex) => __classPrivateFieldGet(this, _WrappingFixedWorldGenerator_map, "f")[rowIndex][colIndex % __classPrivateFieldGet(this, _WrappingFixedWorldGenerator_map, "f")[rowIndex].length]))
            .flat();
    }
}
exports.WrappingFixedWorldGenerator = WrappingFixedWorldGenerator;
_WrappingFixedWorldGenerator_map = new WeakMap();
exports.default = WrappingFixedWorldGenerator;
//# sourceMappingURL=WrappingFixedWorldGenerator.js.map