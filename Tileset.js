"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tileset = void 0;
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const YieldRegistry_1 = require("@civ-clone/core-yield/YieldRegistry");
const Tile_1 = require("./Tile");
const Yield_1 = require("@civ-clone/core-yield/Yield");
class Tileset extends EntityRegistry_1.EntityRegistry {
    static from(...tiles) {
        return new this(...tiles);
    }
    static fromSurrounding(tile, radius = 2) {
        const gen = (radius) => {
            const pairs = [];
            for (let x = tile.x() - radius; x <= tile.x() + radius; x++) {
                for (let y = tile.y() - radius; y <= tile.y() + radius; y++) {
                    pairs.push([x, y]);
                }
            }
            return pairs;
        };
        return this.from(...gen(radius).map(([x, y]) => tile.map().get(x, y)));
    }
    constructor(...tiles) {
        super(Tile_1.Tile);
        this.register(...tiles);
    }
    push(...tiles) {
        this.register(...tiles);
    }
    shift() {
        const [first] = this.entries();
        this.unregister(first);
        return first;
    }
    score(player, values = [], yieldEntries = [], yieldRegistry = YieldRegistry_1.instance) {
        return this.map((tile) => tile.score(player, values, yieldEntries, yieldRegistry)).reduce((total, score) => total + score, 0);
    }
    yields(player, yields = [], yieldRegistry = YieldRegistry_1.instance) {
        if (yields.length === 0) {
            yields = yieldRegistry.entries();
        }
        return this.entries().reduce((tilesetYields, tile) => tile.yields(player, yields, yieldRegistry).map((tileYield) => {
            const [existingYield] = tilesetYields.filter((existingYield) => existingYield instanceof tileYield.constructor);
            if (existingYield instanceof Yield_1.default) {
                tileYield.add(existingYield, `tile-${tile.x()},${tile.y()}`);
            }
            return tileYield;
        }), yields.map((YieldType) => new YieldType()));
    }
}
exports.Tileset = Tileset;
exports.default = Tileset;
//# sourceMappingURL=Tileset.js.map