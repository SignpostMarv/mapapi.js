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
(function(window, undefined){
	var
		mapapi          = window['mapapi'],
		item            = mapapi ? mapapi['uiitem'] : undefined
	;
	if(mapapi == undefined){
		throw new Error('mapapi not loaded');
	}else if(item == undefined){
		throw new Error('mapapi.uiitem not found');
	}

	var
		createElement   = mapapi['utils']['createElement'],
		document        = window['document'],
		gridPoint       = mapapi ? mapapi['gridPoint']['fuzzy'] : undefined,
		clickToggle     = function(e){
			if(this['DOM']){
				mapapi['utils']['toggleClass'](e['child'] ? e['child'] : this['DOM'], 'toggled');
			}
		}
	;

	function list(options){
		var
			obj     = this,
			pos     = (options && options['position']) ? options['position'] : undefined,
			content = (options && options['content'])
		;
		if(pos){
			delete options['pos'];
		}
		item['call'](obj, options);
		if(pos){
			obj['position'](gridPoint(pos));
		}
		if(content){
			obj['content'](content);
		}
		obj['addListener']('click', clickToggle);
	}
	list.prototype = new item;
	list.prototype['constructor'] = list;

	list.prototype['DOMClasses'] = [
		'mapapi-ui-list',
		'toggled'
	];

	list.prototype['zIndex'] = function(){
		return 1;
	}

	list.prototype['content'] = function(content){
		if(content){
			var
				Array           = window['Array'],
				ArrayBufferView = window['ArrayBufferView']
			;
			if(!(content instanceof Array) && !(ArrayBufferView && content instanceof ArrayBufferView)){
				throw new Error('Content can only be an Array');
			}
			this['opts']['content'] = content;
			this['fire']('content_changed');
		}

		return this['opts']['content'];
	}

	list.prototype['content2DOM'] = function(wipe){
		var
			obj = this
		;
		if(wipe || !obj['DOM']){
			var
				DOM = createElement('ul'),
				wrapper = createElement('div')
			;
			obj['content']().forEach(function(e){
				DOM['appendChild'](createElement('li', e + ''));
			});

			wrapper['onclick'] = function(e){
				if(e['target']['nodeName'] == 'LI'){
					obj['fire']('click', {'child': e['target']});
				}else{
					obj['fire']('click');
				}
			}

			DOM['className'] = 'mapapi-ui-item-contents';

			wrapper['appendChild'](DOM);
			wrapper['className'] = obj['DOMClasses']['join'](' ');

			obj['DOM'] = wrapper;
		}

		return obj['DOM'];
	}

	list.prototype['focus'] = function(){
		var
			obj = this,
			pos = obj['csspos']()
		;
		if(obj['ui'] && obj['DOM']){
			pos['x'] += (obj['DOM']['clientWidth'] / 2);
			pos['y'] += (obj['DOM']['clientHeight'] / 2);
			obj['ui']['renderer']['focus'](
				obj['ui']['renderer']['px2point'](pos['x'], pos['y'])
			);
		}
	}

	item['list'] = list;
})(window);
