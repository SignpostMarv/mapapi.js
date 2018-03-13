import { ReadOnlyCoordinates } from './Coordinates.js';
import { Canvas2dTileRenderer } from './Renderer.js';
import { ConstructorArgumentExpectedClass } from './ErrorFormatting.js';

const rafmap = new WeakMap();
const renderermap = new WeakMap();

export class Animator {
    constructor(renderer) {
        if (!(renderer instanceof Canvas2dTileRenderer)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, Canvas2dTileRenderer));
        }

        renderermap.set(this, renderer);
    }

    animate(newpos, newzoom, ms = 1000) {
        const transitionTime = Number(ms);
        if (
            'undefined' !== typeof newzoom &&
            !(newzoom instanceof Number) &&
            'number' !== typeof newzoom
        ) {
            throw new TypeError('Argument 2 passed to Animator::animate() must be a number!');
        } else if ('number' !== typeof transitionTime) {
            throw new TypeError('Argument 3 passed to Animator::animate() must be a number!');
        } else if (!Number.isFinite(transitionTime)) {
            throw new TypeError('Argument 3 must be a finite number!');
        } else if (transitionTime <= 0) {
            throw new TypeError('Argument 3 must be a positive number!');
        }

        const renderer = renderermap.get(this);
        const { minZoom, maxZoom } = renderer.tileSource;

        const zoom = Math.min(
            maxZoom,
            Math.max(minZoom, 'undefined' !== typeof newzoom ? newzoom : renderer.zoom)
        );
        const pos = ReadOnlyCoordinates.Fuzzy(newpos);
        cancelAnimationFrame(rafmap.get(this));

        const startTime = performance.now();
        const endTime = startTime + transitionTime;

        const { x: startX, y: startY } = renderer.focus;
        const startZoom = renderer.zoom;

        const done = () => {
            renderer.dispatchEvent(new CustomEvent(
                'transitionend',
                {
                    detail: {
                        position: ReadOnlyCoordinates.Fuzzy(pos),
                        zoom,
                    },
                }
            ));
        };

        if (pos.x === startX && pos.y === startY && zoom === startZoom) {
            done();

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

            if (renderer.focus.x !== deltaX || renderer.focus.y !== deltaY) {
                renderer.focus.atomicUpdate([deltaX, deltaY]);
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

                done();
            }
        };

        renderer.dispatchEvent(new CustomEvent(
            'transitionstart',
            {
                detail: {
                    position: ReadOnlyCoordinates.Fuzzy(startX, startY),
                    zoom: startZoom,
                },
            }
        ));

        sync();
    }
}
