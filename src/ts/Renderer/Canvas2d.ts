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
import { Renderer, RendererOptions } from '../Renderer.js';
import { TileSource } from '../TileSource.js';
import { Bounds } from '../Bounds.js';
import { Size } from '../Size.js';
import { GridPoint } from '../GridPoint.js';
import { TileRequestResult } from '../TileSource.js';
import { PropertyChangeEvent } from '../Events.js';

const last_bounds = <WeakMap<Canvas2d, Bounds>> new WeakMap();
const last_size = <WeakMap<Canvas2d, Size>> new WeakMap();

class Canvas2d extends Renderer
{
    protected content_node:HTMLCanvasElement;
    protected context:CanvasRenderingContext2D;
    protected dirty:boolean = false;

    constructor(options:RendererOptions)
    {
        super(options);
        const element = document.createElement('canvas');
        this.browser_supported =
            'getContext' in element &&
            (element.getContext('2d') instanceof CanvasRenderingContext2D);

        if ( ! this.browser_supported)
        {
            throw new Error('Browser does not support Canvas2d Renderer');
        }

        this.content_node = document.createElement('canvas');
        this.context = <CanvasRenderingContext2D> this.content_node.getContext(
            '2d'
        );
        this.content_node.classList.add(
            'mapapi-renderer',
            'mapapi-renderer-canvas'
        );
        this.minimum_zoom = Math.min(
            this.grid_config.maximum_zoom,
            this.minimum_zoom
        );
        this.maximum_zoom = Math.min(
            this.grid_config.maximum_zoom,
            this.maximum_zoom
        );
        this.dirty = true;

        this.draw();
    }

    get tile_source() : TileSource
    {
        return this.grid_config.tile_sources[0];
    }

    async draw() : Promise<void>
    {
        const content_bounds = this.bounds;
        let fire_bounds_changed = false;

        if (
            ! last_bounds.has(this) ||
            ! (<Bounds> last_bounds.get(this)).equals(content_bounds)
        ) {
            fire_bounds_changed = true;
        }

        last_bounds.set(this, content_bounds);
        last_size.set(this, new Size(
            this.content_node.clientWidth,
            this.content_node.clientHeight
        ));

        if (this.dirty) {
            const [
                canvas_width,
                canvas_height
            ] = [
                this.context.canvas.width,
                this.context.canvas.height,
            ] = [
                this.context.canvas.clientWidth,
                this.context.canvas.clientHeight,
            ];

            this.context.save();

            const zoom = this.zoom;
            const zoom_b = 1 << Math.floor(zoom);
            const {x:focus_x, y:focus_y} = this.focus;

            const canvas_width_half = canvas_width / 2.0;
            const canvas_height_half = canvas_height / 2.0;

            const {width:tile_width, height:tile_height} = this.tile_size;

            const start_x =
                content_bounds.sw.x -
                (content_bounds.sw.x % zoom_b);
            const start_y =
                content_bounds.sw.y -
                (content_bounds.sw.y % zoom_b);

            this.context.fillStyle = this.tile_source.background_colour;
            this.context.fillRect(0, 0, canvas_width, canvas_height);

            this.context.translate(
                ((focus_x * -tile_width) + canvas_width_half),
                (
                    (focus_y * tile_height) +
                    canvas_height_half -
                    (tile_height * zoom_b)
                )
            );
            this.context.scale(tile_width, tile_height);

            const tiles = [];

            for (let x = start_x; x <= content_bounds.ne.x; x += zoom_b)
            {
                for (let y = start_y; y <= content_bounds.ne.y; y += zoom_b)
                {
                    tiles.push(this.tile_source.request_tile(
                        new GridPoint(x, y),
                        zoom
                    ));
                }
            }

            (await Promise.all(tiles)).forEach((tile:TileRequestResult) => {
                this.context.drawImage(
                    tile.result,
                    tile.position.x,
                    -tile.position.y,
                    zoom_b,
                    zoom_b
                );
            });
        }

        if (fire_bounds_changed)
        {
            this.dispatchEvent(new PropertyChangeEvent('bounds', this));
        }
    }
}
