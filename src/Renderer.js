import {ReadOnlyUintSize, Size} from './Size.js';
import {Bounds, ReadOnlyBounds} from './Geometry.js';
import {TileSource} from './TileSource.js';
import {Coordinates, ReadOnlyCoordinates} from './Coordinates.js';

const sizemap = new WeakMap();
const canvasmap = new WeakMap();
const ctxmap = new WeakMap();
const boundsmap = new WeakMap();
const tilesourcemap = new WeakMap();
const zoommap = new WeakMap();
const focusmap = new WeakMap();
const dirtymap = new WeakMap();

const animatormap = new WeakMap();

const tilecachemap = new WeakMap();
const deferreddirtymap = new WeakMap();

const ctx = (renderer) => {
    return canvasmap.get(renderer).getContext('2d');
};

const deferMakeDirty = (renderer) => {
    cancelAnimationFrame(deferreddirtymap.get(renderer));
    deferreddirtymap.set(renderer, requestAnimationFrame(() => {
        dirtymap.set(renderer, true);
    }));
};

export class Canvas2dTileRenderer
{
    constructor (width, height, tileSource, zoom = 0, focus = [0,0])
    {
        if ( ! (tileSource instanceof TileSource)) {
            throw new TypeError(
                'Argument 1 passed to Canvas2dTileRenderer must be an instance of TileSource!'
            );
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
        ctxmap.set(this, ctx(this));
        tilecachemap.set(tileSource, {});

        this.focus.addEventListener('propertyUpdate', (e) => {
            if (['x', 'y'].includes(e.detail.property)) {
                dirtymap.set(this, true);
            }
        });

        const node = this.DOMNode;

        const ro = new ResizeObserver(entries => {
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
        const pos = ReadOnlyCoordinates.Fuzzy(...arguments);

        this.focus.x = pos.x;
        this.focus.y = pos.y;
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
        if (
            ! (zoom instanceof Number) &&
            'number' !== typeof(zoom)
        ) {
            throw new TypeError(
                'Canvas2dTileRenderer.prototype.zoom must be a Number!'
            );
        }

        const was = zoommap.get(this);

        const {minZoom, maxZoom} = tilesourcemap.get(this);

        zoommap.set(this, Math.min(maxZoom, Math.max(minZoom, zoom)));

        if (was !== this.zoom) {
            dirtymap.set(this, true);
        }
    }

    get bounds() {
        let has_changed = false;
        let bounds;
        if ( ! boundsmap.has(this) || this.dirty) {
            bounds = boundsmap.has(this) ? boundsmap.get(this) : Bounds.Zero;

            const {x: was_bl_x, y: was_bl_y} = bounds.bottomLeft;
            const {x: was_tr_x, y: was_tr_y} = bounds.topRight;

            const zoom = this.zoom;
            const zoom_a = .5 + (.5  * (1 - (zoom % 1)));
            const zoom_b = 1 << Math.floor(zoom);
            const {x: focus_x, y: focus_y} = this.focus;
            const {x: content_width, y: content_height} = this.size;
            let {x: tile_width, y: tile_height} = tilesourcemap.get(this).tileSize;

            tile_width = (tile_width * zoom_a) / zoom_b;
            tile_height = (tile_height * zoom_a) / zoom_b;

            const view_width_half = (content_width / tile_width) / 2.0;
            const view_height_half = (content_height / tile_height) / 2.0;

            bounds.bottomLeft.x = focus_x - view_width_half;
            bounds.bottomLeft.y = focus_y - view_height_half;
            bounds.topRight.x = focus_x + view_width_half;
            bounds.topRight.y = focus_y + view_height_half;

            const {x: is_bl_x, y: is_bl_y} = bounds.bottomLeft;
            const {x: is_tr_x, y: is_tr_y} = bounds.topRight;

            has_changed = (
                was_bl_x !== bounds.bottomLeft.x ||
                was_bl_y !== bounds.bottomLeft.y ||
                was_tr_x !== bounds.topRight.x ||
                was_tr_y !== bounds.topRight.y
            );

            if ( ! boundsmap.has(this)) {
                boundsmap.set(this, bounds);
                bounds.addEventListener('propertyUpdate', () => {
                    if (has_changed) {
                        this.dispatchEvent('propertyUpdate', {
                            detail: {
                                property: 'bounds',
                                was: new ReadOnlyBounds([was_bl_x, was_bl_y], [was_tr_x, was_tr_y]),
                                is: new ReadOnlyBounds([is_bl_x, is_bl_y], [is_tr_x, is_tr_y]),
                            }
                        });
                        dirtymap.set(this, true);
                    }
                }, {passive: true});
            }
        }

        const {x: out_bl_x, y: out_bl_y} = boundsmap.get(this).bottomLeft;
        const {x: out_tr_x, y: out_tr_y} = boundsmap.get(this).topRight;

        return new ReadOnlyBounds([out_bl_x, out_bl_y], [out_tr_x, out_tr_y]);
    }

    updateAsClientSize() {
        const {x: was_width, y: was_height} = this.size;
        const canvas = canvasmap.get(this);
        const {clientWidth: width, clientHeight: height} = canvas;

        if (was_width !== width || was_height !== height) {
            sizemap.set(this, Size.Fuzzy(width, height));
            dirtymap.set(this, true);
            this.DOMNode.width = width;
            this.DOMNode.height = height;

            boundsmap.delete(this);
        }
    }

    render() {
        const ctx = ctxmap.get(this);

        let {x: width, y: height} = this.size;

        ctx.save();
        ctx.fillStyle = tilesourcemap.get(this).backgroundColor.toString();
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        const zoom = this.zoom;
        const zoom_a = .5 + (.5 * (1 - (zoom % 1)));
        const zoom_b = 1 << Math.floor(zoom);
        const {x: focus_x, y: focus_y} = this.focus;
        const bounds = this.bounds;
        const {x: bl_x, y: bl_y} = bounds.bottomLeft;
        const {x: tr_x, y: tr_y} = bounds.topRight;
        const start_x = bl_x - (bl_x % zoom_b);
        const start_y = bl_y - (bl_y % zoom_b);
        const tilesource = tilesourcemap.get(this);
        let {x: tile_width, y: tile_height} = tilesource.tileSize;

        width /= 2.0;
        height /= 2.0;

        tile_width = (tile_width * zoom_a) / zoom_b;
        tile_height = (tile_height * zoom_a) / zoom_b;

        ctx.save();
        ctx.translate(
            (focus_x * -tile_width) + width,
            (focus_y * tile_height) + height - (tile_height * zoom_b)
        );
        ctx.scale(tile_width, tile_height);

        const tilecache = tilecachemap.get(tilesource);
        const xkeys = Object.keys(tilecache);

        for (let x = start_x; x <= tr_x; x += zoom_b) {
            if ( ! xkeys.includes(x + '')) {
                tilecache[x + ''] = {};
            }
            for (let y = start_y; y <= tr_y; y += zoom_b) {
                const ykeys = xkeys.includes(x + '') ? Object.keys(tilecache[x]) : [];
                let tile =
                    ykeys.includes(y + '')
                        ? tilecache[x][y]
                        : tilesource.CoordinatesToTile(zoom, x, y);
                if ( ! ykeys.includes(y + '') && tile.source instanceof HTMLImageElement) {
                    tile.source.addEventListener('load', () => {
                        deferMakeDirty(this);
                    });
                }
                try {
                    ctx.drawImage(tile.source, x, -y, zoom_b, zoom_b);
                    tilecache[x][y] = tile;
                } catch (err) {
                    if (ykeys.includes(y)) {
                        delete tilecache[x][y];
                    }
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
        if ( ! animatormap.has(this)) {
            animatormap.set(this, new Animator(this));
        }

        return animatormap.get(this);
    }

    pixelsToCoordinates() {
        const px = ReadOnlyCoordinates.Fuzzy(...arguments);
        const {clientWidth, clientHeight} = this.DOMNode;

        if (px.x < 0 || px.y < 0 || px.x > clientWidth || px.y > clientHeight) {
            throw new RangeError(
                'Coordinates are outside the bounds of the DOM node!'
            );
        }

        const {x: focus_x, y: focus_y} = this.focus;
        const {x: tile_width, y: tile_height} = tilesourcemap.get(this).tileSize;

        return new ReadOnlyCoordinates(
            focus_x + ((px.x - (clientWidth / 2)) / tile_width),
            focus_y + (((clientHeight - px.y) - (clientHeight / 2)) / tile_height)
        );
    }
}

const transitiontimemap = new WeakMap();
const rafmap = new WeakMap();
const renderermap = new WeakMap();

export class Animator
{
    constructor(renderer) {
        if (! (renderer instanceof Canvas2dTileRenderer)) {
            throw new TypeError(
                'Argument 1 passed to Animator must be an instance of Canvas2dTileRenderer!'
            );
        }

        this.transitionTime = 1000;
        renderermap.set(this, renderer);
    }

    get transitionTime() {
        return transitiontimemap.get(this);
    }

    set transitionTime(val) {
        if ( ! (val instanceof Number) && 'number' !== typeof(val)) {
            throw new TypeError(
                'Animator::transitionTime must be a Number!'
            );
        }

        transitiontimemap.set(this, Math.max(0, (new Number(val)).valueOf()));
    }

    animate(newpos, newzoom) {
        if ('undefined' !== typeof(newzoom) && ! (newzoom instanceof Number) && 'number' !== typeof(newzoom)) {
            throw new TypeError(
                'Argument 2 passed to Animator::animate() must be a number!'
            );
        }

        const renderer = renderermap.get(this);
        const {minZoom, maxZoom} = tilesourcemap.get(renderer);

        const zoom = Math.min(maxZoom, Math.max(minZoom, 'undefined' !== typeof(newzoom) ? newzoom : renderer.zoom));
        const pos = ReadOnlyCoordinates.Fuzzy(newpos);
        cancelAnimationFrame(rafmap.get(this));

        const start_time = performance.now();
        const end_time = start_time + this.transitionTime;

        const {x: start_x, y: start_y} = renderer.focus;
        const start_zoom = renderer.zoom;

        if (pos.x === start_x && pos.y === start_y && zoom === start_zoom) {
            return;
        }

        const sync = () => {
            const now_time = performance.now();
            const delta_time = (now_time - start_time) / (end_time - start_time);

            let delta = delta_time - 1;
            delta = delta * delta * delta + 1;
            const delta_x = start_x + ((pos.x - start_x) * delta);
            const delta_y = start_y + ((pos.y - start_y) * delta);
            const delta_zoom = start_zoom + ((zoom - start_zoom) * delta);

            if (renderer.focus.x !== delta_x) {
                renderer.focus.x = delta_x;
            }
            if (renderer.focus.y !== delta_y) {
                renderer.focus.y = delta_y;
            }
            if (renderer.zoom !== delta_zoom) {
                renderer.zoom = delta_zoom;
            }

            if (now_time <= end_time) {
                rafmap.set(this, requestAnimationFrame(sync));
            } else {
                if (renderer.focus.x !== pos.x) {
                    renderer.focus.x = pos.x;
                }
                if (renderer.focus.y !== pos.y) {
                    renderer.focus.y = pos.y;
                }
                if (renderer.zoom !== zoom) {
                    renderer.zoom = zoom;
                }
            }
        };

        sync();
    }
}
