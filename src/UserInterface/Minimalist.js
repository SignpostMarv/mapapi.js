import { GridConfig } from '../GridConfig.js';
import { ConstructorArgumentExpectedClass } from '../ErrorFormatting.js';
import { Canvas2dTileRenderer } from '../Renderer.js';
import { BasicUserInterface } from '../UserInterface.js';
import { Widget } from '../Html.js';
import { html } from '../../node_modules/lit-html/lit-html.js';

const gridConfigMap = new WeakMap();
const uiMap = new WeakMap();
const rendererMap = new WeakMap();
const infoWindowMap = new WeakMap();

const uiClickHandler = (e) => {
    infoWindowMap.get(e.target).position = e.detail.position;
    e.target.renderer.dirty = true;
};

export class Minimalist {
    constructor (gridConfig, initialFocus = [0, 0], zoomLevel = 0) {
        if (!(gridConfig.constructor instanceof GridConfig.constructor)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, GridConfig));
        }

        gridConfigMap.set(this, new gridConfig());
        rendererMap.set(
            this,
            new Canvas2dTileRenderer(
                1,
                1,
                this.gridConfig.tileSources[0],
                zoomLevel,
                initialFocus
            )
        );
        uiMap.set(this, new BasicUserInterface(this.renderer));

        this.ui.draggable = true;
        this.ui.wheelZoom = true;
        this.ui.addEventListener('click', uiClickHandler);
        let infoWindowPosFound = true;
        let infoWindowX = 0;
        let infoWindowY = 0;
        let infoWindowTpl = '';
        infoWindowMap.set(this.ui, new Widget(
            (pos, offset) => {
                const { x, y } = pos;
                if (infoWindowPosFound && (infoWindowX !== x || infoWindowY !== y)) {
                    infoWindowTpl = 'Searching...';
                    infoWindowPosFound = false;
                    this.gridConfig.api.CoordinatesToLocation(pos).then(res => {
                        infoWindowTpl = html`
                            ${res.name}
                            <a
                                href="secondlife://${
                                    encodeURIComponent(res.name)}/${
                                    encodeURIComponent(Math.floor(256 * (x % 1)))
                                    }/${
                                    encodeURIComponent(Math.floor(256 * (y % 1)))
                                }"
                            >Teleport</a>
                        `;
                        infoWindowPosFound = true;
                        infoWindowMap.get(this.ui).updateDomNode();
                        this.renderer.dirty = true;
                        this.renderer.animator.animate(pos);
                    });
                }
                infoWindowX = x ;
                infoWindowY = y;
                return html`
                    <div
                        class="mapapijs-infowindow"
                        style="
                            bottom:calc(50% - (((1px * var(--scale)) * var(--tilesource-width)) * (var(--focus-y) - (${pos.y + offset.y}))));
                            left:calc(50% - (((1px * var(--scale)) * var(--tilesource-height)) * (var(--focus-x) - (${pos.x + offset.x}))));"
                    >
                        <div class="mapapijs-infowindow--inner">
                            ${infoWindowTpl}
                        </div>
                    </div>`;
            }
        ));
        this.renderer.widgets.push(infoWindowMap.get(this.ui));

        const sync = () => {
            if (this.renderer.dirty) {
                this.renderer.render();
            }

            requestAnimationFrame(sync);
        };

        sync();
    }

    get gridConfig() {
        return gridConfigMap.get(this);
    }

    get renderer() {
        return rendererMap.get(this);
    }

    get ui() {
        return uiMap.get(this);
    }

    get zoom() {
        return this.renderer.zoom;
    }

    set zoom(val) {
        return this.renderer.zoom = val;
    }

    get focus() {
        return this.renderer.focus;
    }

    set focus(val) {
        return this.renderer.focus = val;
    }
}
