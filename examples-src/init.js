import {Agni} from '../src/Grids/Agni.js';
import { Minimalist } from '../src/UserInterface/Minimalist.js';

export function init() {
    const minimalist = new Minimalist(Agni, [1000, 1000]);

    document.body.appendChild(minimalist.renderer.DOMNode);

    return minimalist;
};
