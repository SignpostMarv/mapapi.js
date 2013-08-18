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
		gridConfig  = mapapi['gridConfig'],
		gridConfigs = (mapapi['gridConfigs'] = mapapi['gridConfigs'] || {})
	;
	
	gridConfigs['opensim'] = function(uri){
		var
			req = new xhr
		;
		req['onload'] = function(e){
			var
				resp
			;
			resp = JSON['parse'](e['target']['responseText']);
			if(resp && resp['hasOwnProperty']('config')){
				resp = resp['config'];
				['HTTP', 'WebSocket', 'MapImageURI'].forEach(function(e){
					if(!resp['hasOwnProperty'](e)){
						throw 'Config missing required property (' + e + ')';
					}
				});
				var
					opensim = new gridConfig({
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
				opensim.pos2region({'x':1000, 'y':1000}, function(e){
					console.log(['pos2region success', e]);
				}, function(e){
					console.log(['pos2region fail', e]);
				});
				opensim.region2pos('test', function(e){
					console.log(['pos2region success', e]);
				}, function(e){
					console.log(['pos2region fail', e]);
				});
			}else{
				throw 'HTTP access to URI successful, no config object found (' + uri + ')';
			}
		};
		req['onerror'] = function(e){
			throw e;
		}
		req['open']('GET', uri, true);
		req['send']();
	};
})();