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
	'use strict';
	var
		Error    = window['Error'],
		mapapi   = window['mapapi'],
		uiitem   = mapapi['uiitem'] || undefined,
		list     = uiitem ? uiitem['list'] : undefined,
		search   = mapapi ? mapapi['search'] : undefined,
		element  = mapapi ? mapapi['utils']['createElement'] : undefined,
		id       = 0
	;

	if(!mapapi){
		throw new Error('mapapi.js not loaded');
	}else if(!search){
		throw new Error('mapapi.search not found');
	}else if(!list){
		throw new Error('mapapi.uiitem.list not found');
	}

	function searchList(options){
		this.searchEngine = new search;
		list['call'](this, options);
	}

	searchList.prototype = new list;
	searchList.prototype['constructor'] = searchList;

	searchList.prototype['DOMClasses'] = [
		'mapapi-ui-search-list'
	];

	searchList.prototype['search'] = function(term){
		var
			obj = this
		;
		function reset(){
			var
				lis = obj['content2DOM']()['querySelectorAll']('li')
			;
			for(var i=0;i<lis.length;++i){
				mapapi['utils']['delClass'](lis[i], 'not-matching matching exact');
			}
		}
		obj.searchEngine['search'](term, function(e){
			reset();
			var
				lis = obj['content2DOM']()['querySelectorAll']('li'),
				results = e['partial']
			;
			if((!results || results['length'] < 1) && e['results'] && e['results']['length'] >= 1){
				results = e['results'];
			}
			if(results['length'] >= 1){
				for(var i=0;i<lis['length'];++i){
					mapapi['utils']['addClass'](lis[i],
						((results['indexOf'](lis[i]['textContent']) < 0) ? 'not-' : '') +
						'matching'
					);
					if(e['exact']['indexOf'](lis[i]['textContent']) >= 0){
						mapapi['utils']['addClass'](lis[i], 'exact');
					}
				}
			}else if(e['term']['length'] > 0){
				for(var i=0;i<lis['length'];++i){
					mapapi['utils']['addClass'](lis[i], 'not-matching');
				}
			}
		}, reset);
	}

	searchList.prototype['content'] = function(){
		var
			obj = this
		;
		if(arguments.length > 0){
			obj.searchEngine['removeAll']();
			obj.searchEngine['add']['apply'](obj.searchEngine, arguments[0]);
		}
		return list.prototype['content']['apply'](obj, arguments);
	}

	searchList.prototype['content2DOM'] = function(wipe){
		var
			obj = this
		;
		if(wipe || !obj['DOM']){
			var
				DOM = list.prototype['content2DOM']['call'](obj, true),
				form = element('form'),
				fieldset = [element('fieldset'), element('fieldset')],
				legend   = element('legend', 'Results'),
				label    = element('label', 'Search Terms: '),
				input    = element('input'),
				button   = element('button', 'Search')
			;
			
			[label, input, button].forEach(function(e){
				fieldset[0].appendChild(e);
			});
			fieldset[1].appendChild(legend);
			fieldset[1].appendChild(DOM);
			fieldset.forEach(function(e){
				form.appendChild(e);
			});
			
			label.setAttribute('for', input.id = 'mapapi-ui-search-input-' + (++id));
			input.setAttribute('placeholder', input.type = 'search');
			
			form['onsubmit'] = input['oninput'] = function(e){
				e['preventDefault']();
				e['stopPropagation']();
				obj['search'](input.value);
			}

			DOM.className  = list.prototype['DOMClasses']['join'](' ');
			form.className = obj['DOMClasses']['join'](' ');

			obj['DOM'] = form;
		}
		return obj['DOM'];
	}

	uiitem['searchList'] = searchList;
})(window);
