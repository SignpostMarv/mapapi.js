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
		document    = window['document'],
		mapapi      = window['mapapi'],
		SLURL       = window['SLURL'],
		google      = window['google'],
		google_maps = google['maps'],
		renderer    = mapapi['renderer'],
		gridConfig  = mapapi['gridConfig'],
		gridPoint   = mapapi['gridPoint']
	;

	var google3 = function(options){
		var
			obj      = this,
			options  = options || {},
			gridConf = options['gridConfig']
		;
		if((gridConf instanceof gridConfig) == false){
			throw 'Grid Configuration object must be instance of mapapi.gridConfig';
		}
		obj.gridConfig = gridConf;

		obj['contentNode'] = document.createElement('div');
		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer');
		mapapi['renderer'].call(obj, options);

		obj.vendorContent = new google_maps(obj['contentNode'], options);

		var
			firstMapType = false
		;
		for(var i=0;i<obj.gridConfig['tileSources']()['length'];++i){
			var
				tileSource = obj.gridConfig['tileSources']()[i]
			;
			firstMapType = firstMapType ? firstMapType : tileSource['label'];
			obj.vendorContent['mapTypes']['set'](tileSource[i]['label'], new google_maps['ImageMapType']({
				'alt'        : tileSource['options']['label'],
				'getTileUrl' : tileSource['getTileURL']
				'isPng'      : (tileSource['options']['mimeType'] == 'image/png'),
				'maxZoom'    : tileSource['options']['maxZoom'],
				'minZoom'    : tileSource['options']['minZoom'],
				'name'       : tileSource['options']['label'],
				'opacity'    : tileSource['options']['opacity'],
				'tileSize'   : new google_maps['Size'](tileSource['size']['width'], tileSource['size']['height']),
			}));
		}
		if(firstMapType){
			obj.vendorContent['setMapTypeId'](firstMapType);
		}
		obj['zoom'](0);
		obj['focus'](0, 0, 0);
	}

	google3.prototype = new renderer;

	google3.prototype.GLatLng2gridPoint = function(pos){
		var size = this.gridConfig['size'];
		return new gridPoint(
			pos.lng() / (90.0 / size['width']),
			(size['height'] - (-pos.lat() / (90.0 / size['height'])))
		);
	}
)(window);