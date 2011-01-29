/**
* @license License and Terms of Use
*
* Copyright (c) 2011 SignpostMarv
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
(function(window, undefined){
	if(!window['mapapi']){
		throw 'mapapi.js not loaded';
	}else if(!window['mapapi']['renderer']){
		throw 'mapapi.js renderer class not loaded';
	}

	var
		document   = window['document'],
		mapapi     = window['mapapi'],
		SLURL      = window['SLURL'],
		renderer   = mapapi['renderer'],
		gridConfig = mapapi['gridConfig'],
		gridPoint  = mapapi['gridPoint'],
		bounds     = mapapi['bounds']
	;

	var moveOrder = function(from, to, frames){
		this['from']    = from;
		this['to']      = to;
		this['frames']  = Math.max(1, frames);
		this['current'] = 0;
		this['incrX']   = (to.x - from.x) / frames;
		this['incrY']   = (to.y - from.y) / frames;
	};

	var canvas = function(options){
		var supported = document.createElement('canvas');
		if(supported){
			supported = (supported['getContext'] && supported['getContext']('2d'));
		}
		if(!supported){
			throw 'Browser does not support canvas renderer';
		}
		var
			obj        = this,
			options    = options || {},
			gridConf = options['gridConfig']
		;
		if((gridConf instanceof gridConfig) == false){
			throw 'Grid Configuration object must be instance of mapapi.gridConfig';
		}
		obj.gridConfig = gridConf;

		obj['contentNode']   = document.createElement('canvas');
		obj.vendorContent = obj['contentNode']['getContext']('2d');

		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer');
		mapapi['renderer'].call(obj, options);

		obj['options']['fps'] = Math.max(1, options['fps'] || 15);

		obj.grid_images = {};

		obj['contentNode']['width']  = obj['contentNode']['clientWidth'];
		obj['contentNode']['height'] = obj['contentNode']['clientHeight'];

		obj.tileSource = gridConf['tileSources']()[0];

		window.addEventListener('resize', function(){ obj.dirty = true; obj.updateBounds(); }, true);

		obj['zoom'](0);
		obj['focus'](0, 0);

		obj.updateBounds();
		obj.dirty = true;
		obj.draw(obj['options']['fps']);
	};

	canvas.prototype = new renderer;

	canvas.prototype.updateBounds = function(){
		var
			obj = this,
			canvas  = obj['contentNode'],
			zoom    = obj['zoom'](),
			zoom_a  = .5 + (.5 * (1 - (zoom % 1))),
			zoom_b  = 1 << Math.floor(zoom),
			focus   = obj['focus'](),
			cWidth  = canvas['width'],
			cHeight = canvas['height'],
			tWidth  = (obj.tileSource['size']['width'] * zoom_a) / zoom_b,
			tHeight = (obj.tileSource['size']['height'] * zoom_a) / zoom_b,
			wView   = Math.ceil(cWidth / tWidth) + 1,
			hView   = Math.ceil(cHeight / tHeight) + 1,
			wVhalf  = Math.ceil(wView / 2.0),
			hVhalf  = Math.ceil(hView / 2.0)
		;
		obj.bounds  = new bounds({'x': focus['x'] - wVhalf, 'y': focus['y'] - hVhalf},{'x': focus['x'] + wVhalf,  'y': focus['y'] + hVhalf});
		obj.dirty = true;
	}

	canvas.prototype.imageQueued = function(x, y, zoom){
		var
			obj = this,
			zi = Math.floor(zoom)
			zoom_b = 1 << zi,
			images = obj.grid_images,
			y = y - (y % zoom_b),
			x = x - (x % zoom_b)
		;
		return (images[zi] && images[zi][x] && images[zi][x][y] instanceof Image);
	}

	canvas.prototype.getImage = function(x, y, zoom, preload){
		var
			obj     = this,
			zi      = Math.floor(zoom),
			zoom_b  = 1 << zi,
			images  = obj.grid_images,
			y       = y - (y % zoom_b),
			x       = x - (x % zoom_b),
			preload = !!preload
		;
		if(preload){
			var px, py, pzi;

			pzi = zi + 1;
			px = x - (x % pzi);
			py = y - (y % pzi);
			if(zi < obj['maxZoom']() && !obj.imageQueued(px, py, pzi)){
				obj.getImage(px, py, pzi);
			}
		}
		if(!images[zi]){
			images[zi] = [];
		}
		if(!images[zi][x]){
			images[zi][x] = [];
		}
		if(!images[zi][x][y]){
			images[zi][x][y] = new Image;
			images[zi][x][y]['_mapapi'] = {
				'x' : x,
				'y' : y,
				'preloaded' : (preload == true)
			};
			images[zi][x][y]['onload'] = function(){
				this['_mapapi']['loaded'] = true;
				if(obj.bounds['isWithin'](this['_mapapi']['x'], this['_mapapi']['y'])){
					obj.dirty = true;
				}
			}
			images[zi][x][y]['src'] = obj.tileSource['getTileURL'](new gridPoint(x, y), zi, true);
		}
		return images[zi][x][y];
	}

	canvas.prototype.draw = function(fps){
		fps = Math.max(1, fps || 0);
		var obj = this;
		obj.dirty = obj.dirty || obj.moving;
		if(obj.dirty){
			obj.dirty = false;
			var
				ctx     = obj.vendorContent,
				canvas  = ctx.canvas
			;
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			ctx.save();

			if(obj.moving){
				++obj.moving.current;
				obj.setFocus({
					'x':obj.moving['from']['x'] + (obj['moving']['incrX'] * obj['moving']['current']),
					'y':obj.moving['from']['y'] + (obj['moving']['incrY'] * obj['moving']['current'])
				});
				if(obj['moving']['current'] >= obj.moving['frames']){
					delete obj.moving;
				}
			}

			var
				zoom    = obj['zoom'](),
				zoom_a  = .5 + (.5 * (1 - (zoom % 1))),
				zoom_b  = 1 << Math.floor(zoom),
				scale   = 1 - (.5 * zoom),
				focus   = obj['focus'](),
				cbounds = obj.bounds,
				cWidth  = canvas['width'],
				cWidth2 = cWidth / 2.0,
				cHeight = canvas['height'],
				cHeight2= cHeight / 2.0,
				tWidth  = (obj.tileSource['size']['width'] * zoom_a) / zoom_b,
				tHeight = (obj.tileSource['size']['height'] * zoom_a) / zoom_b,
				images  = [],
				startX  = cbounds['sw']['x'] - (cbounds['sw']['x'] % zoom_b),
				startY  = cbounds['sw']['y'] - (cbounds['sw']['y'] % zoom_b)
			;
			ctx.fillStyle = obj['tileSource']['options']['backgroundColor'];
			ctx.fillRect(0,0, cWidth, cHeight);

			ctx.translate((focus['x'] * -tWidth) + cWidth2,(focus['y'] * tHeight) + cHeight2 - (tHeight * zoom_b));
			ctx.scale(tWidth, tHeight);

			for(var x = startX; x<=cbounds['ne']['x']; x += zoom_b){
				for(var y = startY; y<=cbounds['ne']['y']; y += zoom_b){
					var img = obj.getImage(x, y, zoom);
					if(img['_mapapi'].loaded){
						ctx.drawImage(
							img,
							img['_mapapi'].x,
							-img['_mapapi'].y,
							zoom_b, zoom_b);
					}
				}
			}
			
			ctx.restore();

			obj.dirty = false;
		}
		setTimeout(function(){ obj.draw(fps) },1000/fps);
	}

	canvas.prototype['focus'] = function(pos, y){
		var obj = this;
		if(pos){
			renderer.prototype['focus'].call(obj, pos, y);
			obj.updateBounds();
		}
		return renderer.prototype['focus'].call(obj);
	}

	canvas.prototype['panTo'] = function(pos, frames){
		var obj = this;
		if(!obj.moving){
			obj.moving = new moveOrder(obj['focus'](), pos, frames || 15);
		}
	}

	mapapi['canvasRenderer'] = canvas;
})(window);