import { GridConfig } from '../GridConfig.js';
import { Tile, TileSource } from '../TileSource.js';
import { ReadOnlyGridSize, ReadOnlyUintSize } from '../Size.js';
import { ReadOnlyRectangle } from '../Geometry.js';
import { Api } from '../GridConfig/Api.js';
import { ReadOnlyCoordinates } from '../Coordinates.js';
import { LocationWithKnownGeometry } from '../Location.js';
import SHA1 from '../../node_modules/sha1-es/src/sha1.js';

const AgniSize = new ReadOnlyGridSize(
    new ReadOnlyCoordinates(0, 0),
    new ReadOnlyCoordinates(1048576, 1048576)
);

const tileCacheMap = new WeakMap();

class AgniTileSource extends TileSource {
    constructor() {
        super(
            `© 2007 - ${(new Date()).getFullYear()} Linden Lab`,
            'Land & Objects',
            '#1d475f',
            0,
            7,
            AgniSize,
            new ReadOnlyUintSize(256, 256)
        );

        tileCacheMap.set(this, {});
    }

    CoordinatesToTileUrl(zoom, coords) { // eslint-disable-line class-methods-use-this
        const zoomIsNumber = (zoom instanceof Number);

        if (!(zoomIsNumber) && 'number' !== typeof zoom) {
            throw new TypeError('Argument 1 passed to AgniTileSource.CoordinatesToTileUrl must be a number!');
        }

        const slZoom = Math.floor(zoom + 1);
        const tilesPerImageEdge = 2 ** (slZoom - 1);

        const pos = ReadOnlyCoordinates.Fuzzy(coords);

        const x = pos.x - (pos.x % tilesPerImageEdge);
        const y = pos.y - (pos.y % tilesPerImageEdge);

        return `https://secondlife-maps-cdn.akamaized.net/map-${escape(slZoom)}-${escape(x)}-${escape(y)}-objects.jpg`;
    }

    CoordinatesToTile(zoom, position) {
        const zoomKey = `${Math.floor(zoom)}`;
        const tilesPerImageEdge = 2 ** Math.floor(zoom);
        const pos = ReadOnlyCoordinates.Fuzzy(position);
        const { x, y } = pos;
        const xKey = `${x - (x % tilesPerImageEdge)}`;
        const yKey = `${y - (y % tilesPerImageEdge)}`;

        const tilecache = tileCacheMap.get(this);

        const zoomKeys = Object.keys(tilecache);

        let createZoomCache = true;
        let createXCache = true;

        if (zoomKeys.includes(zoomKey)) {
            const xKeys = Object.keys(tilecache[zoomKey]);
            createZoomCache = false;

            if (xKeys.includes(xKey)) {
                const yKeys = Object.keys(tilecache[zoomKey][xKey]);
                createXCache = false;

                if (yKeys.includes(yKey) && tilecache[zoomKey][xKey][yKey] instanceof Tile) {
                    return tilecache[zoomKey][xKey][yKey];
                }
            }
        }

        const tile = super.CoordinatesToTile(Math.floor(zoom), pos);

        if (createZoomCache) {
            tilecache[zoomKey] = {};
        }
        if (createXCache) {
            tilecache[zoomKey][xKey] = {};
        }
        tilecache[zoomKey][xKey][yKey] = tile;

        return tile;
    }
}

const inProgress = {};

const handleScriptRes = (varname, expectedTypeof) => {
    if (!Object.keys(window).includes(varname)) {
        throw new ReferenceError('API failed to load script variable!');
    } else if ('string' !== typeof expectedTypeof) {
        throw new TypeError('Argument 2 passed to handleScriptRes must be a string!');
    } else if (expectedTypeof !== typeof window[varname]) { // eslint-disable-line valid-typeof
        throw new ReferenceError('Failed to make call to API!');
    }

    return window[varname];
};

class AgniApi extends Api {
    async CoordinatesToLocation(...args) { // eslint-disable-line class-methods-use-this
        const pos = ReadOnlyCoordinates.Fuzzy(...args);
        if (!(pos instanceof ReadOnlyCoordinates)) {
            throw new TypeError('Argument 1 passed to Api.CoordinatesToLocation must be an instance of ReadOnlyCoordinates');
        } else if (!AgniSize.containsCoordinates(pos)) {
            throw new RangeError(`Argument 1 passed to AgniApi.CoordinatesToLocation must be in the range ${AgniSize}`);
        }

        const gridX = Math.floor(pos.x);
        const gridY = Math.floor(pos.y);

        const key = `pos2region_${gridX}_${gridY}`;

        if (!Object.keys(inProgress).includes(key)) {
            inProgress[key] = new Promise((yup, nope) => {
                const script = document.createElement('script');

                const varname = `com_secondlife_agni_posToRegion_${key}`;

                const cleanup = () => {
                    delete inProgress[key];
                    document.head.removeChild(script);
                };

                script.onload = () => {
                    const regionName = handleScriptRes(varname, 'string');
                    const resPos = new ReadOnlyCoordinates(gridX, gridY);

                    yup(new LocationWithKnownGeometry(
                        regionName,
                        resPos,
                        new ReadOnlyRectangle(1, 1, resPos)
                    ));

                    cleanup();
                };

                script.onerror = () => {
                    nope(new Error('Failed to load script for API!'));
                    cleanup();
                };

                const urlargs = {
                    var: varname,
                    grid_x: gridX,
                    grid_y: gridY,
                };

                script.src = `https://cap.secondlife.com/cap/0/b713fe80-283b-4585-af4d-a3b7d9a32492?${new URLSearchParams(urlargs)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return inProgress[key];
    }

    async LocationNameToCoordiantes(locationName) {
        const isString = locationName instanceof String;

        if (!isString && 'string' !== typeof locationName) {
            throw new TypeError('Argument 1 passed to AgniApi.LocationNameToCoordiantes must be a string!');
        }

        const simName = locationName.trim().toLocaleLowerCase();
        const key = `region2pos_${SHA1.hash(simName)}`;

        if (!Object.keys(inProgress).includes(key)) {
            inProgress[key] = new Promise((yup, nope) => {
                const script = document.createElement('script');

                const varname = `com_secondlife_agni_region2pos_${key}`;

                const cleanup = () => {
                    delete inProgress[key];
                    document.head.removeChild(script);
                };

                script.onload = async () => {
                    const pos = handleScriptRes(varname, 'object');

                    const poskeys = Object.keys(pos);

                    if (poskeys.includes('x') && poskeys.includes('y')) {
                        try {
                            yup(await this.CoordinatesToLocation(ReadOnlyCoordinates.Fuzzy(pos)));
                        } catch (err) {
                            nope(err);
                        } finally {
                            cleanup();
                        }
                    } else {
                        throw new TypeError('API result did not contain coordiantes!');
                    }
                };

                script.onerror = () => {
                    nope(new Error('Failed to load script for API!'));
                    cleanup();
                };

                const args = {
                    var: varname,
                    sim_name: simName,
                };

                script.src = `https://cap.secondlife.com/cap/0/d661249b-2b5a-4436-966a-3d3b8d7a574f?${new URLSearchParams(args)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return inProgress[key];
    }
}

export class Agni extends GridConfig {
    constructor() {
        super(
            [
                new AgniTileSource(),
            ],
            new AgniApi()
        );
    }

    get namespace() { // eslint-disable-line class-methods-use-this
        return 'com.secondlife.agni';
    }

    get vendor() { // eslint-disable-line class-methods-use-this
        return 'Linden Lab';
    }

    get name() { // eslint-disable-line class-methods-use-this
        return 'Second Life';
    }

    get description() { // eslint-disable-line class-methods-use-this
        return 'Linden Lab\'s Agni grid';
    }

    get label() { // eslint-disable-line class-methods-use-this
        return 'Agni';
    }

    get minZoom() {
        return this.tileSources[0].maxZoom;
    }

    get maxZoom() {
        return this.tileSources[0].maxZoom;
    }

    get size() {
        return this.tileSources[0].size;
    }
}
