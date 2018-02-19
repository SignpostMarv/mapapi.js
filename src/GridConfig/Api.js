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
    async LocationNameToCoordiantes(locationName) {
        throw new TypeError('LocationNameToCoordiantes API method has not been defined!');
    }
}
