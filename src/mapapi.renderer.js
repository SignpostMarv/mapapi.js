/**
* License and Terms of Use
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
	window['mapapi'] = window['mapapi'] || {};
	var
		document  = window['document'],
		mapapi    = window['mapapi'],
		gridPoint = mapapi['gridPoint']
	;

	function each(array, cb){
		for(var i=0;i<array.length;++i){
			cb(array[i],i);
		}
	}

/**
*	@constructor
*/
	var renderer = function(options){
		var
			obj        = this
		;

		each(['options'], function(value){
			obj[value] = {};
		});

		var
			options         = options || {},
			opts            = obj['options'],
			minZoom         = obj.minZoom(options['minZoom'] || 0),
			maxZoom         = obj.maxZoom(options['maxZoom'] || 0),
			panUnitUD       = obj.panUnitUD(options['panUnitUD'] || 1),
			panUnitLR       = obj.panUnitLR(options['panUnitLR'] || 1)
		;
		opts['scrollWheelZoom'] = (options['scrollWheelZoom'] || 0);
		opts['smoothZoom']      = (options['smoothZoom'] || 1);
		opts['dblclickZoom']    = (options['dblclickZoom'] || 1);

		if(options['container']){
			obj.container(options['container']);
		}
	}

	renderer.prototype.container = function(container){
		var
			opts = this['options']
		;
		if(container){
			if(!container['appendChild']){
				throw 'Container is invalid';
			}else{
				opts['container'] = container;
				if(this['contentNode']){
					this['contentNode']['style']['width']  = '100%';
					this['contentNode']['style']['height'] = '100%';
					while(container['hasChildNodes']()){
						container['removeChild'](container['firstChild']);
					}
					container['appendChild'](this['contentNode']);
				}
			}
		}
		this['_focus'] = new mapapi['gridPoint'](0,0);
		return opts['container'];
	}

	renderer.prototype.minZoom = function(value){
		var
			opts = this['options']
		;
		if(value != undefined){
			opts['minZoom'] = Math.max(0, value);
		}
		return opts['minZoom'];
	};

	renderer.prototype.maxZoom = function(value){
		var
			opts = this['options']
		;
		if(value != undefined){
			opts['maxZoom'] = Math.max(this.minZoom() + 1, value);
		}
		return opts['maxZoom'];
	}

	renderer.prototype.zoom = function(value){
		var
			obj  = this,
			opts = obj['options']
		;
		if(value != undefined){
			opts['zoom'] = Math.min(Math.max(value, obj.minZoom()), obj.maxZoom());
		}
		return opts['zoom'];
	}

	renderer.prototype.panUnitUD = function(value){
		var
			opts = this['options']
		;
		if(value){
			opts['panUnitUD'] = Math.max(value, 1);
		}
		return opts['panUnitUD'];
	}

	renderer.prototype.panUnitLR = function(value){
		var
			opts = this['options']
		;
		if(value){
			opts['panUnitLR'] = Math.max(value, 1);
		}
		return opts['panUnitLR'];
	}


	renderer.prototype.scrollWheelZoom = function(flag){
		var
			opts = this['options']
		;
		if(flag != undefined){
			opts['scrollWheelZoom'] = !!flag;
		}
		return opts['scrollWheelZoom'];
	}

	renderer.prototype.smoothZoom = function(flag){
		var
			obj  = this,
			opts = obj['options']
		;
		if(flag != undefined){
			opts['smoothZoom'] = !!flag;
		}
		return opts['smoothZoom'];
	}

	renderer.prototype.draggable = function(flag){
		if(flag != undefined){
			if(flag){ // do stuff to make the map renderer draggable
				return true;
			}else{ // do stuff to make it non-draggable
				return false;
			}
		}
		return flag; // should return from other property
	}

	renderer.prototype.focus = function(pos, zoom, a){ // should return an instance of mapapi.gridPoint
		if(typeof pos == 'number'){
			pos = new mapapi['gridPoint'](pos, zoom);
			zoom = this['zoom']();
		}
		if(zoom != undefined){
			this['zoom'](zoom);
		}
		if(pos instanceof mapapi['gridPoint']){ // implementations should do something to update the renderer to the focal point
			this['_focus'] = pos;
		}
		return this['_focus'];
	}

	renderer.prototype.px2point = function(x, y){
		var
			obj     = this,
			content = obj['contentNode'],
			cWidth  = content['width'],
			cw2     = cWidth / 2.0,
			cHeight = content['height'],
			ch2     = cHeight / 2.0,
			size    = obj.tileSize(),
			distX   = (x - cw2) / size['width'],
			distY   = ((cHeight - y) - ch2) / size['height'],
			focus   = obj['focus']()//,
			mapX    = focus['x'] + distX,
			mapY    = focus['y'] + distY
		;
		return new gridPoint(mapX, mapY);
	}

	renderer.prototype.dblclickZoom = function(flag){
		if(flag != undefined){
			if(flag){ // do stuff to enable smooth zoom
				return true;
			}else{ // do stuff to disable it
				return false;
			}
		}
		return flag; // should return from other property
	}

	mapapi['renderer'] = renderer;
	mapapi['renderer'].prototype['container']       = renderer.prototype.container;
	mapapi['renderer'].prototype['minZoom']         = renderer.prototype.minZoom;
	mapapi['renderer'].prototype['maxZoom']         = renderer.prototype.maxZoom;
	mapapi['renderer'].prototype['zoom']            = renderer.prototype.zoom;
	mapapi['renderer'].prototype['panUnitUD']       = renderer.prototype.panUnitUD;
	mapapi['renderer'].prototype['panUnitLR']       = renderer.prototype.panUnitLR;
	mapapi['renderer'].prototype['scrollWheelZoom'] = renderer.prototype.scrollWheelZoom;
	mapapi['renderer'].prototype['smoothZoom']      = renderer.prototype.smoothZoom;
	mapapi['renderer'].prototype['draggable']       = renderer.prototype.draggable;
	mapapi['renderer'].prototype['focus']           = renderer.prototype.focus;
	mapapi['renderer'].prototype['px2point']        = renderer.prototype.px2point;
	mapapi['renderer'].prototype['dblclickZoom']    = renderer.prototype.dblclickZoom;
})(window);