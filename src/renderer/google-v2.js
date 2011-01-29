/**
* @license License and Terms of Use
*
* Copyright (c) 2011 SignpostMarv
* Copyright (c) 2010 Linden Research, Inc.
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
	}else if(!window['GMap2']){
		throw 'Google Maps v2 not loaded';
	}

	var
		document  = window['document'],
		mapapi    = window['mapapi'],
		renderer  = mapapi['renderer']
	;


	function each(array, cb){
		for(var i=0;i<array.length;++i){
			cb(array[i],i);
		}
	}

/**
*	@constructor
*/
	var google2 = function(options){
		var
			obj        = this,
			options    = options || {},
			gridConfig = options['gridConfig']
		;
		if((gridConfig instanceof mapapi['gridConfig']) == false){
			throw 'Grid Configuration object must be instance of mapapi.gridConfig';
		}

		obj['contentNode'] = document.createElement('div');
		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer');
		mapapi['renderer'].call(obj, options);


		var
			mapTypes = [],
			tileSources = gridConfig['tileSources'](),
			copyCollection = new GCopyrightCollection('SecondLife')
		;
		for(var i=0;i<tileSources.length;++i){
			var
				copyCollection = new GCopyrightCollection(gridConfig['name']),
				landTilelayer  = new GTileLayer(copyCollection, 10, 16),
				landMap        = new GMapType([landTilelayer], new SLURL.EuclideanProjection(18), tileSources[i]['label'])
			;

			copyCollection.addCopyright(new GCopyright(1, new GLatLngBounds(new GLatLng(0, 0), new GLatLng(-90, 90)), 0, tileSources[i]['copyright']));

			landTilelayer.getTileUrl = tileSources[i]['getTileURL'];

			landMap.getMinimumResolution = function(){ return SLURL.convertZoom(SLURL.minZoomLevel); };
			landMap.getMaximumResolution = function(){ return SLURL.convertZoom(SLURL.maxZoomLevel); };

			mapTypes.push(landMap);
		}

		obj.vendorContent  = new GMap2(obj['contentNode'],{
			"mapTypes"        : mapTypes,
			"backgroundColor" : SLURL.backgroundColor
		});

		var
			gmap = obj.vendorContent
		;
		gmap.setCenter(new GLatLng(0, 0), 16);
	}

	google2.prototype = new renderer;

	google2.prototype['panTo'] = function(pos){
		this.vendorContent['panTo'](pos.GetGLatLng());
	}

	mapapi['google2Renderer'] = google2;
})(window);