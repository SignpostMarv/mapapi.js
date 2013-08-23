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
								;
								if(sw < bounds[i]['sw']){
									bounds[i]['sw'] = sw;
								}
								if(ne > bounds[i]['ne']){
									bounds[i]['ne'] = ne;
								}
							}
						}
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
				bounds = this['bounds'][region],
				sw     = bounds['sw'],
				ne     = bounds['ne']
			;
			success({
				'pos'    : gridPoint['fuzzy']([
					sw['x'] + ((ne['x'] - sw['x']) / 2.0),
					sw['y'] + ((ne['y'] - sw['y']) / 2.0)
				]),
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
				sw = obj['bounds'][e['region']]['sw']
			;
			success({
				'internal' : gridPoint['fuzzy']([
					e['pos']['x'] - sw['x'],
					e['pos']['y'] - sw['y']
				]),
				'pos'    : e['pos'],
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
					sw = obj['bounds'][e['region']]['sw'],
					ne = obj['bounds'][e['region']]['ne']
				;
				if(internal['x'] > ne['x'] || internal['y'] > ne['y']){
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
							sw['x'] + internal['x'],
							sw['y'] + internal['y']
						])
					});
				}
			}
		}, fail);
	}
	mapapi['polyregion'] = polyregion;
})();
