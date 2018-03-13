import { html, render as htmlrender } from '../node_modules/lit-html/lit-html.js';
import { ReadOnlyCoordinates, Coordinates } from './Coordinates.js';

const domNodeMap = new WeakMap();
const posMap = new WeakMap();
const offsetMap = new WeakMap();
const gettplMap = new WeakMap();

export class Widget {
    constructor(gettpl, pos = [0, 0], offset = [0, 0]) {
        posMap.set(this, Coordinates.Fuzzy(pos));
        offsetMap.set(this, ReadOnlyCoordinates.Fuzzy(offset));
        gettplMap.set(this, gettpl);
        this.updateDomNode();
    }

    get position() {
        return posMap.get(this);
    }

    set position(pos) {
        const { x, y } = ReadOnlyCoordinates.Fuzzy(pos);

        this.position.atomicUpdate(x, y);
        this.updateDomNode();
    }

    get offset() {
        return offsetMap.get(this);
    }

    render(into) {
        htmlrender(domNodeMap.get(this), into);
    }

    updateDomNode() {
        const gettpl = gettplMap.get(this);
        domNodeMap.set(this, html`${gettpl(this.position, this.offset)}`);
    }
}

const widgetFilter = e => e instanceof Widget;

export class WidgetGroup extends Array {
    constructor(...widgets) {
        super(...widgets.filter(widgetFilter));
    }

    static of(...widgets) {
        return new this(...widgets);
    }

    concat(...groups) {
        return super.concat(...groups.map((e) => e.filter(widgetFilter)));
    }

    push(...widgets) {
        return super.push(...widgets.filter(widgetFilter));
    }

    fill (...args) {
        throw new TypeError('WidgetGroup cannot be filled!');
    }

    unshift(widget) {
        if (!(widget instanceof Widget)) {
            throw new TypeError('WidgetGroup can only accept instances of Widget');
        }

        return super.unshift(widget);
    }
}
