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
import {
    GridPoint,
    CoordinatesList,
    CoordinatesPair,
    CoordinatesSingleton
} from './GridPoint.js';
import Bounds from './Bounds.js';
import { PropertyChangeEvent } from './Events.js';

export interface ShapeOptions
{
    fillStyle:string,
    strokeStyle:string,
    lineWidth:number,
    position?:GridPoint;
    clickable?:boolean;
}

export class ShapeDefaultOptions implements ShapeOptions
{
    readonly fillStyle:string = 'rgba(255, 255, 255, 0.5)';
    readonly strokeStyle:string = 'rgb(255, 255, 255)';
    readonly lineWidth:number = 0;
}

export abstract class Shape extends EventTarget
{
    protected readonly shape_options:ShapeOptions;

    constructor(options:ShapeOptions = new ShapeDefaultOptions) {
        super();

        this.shape_options = options;
    }

    options(fresh:ShapeOptions = new ShapeDefaultOptions)
    {
        this.shape_options.fillStyle = fresh.fillStyle;
        this.shape_options.strokeStyle = fresh.strokeStyle;
        this.shape_options.lineWidth = fresh.lineWidth;
    }

    abstract within_shape (position:GridPoint) : boolean;

    get position() : GridPoint|undefined
    {
        return 'position' in this.shape_options ? this.shape_options.position : undefined;
    }

    set position(position:GridPoint|undefined)
    {
        if (undefined === position)
        {
            throw new TypeError('Cannot set position back to undefined!');
        }

        const was = this.position;

        this.shape_options.position = position;

        if ( undefined === was || ! was.equals(position))
        {
            this.dispatchEvent(new PropertyChangeEvent('position'));
        }
    }

    get clickable() : boolean
    {
        return this.shape_options.clickable || false;
    }

    set clickable(value:boolean)
    {
        const was = this.clickable;

        this.shape_options.clickable = value;

        if ( was !== this.clickable)
        {
            this.dispatchEvent(new PropertyChangeEvent('clickable'));
        }
    }

    get strokeStyle() : string
    {
        return this.shape_options.strokeStyle;
    }

    set strokeStyle(value:string)
    {
        const was = this.strokeStyle;

        this.shape_options.strokeStyle = value;

        if ( was !== this.strokeStyle)
        {
            this.dispatchEvent(new PropertyChangeEvent('strokeStyle'));
        }
    }

    get lineWidth() : number
    {
        return Math.max(0, this.shape_options.lineWidth);
    }

    set lineWidth(value:number)
    {
        const was = this.lineWidth;

        this.shape_options.lineWidth = value;

        if ( was !== this.lineWidth)
        {
            this.dispatchEvent(new PropertyChangeEvent('lineWidth'));
        }
    }

    abstract get bounds() : Bounds;

    intersects(value:Bounds) : boolean
    {
        return this.bounds.intersects(value);
    }
}

export default Shape;

export class ShapeClickEvent extends Event
{
    readonly target:Shape;
    readonly position:GridPoint;

    constructor(shape:Shape, position:GridPoint)
    {
        super('click');

        this.target = shape;
        this.position = position;
    }
}

export class ShapeManager extends Array
{
    push(...shapes:Array<Shape>) : number
    {
        return Array.prototype.push.apply(this, shapes);
    }

    intersects(with_bounds:Bounds) : Array<Shape>
    {
        return this.filter((maybe:Shape) : boolean => {
            return maybe.intersects(with_bounds);
        });
    }

    click(position:GridPoint) : void
    {
        this.forEach((maybe:Shape) => {
            if (maybe.clickable) {
                maybe.dispatchEvent(new ShapeClickEvent(maybe, position));
            }
        });
    }
}

export interface PolygonOptions extends ShapeOptions
{
    readonly coordinates:CoordinatesList;
}

export class PolygonDefaultOptions extends ShapeDefaultOptions implements PolygonOptions
{
    readonly coordinates:CoordinatesList = [];
}

export class Polygon extends Shape
{
    protected readonly shape_options:PolygonOptions;

    constructor(options:PolygonOptions = new PolygonDefaultOptions())
    {
        super(options);

        this.shape_options = options;
    }

    get coordinates() : CoordinatesList
    {
        return this.shape_options.coordinates;
    }

    set coordinates(value:CoordinatesList)
    {
        const was = this.bounds;

        this.shape_options.coordinates.length = 0;
        this.shape_options.coordinates.push(...value);
        this.dispatchEvent(new PropertyChangeEvent('coordinates'));

        if (
            was.sw.x !== this.bounds.sw.x ||
            was.sw.y !== this.bounds.sw.y ||
            was.ne.x !== this.bounds.ne.x ||
            was.ne.y !== this.bounds.ne.y
        ) {
            this.dispatchEvent(new PropertyChangeEvent('bounds'));
        }
    }

    get bounds() : Bounds
    {
        if (this.coordinates.length < 1)
        {
            return new Bounds(new GridPoint(0, 0), new GridPoint(0, 0));
        }

        let southwest_x = this.coordinates[0].x;
        let southwest_y = this.coordinates[0].y;
        let northeast_x = this.coordinates[0].x;
        let northeast_y = this.coordinates[0].y;

        this.coordinates.forEach((position:GridPoint) => {
            southwest_x = Math.min(southwest_x, position.x);
            southwest_y = Math.min(southwest_y, position.y);
            northeast_x = Math.min(northeast_x, position.x);
            northeast_y = Math.min(northeast_y, position.y);
        });

        return new Bounds(
            new GridPoint(southwest_x, southwest_y),
            new GridPoint(northeast_x, northeast_y)
        );
    }

    within_shape(position:GridPoint) : boolean
    {
        // transposed from http://stackoverflow.com/a/1968345/1498831

        let p0_x = this.bounds.sw.x - 1;
        let p0_y = this.bounds.sw.y - 1;
        let p1_x = position.x;
        let p1_y = position.y;
        let s1_x = p1_x - p0_x;
        let s1_y = p1_y - p0_y;
        let i = 0;
        let s,t;
        let coordinates = this.coordinates;

        coordinates.forEach((_coordinate:GridPoint, j:number) => {
            let k = (j === (coordinates.length - 1)) ? 0 : j + 1;
            let p2_x = coordinates[j].x;
            let p2_y = coordinates[j].y;
            let p3_x = coordinates[k].x;
            let p3_y = coordinates[k].y;
            let s2_x = p3_x - p2_x;
            let s2_y = p3_y - p3_y;

            s =
                (
                    -s1_y *
                    (p0_x - p2_x) +
                    s1_x *
                    (p0_y - p2_y)
                ) /
                (
                    -s2_x *
                    s1_y +
                    s1_x *
                    s2_y
                );
            t =
                (
                    s2_x *
                    (p0_y - p2_y) -
                    s2_y *
                    (p0_x - p2_x)
                ) /
                (
                    -s2_x *
                    s1_y +
                    s1_x *
                    s2_y
                );

            if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
                ++i;
            }
        });

		return (i != 0 && (i % 2) == 1);
    }
}

export interface RectangleOptions extends PolygonOptions
{
    readonly coordinates:CoordinatesPair;
}

export class RectangleDefaultOptions extends PolygonDefaultOptions implements RectangleOptions
{
    readonly coordinates = new CoordinatesPair(
        new GridPoint(0, 0),
        new GridPoint(0, 0)
    );
}

export class Rectangle extends Polygon
{
    constructor(options:RectangleOptions = new RectangleDefaultOptions())
    {
        super(options);
    }
}

export class Line extends Polygon
{
}

export interface CircleOptions extends ShapeOptions
{
    readonly coordinates:CoordinatesSingleton;
    radius:number;
}

export class CircleDefaultOptions extends ShapeDefaultOptions implements CircleOptions
{
    readonly coordinates = new CoordinatesSingleton(new GridPoint(0, 0));
    readonly radius = 0;
}

export class Circle extends Shape
{
    protected readonly shape_options:CircleOptions;

    constructor(options:CircleOptions = new CircleDefaultOptions())
    {
        super(options);
        this.shape_options = options;
    }

    get position() : GridPoint
    {
        return this.shape_options.coordinates[0];
    }

    set position(value:GridPoint)
    {
        const was = this.position;

        this.shape_options.coordinates[0].x = value.x;
        this.shape_options.coordinates[0].y = value.y;

        if ( ! was.equals(value))
        {
            this.dispatchEvent(new PropertyChangeEvent('bounds'));
        }
    }

    get radius() : number
    {
        return this.shape_options.radius;
    }

    set radius(value:number)
    {
        const was = this.radius;

        this.shape_options.radius = value;

        if (was !== this.radius)
        {
            this.dispatchEvent(new PropertyChangeEvent('radius'));
            this.dispatchEvent(new PropertyChangeEvent('bounds'));
        }
    }

    get bounds() : Bounds
    {
        return new Bounds(
            new GridPoint(
                this.position.x - this.radius,
                this.position.y - this.radius
            ),
            new GridPoint(
                this.position.x + this.radius,
                this.position.y + this.radius
            )
        );
    }

    within_shape(value:GridPoint) : boolean
    {
        return this.position.distanceLessThanOrEqualTo(value, this.radius);
    }
}
