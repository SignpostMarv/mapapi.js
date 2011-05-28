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

	if(!window['Array'].prototype['indexOf']){
		window['Array'].prototype['indexOf'] = function(value){
			for(var i=0;i<this.length;++i){
				if(this[i] == value){
					return i;
				}
			}
			return -1;
		}
	}

	var mapapi = {
		'utils' : {
			'addClass' : function(node, className){
				var
					classes = (node.className || '').split(' ')
				;
				if(classes.indexOf(className) == -1){
					classes.push(className);
					node.className = classes.join(' ').replace(/^\s+|\s+$/,'');
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
			if((sw instanceof mapapi['gridPoint']) == false){
				if(typeof sw == 'object' && sw['x'] != undefined && sw['y'] != undefined){
					sw = new mapapi['gridPoint'](sw['x'], sw['y']);
				}else{
					throw 'South-West point should be an instance of mapapi.gridPoint';
				}
			}else if((ne instanceof mapapi['gridPoint']) == false){
				if(typeof ne == 'object' && ne['x'] != undefined && sw['y'] != undefined){
					ne = new mapapi['gridPoint'](ne['x'], ne['y']);
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
	}

	mapapi['bounds'].prototype['isWithin'] = function(x, y){
		if(x instanceof mapapi['gridPoint']){
			y = x['y'];
			x = x['x'];
		}
		var
			sw = this['sw'],
			ne = this['ne']
		;
		return (x >= sw['x'] && x <= ne['x'] && y >= sw['y'] && y <= ne['y']);
	}

	mapapi['bounds'].prototype['equals'] = function(bounds){
		var
			obj = this
		;
		if(bounds instanceof mapapi['bounds']){
			return (obj['sw']['x'] == bounds['sw']['x'] && obj['sw']['y'] == bounds['sw']['y'] && obj['ne']['x'] == bounds['ne']['x'] && obj['ne']['y'] == bounds['ne']['y']);
		}
		return false;
	}

	window['mapapi'] = mapapi;
})(window);