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
        this.draggable = false;
        this.wheelZoom = false;

        mousedownHandler.set(this, (e) => {
            const hasOffsetX = Object.keys(e).includes('offsetX');
            const { x: startFocusX, y: startFocusY } = renderermap.get(this).focus;
            const startMouse = renderermap.get(this).pixelsToCoordinates(
                (hasOffsetX ? e.offsetX : (e.pageX - e.target.offsetLeft)),
                (hasOffsetX ? e.offsetY : (e.pageY - e.target.offsetTop))
            );
            clearTimeout(mousedownTimer.get(this));
            dragstartmap.set(this, [startMouse, startFocusX, startFocusY]);
            draggingmap.set(this, true);
            mousedownTimer.set(
                this,
                setTimeout(
                    () => {
                        draggingmap.set(this, true);
                    },
                    100
                )
            );
        });

        mouseupHandler.set(this, (e) => {
            clearTimeout(mousedownTimer.get(this));
            if (!draggingmap.get(this)) {
                const hasOffsetX = Object.keys(e).includes('offsetX');
                this.dispatchEvent(new CustomEvent(
                    'click',
                    {
                        detail: {
                            position: renderermap.get(this).pixelsToCoordinates(
                                (hasOffsetX ? e.offsetX : (e.pageX - e.target.offsetLeft)),
                                (hasOffsetX ? e.offsetY : (e.pageY - e.target.offsetTop))
                            ),
                        },
                    }
                ));
            }

            draggingmap.set(this, false);
        }, { passive: true });

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

        this.rendererDOMNode.addEventListener('mouseleave', () => {
            mouseposmap.delete(this);
        }, { passive: true });
        this.rendererDOMNode.addEventListener('mouseenter', () => {
            mouseposmap.set(this, Coordinates.Fuzzy(0, 0));
        }, { passive: true });
        this.rendererDOMNode.addEventListener('mousemove', (e) => {
            const hasOffsetX = Object.keys(e).includes('offsetX');
            const { x: newPosX, y: newPosY } = this.renderer.pixelsToCoordinates(
                (hasOffsetX ? e.offsetX : (e.pageX - e.target.offsetLeft)),
                (hasOffsetX ? e.offsetY : (e.pageY - e.target.offsetTop))
            );
            const pos = mouseposmap.get(this);
            pos.atomicUpdate([newPosX, newPosY]);
            if (draggingmap.get(this)) {
                const [startMouse, startFocusX, startFocusY] = dragstartmap.get(this);
                this.renderer.focus = [
                    startFocusX + (startMouse.x - newPosX),
                    startFocusY + (startMouse.y - newPosY),
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
        return draggablemap.get(this);
    }

    set draggable(val) {
        const was = this.draggable;

        if (!!val !== was) {
            const DOM = this.rendererDOMNode;

            const opts = { passive: true };

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
