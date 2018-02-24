import { ReadOnlyUintSize, Size } from './Size.js';
import { Bounds, ReadOnlyBounds } from './Geometry.js';
import { TileSource } from './TileSource.js';
import { Coordinates, ReadOnlyCoordinates } from './Coordinates.js';
import { Animator } from './Animator.js';
import { ConstructorArgumentExpectedClass } from './ErrorFormatting.js';

const sizemap = new WeakMap();
const canvasmap = new WeakMap();
const ctxmap = new WeakMap();
const boundsmap = new WeakMap();
const tilesourcemap = new WeakMap();
const zoommap = new WeakMap();
const focusmap = new WeakMap();
const dirtymap = new WeakMap();

const animatormap = new WeakMap();

const deferreddirtymap = new WeakMap();

const deferMakeDirty = (renderer) => {
    cancelAnimationFrame(deferreddirtymap.get(renderer));
    deferreddirtymap.set(renderer, requestAnimationFrame(() => {
        dirtymap.set(renderer, true);
    }));
};

export class Canvas2dTileRenderer {
    constructor(width, height, tileSource, zoom = 0, focus = [0, 0]) {
        if (!(tileSource instanceof TileSource)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, TileSource));
        }

        tileSource.addEventListener('tileupdate', () => {
            deferMakeDirty(this);
        });

        tilesourcemap.set(this, tileSource);
        this.zoom = zoom;
        sizemap.set(this, ReadOnlyUintSize.Fuzzy(width, height));
        focusmap.set(this, Coordinates.Fuzzy(...((focus instanceof Array) ? focus : [focus])));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        canvasmap.set(this, canvas);
        dirtymap.set(this, true);
        ctxmap.set(this, canvasmap.get(this).getContext('2d'));

        this.focus.addEventListener('propertyUpdate', (e) => {
            if (e.detail.properties.includes('x') || e.detail.properties.includes('y')) {
                dirtymap.set(this, true);
            }
        });

        const node = this.DOMNode;

        const ro = new ResizeObserver((entries) => {
            if (entries.map(e => e.target).includes(node)) {
                this.updateAsClientSize();
            }
        });

        ro.observe(node);
    }

    get focus() {
        return focusmap.get(this);
    }

    set focus(val) {
        this.focus.atomicUpdate(val);
    }

    get size() {
        return sizemap.get(this);
    }

    get dirty() {
        return dirtymap.get(this);
    }

    get zoom() {
        return zoommap.get(this);
    }

    set zoom(zoom) {
        if (!(zoom instanceof Number) && 'number' !== typeof zoom) {
            throw new TypeError('Canvas2dTileRenderer.prototype.zoom must be a Number!');
        }

        const was = zoommap.get(this);

        const { minZoom, maxZoom } = tilesourcemap.get(this);

        zoommap.set(this, Math.min(maxZoom, Math.max(minZoom, zoom)));

        if (was !== this.zoom) {
            dirtymap.set(this, true);
        }
    }

    get bounds() {
        let hasChanged = false;
        let bounds;
        if (!boundsmap.has(this) || this.dirty) {
            bounds = boundsmap.has(this) ? boundsmap.get(this) : Bounds.Zero;

            const { x: wasBlX, y: wasBlY } = bounds.bottomLeft;
            const { x: wasTrX, y: wasTrY } = bounds.topRight;

            const { zoom } = this;
            const zoomA = 0.5 + (0.5 * (1 - (zoom % 1)));
            const zoomB = 2 ** Math.floor(zoom);
            const { x: focusX, y: focusY } = this.focus;
            const { x: contentWidth, y: contentHeight } = this.size;
            let { x: tileWidth, y: tileHeight } = tilesourcemap.get(this).tileSize;

            tileWidth = (tileWidth * zoomA) / zoomB;
            tileHeight = (tileHeight * zoomA) / zoomB;

            const viewWidthHalf = (contentWidth / tileWidth) / 2.0;
            const viewHeightHalf = (contentHeight / tileHeight) / 2.0;

            bounds.bottomLeft.atomicUpdate([
                focusX - viewWidthHalf,
                focusY - viewHeightHalf,
            ]);
            bounds.topRight.atomicUpdate([
                focusX + viewWidthHalf,
                focusY + viewHeightHalf,
            ]);

            const { x: isBlX, y: isBlY } = bounds.bottomLeft;
            const { x: isTrX, y: isTrY } = bounds.topRight;

            hasChanged = (
                wasBlX !== bounds.bottomLeft.x ||
                wasBlY !== bounds.bottomLeft.y ||
                wasTrX !== bounds.topRight.x ||
                wasTrY !== bounds.topRight.y
            );

            if (!boundsmap.has(this)) {
                boundsmap.set(this, bounds);
                bounds.addEventListener('propertyUpdate', () => {
                    if (hasChanged) {
                        this.dispatchEvent('propertyUpdate', {
                            detail: {
                                property: 'bounds',
                                was: new ReadOnlyBounds([wasBlX, wasBlY], [wasTrX, wasTrY]),
                                is: new ReadOnlyBounds([isBlX, isBlY], [isTrX, isTrY]),
                            },
                        });
                        dirtymap.set(this, true);
                    }
                }, { passive: true });
            }
        }

        const { x: outBlX, y: outBlY } = boundsmap.get(this).bottomLeft;
        const { x: outTrX, y: outTrY } = boundsmap.get(this).topRight;

        return new ReadOnlyBounds([outBlX, outBlY], [outTrX, outTrY]);
    }

    updateAsClientSize() {
        const { x: wasWidth, y: wasHeight } = this.size;
        const canvas = canvasmap.get(this);
        const { clientWidth: width, clientHeight: height } = canvas;

        if (wasWidth !== width || wasHeight !== height) {
            sizemap.set(this, Size.Fuzzy(width, height));
            dirtymap.set(this, true);
            this.DOMNode.width = width;
            this.DOMNode.height = height;

            boundsmap.delete(this);
        }
    }

    render() {
        const ctx = ctxmap.get(this);

        let { x: width, y: height } = this.size;

        ctx.save();
        ctx.fillStyle = tilesourcemap.get(this).backgroundColor.toString();
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        const { zoom, bounds } = this;
        const zoomA = 0.5 + (0.5 * (1 - (zoom % 1)));
        const zoomB = 2 ** Math.floor(zoom);
        const { x: focusX, y: focusY } = this.focus;
        const { x: blX, y: blY } = bounds.bottomLeft;
        const { x: trX, y: trY } = bounds.topRight;
        const startX = blX - (blX % zoomB);
        const startY = blY - (blY % zoomB);
        const tilesource = tilesourcemap.get(this);
        let { x: tileWidth, y: tileHeight } = tilesource.tileSize;

        width /= 2.0;
        height /= 2.0;

        tileWidth = (tileWidth * zoomA) / zoomB;
        tileHeight = (tileHeight * zoomA) / zoomB;

        ctx.save();
        ctx.translate(
            (focusX * -tileWidth) + width,
            ((focusY * tileHeight) + height) - (tileHeight * zoomB)
        );
        ctx.scale(tileWidth, tileHeight);

        for (let x = startX; x <= trX; x += zoomB) {
            for (let y = startY; y <= trY; y += zoomB) {
                const tile = tilesource.CoordinatesToTile(zoom, [x, y]);
                if (tile.source instanceof HTMLImageElement) {
                    tile.source.addEventListener('load', () => {
                        deferMakeDirty(this);
                    });
                }
                try {
                    ctx.drawImage(tile.source, x, -y, zoomB, zoomB);
                } catch (err) {
                    console.error(err); // eslint-disable-line no-console
                }
            }
        }

        ctx.restore();

        dirtymap.set(this, false);
    }

    get DOMNode() {
        return canvasmap.get(this);
    }

    get animator() {
        if (!animatormap.has(this)) {
            animatormap.set(this, new Animator(this));
        }

        return animatormap.get(this);
    }

    pixelsToCoordinates(...args) {
        const px = ReadOnlyCoordinates.Fuzzy(...args);
        const { clientWidth, clientHeight } = this.DOMNode;

        if (px.x < 0 || px.y < 0 || px.x > clientWidth || px.y > clientHeight) {
            throw new RangeError('Coordinates are outside the bounds of the DOM node!');
        }

        const { x: focusX, y: focusY } = this.focus;
        const { x: tileWidth, y: tileHeight } = tilesourcemap.get(this).tileSize;
        const tilesPerImageEdge = 2 ** Math.floor(this.zoom);

        return new ReadOnlyCoordinates(
            focusX + ((px.x - (clientWidth / 2)) / (tileWidth / tilesPerImageEdge)),
            (
                focusY +
                (((clientHeight - px.y) - (clientHeight / 2)) / (tileHeight / tilesPerImageEdge))
            )
        );
    }

    get tileSource() {
        return tilesourcemap.get(this);
    }
}
