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
import GridPoint from './GridPoint.js';

export class Bounds extends EventTarget
{
    readonly sw:GridPoint;
    readonly ne:GridPoint;

    constructor(a:GridPoint, b:GridPoint)
    {
        super();

        this.sw = new GridPoint(Math.min(a.x, b.x), Math.min(a.y, b.y));
        this.ne = new GridPoint(Math.max(a.x, b.x), Math.max(a.y, b.y));
    }

    isWithin(point:GridPoint) : boolean
    {
        return this.isWithinNumbers(point.x, point.y);
    }

    private isWithinNumbers(x:number, y:number) : boolean
    {
        return (
            x >= this.sw.x &&
            x <= this.ne.x &&
            y >= this.sw.y &&
            y <= this.ne.y
        );
    }

    equals(bounds:Bounds) : boolean
    {
        return (
            bounds.sw.x === this.sw.x &&
            bounds.sw.y === this.sw.y &&
            bounds.ne.x === this.ne.x &&
            bounds.ne.y === this.ne.y
        );
    }

    intersects(with_bounds:Bounds, anti_recursive:boolean = false) : boolean
    {
        return (
            this.isWithin(with_bounds.ne) ||
            this.isWithin(with_bounds.sw) ||
            this.isWithinNumbers(with_bounds.sw.x, with_bounds.ne.y) ||
            this.isWithinNumbers(with_bounds.ne.x, with_bounds.sw.y) ||
            (false === anti_recursive && with_bounds.intersects(this, true))
        );
    }
};

export default Bounds;
