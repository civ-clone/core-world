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
var _World_generator, _World_height, _World_landMassRegistry, _World_ruleRegistry, _World_tiles, _World_width;
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
const LandMassRegistry_1 = require("./LandMassRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Built_1 = require("./Rules/Built");
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const Tile_1 = require("./Tile");
const LandMass_1 = require("./LandMass");
class World extends DataObject_1.DataObject {
    constructor(generator, ruleRegistry = RuleRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance) {
        super();
        _World_generator.set(this, void 0);
        _World_height.set(this, void 0);
        _World_landMassRegistry.set(this, void 0);
        _World_ruleRegistry.set(this, void 0);
        _World_tiles.set(this, new EntityRegistry_1.default(Tile_1.default));
        _World_width.set(this, void 0);
        __classPrivateFieldSet(this, _World_generator, generator, "f");
        __classPrivateFieldSet(this, _World_height, generator.height(), "f");
        __classPrivateFieldSet(this, _World_landMassRegistry, landMassRegistry, "f");
        __classPrivateFieldSet(this, _World_width, generator.width(), "f");
        __classPrivateFieldSet(this, _World_ruleRegistry, ruleRegistry, "f");
        this.addKey('height', 'tiles', 'width');
    }
    async build() {
        const tiles = await __classPrivateFieldGet(this, _World_generator, "f").generate(), landTiles = [];
        tiles.forEach((terrain, i) => {
            const tile = new Tile_1.default(i % __classPrivateFieldGet(this, _World_width, "f"), Math.floor(i / __classPrivateFieldGet(this, _World_width, "f")), terrain, this, __classPrivateFieldGet(this, _World_ruleRegistry, "f"));
            __classPrivateFieldGet(this, _World_tiles, "f").register(tile);
            if (tile.isLand()) {
                landTiles.push(tile);
            }
        });
        while (landTiles.length) {
            const currentQueue = landTiles.slice(0, 1), continent = [];
            while (currentQueue.length) {
                const currentTile = currentQueue.shift();
                // This should never be hit
                if (!landTiles.includes(currentTile)) {
                    continue;
                }
                landTiles.splice(landTiles.indexOf(currentTile), 1);
                continent.push(currentTile);
                currentTile.getNeighbours().forEach((tile) => {
                    if (!landTiles.includes(tile) || !tile.isLand()) {
                        return;
                    }
                    currentQueue.push(tile);
                });
            }
            __classPrivateFieldGet(this, _World_landMassRegistry, "f").register(new LandMass_1.default(continent));
        }
        __classPrivateFieldGet(this, _World_ruleRegistry, "f").process(Built_1.default, this);
        return this;
    }
    entries() {
        return __classPrivateFieldGet(this, _World_tiles, "f").entries();
    }
    filter(iterator) {
        return this.entries().filter(iterator);
    }
    forEach(iterator) {
        return __classPrivateFieldGet(this, _World_tiles, "f").forEach(iterator);
    }
    get(x, y) {
        return this.entries()[__classPrivateFieldGet(this, _World_generator, "f").coordsToIndex(x, y)];
    }
    height() {
        return __classPrivateFieldGet(this, _World_height, "f");
    }
    includes(tile) {
        return __classPrivateFieldGet(this, _World_tiles, "f").includes(tile);
    }
    landMasses() {
        return __classPrivateFieldGet(this, _World_landMassRegistry, "f").entries();
    }
    map(iterator) {
        return __classPrivateFieldGet(this, _World_tiles, "f").map(iterator);
    }
    register(...tiles) {
        __classPrivateFieldGet(this, _World_tiles, "f").register(...tiles);
    }
    tiles() {
        return this.entries();
    }
    width() {
        return __classPrivateFieldGet(this, _World_width, "f");
    }
}
exports.World = World;
_World_generator = new WeakMap(), _World_height = new WeakMap(), _World_landMassRegistry = new WeakMap(), _World_ruleRegistry = new WeakMap(), _World_tiles = new WeakMap(), _World_width = new WeakMap();
exports.default = World;
//# sourceMappingURL=World.js.map