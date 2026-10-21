"use strict";
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
        this._neighbours = [];
        this._yieldCache = new Map();
        this._x = x;
        this._y = y;
        this._terrain = terrain;
        this._map = map;
        this._ruleRegistry = ruleRegistry;
        this.addKey('terrain', 'isCoast', 'isLand', 'isWater', 'x', 'y', 'yields');
    }
    clearYieldCache(player = null) {
        this._yieldCache.delete(player);
    }
    getAdjacent() {
        return this.getAdjacentDirections().map((direction) => this.getNeighbour(direction));
    }
    /**
     * The world's edge directions, as a new array each call: a caller may sort
     * or splice what it gets.
     *
     * Typed as the square grid's until the consumers that name these types move
     * to the topology's own.
     */
    getAdjacentDirections() {
        return this._map.topology().edgeDirections().slice();
    }
    getNeighbour(direction) {
        const offset = this._map.topology().offset(direction, this._x, this._y);
        return this._map.get(this._x + offset[0], this._y + offset[1]);
    }
    /**
     * The world's directions, as a new array each call: a caller may sort or
     * splice what it gets.
     */
    getNeighbouringDirections() {
        return this._map.topology().directions().slice();
    }
    getNeighbours() {
        if (!this._neighbours.length) {
            this._neighbours = this.getNeighbouringDirections().map((direction) => this.getNeighbour(direction));
        }
        return this._neighbours;
    }
    getSurroundingArea(radius = 2) {
        return Tileset_1.default.fromSurrounding(this, radius);
    }
    /**
     * The distance to `tile`, measured the short way round a wrapping world, as
     * the world's topology measures it. `ITopology.distance` has the history.
     */
    distanceFrom(tile) {
        return this._map.topology().distance(this._x, this._y, tile.x(), tile.y());
    }
    isCoast() {
        const tile = this;
        return ((tile.isWater() &&
            tile.getNeighbours().some((tile) => tile.isLand())) ||
            (tile.isLand() &&
                tile.getNeighbours().some((tile) => tile.isWater())));
    }
    isLand() {
        return this._terrain instanceof Types_1.Land;
    }
    isNeighbourOf(otherTile) {
        return this.getNeighbours().includes(otherTile);
    }
    isWater() {
        return this._terrain instanceof Types_1.Water;
    }
    map() {
        return this._map;
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
        return this._terrain;
    }
    setTerrain(terrain) {
        this._terrain = terrain;
    }
    x() {
        return this._x;
    }
    y() {
        return this._y;
    }
    yields(player = null) {
        if (!this._yieldCache.has(player)) {
            const tileYields = this._ruleRegistry
                .process(Yield_2.default, this, player)
                .flat();
            this._ruleRegistry
                .process(YieldModifier_1.default, this, player, tileYields)
                .flat();
            this._yieldCache.set(player, tileYields);
        }
        return this._yieldCache.get(player);
    }
}
exports.Tile = Tile;
Tile.transient = ['_neighbours', '_ruleRegistry', '_yieldCache'];
exports.default = Tile;
//# sourceMappingURL=Tile.js.map