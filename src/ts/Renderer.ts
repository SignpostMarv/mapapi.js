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
import { ShapeManager } from './Shape.js';
import { PropertyChangeEvent } from './Events.js';
import { GridPoint } from './GridPoint.js';
import { GridConfig } from './GridConfig.js';
import { Bounds } from './Bounds.js';
import { TileSource } from './TileSource.js';
import { Size } from './Size.js';

export interface RendererOptions
{
    shapes?:ShapeManager;
    minimum_zoom?:number;
    maximum_zoom?:number;
    pan_unit_horizontal?:number;
    pan_unit_vertical?:number;
    scroll_wheel_zoom?:boolean;
    draggable?:boolean;
    double_click_zoom?:boolean;
    zoom?:number;
    focus?:GridPoint;
    touchable?:boolean;
    smooth_zoom?:boolean;
    grid_config:GridConfig;
}

export async function doubleclick_handler(
    this:Renderer,
    e:GridPointClickEvent
) : Promise<void> {
    if (this.smooth_zoom) {
        await this.animate(e.position, this.zoom - 1, .5);
    } else {
        this.zoom -= 1;
        this.focus = e.position;
    }
}

export function dragpan(this:Renderer, e:GridPointDragEvent)
{
    this.focus = e.to;
}

export class GridPointChangeEvent extends Event
{
    readonly target:Renderer;
    readonly from:GridPoint;
    readonly to:GridPoint;

    constructor(target:Renderer, from:GridPoint, to:GridPoint)
    {
        super('gridpointchange');

        this.target = target;
        this.from = from;
        this.to = to;
    }
}

export class GridPointDragEvent extends Event
{
    readonly target:Renderer;
    readonly from:GridPoint;
    readonly to:GridPoint;

    constructor(target:Renderer, from:GridPoint, to:GridPoint)
    {
        super('drag');

        this.target = target;
        this.from = from;
        this.to = to;
    }
}

export class GridPointClickEvent extends Event
{
    readonly target:Renderer;
    readonly position:GridPoint;

    constructor(target:Renderer, position:GridPoint)
    {
        super('click');

        this.target = target;
        this.position = position;
    }
}

export abstract class Renderer extends EventTarget
{
    protected options:{
        shapes:ShapeManager;
        minimum_zoom:number;
        maximum_zoom:number;
        pan_unit_horizontal:number;
        pan_unit_vertical:number;
        scroll_wheel_zoom:boolean;
        draggable:boolean;
        double_click_zoom:boolean;
        zoom:number;
        focus:GridPoint;
        touchable:boolean;
        smooth_zoom:boolean;
    } = {
        shapes: new ShapeManager(),
        minimum_zoom: 0,
        maximum_zoom: 0,
        pan_unit_horizontal: 0,
        pan_unit_vertical: 0,
        scroll_wheel_zoom: false,
        draggable: false,
        double_click_zoom: false,
        zoom: 0,
        focus: new GridPoint(0, 0),
        touchable: false,
        smooth_zoom: false,
    };

    protected grid_config:GridConfig;

    protected browser_supported:boolean = false;

    constructor(options:RendererOptions) {
        super();

        if (options.shapes !== undefined) {
            this.options.shapes = options.shapes;
        }
        if (options.minimum_zoom !== undefined) {
            this.options.minimum_zoom = options.minimum_zoom;
        } else {
            this.options.minimum_zoom = 0;
        }
        if (options.maximum_zoom !== undefined) {
            this.options.maximum_zoom = options.maximum_zoom;
        }
        if (options.pan_unit_horizontal !== undefined) {
            this.options.pan_unit_horizontal = options.pan_unit_horizontal;
        }
        if (options.pan_unit_vertical !== undefined) {
            this.options.pan_unit_vertical = options.pan_unit_vertical;
        }
        if (options.scroll_wheel_zoom !== undefined) {
            this.options.scroll_wheel_zoom = options.scroll_wheel_zoom;
        }
        if (options.draggable !== undefined) {
            this.options.draggable = options.draggable;
        }
        if (options.double_click_zoom !== undefined) {
            this.options.double_click_zoom = options.double_click_zoom;
        }
        if (options.zoom !== undefined) {
            this.options.zoom = options.zoom;
        }
        if (options.focus !== undefined) {
            this.options.focus = options.focus;
        }
        if (options.touchable !== undefined) {
            this.options.touchable = options.touchable;
        }

        this.grid_config = options.grid_config;

        this.addEventListener('click', ((e:GridPointClickEvent) => {
            this.options.shapes.click(e.position);
        }) as EventListener );
        this.addEventListener('drag', dragpan as EventListener);
    }

    get content() : HTMLElement
    {
        return this.content_node;
    }

    get smooth_zoom() : boolean
    {
        return this.options.smooth_zoom;
    }

    get minimum_zoom() : number
    {
        return this.options.minimum_zoom;
    }

    set minimum_zoom(value:number)
    {
        const was = this.minimum_zoom;
        const clamped = Math.max(0, value);

        if (was !== clamped)
        {
            this.options.minimum_zoom = clamped;
            this.dispatchEvent(new PropertyChangeEvent('minimum_zoom'));
        }
    }

    get maximum_zoom() : number
    {
        return this.options.maximum_zoom;
    }

    set maximum_zoom(value:number)
    {
        const was = this.maximum_zoom;
        const clamped = Math.max(this.minimum_zoom + 1, value);

        if (was !== clamped)
        {
            this.options.maximum_zoom = clamped;
            this.dispatchEvent(new PropertyChangeEvent('maximum_zoom'));
        }
    }

    get zoom() : number
    {
        return this.options.zoom;
    }

    set zoom(value:number)
    {
        const was = this.zoom;
        const clamped = Math.max(
            this.options.minimum_zoom,
            Math.min(
                this.options.maximum_zoom,
                value
            )
        );

        this.options.zoom = clamped;

        if (was !== clamped) {
            this.dispatchEvent(new PropertyChangeEvent('zoom'));
        }
    }

    get focus() : GridPoint
    {
        return this.options.focus;
    }

    set focus(value:GridPoint)
    {
        if ( ! this.options.focus.equals(value))
        {
            this.options.focus = value;
            this.dispatchEvent(new PropertyChangeEvent('focus'));
        }
    }

    protected abstract content_node:HTMLElement;

    abstract get tile_source() : TileSource;

    get bounds() : Bounds
    {
        const content_node = this.content_node;
        const content_width = content_node.clientWidth;
        const content_height = content_node.clientHeight;

        const {width:tile_width, height:tile_height} = this.tile_size;

        const half_width = Math.ceil(content_width / tile_width) / 2.0;
        const half_height = Math.ceil(content_height / tile_height) / 2.0;

        const focus = this.focus;

        return new Bounds(
            new GridPoint(focus.x - half_width, focus.y - half_height),
            new GridPoint(focus.x + half_width, focus.y + half_height)
        );
    }

    get tile_size() : Size
    {
        const zoom = this.zoom;
        const zoom_a = .5 + (.5 * (1 - (zoom % 1))) ;
        const zoom_b = 1 << Math.floor(zoom);
        const in_size = this.tile_source.size;

        return new Size(
            ((in_size.width * zoom_a) / zoom_b),
            ((in_size.height * zoom_a) / zoom_b)
        );
    }

    async animate(_to:GridPoint, _zoom:number, _over:number) : Promise<void>
    {
        throw new Error('not yet implemented');
    }
}

export default Renderer;
