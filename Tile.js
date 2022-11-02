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
var _Tile_map, _Tile_neighbours, _Tile_ruleRegistry, _Tile_terrain, _Tile_x, _Tile_y, _Tile_yieldCache;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tile = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
const Types_1 = require("@civ-clone/core-terrain/Types");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Tileset_1 = require("./Tileset");
const Yield_1 = require("@civ-clone/core-yield/Yield");
const YieldModifier_1 = require("./Rules/YieldModifier");
const Yield_2 = require("./Rules/Yield");
class Tile extends DataObject_1.DataObject {
    constructor(x, y, terrain, map, ruleRegistry = RuleRegistry_1.instance) {
        super();
        _Tile_map.set(this, void 0);
        _Tile_neighbours.set(this, []);
        _Tile_ruleRegistry.set(this, void 0);
        _Tile_terrain.set(this, void 0);
        _Tile_x.set(this, void 0);
        _Tile_y.set(this, void 0);
        _Tile_yieldCache.set(this, new Map());
        __classPrivateFieldSet(this, _Tile_x, x, "f");
        __classPrivateFieldSet(this, _Tile_y, y, "f");
        __classPrivateFieldSet(this, _Tile_terrain, terrain, "f");
        __classPrivateFieldSet(this, _Tile_map, map, "f");
        __classPrivateFieldSet(this, _Tile_ruleRegistry, ruleRegistry, "f");
        this.addKey('terrain', 'isCoast', 'isLand', 'isWater', 'x', 'y', 'yields');
    }
    clearYieldCache(player = null) {
        __classPrivateFieldGet(this, _Tile_yieldCache, "f").delete(player);
    }
    getAdjacent() {
        return this.getAdjacentDirections().map((direction) => this.getNeighbour(direction));
    }
    getAdjacentDirections() {
        return ['n', 'e', 's', 'w'];
    }
    getNeighbour(direction) {
        if (direction === 'n') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f"), __classPrivateFieldGet(this, _Tile_y, "f") - 1);
        }
        if (direction === 'ne') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") + 1, __classPrivateFieldGet(this, _Tile_y, "f") - 1);
        }
        if (direction === 'e') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") + 1, __classPrivateFieldGet(this, _Tile_y, "f"));
        }
        if (direction === 'se') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") + 1, __classPrivateFieldGet(this, _Tile_y, "f") + 1);
        }
        if (direction === 's') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f"), __classPrivateFieldGet(this, _Tile_y, "f") + 1);
        }
        if (direction === 'sw') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") - 1, __classPrivateFieldGet(this, _Tile_y, "f") + 1);
        }
        if (direction === 'w') {
            return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") - 1, __classPrivateFieldGet(this, _Tile_y, "f"));
        }
        return __classPrivateFieldGet(this, _Tile_map, "f").get(__classPrivateFieldGet(this, _Tile_x, "f") - 1, __classPrivateFieldGet(this, _Tile_y, "f") - 1);
    }
    getNeighbouringDirections() {
        return ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
    }
    getNeighbours() {
        if (!__classPrivateFieldGet(this, _Tile_neighbours, "f").length) {
            __classPrivateFieldSet(this, _Tile_neighbours, this.getNeighbouringDirections().map((direction) => this.getNeighbour(direction)), "f");
        }
        return __classPrivateFieldGet(this, _Tile_neighbours, "f");
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
            .map(([x, y]) => Math.hypot(__classPrivateFieldGet(this, _Tile_x, "f") - tile.x() + x * __classPrivateFieldGet(this, _Tile_map, "f").width(), __classPrivateFieldGet(this, _Tile_y, "f") - tile.y() + y * __classPrivateFieldGet(this, _Tile_map, "f").height()))
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
        return __classPrivateFieldGet(this, _Tile_terrain, "f") instanceof Types_1.Land;
    }
    isNeighbourOf(otherTile) {
        return this.getNeighbours().includes(otherTile);
    }
    isWater() {
        return __classPrivateFieldGet(this, _Tile_terrain, "f") instanceof Types_1.Water;
    }
    map() {
        return __classPrivateFieldGet(this, _Tile_map, "f");
    }
    score(player = null, values = [[Yield_1.default, 3]]) {
        const yields = this.yields(player);
        return yields
            .map((tileYield) => {
            const [value] = values.filter(([YieldType]) => tileYield instanceof YieldType), weight = value ? value[1] || 1 : 0;
            return tileYield.value() * weight;
        })
            .reduce((total, value) => total + value, 0);
    }
    terrain() {
        return __classPrivateFieldGet(this, _Tile_terrain, "f");
    }
    setTerrain(terrain) {
        __classPrivateFieldSet(this, _Tile_terrain, terrain, "f");
    }
    x() {
        return __classPrivateFieldGet(this, _Tile_x, "f");
    }
    y() {
        return __classPrivateFieldGet(this, _Tile_y, "f");
    }
    yields(player = null) {
        if (!__classPrivateFieldGet(this, _Tile_yieldCache, "f").has(player)) {
            const tileYields = __classPrivateFieldGet(this, _Tile_ruleRegistry, "f")
                .process(Yield_2.default, this, player)
                .flat();
            __classPrivateFieldGet(this, _Tile_ruleRegistry, "f")
                .process(YieldModifier_1.default, this, player, tileYields)
                .flat();
            __classPrivateFieldGet(this, _Tile_yieldCache, "f").set(player, tileYields);
        }
        return __classPrivateFieldGet(this, _Tile_yieldCache, "f").get(player);
    }
}
exports.Tile = Tile;
_Tile_map = new WeakMap(), _Tile_neighbours = new WeakMap(), _Tile_ruleRegistry = new WeakMap(), _Tile_terrain = new WeakMap(), _Tile_x = new WeakMap(), _Tile_y = new WeakMap(), _Tile_yieldCache = new WeakMap();
exports.default = Tile;
//# sourceMappingURL=Tile.js.map