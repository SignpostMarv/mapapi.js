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
		createElement = function(element){ return document['createElement'](element); },
		createText    = function(text){ return document['createTextNode'](text); },
		appendChild   = function(a,b){ return a['appendChild'](b); },
		mapapi        = window['mapapi'],
		mapapiui      = (mapapi != undefined) ? mapapi['ui'] : undefined,
		addClass      = (mapapi != undefined) ? mapapi['utils']['addClass'] : undefined
	;
	if(mapapi == undefined){
		throw 'mapapi.js not loaded';
	}else if(mapapiui == undefined){
		throw 'mapapi.ui not loaded';
	}

	minimalistUI = function(options){
		mapapiui.call(this, options);
		var
			obj           = this,
			container     = obj['contentNode'],
			sidebars      = obj['sidebars'],
			renderer      = obj['renderer'],
			zoomcontrol   = createElement('li'),
			zoomin        = createElement('p'),
			zoomout       = createElement('p')
		;
		addClass(container, 'mapapi-ui-minimalist');
		addClass(zoomcontrol, 'zoomcontrol');

		appendChild(zoomin , createText('+'));
		appendChild(zoomout, createText('–'));

		function changeZoom(level){
			if(renderer['smoothZoom']()){
				renderer['animate']({
					'zoom' : level
				}, .5);
			}else{
				renderer['zoom'](level);
			}
		}
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
		appendChild(sidebars, zoomcontrol);
	}
	minimalistUI.prototype = new mapapiui;

	minimalistUI.prototype.css = [
		'/ui/minimalist.css'
	];

	mapapi['minimalistUI'] = minimalistUI;
})(window);