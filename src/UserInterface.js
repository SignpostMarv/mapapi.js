import {Canvas2dTileRenderer} from './Renderer.js';
import {ReadOnlyCoordinates, Coordinates} from './Coordinates.js';

const renderermap = new WeakMap();
const mousedown_timer = new WeakMap();
const draggingmap = new WeakMap();
const draggablemap = new WeakMap();
const wheelzoommap = new WeakMap();
const mousedown_handler = new WeakMap();
const mouseup_handler = new WeakMap();
const wheel_handler = new WeakMap();
const mouseposmap = new WeakMap();

export class BasicUserInterface extends EventTarget
{
    constructor(renderer) {
        if ( ! (renderer instanceof Canvas2dTileRenderer)) {
            throw new TypeError(
                'Argument 1 passed to BasicUserInterface must be an instance of Canvas2dTileRenderer!'
            );
        }

        super();

        renderermap.set(this, renderer);
        draggingmap.set(this, false);
        this.draggable = false;
        this.wheelZoom = false;

        mousedown_handler.set(this, () => {
            clearTimeout(mousedown_timer.get(this));
            draggingmap.set(this, true);
            mousedown_timer.set(
                this,
                setTimeout(
                    () => {
                        draggingmap.set(this, true);
                    },
                    100
                )
            );
        });

        mouseup_handler.set(this, (e) => {
            clearTimeout(mousedown_timer.get(this));
            if ( ! this.dragging) {
                const hasOffsetX = Object.keys(e).includes('offsetX');
                this.dispatchEvent(
                    new CustomEvent('click', {
                        detail: {
                            position: renderermap.get(this).pixelsToCoordinates(
                                (hasOffsetX ? e.offsetX : (e.pageX - e.target.offsetLeft)),
                                (hasOffsetX ? e.offsetY : (e.pageY - e.target.offsetTop))
                            ),
                        },
                    })
                );
            }

            draggingmap.set(this, false);
        }, {passive: true});

        wheel_handler.set(this, (e) => {
            this.dispatchEvent(
                new CustomEvent('wheel', {
                    detail: {
                        zoomIn: e.deltaY < 0,
                        amount: Math.abs(e.deltaY)
                    }
                })
            );
        });

        this.rendererDOMNode.addEventListener('mouseleave', () => {
            mouseposmap.delete(this);
        }, {passive: true});
        this.rendererDOMNode.addEventListener('mouseenter', () => {
            mouseposmap.set(this, Coordinates.Fuzzy(0, 0));
        }, {passive: true});
        this.rendererDOMNode.addEventListener('mousemove', (e) => {
            const hasOffsetX = Object.keys(e).includes('offsetX');
            const {x: newpos_x, y: newpos_y} = this.renderer.pixelsToCoordinates(
                (hasOffsetX ? e.offsetX : (e.pageX - e.target.offsetLeft)),
                (hasOffsetX ? e.offsetY : (e.pageY - e.target.offsetTop))
            );
            const pos = mouseposmap.get(this);
            const was = ReadOnlyCoordinates.Fuzzy(pos);
            pos.x = newpos_x;
            pos.y = newpos_y;

            if (this.dragging) {
                this.dispatchEvent(
                    new CustomEvent('dragmove', {
                        detail: {
                            from: was,
                            position: ReadOnlyCoordinates.Fuzzy(pos)
                        }
                    })
                );
            }
        }, {passive: true});
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

        if ( !! val !== was) {
            const DOM = this.rendererDOMNode;

            const opts = {passive:true};

            if ( ! was) {
                DOM.addEventListener('mousedown', mousedown_handler.get(this), opts);
                DOM.addEventListener('mouseup', mouseup_handler.get(this), opts);
            } else {
                DOM.removeEventListener('mousedown', mousedown_handler.get(this), opts);
                DOM.removeEventListener('mouseup', mouseup_handler.get(this), opts);
            }
        }
    }

    get wheelZoom() {
        return wheelzoommap.get(this);
    }

    set wheelZoom(val) {
        const was = this.wheelZoom;

        if ( !! val !== was) {
            const DOM = this.rendererDOMNode;

            if ( ! was) {
                DOM.addEventListener('wheel', wheel_handler.get(this));
            } else {
                DOM.removeEventListener('wheel', wheel_handler.get(this));
            }
        }
    }

    get mousePosition() {
        if ( ! mouseposmap.has(this)) {
            mouseposmap.set(this, this.renderer.focus);
        }

        return ReadOnlyCoordinates.Fuzzy(mouseposmap.get(this));
    }
}
