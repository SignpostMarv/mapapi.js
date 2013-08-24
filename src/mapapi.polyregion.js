/**
* License and Terms of Use
*
* Copyright (c) 2013 SignpostMarv
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
(function(undefined){
	var
		window = this,
		mapapi = window['mapapi']
	;
	if(mapapi == undefined){
		throw 'mapapi.js is not loaded.';
	}
	var
		Array     = window['Array'],
		gridPoint = mapapi['gridPoint'],
		defaultFail = function(e){
			if(window['console']){
				window['console']['log'](e);
			}else{
				throw e;
			}
		},
		polyregion = function(spec){
			var
				bounds = {},
				lcase  = {}
			;
			for(var i in spec){
				if(spec['hasOwnProperty'](i)){
					if(!(spec[i] instanceof Array)){
						throw 'Polyregion spec children must be arrays';
					}else{
						bounds[i] = spec[i][0]['bounds'];
						for(var j=0;j<spec[i]['length'];++j){
							if(!(mapapi['shape']['isShape'](spec[i][j]))){
								throw 'Polyregion spec children can only contain shapes';
							}else{
								var
									ne = spec[i][j]['bounds']['ne'],
									sw = spec[i][j]['bounds']['sw']
									tne = bounds[i]['ne'],
									tsw = bounds[i]['sw']
								;
								if(ne['x'] > tne['x'] || ne['y'] > tne['y']){
									bounds[i]['ne'] = ne;
								}
								if(sw['x'] < tsw['x'] || sw['y'] < tsw['y']){
									bounds[i]['sw'] = sw;
								}
							}
						}
						bounds[i]['sw'] = gridPoint['fuzzy']([bounds[i]['sw']['x'], bounds[i]['sw']['y']]);
						bounds[i]['ne'] = gridPoint['fuzzy']([bounds[i]['ne']['x'], bounds[i]['ne']['y']]);
						lcase[i['toLocaleLowerCase']()] = i;
					}
				}
			}
			this['regions'] = spec;
			this['bounds']  = bounds;
			this.lcase = lcase;
		}
	;
	polyregion.prototype['pos2region'] = function(pos, success, fail){
		var
			fail    = fail || defaultFail,
			pos     = gridPoint['fuzzy'](pos),
			regions = this['regions']
		;
		for(var i in regions){
			if(regions['hasOwnProperty'](i)){
				for(var j=0;j<regions[i]['length'];++j){
					if(regions[i][j]['withinShape'](pos)){
						success({'pos':pos, 'region': i});
						return;
					}
				}
			}
		}
		fail({'pos':pos, 'error':'No region at specified coordinates'});
	};
	polyregion.prototype['region2pos'] = function(region, success, fail){
		var
			fail = fail || defaultFail,
			i    = region['toLocaleLowerCase']()
		;
		if(this.lcase['hasOwnProperty'](i)){
			var
				region = this.lcase[i],
				bounds = this['bounds'][this.lcase[i]],
				sw     = bounds['sw']
			;
			success({
				'pos'    : gridPoint['fuzzy']([sw['x'], sw['y']]),
				'region' : region
			});
		}else{
			fail({'region':region, 'error': 'No region with the specified name found'});
		}
	};
	polyregion.prototype['pos2internal'] = function(pos, success, fail){
		var
			obj = this
		;
		this['pos2region'](pos, function(e){
			var
				region = e['region'],
				bounds = obj['bounds'][region],
				sw     = bounds['sw'],
				ne     = bounds['ne'],
				width  = ne['x'] - sw['x'],
				height = ne['y'] - sw['y'],
				pWidth = pos['x'] - sw['x'],
				pHeight = pos['y'] - sw['y']
			;
			success({
				'internal' : gridPoint['fuzzy']([
					(pWidth / width) * 1000,
					(pHeight / height) * 1000
				]),
				'pos'    : pos,
				'region' : e['region']
			});
		}, fail);
	};
	polyregion.prototype['internal2pos'] = function(region, internal, success, fail){
		var
			obj      = this,
			fail     = fail || defaultFail,
			internal = gridPoint['fuzzy'](internal)
		;
		this['region2pos'](region, function(e){
			if(internal['x'] < 0 || internal['y'] < 0){
				fail({
					'region'   : e['region'],
					'internal' : internal,
					'error'    : 'Internal coordinates cannot be negative.'
				});
			}else{
				var
					bounds = obj['bounds'][e['region']],
					sw = bounds['sw'],
					ne = bounds['ne']
				;
				if(internal['x'] > 1000 || internal['y'] > 1000){
					fail({
						'region'   : e['region'],
						'internal' : internal,
						'error'    : 'Internal coordinates are outside the bounds of the region.'
					});
				}else{
					success({
						'region'   : e['region'],
						'internal' : internal,
						'pos'      : gridPoint['fuzzy']([
							e['pos']['x'] + ((ne['x'] - sw['x']) * (internal['x'] / 1000.0)),
							e['pos']['y'] + ((ne['y'] - sw['y']) * (internal['y'] / 1000.0))
						])
					});
				}
			}
		}, fail);
	}
	mapapi['polyregion'] = polyregion;
})();
