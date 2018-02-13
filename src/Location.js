import {ReadOnlyCoordinates} from './Coordinates.js';
import {ReadOnlyGeometry} from './Geometry.js';

const namemap = new WeakMap();
const coordinatesmap = new WeakMap();
const geommap = new WeakMap();

export class Location {
    constructor(name) {
        if (name instanceof String) {
            namemap.set(this, name.toString());
        } else if('string' !== typeof(name)) {
            throw new TypeError(
                'Argument 1 passed to Location must be a string!'
            );
        }

        namemap.set(this, name);
    }

    get name() {
        return namemap.get(this);
    }
}

export class LocationWithKnownCoordinates extends Location {
    /**
    * @param ReadOnlyCoordinates pos
    */
    constructor(name, pos) {
        if (! (pos instanceof ReadOnlyCoordinates)) {
            throw new TypeError(
                'Argument 2 passed to LocationWithKnownCoordinates must be an instance of ReadOnlyCoordinates!'
            );
        }

        super(name);
        coordinatesmap.set(this, pos);
    }

    get coordinates() {
        return coordinatesmap.get(this);
    }
}

export class LocationWithKnownGeometry extends LocationWithKnownCoordinates {
    /**
    * @param ReadOnlyGeometry geom
    */
    constructor(name, pos, geom) {
        if ( ! (geom instanceof ReadOnlyGeometry)) {
            throw new TypeError(
                'Argument 3 passed to LocationWithKnownGeometry must be an instance of ReadOnlyGeometry!'
            );
        }

        super(name, pos);

        geommap.set(this, geom);
    }

    get geometry() {
        return geommap.get(this);
    }
}
