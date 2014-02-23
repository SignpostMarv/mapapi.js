/**
* License and Terms of Use
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
		document      = window['document'],
		navigator     = window['navigator'],
		appendChild   = function(a,b){ return a['appendChild'](b); },
		mapapi        = window['mapapi'],
		mapapiui      = (mapapi != undefined) ? mapapi['ui'] : undefined,
		infoWindow    = mapapi['infoWindow'],
		addClass      = (mapapi != undefined) ? mapapi['utils']['addClass'] : undefined,
		hasClass      = addClass ? mapapi['utils']['hasClass'] : undefined,
		empty         = addClass ? mapapi['utils']['empty'] : undefined
	;
	if(mapapi == undefined){
		throw 'mapapi.js not loaded';
	}else if(mapapiui == undefined){
		throw 'mapapi.ui not loaded';
	}

	var minimalistUI = function(options){
		mapapiui['call'](this, options);
		var
			obj           = this,
			container     = obj['contentNode'],
			sidebars      = obj['sidebars'],
			renderer      = obj['renderer'],
			menu        = this['addSidebar']('Menu', new mapapiui['sidebar']()),
			createElement = mapapi['utils']['createElement'],
			createText    = mapapi['utils']['createText'],
			menuHideShow  = createElement('div'),
			menuMinimised = false,
			zoomcontrol   = createElement('li'),
			testStyleProp = function(prop){
				var
					firstLetter = prop[0],
					found = false
				;
				[firstLetter, 'webkit' + firstLetter['toUpperCase'](), 'moz' + firstLetter['toUpperCase'](), 'o' + firstLetter['toUpperCase'](), 'ms' + firstLetter['toUpperCase']()].forEach(function(e){
					found = found ? found : ((e + prop['substr'](1)) in document['body']['style']);
				});
				return found;
			},
			testInputType = function(type){
				var
					input = document.createElement('input')
				;
				input['setAttribute']('type', type);
				return input['type'] == type;
			}
		;

		function toggleMenu(){
			menuMinimised = !menuMinimised;
			mapapi['utils'][menuMinimised ? 'addClass' : 'delClass'](menu, 'minimised');
			menuHideShow['title'] = menuMinimised ? 'Show' : 'Hide';
			empty(menuHideShow)['appendChild'](createText(menuMinimised ? '«' : '»'));
		}
		addClass(menuHideShow,'toggle-menu');
		toggleMenu();
		menuHideShow['onclick'] = toggleMenu;
		menu['appendChild'](menuHideShow);

		addClass(zoomcontrol, 'zoomcontrol');
		function changeZoom(level){
			if(renderer['smoothZoom']() && /MSIE ([0-9]{1,}[\.0-9]{0,})/.test(navigator['userAgent']) == !1){
				renderer['animate']({
					'zoom' : level
				}, .5);
			}else{
				renderer['zoom'](level);
			}
		}
		if(!testStyleProp('transform') || !testInputType('range')){
			var
				zoomin        = createElement('p', '+'),
				zoomout       = createElement('p', '–')
			;
			zoomin['onclick'] = function(e){
				changeZoom(renderer['zoom']() - 1);
				return false;
			};
			zoomout['onclick'] = function(e){
				changeZoom(renderer['zoom']() + 1);
				return false;
			};
			appendChild(zoomcontrol, zoomin);
			appendChild(zoomcontrol, zoomout);
			addClass(zoomcontrol, 'clipped');
		}else{
			var
				activateZoom = document.createElement('x-slider'),
				changing = false
			;
			activateZoom['type']      = 'range';
			activateZoom['min']       = renderer['minZoom']();
			activateZoom['max']       = renderer['maxZoom']();
			activateZoom['step']      = 0.1;
			activateZoom['value']     = renderer['zoom']();
			activateZoom['setAttribute']('polyfill', 'polyfill');
			activateZoom['setAttribute']('vertical', 'vertical');
			activateZoom['oninput']   = function(){
				changing = true;
				changeZoom(this['value']);
			}
			activateZoom['onmouseup'] = function(){
				changing = false;
			}
			activateZoom['addEventListener'](/WebKit/.test(window['navigator']['userAgent']) ? 'mousewheel' : 'DOMMouseScroll', function(e){
				var d=0;
				if(!e){
					e = window['event']
				}else if(e['wheelDelta']){
					d = e['wheelDelta'] / 120;
					if(window['opera']){
						d = -d;
					}
				}else if(e['detail']){
					d = -e['detail'] / 3;
				}
				if(d){
					var
						zoom = renderer['zoom'](),
						mod  = (d > 0) ? -1 : 1
					;
					changeZoom(zoom + mod);
				}
				if(e['preventDefault']){
					e['preventDefault']();
				}
				e['returnValue'] = false;
				return false;
			}, false);
			addClass(activateZoom, 'activate-zoom');
			renderer['addListener']('bounds_changed', function(){
				var
					zoom = renderer['zoom']()
				;
				if(!changing && activateZoom['value'] != zoom){
					activateZoom['value'] = zoom;
				}
			});
			appendChild(zoomcontrol, activateZoom);
		}
		appendChild(this['sidebarsContainer'], zoomcontrol);

		mapapi['events']['fire']('uiready',{'ui':obj});
	}
	minimalistUI.prototype = new mapapiui;
	minimalistUI.prototype['constructor'] = minimalistUI;
	minimalistUI.prototype['name']        = 'minimalist';
	minimalistUI.prototype['description'] = "Provides a minimalist interface to the map.\nUnfinished, made available for feedback.";

	minimalistUI.prototype['css'] = [
		'ui/minimalist.css',
		'lib/x-tag-slider.min.css'
	];
	

	mapapi['userinterfaces'][minimalistUI.prototype['name']] = minimalistUI;


	function minimalistUIinfoWindow(options){
		infoWindow['call'](this, options);
	}

	minimalistUIinfoWindow.prototype = new infoWindow;
	minimalistUIinfoWindow.prototype['constructor'] = minimalistUIinfoWindow;

	minimalistUIinfoWindow.prototype['csspos'] = function(){
		var
			pos = infoWindow.prototype['csspos']['call'](this);
		;
		pos['x'] -= 16;
		return pos;
	}

	minimalistUI.prototype['infoWindow'] = function(options){
		return new minimalistUIinfoWindow(options);
	}
})(window);