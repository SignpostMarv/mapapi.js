import { Canvas2dTileRenderer } from './Renderer.js';
import { ReadOnlyCoordinates, Coordinates } from './Coordinates.js';
import { ConstructorArgumentExpectedClass } from './ErrorFormatting.js';

const renderermap = new WeakMap();
const mousedownTimer = new WeakMap();
const draggingmap = new WeakMap();
const draggablemap = new WeakMap();
const wheelzoommap = new WeakMap();
const mousedownHandler = new WeakMap();
const mouseupHandler = new WeakMap();
const wheelHandler = new WeakMap();
const mouseposmap = new WeakMap();
const dragstartmap = new WeakMap();

export class BasicUserInterface extends EventTarget {
    constructor(renderer) {
        if (!(renderer instanceof Canvas2dTileRenderer)) {
            throw new TypeError(ConstructorArgumentExpectedClass(
                this, // eslint-disable-line no-this-before-super
                1,
                Canvas2dTileRenderer
            ));
        }

        super();

        renderermap.set(this, renderer);
        draggingmap.set(this, false);
        this.wheelZoom = false;

        wheelHandler.set(this, (e) => {
            this.renderer.animator.animate(
                this.mousePosition,
                this.renderer.zoom + (((e.deltaY < 0) ? -0.5 : +0.5) * (Math.abs(e.deltaY) / 100))
            );
            this.dispatchEvent(new CustomEvent(
                'wheel',
                {
                    detail: {
                        zoomIn: e.deltaY < 0,
                        amount: Math.abs(e.deltaY),
                    },
                }
            ));
        });

        this.rendererDOMNode.addEventListener('click', (e) => {
            this.dispatchEvent(new CustomEvent(
                'click',
                {
                    detail: {
                        position: renderermap.get(this).pixelsToCoordinates(
                            e.offsetX,
                            e.offsetY
                        ),
                    },
                }
            ));
        });

        this.rendererDOMNode.addEventListener('mouseleave', () => {
            mouseposmap.delete(this);
        }, { passive: true });
        this.rendererDOMNode.addEventListener('mouseenter', () => {
            mouseposmap.set(this, Coordinates.Fuzzy(0, 0));
        }, { passive: true });
        this.rendererDOMNode.addEventListener('mousemove', (e) => {
            mouseposmap.get(this).atomicUpdate(this.renderer.pixelsToCoordinates(
                e.offsetX,
                e.offsetY
            ));
        });

        this.rendererDOMNode.addEventListener('dragstart', (e) => {
            const { x, y } = renderermap.get(this).focus;
            dragstartmap.set(this, [
                renderermap.get(this).pixelsToCoordinates(e.offsetX, e.offsetY),
                x,
                y,
            ]);
        });
        this.rendererDOMNode.addEventListener('dragover', (e) => {
            if (this.draggable) {
                const { x: newPosX, y: newPosY } = this.renderer.pixelsToCoordinates(
                    e.offsetX,
                    e.offsetY
                );
                const [startMouse, startFocusX, startFocusY] = dragstartmap.get(this);
                const { x: focusX, y: focusY } = this.renderer.focus;
                this.renderer.focus = [
                    focusX - (newPosX - startMouse.x),
                    focusY - (newPosY - startMouse.y),
                ];
            }
        }, { passive: true });
    }

    get renderer() {
        return renderermap.get(this);
    }

    get rendererDOMNode() {
        return renderermap.get(this).DOMNode;
    }

    get draggable() {
        return this.rendererDOMNode.draggable;
    }

    set draggable(val) {
        const was = this.draggable;

        if (!!val !== was) {
            const DOM = this.rendererDOMNode;

            const opts = { passive: true };

            DOM.draggable = !!val;

            if (!was) {
                DOM.addEventListener('mousedown', mousedownHandler.get(this), opts);
                DOM.addEventListener('mouseup', mouseupHandler.get(this), opts);
            } else {
                DOM.removeEventListener('mousedown', mousedownHandler.get(this), opts);
                DOM.removeEventListener('mouseup', mouseupHandler.get(this), opts);
            }
        }
    }

    get wheelZoom() {
        return wheelzoommap.get(this);
    }

    set wheelZoom(val) {
        const was = this.wheelZoom;

        if (!!val !== was) {
            const DOM = this.rendererDOMNode;

            if (!was) {
                DOM.addEventListener('wheel', wheelHandler.get(this));
            } else {
                DOM.removeEventListener('wheel', wheelHandler.get(this));
            }
        }
    }

    get mousePosition() {
        if (!mouseposmap.has(this)) {
            mouseposmap.set(this, this.renderer.focus);
        }

        return ReadOnlyCoordinates.Fuzzy(mouseposmap.get(this));
    }
}
