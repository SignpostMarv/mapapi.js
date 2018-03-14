import { GridConfig } from '../GridConfig.js';
import { ConstructorArgumentExpectedClass } from '../ErrorFormatting.js';
import { Canvas2dTileRenderer } from '../Renderer.js';
import { BasicUserInterface } from '../UserInterface.js';

const gridConfigMap = new WeakMap();
const uiMap = new WeakMap();
const rendererMap = new WeakMap();
const infoWindowMap = new WeakMap();

const uiClickHandler = (e) => {
    infoWindowMap.get(e.target).position = e.detail.position;
    e.target.renderer.dirty = true;
};

export class Minimalist {
    constructor(GridConfigClass, initialFocus = [0, 0], zoomLevel = 0) {
        if (!(GridConfigClass.constructor instanceof GridConfig.constructor)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, GridConfig));
        }

        gridConfigMap.set(this, new GridConfigClass());
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
        const infoWindow = this.gridConfig.api.LocationInfoWindowFactory()(this.ui.renderer);
        infoWindowMap.set(this.ui, infoWindow);
        this.renderer.widgets.push(infoWindow);

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
        this.renderer.zoom = val;
    }

    get focus() {
        return this.renderer.focus;
    }

    set focus(val) {
        this.renderer.focus = val;
    }
}
