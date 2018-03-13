import {
    ConstructorArgumentExpectedClass,
    ClassMethodArgumentExpectedType,
    ConstructorArgumentGT,
    ClassPropertyArgumentGT,
    ClassMethodPropertytExpectedType
} from './ErrorFormatting.js';
import { ReadOnlyCoordinates } from './Coordinates.js';
import { Color, AlphaColor } from './Color.js';
import { ReadOnlyBounds } from './Geometry.js';

const fillStyleMap = new WeakMap();
const strokeStyleMap = new WeakMap();
const lineWidthMap = new WeakMap();

const updateFillStyle = (obj, arg) => {
    const was = fillStyleMap.get(obj);

    fillStyleMap.set(obj, AlphaColor.Fuzzy(...(Array.isArray(arg) ? arg : [arg])));

    const is = fillStyleMap.get(obj);

    return (undefined === was || (was.r != is.r || was.r !== is.r || was.b !== is.b || was.a !== is.a));
};
const updateStrokeStyle = (obj, arg) => {
    const was = fillStyleMap.get(obj);

    strokeStyleMap.set(obj, AlphaColor.Fuzzy(...(Array.isArray(arg) ? arg : [arg])));

    const is = fillStyleMap.get(obj);

    return (undefined === was || (was.r != is.r || was.r !== is.r || was.b !== is.b || was.a !== is.a));
};
const updateLineWidth = (obj, arg, name, argNum) => {
    const was = lineWidthMap.get(obj);
    const width = Number(arg);

    if ('number' !== typeof width || ! Number.isFinite(width)) {
        throw new TypeError(ClassMethodPropertytExpectedType(obj, name, argNum, 'finite number'));
    } else if (width < 0) {
        throw new RangeError(ConstructorArgumentGTE(obj, argNum, 0));
    }

    lineWidthMap.set(obj, arg);

    return was !== width;
};

const dispatchPropertyUpdate = (obj, properties) => {
    return obj.dispatchEvent(new CustomEvent('propertyUpdate', { detail: { properties } }));
};

export class ShapeStyle extends EventTarget {
    constructor(fillStyle, strokeStyle, strokeWidth) {
        const width = Number(strokeWidth);
        if ( ! (fillStyle instanceof Color)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, Color));
        } else if ( ! (strokeStyle instanceof Color)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 2, Color));
        } else if ('number' !== typeof width || ! Number.isFinite(width)) {
            throw new TypeError(ClassMethodArgumentExpectedType(this, this.constructor, 3, 'finite number'));
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
        if (args.length === 3) {
            return new this(...args);
        } else if (args instanceof ShapeStyle) {
            return new this(
                AlphaColor.Fuzzy(args.fillStyle.r, args.fillStyle.g, args.fillStyle.b, args.fillStyle.a),
                AlphaColor.Fuzzy(args.strokeStyle.r, args.strokeStyle.g, args.strokeStyle.b, args.strokeStyle.a),
                args.lineWidth
            );
        }

        throw new TypeError('Unable to determine appropriate arguments for ShapeStyle');
    }

    atomicUpdate(fillStyle, strokeStyle, strokeWidth) {
        const properties = [];

        if (updateFillStyle(this, arg)) {
            properties.push('fillStyle');
        }

        if (updateStrokeStyle(this, arg)) {
            properties.push('strokeStyle');
        }

        if (updateLineWidth(this, value, 'lineWidth', 1)) {
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

export class Shape extends EventTarget
{
    constructor(style, clickable, title, ...coords) {
        if (coords.length < 0) {
            throw new TypeError('At least one coordinate must be specified!');
        }

        coordsMap.set(this, coords.map(ReadOnlyCoordinates.Fuzzy));

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
        let blX = 0;
        let blY = 0;
        let trX = 0;
        let trY = 0;

        this.Coordinates.forEach((coord) => {
            blX = Math.min(coord.x, blX);
            blY = Math.min(coord.y, blY);
            trX = Math.max(coord.x, trX);
            trY = Math.max(coord.y, trY);
        });

        return ReadOnlyBounds.Fuzzy([blX, blY], [trX, trY]);
    }
}

export class Line extends Shape {
    constructor(style, ...coords) {
        if (coords.length < 2) {
            throw new TypeError('At least two coordinates must be specified!');
        }

        super(style, ...coords);
    }

    get length() {
        const coords = this.Coordinates;
        const { length } = coords;
        let distance = 0;
        let against = coords[0];

        for (let i=1; i< length; i += 1) {
            let current = coords[i];

            distance += Math.sqrt(Math.pow(against.x - current.x, 2) + Math.pow(against.y - current.y, 2));

            against = current;
        }

        return distance;
    }
}

export class Circle extends Line {
    get radius() {
        const [center, edge] = this.Coordinates;

        return Math.sqrt(Math.pow(center.x - edge.x, 2) + Math.pow(center.y - edge.y, 2));
    }

    get length() {
        return this.radius;
    }

    get bounds() {
        const {x, y} = this.Coordinates[0];
        const { radius } = this;

        return ReadOnlyBounds.Fuzzy([[x - radius, y - radius], [x + radius, y + radius]]);
    }
}

export class Rectangle extends Line {
    constructor(style, ...coords) {
        if (coords.length < 2) {
            throw new TypeError('At least two coordinates must be specified!');
        }

        super(style, ...coords);
    }
}

export class Polygon extends Line {
    constructor(style, ...coords) {
        if (coords.length < 3) {
            throw new TypeError('At least three coordinates must be specified!');
        }

        super(style, ...coords);
    }
}

const shapeMap = new WeakMap();

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
        return super.concat(...groups.map((e) => e.filter(shapeFilter)));
    }

    push(...shapes) {
        return super.push(shapes.filter(shapeFilter));
    }

    fill (...args) {
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
        super(groups.filter(shapeGroupFilter));
    }

    static of (...groups) {
        return new this(groups.filter(shapeGroupFilter));
    }

    concat(...groups) {
        return super.concat(...groups.map((e) => e.filter(shapeGroupFilter)));
    }

    push(...shapes) {
        return super.push(shapes.filter(shapeGroupFilter));
    }

    fill (...args) {
        throw new TypeError('ShapeGroups cannot be filled!');
    }

    unshift(shape) {
        if (!(shape instanceof ShapeGroup)) {
            throw new TypeError('ShapeGroups can only accept instances of Shape');
        }

        return super.unshift(shape);
    }
}
