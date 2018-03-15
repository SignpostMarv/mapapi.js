import {
    ConstructorArgumentExpectedClass,
    ClassMethodArgumentExpectedType,
    ClassMethodPropertytExpectedType,
    ConstructorArgumentGTE,
} from './ErrorFormatting.js';
import { ReadOnlyCoordinates } from './Coordinates.js';
import { Color, AlphaColor } from './Color.js';
import { ReadOnlyBounds } from './Geometry.js';
import { Widget } from './Html.js';
import { html, svg } from '../node_modules/lit-html/lit-html.js';

const fillStyleMap = new WeakMap();
const strokeStyleMap = new WeakMap();
const lineWidthMap = new WeakMap();
const widgetMap = new WeakMap();

const updateFillStyle = (obj, arg) => {
    const was = fillStyleMap.get(obj);

    fillStyleMap.set(obj, AlphaColor.Fuzzy(...(Array.isArray(arg) ? arg : [arg])));

    const is = fillStyleMap.get(obj);

    return (
        undefined === was ||
        (was.r !== is.r || was.g !== is.g || was.b !== is.b || was.a !== is.a)
    );
};
const updateStrokeStyle = (obj, arg) => {
    const was = fillStyleMap.get(obj);

    strokeStyleMap.set(obj, AlphaColor.Fuzzy(...(Array.isArray(arg) ? arg : [arg])));

    const is = fillStyleMap.get(obj);

    return (
        undefined === was ||
        (was.r !== is.r || was.g !== is.g || was.b !== is.b || was.a !== is.a)
    );
};
const updateLineWidth = (obj, arg, name, argNum) => {
    const was = lineWidthMap.get(obj);
    const width = Number(arg);

    if ('number' !== typeof width || !Number.isFinite(width)) {
        throw new TypeError(ClassMethodPropertytExpectedType(obj, name, argNum, 'finite number'));
    } else if (width < 0) {
        throw new RangeError(ConstructorArgumentGTE(obj, argNum, 0));
    }

    lineWidthMap.set(obj, arg);

    return was !== width;
};

const dispatchPropertyUpdate = (obj, properties) => obj.dispatchEvent(new CustomEvent(
    'propertyUpdate',
    { detail: { properties } }
));

export class ShapeStyle extends EventTarget {
    constructor(fillStyle, strokeStyle, strokeWidth) {
        const width = Number(strokeWidth);
        super();
        if (!(fillStyle instanceof Color)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, Color));
        } else if (!(strokeStyle instanceof Color)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 2, Color));
        } else if ('number' !== typeof width || !Number.isFinite(width)) {
            throw new TypeError(ClassMethodArgumentExpectedType(
                this,
                this.constructor,
                3,
                'finite number'
            ));
        } else if (width < 0) {
            throw new RangeError(ConstructorArgumentGTE(this, 3, 0));
        }

        const fillStyleArgs = [fillStyle.r, fillStyle.g, fillStyle.b];
        const strokeStyleArgs = [strokeStyle.r, strokeStyle.g, strokeStyle.b];

        if (fillStyle instanceof AlphaColor) {
            fillStyleArgs.push(fillStyle.a);
        }
        if (strokeStyle instanceof AlphaColor) {
            strokeStyleArgs.push(strokeStyle.a);
        }

        updateFillStyle(this, fillStyleArgs);
        updateStrokeStyle(this, strokeStyleArgs);
        updateLineWidth(this, width, 'constructor()', 3);
    }

    static Fuzzy(args) {
        if (3 === args.length) {
            return new this(...args);
        } else if (args instanceof ShapeStyle) {
            return new this(
                AlphaColor.Fuzzy(
                    args.fillStyle.r,
                    args.fillStyle.g,
                    args.fillStyle.b,
                    args.fillStyle.a
                ),
                AlphaColor.Fuzzy(
                    args.strokeStyle.r,
                    args.strokeStyle.g,
                    args.strokeStyle.b,
                    args.strokeStyle.a
                ),
                args.lineWidth
            );
        }

        throw new TypeError('Unable to determine appropriate arguments for ShapeStyle');
    }

    atomicUpdate(fillStyle, strokeStyle, strokeWidth) {
        const properties = [];

        if (updateFillStyle(this, fillStyle)) {
            properties.push('fillStyle');
        }

        if (updateStrokeStyle(this, strokeStyle)) {
            properties.push('strokeStyle');
        }

        if (updateLineWidth(this, strokeWidth, 'lineWidth', 1)) {
            properties.push('lineWidth');
        }

        if (properties.length > 0) {
            dispatchPropertyUpdate(this, properties);
        }
    }

    get fillStyle() {
        return fillStyleMap.get(this);
    }

    set fillStyle(arg) {
        if (updateFillStyle(this, arg)) {
            dispatchPropertyUpdate(this, ['fillStyle']);
        }
    }

    get strokeStyle() {
        return strokeStyleMap.get(this);
    }

    set strokeStyle(arg) {
        if (updateStrokeStyle(this, arg)) {
            dispatchPropertyUpdate(this, ['strokeStyle']);
        }
    }

    get lineWidth() {
        return lineWidthMap.get(this);
    }

    set lineWidth(value) {
        if (updateLineWidth(this, value, 'lineWidth', 1)) {
            dispatchPropertyUpdate(this, ['lineWidth']);
        }
    }
}

const styleMap = new WeakMap();
const coordsMap = new WeakMap();
const clickableMap = new WeakMap();
const titleMap = new WeakMap();

export class Shape extends EventTarget {
    constructor(style, clickable, title, ...coords) {
        if (coords.length < 0) {
            throw new TypeError('At least one coordinate must be specified!');
        }

        super();

        coordsMap.set(this, coords.map(e => ReadOnlyCoordinates.Fuzzy(...e)));

        styleMap.set(this, ShapeStyle.Fuzzy(style));

        clickableMap.set(this, !!clickable);
        titleMap.set(this, String(title));

        this.style.addEventListener('propertyUpdate', () => {
            dispatchPropertyUpdate(this, 'style');
        });
    }

    get style() {
        return styleMap.get(this);
    }

    get Coordinates() {
        return coordsMap.get(this).slice();
    }

    get clickable() {
        return clickableMap.get(this);
    }

    set clickable(val) {
        clickableMap.set(this, !!val);
    }

    get title() {
        return titleMap.get(this);
    }

    set title(val) {
        const title = String(val);

        if (title !== this.title) {
            titleMap.set(this, title);
            dispatchPropertyUpdate(this, 'title');
        }
    }

    get bounds() {
        let blX = NaN;
        let blY = NaN;
        let trX = NaN;
        let trY = NaN;

        this.Coordinates.forEach((coord) => {
            blX = Number.isNaN(blX) ? coord.x : Math.min(coord.x, blX);
            blY = Number.isNaN(blY) ? coord.y : Math.min(coord.y, blY);
            trX = Number.isNaN(trX) ? coord.x : Math.max(coord.x, trX);
            trY = Number.isNaN(trY) ? coord.y : Math.max(coord.y, trY);
        });

        return ReadOnlyBounds.Fuzzy(blX, blY, trX, trY);
    }

    get widget() {
        if (!widgetMap.has(this)) {
            throw new TypeError('Shape does not support widgets!');
        }

        return widgetMap.get(this);
    }
}

export class Line extends Shape {
    constructor(style, clickable, title, ...coords) {
        if (coords.length < 2) {
            throw new TypeError('At least two coordinates must be specified!');
        }

        super(style, clickable, title, ...coords);
    }

    get length() {
        const coords = this.Coordinates;
        const { length } = coords;
        let distance = 0;
        let against = coords[0];

        for (let i = 1; i < length; i += 1) {
            const current = coords[i];
            const xDiff = against.x - current.x;
            const yDiff = against.y - current.y;

            distance += Math.sqrt((xDiff ** 2) + (yDiff ** 2));

            against = current;
        }

        return distance;
    }
}

export class Circle extends Line {
    get radius() {
        const [center, edge] = this.Coordinates;

        return Math.sqrt(((center.x - edge.x) ** 2) + ((center.y - edge.y) ** 2));
    }

    get length() {
        return this.radius;
    }

    get bounds() {
        const { x, y } = this.Coordinates[0];
        const { radius } = this;

        return ReadOnlyBounds.Fuzzy([[x - radius, y - radius], [x + radius, y + radius]]);
    }
}

export class Rectangle extends Line {
    constructor(style, clickable, title, ...coords) {
        if (coords.length < 2) {
            throw new TypeError('At least two coordinates must be specified!');
        }

        super(style, clickable, title, ...coords);
    }
}

export class Polygon extends Line {
    constructor(style, clickable, title, ...coords) {
        if (coords.length < 3) {
            throw new TypeError('At least three coordinates must be specified!');
        }

        super(style, clickable, title, ...coords);
    }

    get widget() {
        if (!widgetMap.has(this)) {
            const widget = new Widget((pos, offset) => {
                const [posX, posY] = pos.toArray();
                const {
                    bounds,
                    Coordinates,
                    clickable,
                    style,
                    title,
                } = this;
                const { fillStyle, strokeStyle, lineWidth } = style;
                const [width, height] = bounds.size.toArray();
                const pointerEvents = clickable ? '' : 'pointer-events:none;';
                return html`<svg
                    width="${width}"
                    height="${height}"
                    title="${title}"
                    style="
                        fill:${fillStyle};
                        stroke:${strokeStyle};
                        stroke-width:calc((${lineWidth} / var(--tilesource-width)) * var(--scale));
                        ${pointerEvents}
                        bottom:
                            calc(
                                50% -
                                (
                                    (
                                        (1px * var(--scale)) *
                                        var(--tilesource-width)
                                    ) *
                                    (
                                        var(--focus-y) -
                                        (
                                            ${pos.y + offset.y}
                                        )
                                    )
                                )
                            );
                        left:
                            calc(
                                50% -
                                (
                                    (
                                        (1px * var(--scale)) *
                                        var(--tilesource-height)
                                    ) *
                                    (
                                        var(--focus-x) -
                                        (
                                            ${pos.x + offset.x}
                                        )
                                    )
                                )
                            );
                    "
                >${svg`
                    <polygon points="${
                        Coordinates.map((e) => {
                            const [x, y] = e.toArray();

                            return [x - posX, y - posY].join(',');
                        }).join(' ')
                    }" />
                `}</svg>`;
            });
            widget.position = this.bounds.bottomLeft;
            widgetMap.set(this, widget);
        }

        return super.widget;
    }
}

const shapeFilter = e => e instanceof Shape;

export class ShapeGroup extends Array {
    constructor(name, ...shapes) {
        super(...shapes.filter(shapeFilter));

        titleMap.set(this, String(name));
    }

    get name() {
        return titleMap.get(this);
    }

    set name(val) {
        titleMap.set(this, String(val));
    }

    static of(...shapes) {
        return new this('', ...shapes);
    }

    concat(...groups) {
        return super.concat(...groups.map(e => e.filter(shapeFilter)));
    }

    push(...shapes) {
        return super.push(shapes.filter(shapeFilter));
    }

    fill() { // eslint-disable-line class-methods-use-this
        throw new TypeError('ShapeGroup cannot be filled!');
    }

    unshift(shape) {
        if (!(shape instanceof Shape)) {
            throw new TypeError('ShapeGroup can only accept instances of Shape');
        }

        return super.unshift(shape);
    }
}

const shapeGroupFilter = e => e instanceof ShapeGroup;

export class ShapeGroups extends Array {
    constructor(...groups) {
        super(...groups.filter(shapeGroupFilter));
    }

    static of(...groups) {
        return new this(groups.filter(shapeGroupFilter));
    }

    concat(...groups) {
        const res = new this();
        groups.forEach(e => res.push(e));

        return res;
    }

    push(...val) {
        const groupNames = this.map(e => e.name);
        const groups = val.filter(shapeGroupFilter);
        groups.forEach((group) => {
            const index = groupNames.indexOf(group.name);

            if (index >= 0) {
                this[index].push(...group);
            } else {
                groupNames.push(group.name);
                super.push(group);
            }
        });

        return this.length;
    }

    fill() { // eslint-disable-line class-methods-use-this
        throw new TypeError('ShapeGroups cannot be filled!');
    }

    unshift(shape) {
        if (!(shape instanceof ShapeGroup)) {
            throw new TypeError('ShapeGroups can only accept instances of Shape');
        }

        return super.unshift(shape);
    }
}
