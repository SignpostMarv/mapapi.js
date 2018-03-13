const rmap = new WeakMap();
const gmap = new WeakMap();
const bmap = new WeakMap();
const amap = new WeakMap();

const regexRgb = /^#?([0-9a-f]{1,2})([0-9a-f]{1,2})([0-9a-f]{1,2})$/;

export class Color {
    /**
    * @param int r
    * @param int g
    * @param int b
    */
    constructor(r, g, b) {
        const rnum = (r instanceof Number);
        const gnum = (g instanceof Number);
        const bnum = (b instanceof Number);

        if (!rnum && 'number' !== typeof r) {
            throw new TypeError('Argument 1 passed to Color must be a number!');
        } else if (r < 0 || r > 255) {
            throw new TypeError('Argument 1 passed to Color must be in the range 0-255!');
        } else if (0 !== r % 1) {
            throw new TypeError('Argument 1 passed to Color must be an integer!');
        }

        if (!gnum && 'number' !== typeof g) {
            throw new TypeError('Argument 2 passed to Color must be a number!');
        } else if (g < 0 || g > 255) {
            throw new TypeError('Argument 2 passed to Color must be in the range 0-255!');
        } else if (0 !== g % 1) {
            throw new TypeError('Argument 2 passed to Color must be an integer!');
        }

        if (!bnum && 'number' !== typeof b) {
            throw new TypeError('Argument 3 passed to Color must be a number!');
        } else if (b < 0 || b > 255) {
            throw new TypeError('Argument 3 passed to Color must be in the range 0-255!');
        } else if (0 !== r % 1) {
            throw new TypeError('Argument 1 passed to Color must be an integer!');
        }

        rmap.set(this, rnum ? r.valueOf() : r);
        gmap.set(this, gnum ? g.valueOf() : g);
        bmap.set(this, bnum ? b.valueOf() : b);
    }

    static Fuzzy(...args) {
        if (3 === args.length) {
            return new Color(args[0], args[1], args[2]);
        } else if (1 === args.length) {
            const isString = args[0] instanceof String;

            if (isString || 'string' === typeof args[0]) {
                const color = regexRgb.exec(isString ? args[0].valueOf() : args[0]);

                if (color) {
                    return new Color(
                        parseInt(color[1], 16),
                        parseInt(color[2], 16),
                        parseInt(color[3], 16)
                    );
                }

                throw new TypeError('Color.Fuzzy only accepts hexadecimal strings!');
            }

            throw new TypeError('Color.Fuzzy only accepts single arguments as strings!');
        }

        throw new TypeError('Color.Fuzzy only accepts 1 or 3 arguments');
    }

    get r() {
        return rmap.get(this);
    }

    get g() {
        return gmap.get(this);
    }

    get b() {
        return bmap.get(this);
    }

    toString() {
        const tohex = val => val.toString(16).padStart(2, '0');

        return `#${tohex(this.r)}${tohex(this.g)}${tohex(this.b)}`;
    }
}

export class AlphaColor extends Color {
    constructor(r, g, b, a = 1) {
        super(r, g, b, a);
        const alpha = Number(a);
        if ('number' !== typeof alpha) {
            throw new TypeError('Argument 4 passed to AlphaColor must be a number!');
        } else if (alpha < 0 || alpha > 1) {
            throw new RangeError('Argument 4 passed to AlphaColor must be a number from 0 to 1');
        }

        amap.set(this, alpha);
    }

    get a() {
        return amap.get(this);
    }

    static Fuzzy(...args) {
        if (3 === args.length || 4 === args.length) {
            return new AlphaColor(...args);
        }

        return super.Fuzzy(...args);
    }

    toString() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
    }
}
