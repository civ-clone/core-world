import { DataObject, IDataObject } from '@civ-clone/core-data-object/DataObject';
import { LandMassRegistry } from './LandMassRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import Generator from '@civ-clone/core-world-generator/Generator';
import { IRegistryIterator } from '@civ-clone/core-registry/Registry';
import Tile from './Tile';
import LandMass from './LandMass';
export interface IWorld extends IDataObject {
    build(): Promise<World>;
    filter(iterator: IRegistryIterator<Tile>): Tile[];
    forEach(iterator: (item: Tile, i: number) => void): void;
    get(x: number, y: number): Tile;
    height(): number;
    includes(tile: Tile): boolean;
    landMasses(): LandMass[];
    map(iterator: (item: Tile, i: number) => any): any[];
    register(...tiles: Tile[]): void;
    tiles(): Tile[];
    width(): number;
}
export declare class World extends DataObject implements IWorld {
    static readonly transient: string[];
    private _generator;
    private _height;
    private _landMassRegistry;
    private _ruleRegistry;
    private _tiles;
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
    private _tileCache;
    private _width;
    constructor(generator: Generator, ruleRegistry?: RuleRegistry, landMassRegistry?: LandMassRegistry);
    build(): Promise<World>;
    entries(): Tile[];
    filter(iterator: IRegistryIterator<Tile>): Tile[];
    forEach(iterator: (item: Tile, i: number) => void): void;
    get(x: number, y: number): Tile;
    height(): number;
    includes(tile: Tile): boolean;
    landMasses(): LandMass[];
    map(iterator: (item: Tile, i: number) => any): any[];
    register(...tiles: Tile[]): void;
    tiles(): Tile[];
    width(): number;
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
    onHydrated(): void;
}
export default World;
