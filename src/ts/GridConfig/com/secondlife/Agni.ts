/**
* @license License and Terms of Use
*
* Copyright (c) 2011, 2019 SignpostMarv
* Copyright (c) 2010 Linden Research, Inc.
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
import { TileSource } from '../../../TileSource.js';
import { GridPoint } from '../../../GridPoint.js';
import { GridConfig, GridConfigApiRegionResult } from '../../../GridConfig.js';

export class SecondLifeTileSource extends TileSource
{
    constructor()
    {
        super({
            copyright: '© 2007 - ' + (new Date).getFullYear() + ' Linden Lab',
            label: 'Land & Objects',
            minimum_zoom: 0,
            maximum_zoom: 7,
            background_colour: '#1d475f',
            mime_type: 'image/jpeg',
            width: 256,
            height: 256,
            opacity: 1,
        });
    }

    obtain_tile_url(position:GridPoint, zoom:number) : Promise<string>
    {
        const sl_zoom = Math.floor(zoom + 1);
        const regions_per_tile_edge = (sl_zoom - 1) ** 2;
        const {x:position_x, y:position_y} = position;

        const x = position_x - (position_x % regions_per_tile_edge);
        const y = position_y - (position_y % regions_per_tile_edge);

        if (x < 0 || y < 0)
        {
            return Promise.resolve('data:text/plain,');
        }

        return Promise.resolve(
            [ // 2 hosts so that we get faster performance on clients with lots of bandwidth but possible browser limits on number of open files
                'http://map.secondlife.com.s3.amazonaws.com',
                'http://map.secondlife.com'
            ][Math.random() >= 5 ? 0 : 1] // Pick a server
            + ['/map', sl_zoom, x, y, 'objects.jpg'].join('-') //  Get image tiles from Amazon S3
        );
    }
}

const pos2region_cache = <{
    [index:string]: Promise<GridConfigApiRegionResult
>}> {};

const pos2region = (
    position:GridPoint
) : Promise<GridConfigApiRegionResult> => {
    const result_position = new GridPoint(
        Math.floor(position.x),
        Math.floor(position.y)
    );

    const cache_key =
        result_position.x.toString(10) +
        '_' +
        result_position.y.toString(10);

    if ( ! (cache_key in pos2region_cache))
    {
        pos2region_cache[cache_key] = new Promise((yup, nope) => {
            const script = document.createElement('script');
            const var_name = 'pos2region_' + cache_key;
            script.src = (
                'https://cap.secondlife.com/cap/0/' +
                'b713fe80-283b-4585-af4d-a3b7d9a32492?' +
                'grid_x=' +
                result_position.x.toString(10) +
                '&grid_y=' +
                result_position.y.toString(10) +
                '&var=' +
                var_name
            );
            script.onload = () => {
                const result = <string|undefined> (
                    <any>window
                )[var_name];

                if (undefined === result) {
                    throw new Error(
                        'slurl.com API failed to load script variable'
                    );
                }

                yup ({
                    south_west: result_position,
                    name: result,
                });

                document.head.removeChild(script);
            };
            script.onerror = (error) => {
                nope(error);
                document.head.removeChild(script);
            };

            document.head.appendChild(script);
        });
    }

    return pos2region_cache[cache_key];
};

let region2pos_counter = 0;
const region2pos_cache = <{[index:string]:Promise<GridConfigApiRegionResult>}> {};

const region2pos = (name:string) : Promise<GridConfigApiRegionResult> => {
    const cache_key = name.toLocaleLowerCase();

    if ( ! (cache_key in region2pos_cache)) {
        region2pos_cache[cache_key] = new Promise((yup, nope) => {
            const script = document.createElement('script');
            const var_name = 'pos2region_' + (++region2pos_counter);
            script.src = (
                'https://cap.secondlife.com/cap/0/' +
                'd661249b-2b5a-4436-966a-3d3b8d7a574f?' +
                'sim_name=' +
                encodeURIComponent(name) +
                '&var=' +
                var_name
            );
            script.onload = async () => {
                const result = <
                    {
                        x:number,
                        y:number
                    }|{
                        error:string
                    }|undefined
                > (
                    <any>window
                )[var_name];

                if (
                    undefined === result ||
                    ! ('x' in result) ||
                    ! ('y' in result)
                ) {
                    if (undefined !== result && 'error' in result) {
                        throw new Error((<{error:string}> result).error);
                    }

                    throw new Error(
                        'slurl.com API failed to load script variable'
                    );
                }

                document.head.removeChild(script);

                const case_sensitive_result = await pos2region(new GridPoint(
                    result.x,
                    result.y
                ));

                yup(case_sensitive_result);
            };
            script.onerror = (error) => {
                nope(error);
                document.head.removeChild(script);
            };

            document.head.appendChild(script);
        });
    }

    return region2pos_cache[cache_key];
};

export class SecondLifeGridConfig extends GridConfig
{
    constructor()
    {
        super({
            namespace: 'com.secondlife.agni',
            vendor: 'Linden Lab',
            name: 'Second Life',
            description: 'Linden Lab\'s Agni grid',
            label: 'Agni',
            grid_width:1048576,
            grid_height:1048576,
            tile_sources: [
                new SecondLifeTileSource(),
            ],
            maximum_zoom: 7,
            pos2region,
            region2pos,
        });
    }
}
