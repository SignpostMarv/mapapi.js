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
	window['mapapi'] = window['mapapi'] || {};
	var
		document      = window['document'],
		EventTarget   = window['EventTarget'],
		createElement = function(a){ return document['createElement'](a); },
		createText    = function(a){ return document['createTextNode'](a); },
		mapapi        = window['mapapi'],
		gridPoint     = mapapi['gridPoint'],
		bounds        = mapapi['bounds'],
		addClass      = mapapi['utils'] ? mapapi['utils']['addClass'] : undefined
	;

	function ui(options){
		if(options == undefined){
			return;
		}
		var
			obj          = this,
			options      = options || {},
			container    = options['container'],
			renderer     = options['renderer'],
			gridConfig   = options['gridConfig'],
			rendererNode = createElement('div'),
			sidebars     = createElement('ul')
		;
		if(container == undefined){
			container = document['body'];
		}
		if(mapapi['renderer'] == undefined){
			throw 'mapapi.js core not loaded';
		}else if(mapapi['gridConfig'] == undefined){
			throw 'mapapi.gridConfig not loaded';
		}else if(gridConfig == undefined){
			throw 'no grid config specified';
		}else if(!(gridConfig instanceof mapapi['gridConfig'])){
			throw 'grid config is not an instance of mapapi.gridConfig';
		}else if(renderer == undefined){
			var
				canvas = createElement('canvas')
			;
			try{
				if(canvas['getContext'] && !!canvas['getContext']('2d')){
					renderer = mapapi['canvasRenderer'];
				}
			}catch(e){}
			if(renderer == undefined){
				renderer = mapapi['google3Renderer'];
			}
			if(renderer == undefined){
				throw 'Could not locate any renderers';				
			}
			renderer = new renderer({
				'container'  : rendererNode,
				'gridConfig' : gridConfig
			});
		}else if(!(renderer instanceof mapapi['renderer'])){
			throw 'Specified renderer is not an instance of mapapi.renderer';
		}
		while(container['hasChildNodes']()){
			container['removeChild'](container['firstChild']);
		}
		container['appendChild'](rendererNode);
		container['appendChild'](sidebars);

		addClass(container, 'mapapi-ui');
		addClass(rendererNode, 'mapapi-ui-renderer');
		addClass(sidebars, 'mapapi-ui-sidebars');

		obj['renderer']     = renderer;
		obj['rendererNode'] = rendererNode;
		obj['contentNode']  = container;
		obj['sidebars']     = sidebars;

		obj.loadCSS();
	}

	ui.prototype.css = [
		'reset.css',
		'ui.css'
	];
	ui.prototype.loadCSS = function(){
		var
			obj     = this,
			head    = document.getElementsByTagName('head')[0],
			scripts = head.getElementsByTagName('script'),
			links   = head.getElementsByTagName('link'),
			regexp  = /./,
			uiregex = /mapapi\.ui\.js$/,
			exregex = /^https?/,
			styles  = [],
			css     = [],
			csspath,
			csspathregex,
			mapuijs,
			cssfound,
			newcss
		;
		for(var i=0;i<links.length;++i){
			if(/\bstylesheet\b/.test(links[i]['rel'])){
				styles.push(links[i]);
			}
		}
		links = [];
		for(var i=0;i<scripts.length;++i){
			if(uiregex.test(scripts[i]['src'])){
				mapuijs = scripts[i]['src'];
			}
		}
		if(mapuijs == undefined){
			throw 'Could not find mapapi.js UI file';
		}else{
			for(var i=0;i<ui.prototype.css.length;++i){
				css.push(ui.prototype.css[i]);
			}
			for(var i=0;i<obj['css']['length'];++i){
				css.push(obj['css'][i]);
			}
			for(var i=0;i<css.length;++i){
				cssfound     = false;
				csspath      = css[i];
				csspathregex = csspath.replace(/\./g,'\.').replace(/\//g,'\/');
				if(exregex.test(csspath)){
					regexp.compile('/^' + csspathregex + '$/');
				}else{
					regexp.compile('/' + csspathregex + '$/');
				}
				for(var j=0;j<styles.length;++i){
					if(regexp.test(styles[i]['href'])){
						cssfound = true;
						break;
					}
				}
				if(!cssfound){
					newcss = createElement('link');
					newcss['setAttribute']('rel','stylesheet');
					newcss['setAttribute']('type','text/css');
					newcss['setAttribute']('href',exregex.test(csspath) ? csspath : mapuijs['replace'](uiregex,csspath));
					head['appendChild'](newcss);
				}
			}
		}
	}

	mapapi['ui'] = ui;
	mapapi['ui'].prototype['css']     = ui.prototype.css;
	mapapi['ui'].prototype['loadCSS'] = ui.prototype.loadCSS;

	function infoWindow(options){
		if(EventTarget == undefined){
			throw 'EventTarget not loaded';
		}
		var
			obj       = this,
			opts      = {},
			options   = options || {},
			content   = options['content'],
			autoFocus = options['autoFocus'] == undefined ? true : !!options['autoFocus'],
			maxWidth  = Math.max(80, options['maxWidth'] || 0),
			position  = options['position'],
			zIndex    = options['zIndex'] || 0
		;

		EventTarget['call'](this); 

		obj['opts'] = opts;

		obj['content'](content);
		obj['position'](position);
		obj['maxWidth'](maxWidth);
		obj['zIndex'](zIndex);

		obj['autoFocus'] = autoFocus;

		obj['DOM'] = undefined;

		obj['rendererEvents'] = {
			'focus_changed'  : [],
			'bounds_changed' : []
		};

		obj['addListener']('content_changed', function(){
			obj['DOM'] = obj['content2DOM']();
		});
		if(content != undefined){
			obj['fire']('content_changed');
		}
	};

	infoWindow.prototype = new EventTarget();
	infoWindow.prototype['constructor'] = infoWindow;

	infoWindow.prototype['close'] = function(){
		var
			obj    = this,
			DOM    = obj['DOM'],
			DOMp   = (DOM != undefined) ? DOM['parentNode'] : undefined,
			ui     = obj['ui'],
			events = obj['rendererEvents']
		;
		if(DOM != undefined && DOMp != undefined){
			DOMp['removeChild'](DOM);
		}
		if(ui && ui['renderer']){
			for(var type in events){
				for(var i=0;i<events[type].length;++i){
					ui['renderer']['removeListener'](type, events[i]);
				}
			}
		}
	}

	infoWindow.prototype['open'] = function(ui){
		if(!ui){
			return;
		}
		var
			obj     = this,
			DOM     = obj['DOM'],
			DOMp    = DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined,
			dest    = ui['contentNode']
		;
		if((ui instanceof mapapi['ui']) == false){
			throw 'ui argument is not an instance of mapapi.ui';
		}
		obj['ui'] = ui;
		if(DOM != undefined && DOMp != undefined && DOMp == dest){
			return;
		}
		if(DOM != undefined){
			if(!!obj['opts']['autoFocus']){
				ui['renderer']['focus'](obj['position']);
			}
			obj['rendererEvents']['focus_changed'].push(ui['renderer']['addListener']('focus_changed', function(){
				if(obj['ui']['renderer']['bounds']()['isWithin'](obj['position']())){
					obj['show']();
				}else{
					obj['hide']();
				}
			}));
			dest['appendChild'](DOM);
			var
				obj      = this,
				renderer = ui['renderer'],
				rcontent = renderer['contentNode'],
				offset   = function(){
					if(!!(DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined)){
						var
							csspos = ui['renderer']['point2px'](obj['position']());
						;
						DOM['style']['left'] = csspos['x'] + 'px';
						DOM['style']['top']  = csspos['y'] - DOM['clientHeight'] + 'px';
					}
				}
			;
			offset();
			obj['rendererEvents']['focus_changed'].push('focus_changed', ui['renderer']['addListener']('focus_changed', offset));
			obj['rendererEvents']['bounds_changed'].push('bounds_changed', ui['renderer']['addListener']('bounds_changed', offset));
		}
	}

	infoWindow.prototype['content'] = function(content){
		var
			opts     = this['opts']
		;
		if(content != undefined){
			if(typeof content != 'string' && !content['getElementById']){
				throw 'Contents are invalid';
			}
			opts['content'] = content;
			this['fire']('content_changed');
		}
		return opts['content'];
	}

	infoWindow.prototype['position'] = function(position){
		var
			opts = this['opts']
		;
		if(position != undefined){
			if((position instanceof gridPoint) == false && typeof position['x'] == 'number' &&  typeof position['y'] == 'number'){
				position = new gridPoint(position['x'], position['y']);
			}
			if((position instanceof gridPoint) == false){
				throw 'No position specified';
			}
			opts['position'] = position;
			this['fire']('position_changed');
		}
		return opts['position'];
	}

	infoWindow.prototype['maxWidth'] = function(maxWidth){
		var
			opts = this['opts']
		;
		if(maxWidth != undefined){
			if(typeof maxWidth != 'number'){
				throw 'max width should be a number';
			}
			opts['maxWidth'] = Math.max(80, maxWidth || 0);
		}
	}

	infoWindow.prototype['zIndex'] = function(zIndex){
		var
			opts = this['opts']
		;
		if(zIndex != undefined){
			if(typeof zIndex != 'number'){
				throw 'zIndex should be number';
			}
			opts['zIndex'] = zIndex;
			this['fire']('zIndex_changed');
		}
		return opts['zIndex'];
	}

	infoWindow.prototype['content2DOM'] = function(){
		var
			obj     = this,
			content = obj['content'](),
			content = content == undefined ? '' : content,
			DOM     = createElement('div'),
			close   = createElement('p')
		;
		addClass(DOM, 'mapapi-ui-infowindow');
		addClass(close, 'mapapi-ui-infowindow-close');
		close['appendChild'](createText('×'));
		close['setAttribute']('title', 'Close');
		if(typeof content == 'string'){
			var
				paragraphs,
				paragraph
			;
			if(/\n/.test(content)){
				paragraphs = content.split("\n");
			}else{
				paragraphs = [content];
			}
			for(var i=0;i<paragraphs.length;++i){
				paragraph = createElement('p');
				paragraph.appendChild(createText(paragraphs[i]));
				DOM.appendChild(paragraph);
			}
		}else if(!!content['appendChild']){
			DOM.appendChild(content);
		}
		DOM.appendChild(close);
		close['onclick'] = function(){
			obj['close']();
		}
		return DOM;
	}

	infoWindow.prototype['hide'] = function(){
		if(this['DOM'] && this['DOM']['parentNode']){
			this['DOM']['style']['visibility'] = 'hidden';
		}
	}

	infoWindow.prototype['show'] = function(){
		if(this['DOM'] && this['DOM']['parentNode']){
			this['DOM']['style']['visibility'] = 'visible';
		}
	}

	mapapi['infoWindow'] = infoWindow;
})(window);