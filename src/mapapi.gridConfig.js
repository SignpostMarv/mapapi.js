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

	var
		gridConfig = function(options){
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
			obj['_tileSources'] = options['_tileSources'] || [];
		}
	;

	gridConfig.prototype.tileSources = function(){
		return this['_tileSources'];
	}

	mapapi['gridConfig'] = gridConfig;
	mapapi['gridConfig'].prototype['tileSources'] = gridConfig.prototype.tileSources;

})(window);