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
		document = window['document'],
		Error    = window['Error'],
		mapapi   = window['mapapi'],
		ui       = mapapi  ? mapapi['ui']     : undefined,
		uiitem   = mapapi  ? mapapi['uiitem'] : undefined,
		section  = ui      ? ui['section']    : undefined,
		stub     = section ? section['stub']  : undefined,
		search   = mapapi  ? mapapi['search'] : undefined,
		id       = 0
	;

	if(!mapapi){
		throw new Error('mapapi.js not loaded');
	}else if(!search){
		throw new Error('mapapi.search not found');
	}else if(!section){
		throw new Error('mapapi.ui.section not found');
	}

	function text(txt){
		return document.createTextNode(txt);
	}

	function element(el, txt){
		var
			el = document.createElement(el)
		;
		if(txt){
			el.appendChild(text(txt));
		}

		return el;
	}

	function searchSection(){
		var
			obj = this
		;
		stub['apply'](obj, arguments);
		obj['searchEngine'] = obj.searchEngine = new search;
		obj.searchEngine['addListener']('added', function(e){
			var
				resultList = obj['content2DOM']()['querySelector']('ul')
			;
			for(var i=0;i<e['values']['length'];++i){
				resultList.appendChild(element('li', e['values'][i]['entry']));
			}
		});
		obj.searchEngine['addListener']('removed', function(e){
			var
				indices = e['indices'],
				resultList = obj['content2DOM']()['querySelector']('ul')
			;
			indices['sort']();
			indices['reverse']();
			indices['forEach'](function(i){
				resultList['removeChild'](resultList['childNodes'][i]);
			});
		});
		window['searchEngineTest'] = obj.searchEngine;
	}

	searchSection.prototype = new stub;
	searchSection.prototype['constructor'] = searchSection;

	searchSection.prototype['DOMClasses'] = [
		'mapapi-ui-search-section'
	];

	searchSection.prototype['search'] = function(term){
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

	searchSection.prototype['content2DOM'] = function(wipe){
		var
			obj = this
		;
		if(wipe || !obj['DOM']){
			var
				DOM = document.createElement('ul'),
				form = document.createElement('form'),
				fieldset = [document.createElement('fieldset'), document.createElement('fieldset')],
				legend   = element('legend', 'Results'),
				label    = element('label', 'Search Terms: '),
				input    = document.createElement('input'),
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
			input.setAttribute('placeholder', input.setAttribute('type', 'search'));
			
			form['onsubmit'] = input['oninput'] = function(e){
				e['preventDefault']();
				e['stopPropagation']();
				obj['search'](input.value);
			}

			DOM['onclick'] = function(e){
				if(e['target']['nodeName'] == 'LI'){
					obj['fire']('click', {'child': e['target']});
					obj.searchEngine['click'](e['target']['textContent']);
				}else{
					obj['fire']('click');
				}
			}

			form.className = obj['DOMClasses']['join'](' ');

			obj['DOM'] = form;
		}
		return obj['DOM'];
	}

	uiitem['searchSection'] = searchSection;
})(window);
