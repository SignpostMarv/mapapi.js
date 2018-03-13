import { init } from './init.js';

export default function() {
    const minimalist = init();

    let stateIndex = 0;
    const states = [
        [[1000, 1000], 0, 1000],
        [[1000, 1001], 0, 2000],
        [[1000, 1001], 1, 500],
        [[1000, 1000], 7, 10000],
        [[1000, 1000], 0, 10000],
    ];
    const advanceState = () => {
        if (stateIndex >= states.length) {
            minimalist.renderer.removeEventListener('transitionend', advanceState);
            return;
        }

        minimalist.renderer.animator.animate(...states[stateIndex++]);
    };
    minimalist.renderer.addEventListener('transitionend', advanceState);

    advanceState();

    window.UI = minimalist;
}
