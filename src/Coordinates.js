const xmap = new WeakMap();
const ymap = new WeakMap();
const haltautodispatch = new WeakMap();

export class ReadOnlyCoordinates extends EventTarget {
    constructor (x = 0, y = 0) {
        const xIsNumber = (x instanceof Number);
        const yIsNumber = (y instanceof Number);
        if ( ! xIsNumber && 'number' !== typeof(x)) {
            throw new TypeError(
                'x-axis coordinate must be a number!'
            );
        } else if ( ! yIsNumber && 'number' !== typeof(y)) {
            throw new TypeError(
                'y-axis coordinate must be a number!'
            );
        } else if (isNaN(x)) {
            throw new TypeError(
                'x-axis coordinate must be a valid number!'
            );
        } else if (isNaN(y)) {
            throw new TypeError(
                'y-axis coordinate must be a valid number!'
            );
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

    static Fuzzy() {
        if (2 === arguments.length) {
            return new this(arguments[0], arguments[1]);
        } else if (1 === arguments.length && arguments[0] instanceof Array && 2 === arguments[0].length) {
            const out = new this(...arguments[0]);

            return out;
        } else if (1 === arguments.length && arguments[0] instanceof ReadOnlyCoordinates) {
            return new this(arguments[0].x, arguments[0].y);
        }

        throw new TypeError(
            'Unable to resolve instance of ReadOnlyCoordinates from arguments!'
        );
    }

    toString() {
        return `${this.constructor.name}<${this.x}, ${this.y}>`;
    }

    get halt_auto_dispatch()
    {
        return !! haltautodispatch.get(this);
    }

    set halt_auto_dispatch(val)
    {
        return haltautodispatch.set(this, !!val);
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
        if ( ! (val instanceof Number) && 'number' !== typeof(val)) {
            throw new TypeError(
                'x-axis coordinate must be a number!'
            );
        } else if (isNaN(val)) {
            throw new TypeError(
                'x-axis coordinate must be a valid number!'
            );
        }

        const was = xmap.get(this);
        const is = (new Number(val)).valueOf();

        xmap.set(this, is);

        if (was !== is && ! this.halt_auto_dispatch) {
            this.dispatchEvent(
                new CustomEvent('propertyUpdate', {
                    detail: {
                        property: 'x',
                        was,
                        is
                    }
                })
            );
        }
    }

    set y(val) {
        const yIsNumber = (val instanceof Number);
        if ( ! yIsNumber && 'number' !== typeof(val)) {
            throw new TypeError(
                'y-axis coordinate must be a number!'
            );
        } else if (isNaN(val)) {
            throw new TypeError(
                'y-axis coordinate must be a valid number!'
            );
        }

        const was = ymap.get(this);
        const is = (new Number(val)).valueOf();

        ymap.set(this, is);

        if (was !== is && ! this.halt_auto_dispatch) {
            this.dispatchEvent(
                new CustomEvent('propertyUpdate', {
                    detail: {
                        property: 'y',
                        was,
                        is
                    }
                })
            );
        }
    }
}
