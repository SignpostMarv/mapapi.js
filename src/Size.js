import { ReadOnlyCoordinates } from './Coordinates.js';
import { ReadOnlyBounds, ConfigureBoundsCoordinatesType } from './Geometry.js';
import { ConstructorArgumentGTE } from './ErrorFormatting.js';

const xmap = new WeakMap();
const ymap = new WeakMap();

export class ReadOnlySize {
    constructor(x = 0, y = 0) {
        const xIsNumber = (x instanceof Number);
        const yIsNumber = (y instanceof Number);
        if (!xIsNumber && 'number' !== typeof x) {
            throw new TypeError('x-axis coordinate must be a number!');
        } else if (!yIsNumber && 'number' !== typeof y) {
            throw new TypeError('y-axis coordinate must be a number!');
        }

        xmap.set(this, xIsNumber ? x.valueOf() : x);
        ymap.set(this, yIsNumber ? y.valueOf() : y);
    }

    get x() {
        return xmap.get(this);
    }

    get y() {
        return ymap.get(this);
    }

    static Fuzzy(...args) {
        if (2 === args.length) {
            return new this(args[0], args[1]);
        } else if (1 === args.length && args[0] instanceof Array && 2 === args[0].length) {
            return new this(args[0][0], args[0][1]);
        } else if (1 === args.length && args[0] instanceof ReadOnlyCoordinates) {
            return args[0];
        }

        throw new TypeError('Unable to resolve instance of ReadOnlySize from arguments!');
    }

    toString() {
        return `<${this.x}, ${this.y}>`;
    }
}

export class ReadOnlyUintSize extends ReadOnlySize {
    constructor(x = 0, y = 0) {
        if (x < 0) {
            throw new RangeError(ConstructorArgumentGTE(
                this, // eslint-disable-line no-this-before-super
                1,
                'zero'
            ));
        } else if (0 !== (x % 1)) {
            throw new RangeError('Argument 1 passed to ReadOnlyUintSize must be an integer!');
        } else if (y < 0) {
            throw new RangeError(ConstructorArgumentGTE(
                this, // eslint-disable-line no-this-before-super
                2,
                'zero'
            ));
        } else if (0 !== (y % 1)) {
            throw new RangeError('Argument 2 passed to ReadOnlyUintSize must be an integer!');
        }

        super(x, y);
    }

    get x() {
        return super.x;
    }

    get y() {
        return super.y;
    }
}

export class ReadOnlyGridSize extends ReadOnlyBounds {
    get x() {
        return this.size.x;
    }

    get y() {
        return this.size.y;
    }
}

ConfigureBoundsCoordinatesType(ReadOnlyGridSize, ReadOnlyCoordinates);

export class Size extends ReadOnlySize {
    get x() {
        return super.x;
    }

    get y() {
        return super.y;
    }

    set x(val) {
        if (!(val instanceof Number) && 'number' !== typeof val) {
            throw new TypeError('x-axis coordinate must be a number!');
        }

        xmap.set(this, Number(val).valueOf());
    }

    set y(val) {
        if (!(val instanceof Number) && 'number' !== typeof val) {
            throw new TypeError('y-axis coordinate must be a number!');
        }

        ymap.set(this, Number(val).valueOf());
    }

    toString() {
        return `${this.constructor.name}[${this.bottomLeft}, ${this.topRight.x}]`;
    }
}
