import { ReadOnlyCoordinates } from './Coordinates.js';
import { Canvas2dTileRenderer } from './Renderer.js';

const transitiontimemap = new WeakMap();
const rafmap = new WeakMap();
const renderermap = new WeakMap();

export class Animator {
    constructor(renderer) {
        if (!(renderer instanceof Canvas2dTileRenderer)) {
            throw new TypeError('Argument 1 passed to Animator must be an instance of Canvas2dTileRenderer!');
        }

        this.transitionTime = 1000;
        renderermap.set(this, renderer);
    }

    get transitionTime() {
        return transitiontimemap.get(this);
    }

    set transitionTime(val) {
        if (!(val instanceof Number) && 'number' !== typeof val) {
            throw new TypeError('Animator::transitionTime must be a Number!');
        }

        transitiontimemap.set(this, Math.max(0, Number(val).valueOf()));
    }

    animate(newpos, newzoom) {
        if ('undefined' !== typeof newzoom && !(newzoom instanceof Number) && 'number' !== typeof newzoom) {
            throw new TypeError('Argument 2 passed to Animator::animate() must be a number!');
        }

        const renderer = renderermap.get(this);
        const { minZoom, maxZoom } = renderer.tileSource;

        const zoom = Math.min(maxZoom, Math.max(minZoom, 'undefined' !== typeof newzoom ? newzoom : renderer.zoom));
        const pos = ReadOnlyCoordinates.Fuzzy(newpos);
        cancelAnimationFrame(rafmap.get(this));

        const startTime = performance.now();
        const endTime = startTime + this.transitionTime;

        const { x: startX, y: startY } = renderer.focus;
        const startZoom = renderer.zoom;

        if (pos.x === startX && pos.y === startY && zoom === startZoom) {
            return;
        }

        const sync = () => {
            const nowTime = performance.now();
            const deltaTime = (nowTime - startTime) / (endTime - startTime);

            let delta = deltaTime - 1;
            delta = (delta * delta * delta) + 1;
            const deltaX = startX + ((pos.x - startX) * delta);
            const deltaY = startY + ((pos.y - startY) * delta);
            const deltaZoom = startZoom + ((zoom - startZoom) * delta);

            if (renderer.focus.x !== deltaX) {
                renderer.focus.x = deltaX;
            }
            if (renderer.focus.y !== deltaY) {
                renderer.focus.y = deltaY;
            }
            if (renderer.zoom !== deltaZoom) {
                renderer.zoom = deltaZoom;
            }

            if (nowTime <= endTime) {
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
