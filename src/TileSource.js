import { ReadOnlyCoordinates } from './Coordinates.js';
import { ReadOnlyGridSize, ReadOnlyUintSize } from './Size.js';
import { Color } from './Color.js';
import { ConstructorArgumentExpectedClass } from './ErrorFormatting.js';

const sizemap = new WeakMap();
const sources = new WeakMap();
const posmap = new WeakMap();
const zoommap = new WeakMap();

export class Tile {
    constructor(source, width, height, pos, zoom) {
        if (
            !(source instanceof Image) &&
            !(source instanceof HTMLCanvasElement)
        ) {
            throw new TypeError('Source must be an image or canvas');
        } else if (!(zoom instanceof Number) && 'number' !== typeof zoom) {
            throw new TypeError('Argument 5 passed to Tile::constructor() must be a number!');
        }
        sizemap.set(this, new ReadOnlyUintSize(width, height));
        sources.set(this, source);
        posmap.set(this, ReadOnlyCoordinates.Fuzzy(pos));
        zoommap.set(this, Number(zoom).valueOf());
    }

    get size() {
        return sizemap.get(this);
    }

    get source() {
        return sources.get(this);
    }

    get position() {
        return posmap.get(this);
    }

    get zoom() {
        return zoommap.get(this);
    }
}

const copyrightmap = new WeakMap();
const labelmap = new WeakMap();
const backgroundcolormap = new WeakMap();
const minzoommap = new WeakMap();
const maxzoommap = new WeakMap();
const tilesizemap = new WeakMap();
const firetileupdateonimgtilemap = new WeakMap();

const imgcache = {};
const imgerrors = new WeakSet();
const imgloading = new WeakSet();

export class TileSource extends EventTarget {
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

        if (copyrightIsString || 'string' === typeof copyright) {
            copyrightmap.set(this, copyrightIsString ? copyright.valueOf() : copyright);
        } else {
            throw new TypeError('Argument 1 passed to TileSource must be a string!');
        }

        const labelIsString = (label instanceof String);

        if (labelIsString || 'string' === typeof label) {
            labelmap.set(this, labelIsString ? label.valueOf() : label);
        } else {
            throw new TypeError('Argument 2 passed to TileSource must be a string!');
        }

        backgroundcolormap.set(this, Color.Fuzzy(backgroundColor));

        if (!((minZoom instanceof Number) || 'number' === typeof minZoom)) {
            throw new TypeError('Argument 4 passed to TileSource must be a number!');
        } else if (!((maxZoom instanceof Number) || 'number' === typeof maxZoom)) {
            throw new TypeError('Argument 5 passed to TileSource must be a number!');
        }

        const minZoomNumber = Number(minZoom).valueOf();
        const maxZoomNumber = Number(maxZoom).valueOf();
        minzoommap.set(this, Math.min(minZoomNumber, maxZoomNumber));
        maxzoommap.set(this, Math.max(minZoomNumber, maxZoomNumber));

        if (!(size instanceof ReadOnlyGridSize)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 6, ReadOnlyGridSize));
        }

        sizemap.set(this, size);

        if (!(tileSize instanceof ReadOnlyUintSize)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 7, ReadOnlyUintSize));
        }

        tilesizemap.set(this, tileSize);
        firetileupdateonimgtilemap.set(this, true);
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

    get fireTileupdateOnImgTile() {
        return firetileupdateonimgtilemap.get(this);
    }

    set fireTileupdateOnImgTile(val) {
        return firetileupdateonimgtilemap.set(this, !!val);
    }

    /**
    * @return string
    */
    CoordinatesToTileUrl() { // eslint-disable-line class-methods-use-this
        throw new TypeError('TileSource.CoordinatesToTile has not been implemented!');
    }

    CoordinatesToTile(zoom, position) {
        const pos = ReadOnlyCoordinates.Fuzzy(position);

        const url = this.CoordinatesToTileUrl(zoom, pos);
        let img = imgcache[url];
        const { x: width, y: height } = this.tileSize;

        if (undefined === img) {
            img = new Image();
            imgcache[url] = img;
            imgloading.add(img);

            requestIdleCallback(() => {
                img.src = url;
                img.decode().then(() => {
                    imgloading.delete(img);
                    imgerrors.delete(img);
                    if (this.fireTileupdateOnImgTile) {
                        this.dispatchEvent(new CustomEvent('tileupdate'));
                    }
                }).catch((err) => {
                    imgerrors.add(img);
                    imgloading.delete(img);
                });
            });
        }
        if (imgerrors.has(img) || imgloading.has(img)) {
            const source = document.createElement('canvas');
            source.width = width;
            source.height = height;

            const ctx = source.getContext('2d');
            ctx.fillStyle = this.backgroundColor;
            ctx.fillRect(0, 0, width, height);

            return new Tile(source, width, height, pos, zoom);
        }

        return new Tile(img, width, height, pos, zoom);
    }
}
