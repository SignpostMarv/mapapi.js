import { TileSource } from './TileSource.js';
import { Api } from './GridConfig/Api.js';

const tilesourcemap = new WeakMap();
const gridconfigapimap = new WeakMap();

export class GridConfig {
    /**
    * @param TileSource[] tileSources
    * @param Api api
    */
    constructor(tileSources, api) {
        if (!(tileSources instanceof Array)) {
            throw new TypeError('Argument 1 passed to GridConfig must be an array!');
        } else if (tileSources.length < 1) {
            throw new TypeError('At least one tile source must be passed to GridConfig!');
        }
        tileSources.forEach((source) => {
            if (!(source instanceof TileSource)) {
                throw new TypeError('Argument 1 passed to GridConfig must be an array of TileSource objects!');
            }
        });

        if (!(api instanceof Api)) {
            throw new TypeError('Argument 2 passed to GridConfig must be an instance of GridConfig\\Api!');
        }

        tilesourcemap.set(this, tileSources);
        gridconfigapimap.set(this, api);
    }

    /**
    * @return string
    */
    get namespace() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Namespace is undefined!');
    }

    /**
    * @return string
    */
    get vendor() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Vendor is undefined!');
    }

    /**
    * @return string
    */
    get name() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Name is undefined!');
    }

    /**
    * @return string
    */
    get description() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Description is undefined!');
    }

    /**
    * @return string
    */
    get label() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Label is undefined!');
    }

    /**
    * @return int
    */
    get minZoom() { // eslint-disable-line class-methods-use-this
        return 0;
    }

    /**
    * @return int
    */
    get maxZoom() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Maximum Zoom level is undefined!');
    }

    /**
    * @return {ReadOnlySize} from './Size.js';
    */
    get size() { // eslint-disable-line class-methods-use-this
        throw new TypeError('Grid size is undefined!');
    }

    /**
    * @return TileSource[]
    */
    get tileSources() {
        return tilesourcemap.get(this);
    }

    /**
    * @return Api
    */
    get api() {
        return gridconfigapimap.get(this);
    }
}
