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
		GLatLng     = google_maps['LatLng'],
		renderer    = mapapi['renderer'],
		gridConfig  = mapapi['gridConfig'],
		gridPoint   = mapapi['gridPoint'],
		euclid      = function(gc){
			this.gridConf = gc;
			this.hscale   = 180.0 / this.gridConf['size']['width'];
			this.vscale   = 90.0  / this.gridConf['size']['height'];
		}
	;
	euclid.prototype['fromLatLngToPoint'] = function(latlng, opt){
		var point = opt || new gridPoint(0,0);
		point['x'] = latlng['lng']() / this.hscale;
		point['y'] = latlng['lat']() / this.hscale;
		return point;
	}
	euclid.prototype['fromPointToLatLng'] = function(point){
		return new GLatLng(point['y'] * this.hscale, point['x'] * this.hscale);
	}
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
		function regionsPerTileEdge(zoom){
			return Math.pow(2, obj.convertZoom(zoom) - 1);
		}
		function posZoomToxyZoom(pos, zoom){
			var
				regions_per_tile_edge = regionsPerTileEdge(zoom),
				result = {
					'x' : pos['x'] * regions_per_tile_edge,
					'y' : pos['y'] * regions_per_tile_edge,
					'zoom' : obj.convertZoom(zoom) - 1
				}
			;

			result['x'] -= result['x'] % regions_per_tile_edge;

			result['y'] = -result['y'];
			result['y'] -= regions_per_tile_edge;
			result['y'] -= result['y'] % regions_per_tile_edge;

			return result;
		}

		obj['contentNode'] = document.createElement('div');
		mapapi['utils']['addClass'](obj['contentNode'], 'mapapi-renderer');
		mapapi['renderer'].call(obj, options);

		if(obj.gridConfig['tileSources']()[0]['options']['backgroundColor']){
			options['backgroundColor'] = obj.gridConfig['tileSources']()[0]['options']['backgroundColor'];
		}
		options['scrollwheel']        = obj['options']['scrollWheelZoom'] || !0;
		options['mapTypeControl']     = options['mapTypeControl']         || !1;
		options['overviewMapControl'] = options['overviewMapControl']     || !1;
		options['panControl']         = options['panControl']             || !1;
		options['rotateControl']      = options['rotateControl']          || !1;
		options['scaleControl']       = options['scaleControl']           || !1;
		options['streetViewControl']  = options['streetViewControl']      || !1;
		options['zoomControl']        = options['zoomControl']            || !1;

		obj.vendorContent = new google_maps['Map'](obj['contentNode'], options);


		var
			firstMapType = false,
			mapTypes     = {},
			mapTypeIds   = [],
			size   = this.gridConfig['size'],
			hw     = size['width'] / 2.0,
			hh     = size['height'] / 2.0
		;
		for(var i=0;i<obj.gridConfig['tileSources']()['length'];++i){
			var
				tileSource = obj.gridConfig['tileSources']()[i],
				label      = tileSource['options']['label']
			;
			mapTypeIds.push(label);
			mapTypes[label] = new google_maps['ImageMapType']({
				'maxZoom'    : tileSource['options']['maxZoom'],
				'minZoom'    : tileSource['options']['minZoom'],
				'tileSize'   : new google_maps['Size'](tileSource['size']['width'], tileSource['size']['height']),
				'isPng'      : (tileSource['options']['mimeType'] == 'image/png'),
				'opacity'    : tileSource['options']['opacity'],
				'getTileUrl' : function(pos,zoom){
					var
						newpos = posZoomToxyZoom(pos,zoom),
						url = tileSource['getTileURL']({'x':newpos['x'], 'y':newpos['y']}, newpos['zoom'])
					;
//					console.log(url);
					return url;
				},
				'alt'        : label,
				'name'       : tileSource['options']['label'],
			});
			mapTypes[label]['projection'] = new euclid(gridConf);
			mapTypes[label]['getTileUrl'] = tileSource['getTileURL'];
		}
		for(var i in mapTypes){
			firstMapType = firstMapType ? firstMapType : label;
			obj.vendorContent['mapTypes']['set'](i,mapTypes[i]);
		}
		obj.vendorContent['setOptions']({
			'mapTypeIds' : mapTypeIds,
			'mapTypeControlOptions' : {
				'mapTypeIds' : mapTypeIds
			}
		});
		if(firstMapType){
			obj.vendorContent['setMapTypeId'](firstMapType);
		}
	}


	google3.prototype = new renderer;

	google3.prototype.convertZoom = function(zoom){
		return (this.gridConfig['maxZoom'] + 1) - zoom;
	}

	google3.prototype.gridPoint2GLatLng = function(pos){
		var
			size   = this.gridConfig['size'],
			hw     = size['width'] / 2.0,
			hh     = size['height'] / 2.0,
			hscale = 180.0 / size['height'],
			wscale = 360.0 / size['width'],
			lat   = (pos['y'] * 2) * hscale,
			lng   = (pos['x'] * 2) * hscale
		;
		return new GLatLng(0 - lat, lng);
	}

	google3.prototype.GLatLng2gridPoint = function(pos){
		var
			size   = this.gridConfig['size'],
			hw     = size['width'] / 2.0,
			hh     = size['height'] / 2.0,
			hscale = 180.0 / size['height'],
			wscale = 360.0 / size['width']
		;
		return new gridPoint(
			(pos.lng() / hscale) + hw,
			(pos.lat() / hscale) + hh
		);
	}

	google3.prototype['zoom'] = function(zoom){
		if(zoom != undefined){
			this.vendorContent['setZoom'](this.convertZoom(zoom));
		}
		return this.convertZoom(this.vendorContent['getZoom']());
	}
	google3.prototype['focus'] = function(pos, zoom, a){
		if(typeof pos == 'number'){
			pos = new gridPoint(pos, zoom);
			zoom = a;
		}
		if(pos instanceof gridPoint){
			this.vendorContent['setCenter'](this.gridPoint2GLatLng(pos));
		}
		if(zoom != undefined){
			this['zoom'](zoom);
		}
		return this['GLatLng2gridPoint'](this.vendorContent['getCenter']());
	}
	google3.prototype['scrollWheelZoom'] = function(flag){
		var
			obj = this
		;
		if(flag != undefined){
			obj.vendorContent['setOptions']({'scrollwheel':!!flag});
		}
		return obj.vendorContent['scrollwheel'];
	}

	mapapi['google3Renderer'] = google3;
})(window);