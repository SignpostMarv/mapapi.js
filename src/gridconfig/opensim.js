/**
* @license License and Terms of Use
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
		mapapi = window['mapapi'],
		xhr    = window['XMLHttpRequest'],
		JSON   = window['JSON']
	;
	if(mapapi == undefined){
		throw 'mapapi.js is not loaded.';
	}else if(xhr == undefined){
		throw 'XMLHttpRequest not present';
	}else if(JSON == undefined){
		throw 'JSON not present';
	}
	var
		gridPoint   = mapapi['gridPoint'],
		tileSource  = mapapi['tileSource'],
		gridConfig  = mapapi['gridConfig'],
		gridConfigs = (mapapi['gridConfigs'] = mapapi['gridConfigs'] || {})
	;

	gridConfigs['opensim'] = function(uri, success, fail){
		var
			fail    = fail || function(e){
				throw e;
			},
			req     = undefined,
			origUri = uri,
			p9000   = ':9000',
			p8002   = ':8002',
			testing = 0,
			open    = function(){
				req = new xhr;
				req['onload'] = function(e){
					var
						resp
					;
					resp = JSON['parse'](e['target']['responseText']);
					if(resp && resp['hasOwnProperty']('config')){
						resp = resp['config'];
						['HTTP', 'WebSocket', 'MapImageURI'].forEach(function(e){
							if(!resp['hasOwnProperty'](e)){
								fail('Config missing required property (' + e + ')');
							}
						});
						var
							ts = new tileSource({
								'copyright' : 'foo',
								'label'     : 'Land & Objects'
							}),
							opensim = new gridConfig({
								'tileSources' : [
									ts
								],
								'maxZoom'    : 7,
								'pos2region' : function(pos, success, fail){
									var
										pos    = gridPoint['fuzzy'](pos);
										x      = Math.floor(pos['x']),
										y      = Math.floor(pos['y']),
										apireq = new xhr
									;
									apireq['onload'] = function(e){
										var
											resp      = JSON['parse'](e.target.responseText),
											isSuccess = true
										;
										if(resp['hasOwnProperty']('error')){
											fail(resp['error']);
										}else{
											['x','y','region'].forEach(function(e){
												if(!resp['hasOwnProperty'](e)){
													isSuccess = false;
												}
											});
											if(!isSuccess){
												fail('API call was missing required properties');
											}else{
												success({
													'pos'    : gridPoint['fuzzy'](resp),
													'region' : resp['region']
												});
											}
										}
									};
									apireq['onerror'] = function(e){
										fail(e);
									};
									apireq['open']('GET', uri + '/pos2region/' + escape(x) + '/' + escape(y), true);
									apireq['send']();
								},
								'region2pos' : function(region, success, fail){
									var
										apireq = new xhr
									;
									apireq['onload']  = function(e){
										var
											resp      = JSON['parse'](e.target.responseText),
											isSuccess = true
										;
										if(resp['hasOwnProperty']('error')){
											fail(resp['error']);
										}else{
											['x','y','region'].forEach(function(e){
												if(!resp['hasOwnProperty'](e)){
													isSuccess = false;
												}
											});
											if(!isSuccess){
												fail('API call was missing required properties');
											}else{
												success({
													'pos'    : gridPoint['fuzzy'](resp),
													'region' : resp['region']
												});
											}
										}
									};
									apireq['onerror'] = function(e){
										fail(e);
									};
									apireq['open']('GET', uri + '/region2pos/' + escape(region), true);
									apireq['send']();
								}
							})
						;
						ts['getTileURL'] = function(pos, zoom){
							var
								pos                   = gridPoint['fuzzy'](pos),
								sl_zoom               = Math.floor(zoom + 1),
								regions_per_tile_edge = Math.pow(2, sl_zoom - 1),
								x                     = pos['x'],
								y                     = pos['y']
							;
							x -= x % regions_per_tile_edge;
							y -= y % regions_per_tile_edge;

							if(x < 0 || y < 0){
								return null;
							}
							return [resp['MapImageURI'] + '/map', sl_zoom, x, y, "objects.jpg"].join("-");
						};
						if(success){
							success(opensim);
						}
					}else{
						fail('HTTP access to URI successful, no config object found (' + uri + ')');
					}
				};
				req['onerror'] = function(e){
					if(!/([^\:])+\:\d+/.test(origUri)){
						if(uri == origUri){
							testing = 1;
							uri = uri['replace'](/^(https?\:\/\/)([^\/]+)(.*)/,function(m,m1,m2,m3){
								return m1 + m2 + p9000 + m3;
							});
							open();
						}else if(testing == 1){
							testing = 2;
							uri = uri['replace'](/^(https?\:\/\/)([^\/]+)(.*)/,function(m,m1,m2,m3){
								return m1 + m2 + 8002 + m3;
							});
							open();
						}else{
							fail(e);
						}
					}
				}
				req['open']('GET', uri, true);
				req['send']();
			}
		;
		open();
	};
})();
