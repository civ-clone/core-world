"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tileset = void 0;
const EntityRegistry_1 = require("@civ-clone/core-registry/EntityRegistry");
const Tile_1 = require("./Tile");
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
    score(player = null, values = []) {
        return this.entries().reduce((total, tile) => total + tile.score(player, values), 0);
    }
    yields(player = null) {
        return this.entries().flatMap((tile) => tile.yields(player));
    }
}
exports.Tileset = Tileset;
exports.default = Tileset;
//# sourceMappingURL=Tileset.js.map