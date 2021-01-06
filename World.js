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
var _generator, _height, _width;
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Tile_1 = require("./Tile");
const Built_1 = require("./Rules/Built");
class World extends EntityRegistry_1.EntityRegistry {
    constructor(generator) {
        super(Tile_1.default);
        _generator.set(this, void 0);
        _height.set(this, void 0);
        _width.set(this, void 0);
        __classPrivateFieldSet(this, _generator, generator);
        __classPrivateFieldSet(this, _height, generator.height());
        __classPrivateFieldSet(this, _width, generator.width());
    }
    build(ruleRegistry = RuleRegistry_1.instance) {
        __classPrivateFieldGet(this, _generator).generate().forEach((terrain, i) => {
            const tile = new Tile_1.default(i % __classPrivateFieldGet(this, _width), Math.floor(i / __classPrivateFieldGet(this, _width)), terrain, this, ruleRegistry);
            this.register(tile);
        });
        ruleRegistry.process(Built_1.default, this);
    }
    get(x, y) {
        return this.entries()[__classPrivateFieldGet(this, _generator).coordsToIndex(x, y)];
    }
    height() {
        return __classPrivateFieldGet(this, _height);
    }
    width() {
        return __classPrivateFieldGet(this, _width);
    }
}
exports.World = World;
_generator = new WeakMap(), _height = new WeakMap(), _width = new WeakMap();
exports.default = World;
//# sourceMappingURL=World.js.map