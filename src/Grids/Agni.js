import {GridConfig} from '../GridConfig.js';
import {TileSource} from '../TileSource.js';
import {ReadOnlyGridSize, ReadOnlyUintSize} from '../Size.js';
import {ReadOnlyRectangle} from '../Geometry.js';
import {Api} from '../GridConfig/Api.js';
import {ReadOnlyCoordinates} from '../Coordinates.js';
import {LocationWithKnownGeometry} from '../Location.js';
import SHA1 from '../../node_modules/sha1-es/src/sha1.js';

const AgniSize = new ReadOnlyGridSize(
    new ReadOnlyCoordinates(0, 0),
    new ReadOnlyCoordinates(1048576, 1048576)
);

class AgniTileSource extends TileSource
{
    constructor() {
        super(
            ('© 2007 - ' + (new Date).getFullYear() + ' Linden Lab'),
            'Land & Objects',
            '#1d475f',
            0,
            7,
            AgniSize,
            new ReadOnlyUintSize(256, 256)
        );
    }

    CoordinatesToTileUrl(zoom) {
        const zoomIsNumber = (zoom instanceof Number);

        if ( ! (zoomIsNumber) && 'number' !== typeof(zoom)) {
            throw new TypeError(
                'Argument 1 passed to AgniTileSource.CoordinatesToTileUrl must be a number!'
            );
        }

        const slZoom = Math.floor(zoom + 1);
        const tilesPerImageEdge = Math.pow(2, slZoom - 1);

        const pos = ReadOnlyCoordinates.Fuzzy(
            ...(
                arguments.length >= 3
                    ? [arguments[1], arguments[2]]
                    : [arguments[1]]
            )
        );

        const x = pos.x - (pos.x % tilesPerImageEdge);
        const y = pos.y - (pos.y % tilesPerImageEdge);

        return `https://secondlife-maps-cdn.akamaized.net/map-${escape(slZoom)}-${escape(x)}-${escape(y)}-objects.jpg`;
    }
}

const inProgress = {};

const handleScriptRes = (varname, expectedTypeof) => {
    if ( ! Object.keys(window).includes(varname)) {
        throw new ReferenceError(
            'API failed to load script variable!'
        );
    } else if (expectedTypeof !== typeof(window[varname])) {
        throw new ReferenceError(
            'Failed to make call to API!'
        );
    }

    return window[varname];
};

class AgniApi extends Api
{
    async CoordinatesToLocation () {
        const pos = ReadOnlyCoordinates.Fuzzy(...arguments);
        if ( ! (pos instanceof ReadOnlyCoordinates)) {
            throw new TypeError(
                'Argument 1 passed to Api.CoordinatesToLocation must be an instance of '
            );
        } else if ( ! AgniSize.containsCoordinates(pos)) {
            throw new RangeError(
                `Argument 1 passed to AgniApi.CoordinatesToLocation must be in the range ${AgniSize}`
            );
        }

        const grid_x = Math.floor(pos.x);
        const grid_y = Math.floor(pos.y);

        const key = `pos2region_${grid_x}_${grid_y}`;

        if ( ! Object.keys(inProgress).includes(key)) {
            inProgress[key] = new Promise((yup, nope) => {
                const script = document.createElement('script');

                const varname = `com_secondlife_agni_posToRegion_${key}`;

                const cleanup = () => {
                    delete inProgress[key];
                    document.head.removeChild(script);
                };

                script.onload = () => {
                    const regionName = handleScriptRes(varname, 'string');
                    const pos = new ReadOnlyCoordinates(
                        grid_x,
                        grid_y
                    );

                    yup(new LocationWithKnownGeometry(
                        regionName,
                        pos,
                        new ReadOnlyRectangle(1, 1, pos)
                    ));

                    cleanup();
                };

                script.onerror = () => {
                    nope('Failed to load script for API!');
                    cleanup();
                };

                const args = {
                    var: varname,
                    grid_x,
                    grid_y
                };

                script.src = `https://cap.secondlife.com/cap/0/b713fe80-283b-4585-af4d-a3b7d9a32492?${new URLSearchParams(args)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return await inProgress[key];
    }

    async LocationNameToCoordiantes (locationName) {
        const isString = locationName instanceof String;

        if ( ! isString && 'string' !== typeof(locationName)) {
            throw new TypeError(
                'Argument 1 passed to AgniApi.LocationNameToCoordiantes must be a string!'
            );
        }

        const sim_name = locationName.trim().toLocaleLowerCase();
        const key = `region2pos_${SHA1.hash(sim_name)}`;

        if ( ! Object.keys(inProgress).includes(key)) {
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
                            yup(
                                await this.CoordinatesToLocation(
                                    new ReadOnlyCoordinates(pos.x, pos.y)
                                )
                            );
                        } catch (err) {
                            nope(err);
                        } finally {
                            cleanup();
                        }
                    } else {
                        throw new TypeError(
                            'API result did not contain coordiantes!'
                        );
                    }
                };

                script.onerror = () => {
                    nope('Failed to load script for API!');
                    cleanup();
                };

                const args = {
                    var: varname,
                    sim_name
                };

                script.src = `https://cap.secondlife.com/cap/0/d661249b-2b5a-4436-966a-3d3b8d7a574f?${new URLSearchParams(args)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return await inProgress[key];
    }
}

export class Agni extends GridConfig
{
    constructor() {
        super(
            [
                new AgniTileSource(),
            ],
            new AgniApi()
        );
    }

    get namespace() {
        return 'com.secondlife.agni';
    }

    get vendor() {
        return 'Linden Lab';
    }

    get name() {
        return 'Second Life';
    }

    get description() {
        return 'Linden Lab\'s Agni grid';
    }

    get label() {
        return 'Agni';
    }

    get minZoom() {
        this.tileSources[0].maxZoom;
    }

    get maxZoom() {
        this.tileSources[0].maxZoom;
    }

    get size() {
        this.tileSources[0].size;
    }
}
