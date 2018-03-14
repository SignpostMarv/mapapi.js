import { GridConfig } from '../GridConfig.js';
import { TileSource } from '../TileSource.js';
import { ReadOnlyGridSize, ReadOnlyUintSize } from '../Size.js';
import { ReadOnlyRectangle } from '../Geometry.js';
import { Api } from '../GridConfig/Api.js';
import { ReadOnlyCoordinates } from '../Coordinates.js';
import { LocationWithKnownGeometry } from '../Location.js';
import SHA1 from '../../node_modules/sha1-es/src/sha1.js';
import {
    ClassMethodArgumentExpectedType,
    ClassMethodArgumentExpectedClass,
} from '../ErrorFormatting.js';
import { Widget } from '../Html.js';
import { html } from '../../node_modules/lit-html/lit-html.js';

const AgniSize = new ReadOnlyGridSize(
    new ReadOnlyCoordinates(0, 0),
    new ReadOnlyCoordinates(1048576, 1048576)
);

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
    }

    CoordinatesToTileUrl(zoom, coords) { // eslint-disable-line class-methods-use-this
        const zoomIsNumber = (zoom instanceof Number);

        if (!(zoomIsNumber) && 'number' !== typeof zoom) {
            throw new TypeError(ClassMethodArgumentExpectedType(
                this,
                this.CoordinatesToTileUrl,
                'number'
            ));
        }

        const slZoom = Math.floor(zoom + 1);
        const tilesPerImageEdge = 2 ** (slZoom - 1);

        const pos = ReadOnlyCoordinates.Fuzzy(coords);

        const x = pos.x - (pos.x % tilesPerImageEdge);
        const y = pos.y - (pos.y % tilesPerImageEdge);
        const domain = 'secondlife-maps-cdn.akamaized.net';

        return `https://${domain}/map-${escape(slZoom)}-${escape(x)}-${escape(y)}-objects.jpg`;
    }

    CoordinatesToTile(zoom, position) {
        const tilesPerImageEdge = 2 ** Math.floor(zoom);
        const { x, y } = ReadOnlyCoordinates.Fuzzy(position);

        return super.CoordinatesToTile(
            Math.floor(zoom),
            ReadOnlyCoordinates.Fuzzy(
                x - (x % tilesPerImageEdge),
                y - (y % tilesPerImageEdge)
            )
        );
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
            throw new TypeError(ClassMethodArgumentExpectedClass(
                this,
                this.CoordinatesToLocation,
                1,
                ReadOnlyCoordinates
            ));
        } else if (!AgniSize.containsCoordinates(pos)) {
            throw new RangeError(ClassMethodArgumentExpectedType(
                this,
                this.CoordinatesToLocation,
                ` value in the range ${AgniSize}`
            ));
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
                    try {
                        const regionName = handleScriptRes(varname, 'string');
                        const resPos = new ReadOnlyCoordinates(gridX, gridY);

                        yup(new LocationWithKnownGeometry(
                            regionName,
                            resPos,
                            new ReadOnlyRectangle(1, 1, resPos)
                        ));

                        cleanup();
                    } catch (err) {
                        nope(err);
                    }
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

                const path =
                    'https://cap.secondlife.com/cap/0/b713fe80-283b-4585-af4d-a3b7d9a32492';

                script.src = `${path}?${new URLSearchParams(urlargs)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return inProgress[key];
    }

    async LocationNameToCoordinates(locationName) {
        const isString = locationName instanceof String;

        if (!isString && 'string' !== typeof locationName) {
            throw new TypeError(ClassMethodArgumentExpectedType(
                this,
                this.LocationNameToCoordinates,
                1,
                'string'
            ));
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
                    try {
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
                            throw new TypeError('API result did not contain coordinates!');
                        }
                    } catch (err) {
                        nope(err);
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
                const path =
                    'https://cap.secondlife.com/cap/0/d661249b-2b5a-4436-966a-3d3b8d7a574f';

                script.src =
                    `${path}?${new URLSearchParams(args)}`;
                script.async = true;

                document.head.appendChild(script);
            });
        }

        return inProgress[key];
    }

    LocationInfoWindowFactory() {
        return (renderer) => {
            let infoWindowPosFound = true;
            let infoWindowX = 0;
            let infoWindowY = 0;
            let infoWindowTpl = '';
            let infoWindowProm;

            const update = () => {
                widget.updateDomNode();
                renderer.dirty = true;
            };

            const widget = new Widget(async(pos, offset) => {
                let { x, y } = pos;
                x -= x % 1;
                y -= y % 1;
                if (infoWindowX != x || infoWindowY != y) {
                    infoWindowPosFound = false;
                    this.CoordinatesToLocation(pos).then((res) => {
                        let { x: resX, y: resY } = res.coordinates;
                        resX -= resX % 1;
                        resY -= resY % 1;
                        if (infoWindowX === resX && infoWindowY === resY) {
                            const uriRegion = encodeURIComponent(res.name);
                            const uriX = encodeURIComponent(Math.floor(256 * (x % 1)));
                            const uriY = encodeURIComponent(Math.floor(256 * (y % 1)));
                            infoWindowTpl = html`
                                ${res.name}
                                <a
                                    href="secondlife://${uriRegion}/${uriX}/${uriY}"
                                >Teleport</a>
                            `;
                            infoWindowPosFound = true;
                            update();
                        }
                    }).catch((err) => {
                        infoWindowTpl = html`Error`;
                        infoWindowPosFound = true;
                        console.error(err);
                        update();
                    });
                }
                if (! infoWindowPosFound) {
                    const doUpdate = infoWindowTpl !== 'Searching...';
                    infoWindowTpl = 'Searching...';
                    if (doUpdate) {
                        update();
                    }
                }
                infoWindowX = x;
                infoWindowY = y;
                return html`
                    <div
                        class="mapapijs-infowindow"
                        style="
                            bottom:
                                calc(
                                    50% -
                                    (
                                        (
                                            (1px * var(--scale)) *
                                            var(--tilesource-width)
                                        ) *
                                        (
                                            var(--focus-y) -
                                            (
                                                ${pos.y + offset.y}
                                            )
                                        )
                                    )
                                );
                            left:
                                calc(
                                    50% -
                                    (
                                        (
                                            (1px * var(--scale)) *
                                            var(--tilesource-height)
                                        ) *
                                        (
                                            var(--focus-x) -
                                            (
                                                ${pos.x + offset.x}
                                            )
                                        )
                                    )
                                );"
                    >
                        <div class="mapapijs-infowindow--inner">
                            ${infoWindowTpl}
                        </div>
                    </div>`;
            });

            return widget;
        };
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
