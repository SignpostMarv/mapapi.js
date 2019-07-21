/**
* @license License and Terms of Use
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
export class GridPoint
{
    readonly x:number;
    readonly y:number;

    constructor(x:number, y:number)
    {
        this.x = x;
        this.y = y;
    }

    equals(value:GridPoint) : boolean
    {
        return value.x === this.x && value.y === this.y;
    }

    distance(value:GridPoint) : number
    {
        return Math.sqrt(this.distanceSquared(value));
    }

    distanceSquared(value:GridPoint) : number
    {
        const relative_x = value.x - this.x;
        const relative_y = value.y - this.y;

        return Math.abs((relative_x ** 2) +( relative_y ** 2));
    }

    distanceGreaterThan(value:GridPoint, than:number) : boolean
    {
        return this.distanceSquared(value) > (than ** 2);
    }

    distanceGreaterThanOrEqualTo(value:GridPoint, than:number) : boolean
    {
        return this.distanceSquared(value) >= (than ** 2);
    }

    distanceLessThan(value:GridPoint, than:number) : boolean
    {
        return this.distanceSquared(value) < (than ** 2);
    }

    distanceLessThanOrEqualTo(value:GridPoint, than:number) : boolean
    {
        return this.distanceSquared(value) <= (than ** 2);
    }

    static lerp(a:GridPoint, b:GridPoint, c:number) : GridPoint
    {
        const c_clamped = Math.max(0, Math.min(1, c));

        return new this(
            a.x + ((b.x - a.x) * c_clamped),
            a.y + ((b.y - a.y) * c_clamped)
        );
    }
}

export default GridPoint;

export class CoordinatesList extends Array
{
    constructor(...coordinates:Array<GridPoint>)
    {
        super();

        this.push(...coordinates);
    }

    push(...coordinates:Array<GridPoint>) : number
    {
        return Array.prototype.push.apply(this, coordinates);
    }
}

export class FixedLengthCoordinatesList extends CoordinatesList
{
    constructor(...coordinates:Array<GridPoint>)
    {
        super(...coordinates);

        Object.seal(this);
    }
}

export class CoordinatesPair extends FixedLengthCoordinatesList
{
    constructor(a:GridPoint, b:GridPoint)
    {
        super(a, b);
    }
}

export class CoordinatesSingleton extends FixedLengthCoordinatesList
{
    constructor(a:GridPoint)
    {
        super(a);
    }
}

export class GridPointError extends Error
{
    readonly position:GridPoint;

    constructor(message:string, position:GridPoint)
    {
        super(message);
        this.position = position;
    }
}
