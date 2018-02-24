import { ReadOnlySize } from './Size.js';
import { ReadOnlyCoordinates, Coordinates } from './Coordinates.js';

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

    get size() {
        const { x: blX, y: blY } = this.bottomLeft;
        const { y: trX, y: trY } = this.topRight;
        return new ReadOnlySize(
            trX - blX,
            trY - blY
        );
    }

    static get Zero() {
        return new this([0, 0], [0, 0]);
    }

    /**
    * @param ReadOnlyCoordinates... arguments
    */
    containsCoordinates(...args) {
        if (args.length < 1) {
            throw new TypeError('Cannot call ReadOnlyBounds.containsCoordinates with zero arguments!');
        }

        return args.reduce(
            (out, pos) => {
                if (out) {
                    if (!(pos instanceof ReadOnlyCoordinates)) {
                        throw new TypeError('Arguments passed to ReadOnlyBounds.containsCoordinates must be insances of ReadOnlyCoordinates!');
                    }

                    if (
                        !(
                            pos.x >= this.bottomLeft.x &&
                            pos.x <= this.topRight.x &&
                            pos.y >= this.bottomLeft.y &&
                            pos.y <= this.topRight.y
                        )
                    ) {
                        return false;
                    }
                }

                return true;
            },
            true
        );
    }

    toString() {
        return `${this.constructor.name}[${this.bottomLeft}, ${this.topRight}]`;
    }
}

export function ConfigureBoundsCoordinatesType(boundsType, coordsType) {
    if (boundsType !== ReadOnlyBounds && !(boundsType.prototype instanceof ReadOnlyBounds)) {
        throw new TypeError('Argument 1 passed to ConfigureBoundsCoordinatesType must be an implementation of ReadOnlyBounds!');
    } else if (
        coordsType !== ReadOnlyCoordinates &&
        !(coordsType.prototype instanceof ReadOnlyCoordinates)
    ) {
        throw new TypeError('Argument 2 passed to ConfigureBoundsCoordinatesType must be an implementation of ReadOnlyCoordinates!');
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
            throw new TypeError('Argument 1 passed to ReadOnlyGeometry must be an instance of ReadOnlyCoordinates!');
        } else if (!(bounds instanceof ReadOnlyBounds)) {
            throw new TypeError('Argument 2 passed to ReadOnlyGeometry must be an instance of ReadOnlyBounds');
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
            throw new TypeError('Argument 3 passed to ReadOnlyRectangle must be undefined or an instance of ReadOnlyCoordinates!');
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