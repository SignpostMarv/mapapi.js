/**
* License and Terms of Use
*
* Copyright (c) 2013, 2019 SignpostMarv
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
import Shape from './Shape.js';
import GridPoint, { GridPointError } from './GridPoint.js';
import Bounds from './Bounds.js';
import {
    GridConfigApiRegionResult,
    GridConfigLocalApi,
    GridConfigApiLocalResult,
    Internal2PosApiError
} from './GridConfig.js';

declare type Regions = {[index:string]: Array<Shape>};

export class RegionNameError extends Error
{
    readonly region_name:string;

    constructor(message:string, region_name:string)
    {
        super(message);
        this.region_name = region_name;
    }
}

export class PolyRegion implements GridConfigLocalApi
{
    readonly regions:Regions;
    readonly lcase:{[index:string]:string};
    readonly bounds:{[index:string]:Bounds};

    constructor(specfication:Regions)
    {
        const lcase = {};
        const bounds = <{[index:string]:Bounds}> {};

        this.regions = Object.seal(specfication);

        Object.keys(specfication).forEach((region:string) => {
            this.lcase[region.toLocaleLowerCase()] = region;

            type bound_options = {
                sw_x:number,
                sw_y:number,
                ne_x:number,
                ne_y:number,
            }|{
                sw_x:undefined,
                sw_y:undefined,
                ne_x:undefined,
                ne_y:undefined,
            };

            const {sw_x, sw_y, ne_x, ne_y} = specfication[region].reduce(
                (
                    maybe_bounds:bound_options,
                    shape:Shape
                ) => {
                    if (
                        'number' === typeof(maybe_bounds.sw_x) &&
                        'number' === typeof(maybe_bounds.sw_y) &&
                        'number' === typeof(maybe_bounds.ne_x) &&
                        'number' === typeof(maybe_bounds.ne_y)
                    ) {
                        maybe_bounds.sw_x = Math.min(
                            maybe_bounds.sw_x,
                            shape.bounds.sw.x
                        );
                        maybe_bounds.sw_y = Math.min(
                            maybe_bounds.sw_y,
                            shape.bounds.sw.y
                        );
                        maybe_bounds.ne_x = Math.max(
                            maybe_bounds.ne_x,
                            shape.bounds.ne.x
                        );
                        maybe_bounds.ne_y = Math.max(
                            maybe_bounds.ne_y,
                            shape.bounds.ne.y
                        );
                    } else {
                        maybe_bounds.sw_x = shape.bounds.sw.x;
                        maybe_bounds.sw_y = shape.bounds.sw.y;
                        maybe_bounds.ne_x = shape.bounds.ne.x;
                        maybe_bounds.ne_y = shape.bounds.ne.y;
                    }

                    return maybe_bounds;
                },
                {
                    sw_x:undefined,
                    sw_y:undefined,
                    ne_x:undefined,
                    ne_y:undefined,
                }
            );

            if (
                'number' === typeof(sw_x) &&
                'number' === typeof(sw_y) &&
                'number' === typeof(ne_x) &&
                'number' === typeof(ne_y)
            ) {
                bounds[region] = Object.seal(new Bounds(
                    new GridPoint(sw_x, sw_y),
                    new GridPoint(ne_x, ne_y)
                ));
            }
        });

        this.lcase = lcase;
        this.bounds = Object.seal(bounds);

        Object.seal(this);
    }

    pos2region(position:GridPoint): Promise<GridConfigApiRegionResult>
    {
        return new Promise((yup, nope) => {
            const result = <[string, Array<Shape>]|null> Object.entries(
                this.regions
            ).find(
                (entry: [string, Array<Shape>]): boolean => {
                    const [, shapes] = entry;

                    return shapes.find((shape:Shape) : boolean => {
                        return shape.within_shape(position);
                    }) instanceof Shape;
                }
            );

            if (result) {
                const [region_name, shapes] = result;
                let south_west_x = shapes[0].bounds.sw.x;
                let south_west_y = shapes[0].bounds.sw.y;

                shapes.forEach((shape:Shape) => {
                    south_west_x = Math.min(south_west_x, shape.bounds.sw.x);
                    south_west_y = Math.min(south_west_y, shape.bounds.sw.y);
                });

                yup(Object.seal({
                    south_west: new GridPoint(south_west_x, south_west_y),
                    name: region_name,
                }));
            } else {
                nope(new GridPointError(
                    'No region at the specified coordinates',
                    position
                ));
            }
        });
    }

    region2pos(region:string) : Promise<GridConfigApiRegionResult>
    {
        return new Promise((yup, nope) => {
            const lcase = region.toLocaleLowerCase();

            if (lcase in this.lcase)
            {
                const shapes = this.regions[this.lcase[lcase]];

                let south_west_x = shapes[0].bounds.sw.x;
                let south_west_y = shapes[0].bounds.sw.y;

                shapes.forEach((shape:Shape) => {
                    south_west_x = Math.min(south_west_x, shape.bounds.sw.x);
                    south_west_y = Math.min(south_west_y, shape.bounds.sw.y);
                });

                yup(Object.seal({
                    south_west: new GridPoint(south_west_x, south_west_y),
                    name: this.lcase[lcase],
                }));
            } else {
                nope(new RegionNameError(
                    'No region with the specified name found',
                    region
                ));
            }
        });
    }

    async pos2internal (global_position:GridPoint) : Promise<GridConfigApiLocalResult>
    {
        const global_result = await this.pos2region(global_position);

        return Object.seal({
            name: global_result.name,
            south_west: global_result.south_west,
            local_position: new GridPoint(
                (
                    (
                        (
                            global_position.x -
                            global_result.south_west.x
                        ) / (
                            this.bounds[global_result.name].ne.x -
                            this.bounds[global_result.name].sw.x
                        )
                    ) * 1000
                ),
                (
                    (
                        (
                            global_position.y -
                            global_result.south_west.y
                        ) / (
                            this.bounds[global_result.name].ne.y -
                            this.bounds[global_result.name].sw.y
                        )
                    ) * 1000
                )
            ),
        });
    }

    async internal2pos(
        region_name:string,
        local_position:GridPoint
    ) : Promise<GridConfigApiLocalResult> {
        if (local_position.x < 0 || local_position.y < 0) {
            throw new Internal2PosApiError(
                'Internal coordinates cannot be negative.',
                local_position,
                region_name
            );
        } else if (local_position.x > 1000 || local_position.y > 1000) {
            throw new Internal2PosApiError(
                'Internal coordinates are outside the bounds of the region.',
                local_position,
                region_name
            );
        }

        const global_result = await this.region2pos(region_name);

        return Object.seal({
            name: global_result.name,
            south_west: global_result.south_west,
            local_position: new GridPoint(
                (
                    global_result.south_west.x +
                    (
                        (
                            this.bounds[global_result.name].ne.x -
                            this.bounds[global_result.name].sw.x
                        ) *
                        (
                            local_position.x / 1000.0
                        )
                    )
                ),
                (
                    global_result.south_west.y +
                    (
                        (
                            this.bounds[global_result.name].ne.y -
                            this.bounds[global_result.name].sw.y
                        ) *
                        (
                            local_position.y / 1000.0
                        )
                    )
                )
            ),
        });
    }
}
