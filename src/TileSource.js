import {ReadOnlyCoordinates} from './Coordinates.js';
import {ReadOnlyGridSize, ReadOnlyUintSize} from './Size.js';
import {Color} from './Color.js';

const sizemap = new WeakMap();
const sources = new WeakMap();
const posmap = new WeakMap();

export class Tile
{
    constructor(source, width, height, pos)
    {
        if (
            ! (source instanceof Image) &&
            ! (source instanceof HTMLCanvasElement)
        ) {
            throw new TypeError(
                'Source must be an image or canvas'
            );
        }
        sizemap.set(this, new ReadOnlyUintSize(width, height));
        sources.set(this, source);
        posmap.set(this, ReadOnlyCoordinates.Fuzzy(pos));
    }

    get size()
    {
        return sizemap.get(this);
    }

    get source() {
        return sources.get(this);
    }

    get position() {
        return posmap.get(this);
    }

    set position(pos) {
        posmap.set(this, ReadOnlyCoordinates.Fuzzy(pos));
    }
}

const copyrightmap = new WeakMap();
const labelmap = new WeakMap();
const backgroundcolormap = new WeakMap();
const minzoommap = new WeakMap();
const maxzoommap = new WeakMap();
const tilesizemap = new WeakMap();

const imgcache = {};
const imgerrors = new WeakSet();

export class TileSource extends EventTarget
{
    /**
    * @param string copyright
    * @param string label
    * @param string backgroundColor
    * @param int minZoom
    * @param int maxZoom
    * @param ReadOnlyGridSize size
    * @param ReadOnlyUintSize tileSize
    */
    constructor(
        copyright,
        label,
        backgroundColor,
        minZoom,
        maxZoom,
        size,
        tileSize
    ) {
        super();

        const copyrightIsString = (copyright instanceof String);

        if (copyrightIsString || 'string' === typeof(copyright)) {
            copyrightmap.set(this, copyrightIsString ? copyright.valueOf() : copyright);
        } else {
            throw new TypeError(
                'Argument 1 passed to TileSource must be a string!'
            );
        }

        const labelIsString = (label instanceof String);

        if (labelIsString || 'string' === typeof(label)) {
            labelmap.set(this, labelIsString ? label.valueOf() : label);
        } else {
            throw new TypeError(
                'Argument 2 passed to TileSource must be a string!'
            );
        }

        backgroundcolormap.set(this, Color.Fuzzy(backgroundColor));

        const minZoomIsNumber = (minZoom instanceof Number);

        if (minZoomIsNumber || 'number' === typeof(minZoom)) {
            minzoommap.set(this, minZoomIsNumber ? minZoom.valueOf() : minZoom);
        } else {
            throw new TypeError(
                'Argument 4 passed to TileSource must be a number!'
            );
        }

        const maxZoomIsNumber = (maxZoom instanceof Number);

        if (maxZoomIsNumber || 'number' === typeof(maxZoom)) {
            if (maxZoom < minZoom) {
                throw new TypeError(
                    'Argument 5 passed to TileSource must be lower than argument 3!'
                );
            }
            maxzoommap.set(this, maxZoomIsNumber ? maxZoom.valueOf() : maxZoom);
        } else {
            throw new TypeError(
                'Argument 5 passed to TileSource must be a number!'
            );
        }

        if ( ! (size instanceof ReadOnlyGridSize)) {
            throw new TypeError(
                'Argument 6 passed to TileSource must be an instance of ReadOnlyGridSize!'
            );
        }

        sizemap.set(this, size);

        if ( ! (tileSize instanceof ReadOnlyUintSize)) {
            throw new TypeError(
                'Argument 7 passed to TileSource must be an instance of ReadOnlyUintSize!'
            );
        }

        tilesizemap.set(this, tileSize);
    }

    get copyright() {
        return copyrightmap.get(this);
    }

    get label() {
        return labelmap.get(this);
    }

    get backgroundColor() {
        return backgroundcolormap.get(this);
    }

    get minZoom() {
        return minzoommap.get(this);
    }

    get maxZoom() {
        return maxzoommap.get(this);
    }

    get size() {
        return sizemap.get(this);
    }

    get tileSize() {
        return tilesizemap.get(this);
    }

    /**
    * @return string
    */
    CoordinatesToTileUrl() {
        throw new TypeError(
            'TileSource.CoordinatesToTile has not been implemented!'
        );
    }

    CoordinatesToTile(zoom) {
        if (arguments.length < 2) {
            throw new TypeError(
                'Position not specified!'
            );
        }
        const pos = ReadOnlyCoordinates.Fuzzy(
            ...(
                arguments.length >= 3
                    ? [arguments[1], arguments[2]]
                    : [arguments[1]]
            )
        );

        const source = document.createElement('canvas');
        const {x: width, y: height} = this.tileSize;
        source.width = width;
        source.height = height;

        const ctx = source.getContext('2d');
        ctx.fillStyle = this.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        const url = this.CoordinatesToTileUrl(zoom, pos);
        let img = imgcache[url];

        if (undefined === img) {
            img = new Image();
            img.src = url;

            img.onload = () => {
                this.dispatchEvent(
                    new CustomEvent('tileupdate', {
                    })
                );
            };

            img.onerror = () => {
                imgerrors.add(img);
            };

            imgcache[url] = img;
        }

        return new Tile(imgerrors.has(img) ? source : img, width, height, pos);
    }
}
