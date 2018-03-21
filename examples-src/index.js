import { init } from './init.js';

export default function() {
    const minimalist = init();

    window.UI = minimalist;
    UI.zoom = 5;
}
