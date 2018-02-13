export class Api {
    /**
    * @param ../ReadOnlyCoordinates pos
    *
    * @return LocationWithKnownCoordinates
    */
    async CoordinatesToLocation (pos) {
        console.log(pos); // eslint-disable-line no-console
        throw new TypeError(
            'CoordinatesToLocation API method has not been defined!'
        );
    }

    /**
    * @param string locationName
    *
    * @return {LocationWithKnownCoordinates} from '../Location.js';
    */
    async LocationNameToCoordiantes (locationName) {
        console.log(locationName); // eslint-disable-line no-console
        throw new TypeError(
            'LocationNameToCoordiantes API method has not been defined!'
        );
    }
}
