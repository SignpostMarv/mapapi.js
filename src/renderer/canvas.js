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

	var moveOrder = function(from, to){
		this['from']    = from;
		this['to']      = to;
		this['current'] = 0;
	};
	moveOrder.prototype.overTime = function(time, fps){
		if(!this['frames']){
			this['frames'] = Math.max(1, Math.floor(time * fps));
			var
				frames = this['frames'],
				to     = this['to'],
				from   = this['from']
			;
			this['incrX']   = (to['x'] - from['x']) / frames;
			this['incrY']   = (to['y'] - from['y']) / frames;
		}
	}

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
		obj['options']['maxZoom'] = gridConf['maxZoom'];

		obj.grid_images = {};

		obj.tileSource = gridConf['tileSources']()[0];

		window.addEventListener('resize', function(){ obj.dirty = true; obj.updateBounds(); }, true);

		var
			dragging          = false,
			mousedown_timer   = undefined,
			dragstart_pos     = undefined,
			mousedown_handler = function(e){
				var
					x = e['clientX'],
					y = e['clientY']
				;
				dragstart_pos = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop']);
				clearTimeout(mousedown_timer);
				mousedown_timer = setTimeout(function(){
					dragging = true;
				}, 50);
			},
			mouseup_handler   = function(){
				clearTimeout(mousedown_timer);
				dragging = false;
			},
			mousemove_handler = function(e){
				var
					x     = e['clientX'],
					y     = e['clientY'],
					point = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop']),
					focus = obj['focus']()
				;
				if(dragging){
					obj['focus'](
						focus['x'] - (point['x'] - dragstart_pos['x']),
						focus['y'] - (point['y'] - dragstart_pos['y'])
					);
				}
			}
		;
		obj['contentNode'].addEventListener('mousedown', mousedown_handler, false);
		obj['contentNode'].addEventListener('mouseup'  , mouseup_handler  , false);
		obj['contentNode'].addEventListener('mousemove', mousemove_handler, false);

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

	canvas.prototype['px2point'] = function(x, y){
		var
			obj     = this,
			canvas  = obj['contentNode'],
			sw      = obj.bounds['sw'],
			ne      = obj.bounds['ne'],
			cWidth  = canvas['width'],
			cHeight = canvas['height'],
			mapX    = sw['x'] + ((ne['x'] - sw['x']) * (x / cWidth)),
			mapY    = ne['y'] - ((ne['y'] - sw['y']) * (y / cHeight))
		;
		return new gridPoint(mapX, mapY);
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
			images[zi][x][y]['src'] = obj.tileSource['getTileURL'](new gridPoint(x, y), zi);
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
				obj.moving.overTime(3,fps);
				window['status'] = [
					obj.moving['from']['x'],
					obj['moving']['incrX'],
					obj['moving']['current'],
					obj.moving['frames']
				]
				++obj.moving.current;
				obj['focus'](
					obj.moving['from']['x'] + (obj['moving']['incrX'] * obj['moving']['current']),
					obj.moving['from']['y'] + (obj['moving']['incrY'] * obj['moving']['current'])
				);
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

	canvas.prototype['focus'] = function(pos, zoom, a){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, zoom),
			zoom = a;
		}
		if(zoom == undefined){
			zoom = this['zoom']();
		}
		var obj = this;
		if(pos){
			renderer.prototype['focus'].call(obj, pos, zoom);
			obj.updateBounds();
		}
		return renderer.prototype['focus'].call(obj);
	}

	canvas.prototype['panTo'] = function(pos, y){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, y);
		}
		var obj = this;
		if(!obj.moving){
			obj.moving = new moveOrder(obj['focus'](), pos);
		}
	}

	canvas.prototype['scrollWheelZoom'] = function(flag){
		var
			obj        = this,
			opts       = obj['options'],
			zoomStuffs = function(e){
				var d=0;
				if(!e){
					e = window['event']
				}else if(e['wheelDelta']){
					d = e['wheelDelta'] / 120;
					if(window['opera']){
						d = -d;
					}
				}else if(e['detail']){
					d = -e['detail'] / 3;
				}
				if(d){
					var
						zoom = obj['zoom'](),
						mod  = (d > 0) ? -1 : 1
					;
					obj['zoom'](zoom + mod);
					obj.dirty = true;
					obj.updateBounds();
				}
				if(e['preventDefault']){
					e['preventDefault']();
				}
				e['returnValue'] = false;
				return false;
			}
		;
		if(flag != undefined){
			flag = !!flag;
			opts['scrollWheelZoom'] = flag;
			if(flag){
				if(window['addEventListener']){
					obj['contentNode']['addEventListener']('DOMMouseScroll', zoomStuffs, false);
				}else if(window['attachEvent']){
					obj['contentNode']['attachEvent']('onmousewheel', zoomStuffs);
				}
			}else{
				if(window['removeEventListener']){
					obj['contentNode']['removeEventListener']('DOMMouseScroll', zoomStuffs, false);
				}else if(window['detachEvent']){
					obj['contentNode']['detachEvent']('onmousewheel', zoomStuffs);
				}
			}
		}
		return opts['scrollWheelZoom'];
	}

	mapapi['canvasRenderer'] = canvas;
})(window);