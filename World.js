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
class World extends DataObject_1.DataObject {
    constructor(generator, ruleRegistry = RuleRegistry_1.instance, landMassRegistry = LandMassRegistry_1.instance) {
        super();
        this._tiles = new EntityRegistry_1.default(Tile_1.default);
        this._generator = generator;
        this._height = generator.height();
        this._landMassRegistry = landMassRegistry;
        this._width = generator.width();
        this._ruleRegistry = ruleRegistry;
        this.addKey('height', 'tiles', 'width');
    }
    async build() {
        const tiles = await this._generator.generate(), landTiles = [];
        tiles.forEach((terrain, i) => {
            const tile = new Tile_1.default(i % this._width, Math.floor(i / this._width), terrain, this, this._ruleRegistry);
            this._tiles.register(tile);
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
        return this.entries()[this._generator.coordsToIndex(x, y)];
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
    }
    tiles() {
        return this.entries();
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
     */
    onHydrated() {
        const tiles = this._tiles;
        if (!Array.isArray(tiles)) {
            return;
        }
        this._tiles = new EntityRegistry_1.default(Tile_1.default);
        this._tiles.register(...tiles);
    }
}
exports.World = World;
World.transient = [
    '_generator',
    '_landMassRegistry',
    '_ruleRegistry',
];
exports.default = World;
//# sourceMappingURL=World.js.map