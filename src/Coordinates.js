const xmap = new WeakMap();
const ymap = new WeakMap();

export class ReadOnlyCoordinates extends EventTarget {
    constructor(x = 0, y = 0) {
        const xIsNumber = (x instanceof Number);
        const yIsNumber = (y instanceof Number);
        if (!xIsNumber && 'number' !== typeof x) {
            throw new TypeError('x-axis coordinate must be a number!');
        } else if (!yIsNumber && 'number' !== typeof y) {
            throw new TypeError('y-axis coordinate must be a number!');
        } else if (Number.isNaN(x)) {
            throw new TypeError('x-axis coordinate must be a valid number!');
        } else if (Number.isNaN(y)) {
            throw new TypeError('y-axis coordinate must be a valid number!');
        }

        super();

        xmap.set(this, xIsNumber ? x.valueOf() : x);
        ymap.set(this, yIsNumber ? y.valueOf() : y);
    }

    get x() {
        return xmap.get(this);
    }

    get y() {
        return ymap.get(this);
    }

    toArray() {
        return [ xmap.get(this), ymap.get(this) ];
    }

    compare(pos) {
        const comparingTo = this.Fuzzy(pos);

        if (this.x === comparingTo.x && this.y === comparingTo.y) {
            return 0;
        } else if (this.y === comparingTo.y) {
            return this.x - comparingTo.x;
        }

        return this.y - comparingTo.y;
    }

    static get Zero() {
        return new this(0, 0);
    }

    static Fuzzy(...args) {
        if (2 === args.length) {
            return new this(args[0], args[1]);
        } else if (1 === args.length && args[0] instanceof Array && 2 === args[0].length) {
            return new this(...args[0]);
        } else if (1 === args.length && args[0] instanceof ReadOnlyCoordinates) {
            return new this(args[0].x, args[0].y);
        }

        throw new TypeError('Unable to resolve instance of ReadOnlyCoordinates from arguments!');
    }

    toString() {
        return `${this.constructor.name}<${this.x}, ${this.y}>`;
    }
}

export class Coordinates extends ReadOnlyCoordinates {
    get x() {
        return super.x;
    }

    get y() {
        return super.y;
    }

    set x(val) {
        if (!(val instanceof Number) && 'number' !== typeof val) {
            throw new TypeError('x-axis coordinate must be a number!');
        } else if (Number.isNaN(val)) {
            throw new TypeError('x-axis coordinate must be a valid number!');
        }

        const was = xmap.get(this);
        const is = Number(val).valueOf();

        xmap.set(this, is);

        if (was !== is) {
            this.dispatchEvent(new CustomEvent(
                'propertyUpdate',
                {
                    detail: {
                        properties: ['x'],
                    },
                }
            ));
        }
    }

    set y(val) {
        const yIsNumber = (val instanceof Number);
        if (!yIsNumber && 'number' !== typeof val) {
            throw new TypeError('y-axis coordinate must be a number!');
        } else if (Number.isNaN(val)) {
            throw new TypeError('y-axis coordinate must be a valid number!');
        }

        const was = ymap.get(this);
        const is = Number(val).valueOf();

        ymap.set(this, is);

        if (was !== is) {
            this.dispatchEvent(new CustomEvent(
                'propertyUpdate',
                {
                    detail: {
                        properties: ['y'],
                    },
                }
            ));
        }
    }

    atomicUpdate(...args) {
        const { x: newX, y: newY } = this.constructor.Fuzzy(...args);
        const { x: wasX, y: wasY } = this;
        const properties = [];

        if (newX !== wasX) {
            properties.push('x');
            xmap.set(this, newX);
        }
        if (newY !== wasY) {
            properties.push('y');
            ymap.set(this, newY);
        }

        if (properties.length) {
            this.dispatchEvent(new CustomEvent(
                'propertyUpdate',
                {
                    detail: {
                        properties,
                    },
                }
            ));
        }
    }
}
