"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.World = void 0;
const DataObject_1 = require("@civ-clone/core-data-object/DataObject");
const LandMassRegistry_1 = require("./LandMassRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Built_1 = require("./Rules/Built");
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const Tile_1 = require("./Tile");
const LandMass_1 = require("./LandMass");
const topologies_1 = require("./topologies");
/**
 * The id of the grid `topology` is on.
 *
 * A generator's topology can come from another copy of this package than the
 * one `World` is loaded from: `core-world-generator` depends on `core-world`,
 * so a project whose two versions do not match has two copies, as this
 * package's own tests do. One from before `id()` was added has no id, and a
 * generator's topology from it is its default square grid: nothing gave a
 * generator any other before topology ids existed.
 */
const topologyIdOf = (topology) => { var _a, _b, _c; return (_c = (_b = (_a = topology).id) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : 'square'; };
class World extends DataObject_1.DataObject {
    constructor(generator, ruleRegistry = RuleRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance) {
        super();
        this._tiles = new EntityRegistry_1.default(Tile_1.default);
        /**
         * The registry's tiles in registration order, for `get`.
         *
         * `EntityRegistry.entries()` hands back a defensive copy, which is right for
         * a caller that might sort or splice what it gets and ruinous for a caller
         * that wants one element: `get` copied all 2,400 tiles of a 60x40 world to
         * index one of them, and `Tile.getNeighbour` calls it eight times per tile.
         * Counting the copies over thirty turns found 204,552 calls moving **490
         * million** tile references, 98.5% of all registry copying in the run.
         *
         * Rebuilt lazily and dropped whenever a tile is registered, which is the
         * only way `_tiles` changes — nothing unregisters a tile from the world.
         * Transient: a saved world carries its tiles, and `onHydrated` rebuilds the
         * registry around them.
         */
        this._tileCache = null;
        /**
         * The shape of the grid: neighbours, distance and surrounding areas, which
         * `Tile` and `Tileset` ask for rather than working out themselves.
         *
         * Built lazily from `_topologyId` and the dimensions, so it is configuration
         * rather than state and is not saved — a loaded world rebuilds it on first
         * use.
         */
        this._topology = null;
        this._generator = generator;
        this._height = generator.height();
        this._landMassRegistry = landMassRegistry;
        this._width = generator.width();
        this._ruleRegistry = ruleRegistry;
        this._topologyId = topologyIdOf(generator.topology());
        this.addKey('height', 'tiles', 'width');
    }
    async build() {
        const tiles = await this._generator.generate(), landTiles = [];
        tiles.forEach((terrain, i) => {
            const tile = new Tile_1.default(i % this._width, Math.floor(i / this._width), terrain, this, this._ruleRegistry);
            this.register(tile);
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
            this._landMassRegistry.register(new LandMass_1.default(continent));
        }
        this._ruleRegistry.process(Built_1.default, this);
        return this;
    }
    entries() {
        return this._tiles.entries();
    }
    filter(iterator) {
        return this.entries().filter(iterator);
    }
    forEach(iterator) {
        return this._tiles.forEach(iterator);
    }
    get(x, y) {
        // Falsy rather than `=== null`: `Game.inject` is what puts a transient
        // field back after a load, and one it has no entry for arrives as
        // `undefined`. That is asserted against — `tests/engine/inject.ts` caught
        // exactly this, before `_tileCache` was added to `Game.inject`'s caches —
        // but the guard costs nothing and what it prevents is `undefined[index]`
        // deep inside a loaded game.
        if (!this._tileCache) {
            this._tileCache = this._tiles.entries();
        }
        return this._tileCache[this._generator.coordsToIndex(x, y)];
    }
    height() {
        return this._height;
    }
    includes(tile) {
        return this._tiles.includes(tile);
    }
    landMasses() {
        return this._landMassRegistry.entries();
    }
    map(iterator) {
        return this._tiles.map(iterator);
    }
    register(...tiles) {
        this._tiles.register(...tiles);
        this._tileCache = null;
    }
    tiles() {
        return this.entries();
    }
    topology() {
        // Falsy rather than `=== null`, for the reason given in `get`.
        if (!this._topology) {
            // `createTopology` validates the dimensions, and throws for an id it
            // does not know.
            this._topology = (0, topologies_1.default)(this._topologyId, this._width, this._height);
        }
        return this._topology;
    }
    topologyId() {
        return this._topologyId;
    }
    width() {
        return this._width;
    }
    /**
     * Put the registry back around the restored tiles.
     *
     * `_tiles` is an `EntityRegistry` held as a field, and `core-save-game`
     * writes one as an array of its members: the class around a collection is
     * the one thing the format cannot record. So a loaded world arrives with a
     * plain `Tile[]` here, and `tiles()` — `this._tiles.entries()` — hands back
     * an array iterator. Nothing fails at load; the first thing to notice is
     * `Tileset.from` choking on pairs when something asks a tile for its
     * surroundings, several turns into a game that was loaded successfully.
     *
     * The tiles themselves are saved entities and are restored before this runs,
     * so only the container has to be rebuilt.
     *
     * `_topology` is reset here as well. It is transient, and `Game.inject`
     * fails a load that leaves a transient field `undefined`; it has no entry
     * for this one, and needs none, because `topology()` rebuilds it from the
     * restored id and dimensions on first use. A hook runs before that check.
     *
     * A world saved before its topology id was recorded arrives without one.
     * Every world was square then, so it is given `'square'` here, and the next
     * save records it.
     */
    onHydrated() {
        const tiles = this._tiles;
        this._topology = null;
        if (this._topologyId === undefined) {
            this._topologyId = 'square';
        }
        if (!Array.isArray(tiles)) {
            return;
        }
        this._tiles = new EntityRegistry_1.default(Tile_1.default);
        this.register(...tiles);
    }
}
exports.World = World;
World.transient = [
    '_generator',
    '_landMassRegistry',
    '_ruleRegistry',
    '_tileCache',
    '_topology',
];
exports.default = World;
//# sourceMappingURL=World.js.map