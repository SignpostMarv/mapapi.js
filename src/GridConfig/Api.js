/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

export class Api {
    /**
    * @param ../ReadOnlyCoordinates pos
    *
    * @return LocationWithKnownCoordinates
    */
    async CoordinatesToLocation(pos) {
        throw new TypeError('CoordinatesToLocation API method has not been defined!');
    }

    /**
    * @param string locationName
    *
    * @return {LocationWithKnownCoordinates} from '../Location.js';
    */
    async LocationNameToCoordinates(locationName) {
        throw new TypeError('LocationNameToCoordinates API method has not been defined!');
    }

    LocationInfoWindowFactory(renderer) {
        throw new TypeError('LocationInfoWindowFactory API method has not been defined!');
    }
}
