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
import Size from './Size.js';
import TileSource from './TileSource.js';
import { GridPoint, GridPointError } from './GridPoint.js';
import { PolyRegion } from './PolyRegion.js';

export interface GridConfigApiRegionResult
{
    readonly south_west:GridPoint;
    readonly name:string;
}

export type pos2region_method = (
    position:GridPoint
) => Promise<GridConfigApiRegionResult>;

export type region2pos_method = (
    name:string
) => Promise<GridConfigApiRegionResult>;

export interface GridConfigApi
{
    pos2region: pos2region_method;
    region2pos: region2pos_method;
}

export interface GridConfigApiLocalResult extends GridConfigApiRegionResult
{
    readonly local_position:GridPoint;
}

export interface GridConfigLocalApi extends GridConfigApi
{
    pos2internal: (
        global_position:GridPoint
    ) => Promise<GridConfigApiLocalResult>;
    internal2pos: (
        region_name:string,
        local_position:GridPoint
    ) => Promise<GridConfigApiLocalResult>;
}

export interface GridConfigOptions
{
    readonly namespace:string;
    readonly vendor:string;
    readonly name:string;
    readonly description?:string;
    readonly label:string;
    readonly maximum_zoom:number;
    readonly size?:Size;
    readonly grid_width?:number;
    readonly grid_height?:number;
    readonly tile_sources?:Array<TileSource>;
    readonly pos2region?:(
        position:GridPoint
    ) => Promise<GridConfigApiRegionResult>;
    readonly region2pos?:(
        name:string
    ) => Promise<GridConfigApiRegionResult>;
    readonly polyregion?:PolyRegion;
}

export class GridConfig implements GridConfigApi
{
    readonly namespace:string;
    readonly vendor:string;
    readonly name:string;
    readonly description:string;
    readonly label:string;
    readonly maximum_zoom:number;
    readonly size:Size;
    readonly tile_sources:Array<TileSource>;
    readonly API:GridConfigApi;

    constructor(options:GridConfigOptions) {
        this.namespace = options.namespace;
        this.vendor = options.vendor;
        this.name = options.name;
        this.description = options.description || 'No description specified';
        this.label = options.label;
        this.maximum_zoom = options.maximum_zoom;
        this.size = (
            options.size ||
            new Size(
                options.grid_width || 1048576,
                options.grid_height || 1048576
            )
        );
        this.tile_sources = options.tile_sources || [];
        this.API = <GridConfigApi> {
            pos2region: (_position:GridPoint) => {
                throw new Error('Not implemented!');
            },
            region2pos: (_name:string) => {
                throw new Error('Not implemented!');
            },
        };

        if ('pos2region' in options) {
            this.API.pos2region = <pos2region_method> options.pos2region;
        }

        if ('region2pos' in options) {
            this.API.region2pos = <region2pos_method> options.region2pos;
        }

        if (
            ! ('pos2region' in options) &&
            ! ('region2pos' in options) &&
            'polyregion' in options
        ) {
            this.API = <GridConfigLocalApi> options.polyregion;
        }
    }

    async pos2region(position:GridPoint) : Promise<GridConfigApiRegionResult>
    {
        if (
            ! ('pos2region' in this.API) ||
            undefined === this.API.pos2region
        ) {
            throw new GridPointError(
                'This grid config has no pos2region API',
                position
            );
        }

        return await this.API.pos2region(position);
    }

    async region2pos(name:string) : Promise<GridConfigApiRegionResult>
    {
        if (
            ! ('region2pos' in this.API) ||
            undefined === this.API.region2pos
        ) {
            throw new Region2PosError(
                'This grid config has no region2pos API',
                name
            );
        }

        return await this.API.region2pos(name);
    }
}

export default GridConfig;

export class Internal2PosApiError extends GridPointError
{
    readonly region:string;

    constructor(message:string, position:GridPoint, region_name:string)
    {
        super(message, position);

        this.region = region_name;
    }
}

export class Region2PosError extends Error
{
    readonly region_name:string;

    constructor(message:string, region_name:string)
    {
        super(message);

        this.region_name = region_name;
    }
}
