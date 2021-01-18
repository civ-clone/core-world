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
var _map, _neighbours, _ruleRegistry, _terrain, _x, _y, _yieldCache;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
const Types_1 = require("@civ-clone/core-terrain/Types");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const YieldRegistry_1 = require("@civ-clone/core-yield/YieldRegistry");
const Tileset_1 = require("./Tileset");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const Yield_2 = require("./Rules/Yield");
class Tile extends DataObject_1.DataObject {
    constructor(x, y, terrain, map, ruleRegistry = RuleRegistry_1.instance) {
        super();
        _map.set(this, void 0);
        _neighbours.set(this, []);
        _ruleRegistry.set(this, void 0);
        _terrain.set(this, void 0);
        _x.set(this, void 0);
        _y.set(this, void 0);
        _yieldCache.set(this, new Map());
        __classPrivateFieldSet(this, _x, x);
        __classPrivateFieldSet(this, _y, y);
        __classPrivateFieldSet(this, _terrain, terrain);
        __classPrivateFieldSet(this, _map, map);
        __classPrivateFieldSet(this, _ruleRegistry, ruleRegistry);
        this.addKey('terrain', 'isCoast', 'isLand', 'isWater', 'x', 'y', 'yields');
    }
    clearYieldCache(player = null) {
        if (player === null) {
            __classPrivateFieldGet(this, _yieldCache).clear();
            return;
        }
        __classPrivateFieldGet(this, _yieldCache).set(player, new Map());
    }
    getYieldCache(player = null) {
        const cacheCheck = __classPrivateFieldGet(this, _yieldCache).get(player);
        if (cacheCheck) {
            return cacheCheck;
        }
        const cache = new Map();
        __classPrivateFieldGet(this, _yieldCache).set(player, cache);
        return cache;
    }
    getAdjacent() {
        return this.getAdjacentDirections().map((direction) => this.getNeighbour(direction));
    }
    getAdjacentDirections() {
        return ['n', 'e', 's', 'w'];
    }
    getNeighbour(direction) {
        if (direction === 'n') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x), __classPrivateFieldGet(this, _y) - 1);
        }
        if (direction === 'ne') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) + 1, __classPrivateFieldGet(this, _y) - 1);
        }
        if (direction === 'e') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) + 1, __classPrivateFieldGet(this, _y));
        }
        if (direction === 'se') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) + 1, __classPrivateFieldGet(this, _y) + 1);
        }
        if (direction === 's') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x), __classPrivateFieldGet(this, _y) + 1);
        }
        if (direction === 'sw') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) - 1, __classPrivateFieldGet(this, _y) + 1);
        }
        if (direction === 'w') {
            return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) - 1, __classPrivateFieldGet(this, _y));
        }
        return __classPrivateFieldGet(this, _map).get(__classPrivateFieldGet(this, _x) - 1, __classPrivateFieldGet(this, _y) - 1);
    }
    getNeighbouringDirections() {
        return ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    }
    getNeighbours() {
        if (!__classPrivateFieldGet(this, _neighbours).length) {
            __classPrivateFieldSet(this, _neighbours, this.getNeighbouringDirections().map((direction) => this.getNeighbour(direction)));
        }
        return __classPrivateFieldGet(this, _neighbours);
    }
    getSurroundingArea(radius = 2) {
        return Tileset_1.default.fromSurrounding(this, radius);
    }
    distanceFrom(tile) {
        const map = [
            [-1, 1],
            [-1, 0],
            [-1, -1],
            [0, 1],
            [0, 0],
            [0, -1],
            [1, 1],
            [1, 0],
            [1, -1],
        ], [shortestDistance] = map
            .map(([x, y]) => Math.hypot(__classPrivateFieldGet(this, _x) - tile.x() + x * __classPrivateFieldGet(this, _map).width(), __classPrivateFieldGet(this, _y) - tile.y() + y * __classPrivateFieldGet(this, _map).height()))
            .sort((a, b) => a - b);
        return shortestDistance;
    }
    isCoast() {
        const tile = this;
        return ((tile.isWater() &&
            tile.getNeighbours().some((tile) => tile.isLand())) ||
            (tile.isLand() &&
                tile.getNeighbours().some((tile) => tile.isWater())));
    }
    isLand() {
        return __classPrivateFieldGet(this, _terrain) instanceof Types_1.Land;
    }
    isNeighbourOf(otherTile) {
        return this.getNeighbours().includes(otherTile);
    }
    isWater() {
        return __classPrivateFieldGet(this, _terrain) instanceof Types_1.Water;
    }
    map() {
        return __classPrivateFieldGet(this, _map);
    }
    resource(type, player) {
        const yieldCache = this.getYieldCache(player);
        if (yieldCache.has(type.constructor)) {
            const cachedYield = yieldCache.get(type.constructor);
            if (typeof cachedYield === 'number') {
                type.add(cachedYield);
                return type;
            }
        }
        __classPrivateFieldGet(this, _ruleRegistry).process(Yield_2.default, type, this, player);
        yieldCache.set(type.constructor, type.value());
        return type;
    }
    score(player, values = [[Yield_1.default, 3]], yieldEntries = [], yieldRegistry = YieldRegistry_1.instance) {
        const yields = this.yields(player, yieldEntries, yieldRegistry);
        return (yields
            .map((tileYield) => {
            const [value] = values.filter(([YieldType]) => tileYield instanceof YieldType), weight = value[1] || 1;
            return tileYield.value() * weight;
        })
            .reduce((total, value) => total + value, 0) *
            // Ensure we have some of each scored yield
            (values.every(([YieldType, value]) => value < 1 ||
                yields.some((tileYield) => tileYield instanceof YieldType))
                ? 1
                : 0));
    }
    terrain() {
        return __classPrivateFieldGet(this, _terrain);
    }
    setTerrain(terrain) {
        __classPrivateFieldSet(this, _terrain, terrain);
    }
    x() {
        return __classPrivateFieldGet(this, _x);
    }
    y() {
        return __classPrivateFieldGet(this, _y);
    }
    yields(player, yields = [], yieldRegistry = YieldRegistry_1.instance) {
        if (yields.length === 0) {
            yields = yieldRegistry.entries();
        }
        return yields.map((YieldType) => this.resource(new YieldType(), player));
    }
}
exports.Tile = Tile;
_map = new WeakMap(), _neighbours = new WeakMap(), _ruleRegistry = new WeakMap(), _terrain = new WeakMap(), _x = new WeakMap(), _y = new WeakMap(), _yieldCache = new WeakMap();
exports.default = Tile;
//# sourceMappingURL=Tile.js.map