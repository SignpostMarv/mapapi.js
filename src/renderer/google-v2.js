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
	}

	var
		document   = window['document'],
		mapapi     = window['mapapi'],
		SLURL      = window['SLURL'],
		renderer   = mapapi['renderer'],
		gridConfig = mapapi['gridConfig'],
		gridPoint  = mapapi['gridPoint'],
		GEvent     = window['GEvent']
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
		if(!window['GMap2']){
			throw 'Google Maps v2 not loaded';
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

		obj['contentNode'] = document.createElement('div');
		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer');
		mapapi['renderer'].call(obj, options);

		var
			mapTypes = [],
			tileSources = gridConf['tileSources'](),
			copyCollection = new GCopyrightCollection('SecondLife')
		;
		function posZoomToxyZoom(pos, zoom){
			var
				regions_per_tile_edge = Math.pow(2, SLURL['convertZoom'](zoom) - 1),
				result = {
					'x' : pos['x'] * regions_per_tile_edge,
					'y' : pos['y'] * regions_per_tile_edge,
					'zoom' : SLURL['convertZoom'](zoom) - 1
				}
			;

			result['x'] -= result['x'] % regions_per_tile_edge;

			result['y'] = -result['y'];
			result['y'] -= regions_per_tile_edge;
			result['y'] -= result['y'] % regions_per_tile_edge;
			result['y'] = gridConf['size']['height'] + result['y'];

			return result;
		}
		for(var i=0;i<tileSources.length;++i){
			var
				tileSource     = tileSources[i],
				copyCollection = new GCopyrightCollection(gridConf['name']),
				landTilelayer  = new GTileLayer(copyCollection, 10, 16),
				landMap        = new GMapType([landTilelayer], new SLURL.EuclideanProjection(18), tileSource['options']['label'])
			;

			copyCollection.addCopyright(new GCopyright(1, new GLatLngBounds(new GLatLng(0, 0), new GLatLng(-90, 90)), 0, tileSource['options']['copyright']));

			landTilelayer.getTileUrl = function(pos, zoom){
				var
					result = posZoomToxyZoom(pos, zoom);
				;
				return tileSource['getTileURL']({'x':result['x'],'y':result['y']}, result['zoom']);
			}

			landMap.getMinimumResolution = function(){ return tileSource['options']['minZoom']; };
			landMap.getMaximumResolution = function(){ return tileSource['options']['maxZoom']; };

			mapTypes.push(landMap);
		}
		obj.vendorContent  = new GMap2(obj['contentNode'],{
			'mapTypes'        : mapTypes,
			'backgroundColor' : tileSources[0]['options']['backgroundColor']
		});

		obj['scrollWheelZoom'](obj['options']['scrollWheelZoom']);
		obj['smoothZoom'](obj['options']['smoothZoom']);
		obj['dblclickZoom'](obj['options']['dblclickZoom']);
		obj['zoom'](0);
		obj['focus'](0, 0, 0);

		GEvent['addListener'](
			obj.vendorContent,
			'zoomend',
			function(oldZoom, newZoom){
				obj['options']['zoom'] = (SLURL['convertZoom'](newZoom) - 1);
			}
		);

		GEvent['addListener'](
			obj.vendorContent,
			'moveend',
			function(){
				obj['_focus'] = obj.GLatLng2gridPoint(obj.vendorContent['getCenter']());
			}
		);
	}

	google2.prototype = new renderer;

	google2.prototype.gridPoint2GLatLng = function(pos){
		var
			size = this.gridConfig['size'],
			y    = (size['height'] - pos['y'])
		;
		return new GLatLng(
			-y    * (90.0 / size['height']),
			pos['x'] * (90.0 / size['width'])
		);
	}

	google2.prototype.GLatLng2gridPoint = function(pos){
		var size = this.gridConfig['size'];
		return new gridPoint(
			pos.lng() / (90.0 / size['width']),
			(size['height'] - (-pos.lat() / (90.0 / size['height'])))
		);
	}

	google2.prototype['panTo'] = function(pos, y){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, y);
		}
		this.vendorContent['panTo']((pos instanceof SLURL['XYPoint']) ? pos.GetGLatLng() : this.gridPoint2GLatLng(pos));
	}

	google2.prototype['scrollWheelZoom'] = function(flag){
		var vendorContent = this.vendorContent;
		if(flag != undefined){
			flag = !!flag;
			if(flag){
				vendorContent['enableScrollWheelZoom']();
			}else{
				vendorContent['disableScrollWheelZoom']();
			}
		}
		return vendorContent['scrollWheelZoomEnabled']();
	}

	google2.prototype['smoothZoom'] = function(flag){
		var vendorContent = this.vendorContent;
		if(flag != undefined){
			flag = !!flag;
			if(flag){
				vendorContent['enableContinuousZoom']();
			}else{
				vendorContent['disableContinuousZoom']();
			}
		}
		return vendorContent['continuousZoomEnabled']();
	}

	google2.prototype['draggable'] = function(flag){
		var vendorContent = this.vendorContent;
		if(flag != undefined){
			if(flag){
				vendorContent['enableDragging']();
			}else{
				vendorContent['disableDragging']();
			}
		}
		return vendorContent['draggingEnabled']();
	}

	google2.prototype['focus'] = function(pos, zoom, a){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, zoom);
			zoom = a;
		}
		if(zoom == undefined){
			zoom = this['zoom']();
		}
		if(pos){
			zoom = SLURL['convertZoom'](((zoom != undefined) ? zoom : renderer.prototype['zoom'].call(this)) + 1);
			this['_focus'] = pos;
			this.vendorContent['setCenter'](this.gridPoint2GLatLng(pos), zoom);
		}
		return this.GLatLng2gridPoint(this.vendorContent['getCenter']());
	}

	google2.prototype['dblclickZoom'] = function(flag){
		var
			obj  = this,
			opts = obj['options']
		;
		if(flag != undefined){
			flag = !!flag;
			opts['dblclickZoom'] = flag;
			if(flag){
				obj.vendorContent['enableDoubleClickZoom']();
			}else{
				obj.vendorContent['disableDoubleClickZoom']();
			}
		}
		return obj.vendorContent['doubleClickZoomEnabled']();
	}

	mapapi['google2Renderer'] = google2;
})(window);