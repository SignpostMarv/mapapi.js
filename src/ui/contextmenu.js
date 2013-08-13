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
		window   = this,
		mapapi   = window['mapapi'],
		mapapiui = (mapapi != undefined) ? mapapi['ui'] : undefined
	;
	if(!('HTMLMenuItemElement' in window && 'HTMLCommandElement' in window)){
		throw 'context menu not supported.';
	}else if(mapapi == undefined){
		throw 'mapapi.js not loaded';
	}else if(mapapiui == undefined){
		throw 'mapapi.ui not loaded';
	}
	var
		document      = window['document'],
		sidebar       = mapapiui['sidebar'],
		section       = mapapiui['section'],
		infoWindow    = mapapi['infoWindow'],
		createElement = function(element){ return document['createElement'](element); },
		createText    = function(text){ return document['createTextNode'](text); },
		appendChild   = function(a,b){ return a['appendChild'](b); },
		addClass      = (mapapi != undefined) ? mapapi['utils']['addClass'] : undefined,
		hasClass      = addClass ? mapapi['utils']['hasClass'] : undefined,
		empty         = addClass ? mapapi['utils']['empty'] : undefined,
		trimRegex     = /^\s+|\s+$/g,
		UI            = function(options){
			mapapiui['call'](this, options);
			var
				obj           = this,
				container     = obj['contentNode'],
				sidebars      = obj['sidebars'],
				renderer      = obj['renderer'],
				menu          = obj['addSidebar']('Menu', new mapapiui['sidebar']()),
				sBarOriginal  = obj['sidebarsContainer'],
				sBarReplacer  = createElement('div'),
				menuHideShow  = createElement('div'),
				menuMinimised = false,
				zoomcontrol   = createElement('li'),
				zoomin        = createElement('p'),
				zoomout       = createElement('p')
			;
			sBarReplacer['style']['display'] = 'none';
			while(sBarOriginal['hasChildNodes']()){
				appendChild(sBarReplacer, sBarOriginal['firstChild']);
			}
			sBarOriginal['parentNode']['replaceChild'](sBarReplacer, sBarOriginal);
			mapapi['events']['fire']('uiready',{'ui':obj});
		}
	;
	UI.prototype = new mapapiui;
	UI.prototype['constructor'] = UI;
	UI.prototype['name']        = 'Context Menu';
	UI.prototype['description'] = "Uses the Context Menu instead of adding DOM elements.\nUnfinished, made available for feedback.";


	function sectionsAddedListener(e){
		var
			sections = e['sections']
		;
		if(sections && sections instanceof Array){
			for(var i=0;i<sections['length'];++i){
				if(sections[i] instanceof section){
					var
						menuitem   = createElement('menuitem'),
						subsection = sections[i],
						thisDOM    = this['DOM']
					;
					if(thisDOM != undefined){
						var
							menu = createElement('menu'),
							copyOver = []
						;
						['onclick', 'label', 'id']['forEach'](function(e){
							if(thisDOM[e]){
								menu[e] = thisDOM[e];
							}
						});
						for(var i=0;i<thisDOM['childNodes']['length'];++i){
							copyOver['push'](thisDOM['childNodes'][i]);
						}
						this['DOM']['parentNode']['replaceChild'](menu, this['DOM']);
						this['DOM'] = menu;
						copyOver['forEach'](function(e){
							appendChild(menu, e);
						});
					}
					menuitem['setAttribute']('label', subsection['text']());
					menuitem['onclick'] = function(){
						subsection['fire']('click');
					};
					subsection['DOM'] = menuitem;
					appendChild(this['DOM'], menuitem);
					subsection['addListener']('sectionsadded', sectionsAddedListener);
//					subsection['addListener']('sectionsremoved', sectionsRemovedListener);
				}
			}
		}
	};
	UI.prototype['sidebar2DOM'] = function(sidebarName, sidebarObj){
		if(typeof sidebarName != 'string'){
			throw 'sidebar name should be specified as string';
		}else if(!(sidebarObj instanceof sidebar)){
			throw 'sidebar object should be an instanceof mapapi.ui.sidebar';
		}
		sidebarName = sidebarName['replace'](trimRegex,'');
		if(sidebarName == ''){
			throw 'sidebar name is empty';
		}
		var
			className = sidebarName['toLowerCase']()['replace'](/\s+/g,''),
			menu      = createElement('menu')
		;
		menu['setAttribute']('type', 'context');
		menu['id'] = className + '-' + sidebarObj['ID'];
		addClass(menu, className);
		sidebarObj['DOM'] = menu;
		sidebarObj['addListener']('sectionsadded', sectionsAddedListener);
		return menu;
	}
	
	mapapi['userinterfaces'][UI.prototype['name']] = UI;
})();
