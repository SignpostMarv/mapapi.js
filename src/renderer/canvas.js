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
		bounds     = mapapi['bounds'],
		size       = mapapi['size'],
		infoWindow = mapapi['infoWindow'],
		reqAnim    = ['mozRequestAnimationFrame', 'webkitRequestAnimationFrame'],
		reqAnimSp  = false
	;
	for(var i=0;i<reqAnim.length;++i){
		if(!!window[reqAnim[i]]){
			reqAnim = window[reqAnim[i]];
			reqAnimSp = true;
			break;
		}
	}
	reqAnim = reqAnimSp ? reqAnim : false;

	function canvas(options){
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
			gridConf = options['gridConfig'],
			clickpan = function(e){
				if(obj.dragging == false){
					clearTimeout(obj.mousedown_timer);
					var
						x     = e['clientX'],
						y     = e['clientY'],
						point = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop'])
					;
					obj['panTo'](point);
				}
			}
		;
		if((gridConf instanceof gridConfig) == false){
			throw 'Grid Configuration object must be instance of mapapi.gridConfig';
		}
		obj.gridConfig = gridConf;

		obj['contentNode']   = document.createElement('canvas');
		obj.vendorContent = obj['contentNode']['getContext']('2d');
		

		obj['contentNode']['addEventListener']('click', function(e){
			var
				x     = e['clientX'],
				y     = e['clientY'],
				point = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop'])
			;
			obj['fire']('click', {
				'pos' : point
			});
		}, false);

		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer mapapi-renderer-canvas');
		mapapi['renderer'].call(obj, options);

		obj['options']['fps'] = Math.max(1, options['fps'] || 30);
		obj['options']['maxZoom'] = gridConf['maxZoom'];

		obj.grid_images = {};

		obj.tileSource = gridConf['tileSources']()[0];

		obj['scrollWheelZoom'](obj['options']['scrollWheelZoom']);
		obj['smoothZoom'](obj['options']['smoothZoom']);
		obj['dblclickZoom'](obj['options']['dblclickZoom']);
		obj['zoom'](0);
		obj['focus'](0, 0);

		obj.dirty = true;
		obj.draw(obj['options']['fps']);
	};

	canvas.prototype = new renderer;
	canvas.prototype['constructor'] = canvas;

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
				if(obj.bounds()['isWithin'](this['_mapapi']['x'], this['_mapapi']['y'])){
					obj.dirty = true;
				}
			}
			images[zi][x][y]['src'] = obj.tileSource['getTileURL'](new gridPoint(x, y), zi);
		}
		return images[zi][x][y];
	}

	canvas.prototype.draw = function(fps){
		fps = Math.max(1, fps || 0);
		var
			obj     = this,
			cbounds = obj['bounds']()
		;
		if(obj.lastsize == undefined || (obj.lastsize['width'] != obj['contentNode']['clientWidth'] || obj.lastsize['height'] != obj['contentNode']['clientHeight'])){
			obj.lastbounds = undefined;
		}
		obj.dirty = obj.dirty || obj['doAnimation']() || (obj.lastbounds == undefined || !obj.lastbounds['equals'](cbounds)) ;
		obj.lastbounds = cbounds;
		obj.lastsize   = new mapapi['size'](obj['contentNode']['clientWidth'], obj['contentNode']['clientHeight']);
		if(obj.dirty){
			var
				ctx     = obj.vendorContent,
				canvas  = ctx.canvas
			;
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			ctx.save();

			var
				zoom    = obj['zoom'](),
				zoom_a  = .5 + (.5 * (1 - (zoom % 1))),
				zoom_b  = 1 << Math.floor(zoom),
				zoom_c  = 1 << Math.floor(zoom - 1),
				focus   = obj['focus'](),
				cWidth  = canvas['width'],
				cWidth2 = cWidth / 2.0,
				cHeight = canvas['height'],
				cHeight2= cHeight / 2.0,
				size    = obj.tileSize(),
				tWidth  = size['width'],
				tHeight = size['height'],
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
		if(reqAnimSp){
			reqAnim(function(){ obj.draw() });
		}else{
			setTimeout(function(){ obj.draw(fps) },1000/fps);
		}
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
		}
		return renderer.prototype['focus'].call(obj);
	}

	canvas.prototype['zoom'] = function(value){
		var
			obj  = this,
			zoom = renderer.prototype['zoom'].call(obj, value)
		;
		return zoom;
	}

	canvas.prototype['panTo'] = function(pos, y){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, y);
		}
		var obj = this;
		this['animate']({
			'focus' : pos
		}, .5);
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
					if(obj['smoothZoom']()){
						obj['animate']({
							'zoom' : (zoom + mod)
						}, .5);
					}else{
						obj['zoom'](zoom + mod);
					}
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
					obj['contentNode']['addEventListener'](/WebKit/.test(window['navigator']['userAgent']) ? 'mousewheel' : 'DOMMouseScroll', zoomStuffs, false);
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

	canvas.prototype['draggable'] = function(flag){
		var
			obj  = this,
			opts = obj['options'],
			dragstart_pos     = undefined,
			mousedown_handler = function(e){
				var
					x = e['clientX'],
					y = e['clientY']
				;
				dragstart_pos = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop']);
				clearTimeout(obj.mousedown_timer);
				obj.dragging = false;
				obj.mousedown_timer = setTimeout(function(){
					obj.dragging = true;
				}, 100);
			},
			mouseup_handler   = function(){
				clearTimeout(obj.mousedown_timer);
				obj.dragging = false;
			},
			mousemove_handler = function(e){
				if(obj.dragging){
					var
						x     = e['clientX'],
						y     = e['clientY'],
						point = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop']),
						focus = obj['focus']()
					;
					obj['fire']('drag',{
						'to': new gridPoint(
							focus['x'] - (point['x'] - dragstart_pos['x']),
							focus['y'] - (point['y'] - dragstart_pos['y'])
						)
					});
				}
			}
		;
		if(flag != undefined){
			flag = !!flag;
			opts['draggable'] = flag;
			if(flag){
				obj['contentNode']['addEventListener']('mousedown', mousedown_handler, false);
				obj['contentNode']['addEventListener']('mouseup'  , mouseup_handler  , false);
				obj['contentNode']['addEventListener']('mousemove', mousemove_handler, false);
			}else{
				obj['contentNode']['removeEventListener']('mousedown', mousedown_handler, false);
				obj['contentNode']['removeEventListener']('mouseup'  , mouseup_handler  , false);
				obj['contentNode']['removeEventListener']('mousemove', mousemove_handler, false);
			}
		}
		return opts['draggable'];
	}

	canvas.prototype['dblclickZoom'] = function(flag){
		var
			obj  = this,
			opts = obj['options'],
			dblclickzoom = function(e){
				var
					x     = e['clientX'],
					y     = e['clientY'],
					point = obj['px2point'](x - this['offsetLeft'], y - this['offsetTop'])
				;
				obj['fire']('dblclick', {
					'pos' : point
				});
			}
		;
		renderer.prototype['dblclickZoom'].call(obj, flag);
		if(flag != undefined){
			flag = !!flag;
			if(flag){
				obj['contentNode']['addEventListener']('dblclick', dblclickzoom, false);
			}else{
				obj['contentNode']['removeEventListener']('dblclick', dblclickzoom, false);
			}
		}
		return opts['dblclickZoom'];
	}

	mapapi['canvasRenderer'] = canvas;

	if(!!infoWindow){
		function canvasInfoWindow(opts){
			infoWindow['call'](this, opts);
		}

		canvasInfoWindow.prototype = new infoWindow;
		canvasInfoWindow.prototype['constructor'] = canvasInfoWindow;

		canvasInfoWindow.prototype['open'] = function(ui){
			infoWindow.prototype['open']['call'](this, ui);
			var
				obj      = this,
				DOM      = obj['DOM'],
				DOMp     = DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined,
				renderer = ui['renderer'],
				rcontent = renderer['contentNode'],
				offset   = function(){
					if(!!(DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined)){
						var
							csspos = ui['renderer']['point2px'](obj['position']());
						;
						DOM['style']['left'] = csspos['x'] + 'px';
						DOM['style']['top']  = csspos['y'] - DOM['clientHeight'] + 'px';
					}
				}
			;
			offset();
			ui['renderer']['addListener']('focus_changed', offset);
		}

		canvas.prototype['infoWindow'] = function(opts){
			return new canvasInfoWindow(opts);
		}
	}

})(window);