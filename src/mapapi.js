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
	'use strict';
	var
		Array = window['Array']
	;

	if(!Array.prototype['indexOf']){
		Array.prototype['indexOf'] = function(value){
			for(var i=0;i<this.length;++i){
				if(this[i] == value){
					return i;
				}
			}
			return -1;
		}
	}

	if (!Array.prototype.forEach) {
		Array.prototype['forEach'] = function(fn, scope){
			var
				obj = this,
				scope = scope || obj,
				i, len
			;
			for(i=0,len = obj['length'];i<len;++i){
				if(i in obj){
					fn['call'](scope, obj[i], i, obj);
				}
			}
		};
	}

	var
		EventTarget   = window['EventTarget'],
		jsRegex = /(mapapi\.js|mapapi-complete.js)$/,
		mapapi = {
			'utils' : {
				'addClass' : function(node, className){
					var
						classes = (node.className || '').split(' ')
					;
					if(classes.indexOf(className) == -1){
						classes.push(className);
						node.className = classes.join(' ').replace(/^\s+|\s+$/,'');
					}
				},
				'delClass' : function(node, className){
					var
						classes = (node['className'] || '')['split'](' '),
						pos     = classes['indexOf'](className)
					;
					if(pos >= 0){
						classes['splice'](pos, 1);
						node['className'] = classes['join'](' ')['replace'](/^\s+|\s+$/,'');
					}
				},
				'hasClass' : function(node, className){
					return !node ? false : ((node['className'] || '')['split'](' ')['indexOf'](className) >= 0 ? true : false);
				},
				'toggleClass' : function(node, className){
					mapapi['utils'][mapapi['utils']['hasClass'](node, className) ? 'delClass' : 'addClass'](node, className);
				},
				'empty' : function(node){
					while(node['hasChildNodes']()){
						node['removeChild'](node['firstChild']);
					}
					return node;
				},
				'ctype_digit' : function(value){
					return /^\d+$/.test(value + '');
				},
				'ctype_float' : function(value){
					return /^\-?(\d+|\d*\.\d+)$/.test(value + '');
				},
				'createElement' : function(element){
					return document['createElement'](element);
				},
				'createText'    : function(text){
					return document['createTextNode'](text);
				},
				'jsPath' : function(){
					var
						scripts = document.querySelectorAll('head script')
					;
					for(var i=0;i<scripts.length;++i){
						if(jsRegex.test(scripts[i]['src'])){
							return scripts[i]['src'];
						}
					}
					throw new Error('Could not find mapapi.js file');
				},
				'load' : function(things, success){
					var
						needLoaded = things['length'] / 2,
						thingsLoaded = 0
					;
					for(var i=0;i<(things['length'] - 1);i+=2){
						var
							className = things[i + 0]['split']('.'),
							srcFile   = things[i + 1],
							loaded    = !!mapapi[className[0]]
						;
						for(var j=1;j<className['length'];++j){
							loaded = loaded && !!mapapi[className[j]];
						}
						if(loaded){
							++thingsLoaded;
						}else{
							var
								jsPath = mapapi['utils']['jsPath'](),
								jsPath = jsPath['replace'](jsRegex, '') + srcFile,
								js = mapapi['utils']['createElement']('script')
							;
							js['onload'] = function(){
								++thingsLoaded;
								if(thingsLoaded >= needLoaded){
									success();
								}
							}
							js['onreadystatechange'] = function(){
								if(js['readyState'] == 'complete' || js['readyState'] == 'loaded'){
									++thingsLoaded;
									if(thingsLoaded >= needLoaded){
										success();
									}
								}
							}
							js['onerror'] = function(e){
								throw new Error('Could not load ' + js['src']);
							}
							js['src'] = jsPath;
							document.querySelector('head').appendChild(js);
						}
					}
					if(thingsLoaded >= needLoaded){
						success();
					}
				}
			},
			'gridPoint' : function(x, y){
				var obj = this;
				obj['x'] = x;
				obj['y'] = y;
			},
			'size' : function(width, height){
				this['width']  = Math.max(0, width || 0);
				this['height'] = Math.max(0, height || 0);
			},
			'bounds' : function(sw, ne){
				if((sw instanceof gridPoint) == false){
					if(typeof sw == 'object' && sw['x'] != undefined && sw['y'] != undefined){
						sw = new gridPoint(sw['x'], sw['y']);
					}else{
						throw 'South-West point should be an instance of mapapi.gridPoint';
					}
				}else if((ne instanceof gridPoint) == false){
					if(typeof ne == 'object' && ne['x'] != undefined && sw['y'] != undefined){
						ne = new gridPoint(ne['x'], ne['y']);
					}else{
						throw 'North-East point should be an instance of mapapi.gridPoint';
					}
				}
				if(sw['x'] > ne['x']){
					var foo = sw['x'];
					sw['x'] = ne['x'];
					ne['x'] = foo;
				}
				if(sw['y'] > ne['y']){
					var foo = sw['y'];
					sw['y'] = ne['y'];
					ne['y'] = foo;
				}
				this['sw'] = sw;
				this['ne'] = ne;
			},
			'events' : new EventTarget
		},
		gridPoint       = mapapi['gridPoint'],
		bounds          = mapapi['bounds'],
		windowDiscovery = mapapi['utils']['windowDiscovery'],
		ctype_digit     = mapapi['utils']['ctype_digit'],
		ctype_float     = mapapi['utils']['ctype_float']
	;

	bounds.prototype['isWithin'] = function(x, y){
		if(x instanceof gridPoint){
			y = x['y'];
			x = x['x'];
		}
		var
			sw = this['sw'],
			ne = this['ne']
		;
		return (x >= sw['x'] && x <= ne['x'] && y >= sw['y'] && y <= ne['y']);
	}

	bounds.prototype['equals'] = function(value){
		var
			obj = this
		;
		if(value instanceof bounds){
			return (obj['sw']['x'] == value['sw']['x'] && obj['sw']['y'] == value['sw']['y'] && obj['ne']['x'] == value['ne']['x'] && obj['ne']['y'] == value['ne']['y']);
		}
		return false;
	}

	bounds.prototype['intersects'] = function(value,antirecursive){
		if(antirecursive != true){
			antirecursive = false;
		}
		if(value instanceof bounds){
			if(
				this['isWithin'](value['ne']) ||
				this['isWithin'](value['sw']) ||
				this['isWithin'](new gridPoint(value['sw']['x'], value['ne']['y'])) ||
				this['isWithin'](new gridPoint(value['ne']['x'], value['sw']['y']))
			){
				return true;
			}/*else if(
				(value['ne']['y'] < this['ne']['y'] || value['sw']['y'] > this['sw']['y']) &&
				(value['ne']['x'] > this['sw']['x'] || value['sw']['x'] < this['ne']['x'])
			){
				return true;
			}*/else if(antirecursive == false){
				return value['intersects'](this, true);
			}
		}
		return false;
	}

	gridPoint['fuzzy'] = function(value){
		if(!(value instanceof gridPoint)){
			if(ctype_float(value['x']) && ctype_float(value['y'])){
				value = new gridPoint(value['x'] * 1, value['y'] * 1);
			}else if(value instanceof Array && value['length'] == 2 && ctype_float(value[0]) && ctype_float(value[1])){
				value = new gridPoint(value[0] * 1, value[1] * 1);
			}else{
				throw 'value was not an instance of mapapi.gridPoint and was not an object with appropriate properties';
			}
		}
		return value;
	}

	gridPoint['lerp'] = function(a, b, c){
		var
			a = gridPoint['fuzzy'](a),
			b = gridPoint['fuzzy'](b),
			c = +Math.max(0, Math.min(1, c * 1)),
			x1 = a['x'],
			y1 = a['y'],
			x2 = b['x'],
			y2 = b['y']
		;
		return new gridPoint(
			x1 + ((x2 - x1) * c),
			y1 + ((y2 - y1) * c)
		);
	}

	gridPoint.prototype['equals'] = function(value){
		return (value instanceof gridPoint && value['x'] == this['x'] && value['y'] == this['y']);
	}

	gridPoint.prototype['distance'] = function(value){
		return Math.sqrt(this['distanceSquared'](value));
	}

	gridPoint.prototype['distanceSquared'] = function(value){
		var
			value = gridPoint['fuzzy'](value),
			relative = gridPoint['fuzzy']([
				value['x'] - this['x'],
				value['y'] - this['y']
			])
		;
		return Math.abs(Math.pow(relative['x'], 2) + Math.pow(relative['y'], 2));
	}

	gridPoint.prototype['distanceGT'] = function(value, than){
		return gridPoint.prototype['distanceSquared'] > Math.pow(parseFloat(than), 2);
	}

	gridPoint.prototype['distanceGTEQ'] = function(value, than){
		return gridPoint.prototype['distanceSquared'] >= Math.pow(parseFloat(than), 2);
	}

	gridPoint.prototype['distanceLT'] = function(value, than){
		return gridPoint.prototype['distanceSquared'] < Math.pow(parseFloat(than), 2);
	}

	gridPoint.prototype['distanceLTEQ'] = function(value, than){
		return gridPoint.prototype['distanceSquared'] <= Math.pow(parseFloat(than), 2);
	}

	var
		testNode      = window['document']['createElement']('a'),
		testClassList = testNode && testNode['classList'] ? testNode['classList'] : false,
		testClassList = testClassList['add'] && testClassList['remove'] && testClassList['contains']
	;
	if(testClassList){
		mapapi['utils']['addClass'] = function(node, className){
			if((className + '')['indexOf'](' ') > 0){
				className['split'](' ')['forEach'](function(e){
					mapapi['utils']['addClass'](node, e);
				});
			}else{
				node['classList']['add'](className);
			}
		};
		mapapi['utils']['delClass'] = function(node, className){
			if((className + '')['indexOf'](' ') > 0){
				className['split'](' ')['forEach'](function(e){
					mapapi['utils']['delClass'](node, e);
				});
			}else{
				node['classList']['remove'](className);
			}
		};
		mapapi['utils']['hasClass'] = function(node, className){
			return node['classList']['contains'](className);
		};
		mapapi['utils']['toggleClass'] = function(node, className){
			return node['classList']['toggle'](className);
		};
	}

	window['mapapi'] = mapapi;
})(window);