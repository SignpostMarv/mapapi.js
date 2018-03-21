import { ReadOnlySize } from './Size.js';
import { ReadOnlyCoordinates, Coordinates } from './Coordinates.js';
import {
    ConstructorArgumentExpectedClass,
    ClassMethodArgumentExpectedType,
    ClassMethodArgumentExpectedClass,
} from './ErrorFormatting.js';

const bottomleftmap = new WeakMap();
const toprightmap = new WeakMap();
const boundsmap = new WeakMap();

const boundsCoordsType = {};

const updateBounds = (obj, bottomLeft, topRight) => {
    const type = obj.constructor.name;
    if (!Object.keys(boundsCoordsType).includes(type)) {
        throw new TypeError(`Coordinates type not set for${type}`);
    }

    const coords = boundsCoordsType[type];

    const { x: blx, y: bly } = coords.Fuzzy(bottomLeft);
    const { x: trx, y: trY } = coords.Fuzzy(topRight);

    if (undefined === blx) {
        throw new TypeError('no x-coordinate!');
    }

    bottomleftmap.set(obj, coords.Fuzzy(
        Math.min(blx, trx),
        Math.min(bly, trY)
    ));
    toprightmap.set(obj, coords.Fuzzy(
        Math.max(blx, trx),
        Math.max(bly, trY)
    ));
};

export class ReadOnlyBounds extends EventTarget {
    constructor(bottomLeft, topRight) {
        super();

        updateBounds(this, bottomLeft, topRight);
    }

    get bottomLeft() {
        return bottomleftmap.get(this);
    }

    get topRight() {
        return toprightmap.get(this);
    }

    toArray() {
        const [blX, blY] = bottomleftmap.get(this).toArray();
        const [trX, trY] = toprightmap.get(this).toArray();

        return [blX, blY, trX, trY];
    }

    get size() {
        const [blX, blY, trX, trY] = this.toArray();
        return new ReadOnlySize(
            trX - blX,
            trY - blY
        );
    }

    static get Zero() {
        return new this([0, 0], [0, 0]);
    }

    /**
    * @param ReadOnlyCoordinates ...args
    */
    containsCoordinates(...args) {
        if (args.length < 1) {
            return false;
        }

        const { bottomLeft, topRight } = this;
        const { x: blX, y: blY } = bottomLeft;
        const { x: trX, y: trY } = topRight;


        return args.some(
            (pos, i) => {
                    if (!(pos instanceof ReadOnlyCoordinates)) {
                        throw new TypeError(ClassMethodArgumentExpectedClass(
                            this,
                            this.containsCoordinates,
                            i,
                            ReadOnlyCoordinates
                        ));
                    }

                const { x, y } = pos;

                return (
                    x >= blX &&
                    x <= trX &&
                    y >= blY &&
                    y <= trY
                );
            },
            true
        );
    }

    static Fuzzy(...args) {
        if (4 === args.length) {
            return new this([args[0], args[1]], [args[2], args[3]]);
        }

        throw new TypeError('Unable to resolve instance of ReadOnlyBounds from arguments!');
    }

    toString() {
        return `${this.constructor.name}[${this.bottomLeft}, ${this.topRight}]`;
    }
}

export function ConfigureBoundsCoordinatesType(boundsType, coordsType) {
    if (boundsType !== ReadOnlyBounds && !(boundsType.prototype instanceof ReadOnlyBounds)) {
        throw new TypeError(ClassMethodArgumentExpectedType(
            this,
            this.ConfigureBoundsCoordinatesType,
            2,
            `${ReadOnlyBounds.constuctor.name} implementation`
        ));
    } else if (
        coordsType !== ReadOnlyCoordinates &&
        !(coordsType.prototype instanceof ReadOnlyCoordinates)
    ) {
        throw new TypeError(ClassMethodArgumentExpectedType(
            this,
            this.ConfigureBoundsCoordinatesType,
            2,
            `${ReadOnlyCoordinates.constuctor.name} implementation`
        ));
    }

    boundsCoordsType[boundsType.name] = coordsType;
}

export class Bounds extends ReadOnlyBounds {
    get bottomLeft() {
        return super.bottomLeft;
    }

    get topRight() {
        return super.topRight;
    }

    set bottomLeft(val) {
        updateBounds(this, val, this.topRight);
    }

    set topRight(val) {
        updateBounds(this, this.bottomLeft, val);
    }
}

ConfigureBoundsCoordinatesType(ReadOnlyBounds, ReadOnlyCoordinates);
ConfigureBoundsCoordinatesType(Bounds, Coordinates);

export class ReadOnlyGeometry {
    constructor(pos, bounds) {
        if (!(pos instanceof ReadOnlyCoordinates)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 1, ReadOnlyCoordinates));
        } else if (!(bounds instanceof ReadOnlyBounds)) {
            throw new TypeError(ConstructorArgumentExpectedClass(this, 2, ReadOnlyBounds));
        }

        bottomleftmap.set(this, pos);
        boundsmap.set(this, bounds);
    }

    get coordinates() {
        return bottomleftmap.get(this);
    }

    get bounds() {
        return boundsmap.get(this);
    }

    get size() {
        return this.bounds.size;
    }
}

export class ReadOnlyRectangle extends ReadOnlyGeometry {
    constructor(width, height, pos) {
        if ('undefined' !== typeof pos && !(pos instanceof ReadOnlyCoordinates)) {
            throw new TypeError(ConstructorArgumentExpectedClass(
                this, // eslint-disable-line no-this-before-super
                3,
                ReadOnlyCoordinates
            ));
        }

        const usepos = ('undefined' === typeof pos) ? ReadOnlyCoordinates.Zero : pos;

        const bounds = new ReadOnlyBounds(
            usepos,
            new ReadOnlyCoordinates(
                usepos.x + width,
                usepos.y + height
            )
        );

        super(usepos, bounds);
    }

    get width() {
        return this.bound.size.x;
    }

    get height() {
        return this.bounds.size.y;
    }
}
