import {Agni} from '../src/Grids/Agni.js';
import {Canvas2dTileRenderer} from '../src/Renderer.js';
import {BasicUserInterface} from '../src/UserInterface.js';

export function init() {
    const AgniInstance = new Agni();

    const renderer = new Canvas2dTileRenderer(1, 1, AgniInstance.tileSources[0], 0, [1000, 1000]);

    AgniInstance.tileSources[0].fireTileupdateOnImgTile = false;

    const UI = new BasicUserInterface(renderer);
    const move = (e) => {
        e.target.renderer.animator.animate(e.detail.position);
    };
    UI.addEventListener('click', move);
    UI.addEventListener('dragmove', move);
    UI.draggable = true;
    UI.wheelZoom = true;

    document.body.appendChild(renderer.DOMNode);

    const sync = () => {
        if (renderer.dirty) {
            renderer.render();
        }

        requestAnimationFrame(sync);
    };

    requestAnimationFrame(() => {
        renderer.updateAsClientSize();

        sync();
    });

    window.Agni = AgniInstance;
    window.renderer = renderer;
    window.ui = UI;
}
