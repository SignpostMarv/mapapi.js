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

	var
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
				'windowDiscovery' : function(checkThis){
					for(var i=0;i<checkThis.length;++i){
						if(window[checkThis[i]] != undefined){
							return window[checkThis[i]];
						}
					}
					return undefined;
				},
				'empty' : function(node){
					while(node['hasChildNodes']()){
						node['removeChild'](node['firstChild']);
					}
					return node;
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
			}
		},
		gridPoint       = mapapi['gridPoint'],
		bounds          = mapapi['bounds'],
		windowDiscovery = mapapi['utils']['windowDiscovery']
	;

	window['IndexedDB']      = windowDiscovery(['IndexedDB', 'mozIndexedDB', 'webkitIndexedDB']);
	window['IDBTransaction'] = windowDiscovery(['IDBTransaction', 'webkitIDBTransaction']);
	window['IDBObjectStore'] = windowDiscovery(['IDBObjectStore', 'webkitIDBObjectStore']);

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
			if(typeof value['x'] == 'number' && typeof value['y'] == 'number'){
				value = new gridPoint(value['x'], value['y']);
			}else{
				throw 'value was not an instance of mapapi.gridPoint and was not an object with appropriate properties';
			}
		}
		return value;
	}

	window['mapapi'] = mapapi;
})(window);