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
		document = window['document'],
		mapapi   = window['mapapi']
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
			options    = options || {},
			opts       = obj['options'],
			minZoom    = obj.minZoom(options['minZoom'] || 0),
			maxZoom    = obj.maxZoom(options['maxZoom'] || 0),
			panUnitUD  = obj.panUnitUD(options['panUnitUD'] || 1),
			panUnitLR  = obj.panUnitLR(options['panUnitLR'] || 1)
		;

		if(options['container']){
			obj.container(options['container']);
		}
	}

	renderer.prototype.container = function(container){
		var
			opts = this['options']
		;
		if(container){
			if(!container.appendChild){
				throw 'Container is invalid';
			}else{
				opts['container'] = container;
				if(this['contentNode']){
					container.appendChild(this['contentNode']);
				}
			}
		}
		return opts['container'];
	}

	renderer.prototype.minZoom = function(value){
		var
			opts = this['options']
		;
		if(value){
			opts['minZoom'] = Math.max(0, value);
		}
		return opts['minZoom'];
	};

	renderer.prototype.maxZoom = function(value){
		var
			opts = this['options']
		;
		if(value){
			opts['maxZoom'] = Math.max(this.minZoom() + 1, value);
		}
		return opts['maxZoom'];
	}

	renderer.prototype.zoom = function(value){
		var
			obj  = this,
			opts = obj['options']
		;
		if(value){
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

	mapapi['renderer'] = renderer;
	mapapi['renderer'].prototype['container'] = renderer.prototype.container;
	mapapi['renderer'].prototype['minZoom']   = renderer.prototype.minZoom;
	mapapi['renderer'].prototype['maxZoom']   = renderer.prototype.maxZoom;
	mapapi['renderer'].prototype['zoom']      = renderer.prototype.zoom;
	mapapi['renderer'].prototype['panUnitUD'] = renderer.prototype.panUnitUD;
	mapapi['renderer'].prototype['panUnitLR'] = renderer.prototype.panUnitLR;
})(window);