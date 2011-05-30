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
		document     = window['document'],
		mapapi       = window['mapapi']
	;

	function gridConfig(options){
		var
			obj     = this,
			options = options || {}
		;
		obj['namespace']    = options['namespace'];
		obj['vendor']       = options['vendor'];
		obj['name']         = options['name'];
		obj['label']        = options['label'];
		obj['maxZoom']      = options['maxZoom'];
		obj['size']         = options['size'] || new mapapi['size'](options['gridWidth'] || 1048576, options['gridHeight'] || 1048576);
		obj['tileSources']  = options['tileSources'] || [];

		obj['API']          = {};
		obj['APIcache']     = {};
		if(options['pos2region'] != undefined){
			obj['API']['pos2region'] = options['pos2region'];
			obj['APIcache']['pos2region'] = {};
		}
	}

	gridConfig.prototype['pos2region'] = function(pos, success, fail){
		if(this['API']['pos2region'] == undefined){
			throw 'This grid config has no pos2region API';
		}else if(!(pos instanceof mapapi['gridPoint'])){
			throw 'Position should be an instance of mapapi.gridPoint';
		}
		this['API']['pos2region'](pos, success, fail);
	}

	gridConfig.prototype['apiCacheCheck'] = function(call){
		var
			dest = this['APIcache'][call],
			i = 1
		;
		if(dest != undefined && arguments.length >= 2){
			for(i=1;i<arguments.length;++i){
				dest = dest[arguments[i]];
				if(dest == undefined){
					break;
				}
			}
			if(i == arguments.length && dest != undefined){
				return dest;
			}
		}
		return undefined;
	}

	mapapi['gridConfig'] = gridConfig;
})(window);