/**
* License and Terms of Use
*
* Copyright (c) 2011, 2019 SignpostMarv
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
import { Size } from './Size.js';
import { GridPoint } from './GridPoint.js';

export interface TileSourceOptions
{
    readonly copyright:string;
    readonly label:string;
    readonly minimum_zoom:number;
    readonly maximum_zoom:number;
    readonly background_colour:string;
    readonly width:number;
    readonly height:number;
    readonly mime_type:string;
    readonly opacity:number;
}

export interface TileRequestResult
{
    readonly position:GridPoint;
    readonly zoom:number;
    readonly result:HTMLImageElement|HTMLCanvasElement;
}

export abstract class TileSource
{
    readonly options:TileSourceOptions;
    readonly grid_image_cache:{
        [index:string]: { // zoom
            [index:string]: { // x
                [index:string]: // y
                    Promise<TileRequestResult> // cached image
            }
        }
    } = {};

    constructor(options:TileSourceOptions = {
        copyright: '',
        label: '',
        minimum_zoom: 0,
        maximum_zoom: 0,
        background_colour: '#000000',
        width: 256,
        height: 256,
        mime_type: 'image/jpeg',
        opacity: 1,
    }) {
        this.options = options;
    }

    get copyright() : string
    {
        return this.options.copyright;
    }

    get label() : string
    {
        return this.options.label;
    }

    get minimum_zoom() : number
    {
        return Math.max(0, this.options.minimum_zoom);
    }

    get maximum_zoom() : number
    {
        return Math.max(
            this.options.minimum_zoom + 1,
            this.options.maximum_zoom
        );
    }

    get background_colour() : string
    {
        return this.options.background_colour;
    }

    get size() : Size
    {
        return new Size(this.options.width, this.options.height);
    }

    get mime_type() : string
    {
        return this.options.mime_type;
    }

    get opacity() : number
    {
        return Math.max(0, Math.min(1, this.options.opacity));
    }

    abstract obtain_tile_url (_position:GridPoint, _zoom:number) : Promise<string>;

    request_tile (position:GridPoint, zoom:number) : Promise<TileRequestResult>
    {
        const zoom_floored = Math.floor(
            Math.max(
                this.minimum_zoom,
                Math.min(this.maximum_zoom, zoom)
            )
        );

        const zoom_bitshifted = 1 << zoom_floored;

        const x = position.x - (position.x % zoom_bitshifted);
        const y = position.y - (position.y % zoom_bitshifted);

        const zoom_index = zoom_floored.toString(10);
        const x_index = x.toString(10);
        const y_index = y.toString(10);

        if ( ! (zoom_index in this.grid_image_cache))
        {
            this.grid_image_cache[zoom_index] = {};
        }

        if ( ! (x_index in this.grid_image_cache[zoom_index])) {
            this.grid_image_cache[zoom_index][x_index] = {};
        }

        if ( ! (y_index in this.grid_image_cache[zoom_index][x_index])) {

            this.grid_image_cache[
                zoom_index
            ][
                x_index
            ][
                y_index
            ] = new Promise(async (yup) => {
                const image = new Image();
                const result_position = new GridPoint(x, y);

                image.decoding = 'async';

                const yield_blank = () => {
                    const image = document.createElement('canvas');
                    const ctx = <CanvasRenderingContext2D> image.getContext(
                        '2d'
                    );
                    image.width = this.size.width;
                    image.height = this.size.height;
                    ctx.fillStyle = this.background_colour;
                    ctx.fillRect(0, 0, image.width, image.height);

                    yup({
                        position: result_position,
                        zoom: zoom_floored,
                        result: image,
                    });
                };

                try {
                    image.src = await this.obtain_tile_url(
                        result_position,
                        zoom_floored
                    );

                    await image.decode();

                    yup({
                        position: result_position,
                        zoom: zoom_floored,
                        result: image,
                    });
                } catch (error) {
                    console.error(error);

                    yield_blank();
                }
            });
        }

        return this.grid_image_cache[zoom_index][x_index][y_index];
    }
}

export default TileSource;
