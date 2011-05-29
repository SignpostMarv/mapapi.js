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
		Image         = window['Image'],
		createElement = function(a){ return document['createElement'](a); },
		createText    = function(a){ return document['createTextNode'](a); },
		mapapi        = window['mapapi'],
		gridPoint     = mapapi['gridPoint'],
		bounds        = mapapi['bounds'],
		addClass      = mapapi['utils'] ? mapapi['utils']['addClass'] : undefined,
		delClass      = mapapi['utils'] ? mapapi['utils']['delClass'] : undefined
	;

	function extend(a,b){
		a.prototype = new b;
		a.prototype['constructor'] = a;
	}

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
			markerMngr   = options['markerManager'],
			rendererNode = createElement('div'),
			sidebars     = createElement('ul')
		;
		if(markerMngr == undefined){
			markerMngr = new markerManager;
		}else if(!(markerMngr instanceof markerManager)){
			throw 'marker manager must be an instance of mapapi.markerManager';
		}
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

		obj['renderer']      = renderer;
		obj['rendererNode']  = rendererNode;
		obj['contentNode']   = container;
		obj['sidebars']      = sidebars;
		obj['markerManager'] = markerMngr;

		obj.loadCSS();
	}

	ui.prototype['css'] = [
		'reset.css',
		'ui.css'
	];
	ui.prototype['loadCSS'] = function(){
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

	function uiItem(){
		if(EventTarget == undefined){
			throw 'EventTarget not loaded';
		}
		var
			obj        = this,
			DOMclasses = obj['DOMclasses']
		;
		EventTarget['call'](obj);

		obj['opts'] = {'open':false};

		obj['rendererEvents'] = {
			'focus_changed'  : [],
			'bounds_changed' : []
		};

		obj['DOM'] = undefined;
		obj['addListener']('content_changed', function(){
			obj['DOM'] = obj['content2DOM']();
			for(var i=0;i<DOMclasses['length'];++i){
				addClass(obj['DOM'], DOMclasses[i]);
			}
			if(obj['opts']['open'] == true){
				obj['open'](obj['ui']);
			}
		});
	}
	extend(uiItem, EventTarget);

	uiItem.prototype['DOMclasses'] = [
		'mapapi-ui-item'
	];

	uiItem.prototype['position'] = function(position){
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

	uiItem.prototype['hide'] = function(){
		if(this['DOM'] && this['DOM']['parentNode']){
			this['DOM']['style']['display'] = 'none';
		}
	}

	uiItem.prototype['show'] = function(){
		if(this['DOM'] && this['DOM']['parentNode']){
			this['DOM']['style']['display'] = 'block';
		}
	}

	uiItem.prototype['content'] = function(content){
		var
			opts     = this['opts']
		;
		if(content != undefined){
			if(typeof content != 'string' && !content['appendChild'] && !(content instanceof Image)){
				throw 'Contents are invalid';
			}
			opts['content'] = content;
			this['fire']('content_changed');
		}
		return opts['content'];
	}

	uiItem.prototype['content2DOM'] = function(){
		var
			obj = this,
			content = obj['content'](),
			content = content == undefined ? '' : content,
			DOM     = createElement('div')
		;

		if(typeof content == 'string'){
			var
				paragraphs,
				paragraph
			;
			paragraphs = /\n/.test(content) ? content.split("\n") : [content];
			for(var i=0;i<paragraphs.length;++i){
				paragraph = createElement('p');
				paragraph.appendChild(createText(paragraphs[i]));
				DOM.appendChild(paragraph);
			}
		}else if(content['appendChild'] != undefined || content instanceof Image){
			DOM.appendChild(content);
		}

		addClass(DOM, 'mapapi-ui-item-contents');

		return DOM;
	}

	uiItem.prototype['csspos'] = function(){
		return this['ui']['renderer']['point2px'](this['position']());
	}

	uiItem.prototype['open'] = function(ui){
		if(ui == undefined){
			throw 'UI was not supplied';
		}else if((ui instanceof mapapi['ui']) == false){
			throw 'ui argument is not an instance of mapapi.ui';
		}else if(this['DOM'] != undefined && this['DOM']['parentNode'] != undefined && this['DOM']['parentNode'] == ui['contentNode']){
			throw 'Already open';
		}else if(this['ui'] != undefined && this['ui'] != ui){
			throw 'Already open on another UI instance';
		}
		this['ui'] = ui;
		var
			obj     = this,
			DOM     = obj['DOM'],
			DOMp    = DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined,
			dest    = ui['contentNode']
		;
		if(DOM != undefined){
			if(!!obj['opts']['autoFocus']){
				ui['renderer']['focus'](obj['position']);
			}
			dest['appendChild'](DOM);
			var
				renderer = ui['renderer'],
				rcontent = renderer['contentNode'],
				offset   = function(){
					if(!!(DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined)){
						var
							style     = DOM['style'],
							wasHidden = (style['display'] == 'none'),
							zIndex    = style['zIndex']
						;
						if(wasHidden){
							style['zIndex'] = '-1';
							style['display'] = 'block';
							style['left'] = 0;
							style['top'] = 0;
						}
						var
							csspos      = obj['csspos'](),
							height      = DOM['clientHeight'],
							width       = DOM['clientWidth'],
							top         = csspos['y'],
							left        = csspos['x'],
							contentNode = ui['renderer']['contentNode'],
							vertical    = height > 0 && top >= 0  && (top + height) <= contentNode['clientHeight'],
							horizontal  = width > 0  && left >= 0 && (left + DOM['clientWidth']) <= contentNode['clientWidth']
						;
						if((vertical && horizontal) || (height == 0 && obj['ui']['renderer']['bounds']()['isWithin'](obj['position']()))){
							style['top']  = top + 'px';
							style['left'] = left + 'px';
							obj['show']()
						}else{
							obj['hide']();
						}
						if(wasHidden){
							if(zIndex == undefined){
								delete style['zIndex'];
							}else{
								style['zIndex'] = zIndex;
							}
						}
					}
				}
			;
			offset();
			obj['rendererEvents']['focus_changed' ].push('focus_changed' , ui['renderer']['addListener']('focus_changed' , offset));
			obj['rendererEvents']['bounds_changed'].push('bounds_changed', ui['renderer']['addListener']('bounds_changed', offset));
			obj['fire']('opened');
		}
		obj['opts']['open'] = true;
	}

	uiItem.prototype['close'] = function(){
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
		obj['fire']('closed');
		obj['opts']['open'] = false;
	}

	function infoWindow(options){
		uiItem['call'](this);
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

		obj['opts'] = opts;

		obj['content'](content);
		obj['position'](position);
		obj['maxWidth'](maxWidth);
		obj['zIndex'](zIndex);

		obj['autoFocus'] = autoFocus;

		obj['DOM'] = undefined;

		if(content != undefined){
			obj['fire']('content_changed');
		}
	};
	extend(infoWindow, uiItem);

	infoWindow.prototype['csspos'] = function(){
		var pos = uiItem.prototype['csspos']['call'](this);
		pos['y'] -= (this['DOM'] != undefined && this['DOM']['clientHeight'] != undefined) ? this['DOM']['clientHeight'] : 0;
		return pos;
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
		return opts['maxWidth'];
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
			content = uiItem.prototype['content2DOM']['call'](obj),
			DOM     = createElement('div'),
			close   = createElement('p')
		;
		addClass(close, 'mapapi-ui-infowindow-close');
		close['appendChild'](createText('×'));
		close['setAttribute']('title', 'Close');
		DOM.appendChild(content);
		DOM.appendChild(close);
		if(obj['maxWidth']() != undefined){
			DOM['style']['maxWidth'] = obj['maxWidth']();
		}
		close['onclick'] = function(){
			obj['close']();
		}
		return DOM;
	}

	infoWindow.prototype['DOMclasses'] = [
		'mapapi-ui-infowindow'
	];

	mapapi['infoWindow'] = infoWindow;
	ui.prototype['infoWindow'] = function(options){
		return new infoWindow(options);
	}

	function marker(options){
		uiItem['call'](this);
		if(options == undefined){
			return;
		}
		if(Image == undefined){
			throw 'Your browser does not support the image object';
		}
		var
			obj      = this,
			opts     = obj['opts'],
			options  = options || {},
			image    = options['image'],
			anchor   = options['anchor'],
			position = options['position'],
			infoW    = options['infoWindow'],
			img      = new Image
		;
		if(image == undefined){
			throw 'No marker image specified';
		}else if(position == undefined){
			throw 'No position specified';
		}else if((position instanceof gridPoint) == false){
			throw 'Invalid position specified';
		}
		obj['position'](position);
		if(anchor != undefined){
			obj['anchor'](anchor);
		}
		obj['position'](position);
		img['onload'] = function(){
			if(anchor == undefined){
				obj['anchor']({'x':img['width'] / 2, 'y' : img['height']});
			}
			obj['content'](img);
		}
		img['onerror'] = function(){
			throw 'Could not load image';
		}
		img['src'] = image;
		obj['img'] = img;
		if(infoW instanceof infoWindow){
			infoW['position'](obj['position']());
			obj['addListener']('click', function(){
				obj['hide']();
				infoW['open'](obj['ui']);
			});
			infoW['addListener']('closed', function(){
				obj['show']();
			});
		}
	}
	extend(marker, uiItem);

	marker.prototype['anchor'] = function(anchor){
		if(anchor != undefined){
			if(typeof anchor['x'] != 'number' || typeof anchor['y'] != 'number'){
				throw 'x and y anchor points must be numbers';
			}
			this['opts']['anchor'] = {'x':anchor['x'], 'y':anchor['y']};
		}
		return this['opts']['anchor'];
	}

	marker.prototype['csspos'] = function(){
		var
			pos    = uiItem.prototype['csspos']['call'](this),
			anchor = this['anchor']()
		;
		if(anchor == undefined){
			throw 'No anchor point found';
		}else{
			pos['x'] -= anchor['x'],
			pos['y'] -= anchor['y']
		}
		return pos;
	}

	marker.prototype['content2DOM'] = function(){
		var
			obj     = this,
			content = obj['content'](),
			DOM     = createElement('img')
		;
		if(!(content instanceof Image) && content['nodeName']['toLowerCase']() != 'img'){
			throw 'Invalid contents, must be an instance of Image or an img tag';
		}
		DOM['setAttribute']('src', content['src']);
		DOM['onclick'] = function(){
			obj['fire']('click');
		}
		return DOM;
	}

	marker.prototype['DOMclasses'] = [
		'mapapi-ui-marker'
	];

	mapapi['marker'] = marker;

	function markerManager(){
		EventTarget['call'](this);
		this['markers'] = [];
	}
	extend(markerManager, EventTarget);

	markerManager.prototype['add'] = function(one){
		if(one == undefined){
			throw 'No marker specified';
		}else if(one instanceof marker){
			if(this['markers']['indexOf'](one) == -1){
				this['markers']['push'](one);
			}
		}else{
			throw 'value is not a marker';
		}
	}

	markerManager.prototype['remove'] = function(one){
		if(one != undefined){
			var
				pos = this['markers']['indexOf'](one)
			;
			if(pos >= 0){
				this['markers'][i]['close']();
				this['markers']['splice'](pos, 1);
			}
		}
	}

	markerManager.prototype['open'] = function(on){
		if(!(on instanceof ui)){
			throw 'value must be an instance of mapapi.ui';
		}
		for(var i=0;i<this['markers']['length'];++i){
			this['markers'][i]['open'](on);
		}
		this['fire']('opened');
	}

	markerManager.prototype['close'] = function(){
		for(var i=0;i<this['markers']['length'];++i){
			this['markers'][i]['close']();
		}
		this['fire']('closed');
	}

	mapapi['markerManager'] = markerManager;
	ui.prototype['addMarker'] = function(one){
		if(one instanceof marker){
			this['markerManager']['add'](one);
		}else{
			throw 'value must be instance of mapapi.marker';
		}
	}

	function numberedMarker(options){
		marker['call'](this, options);

		if(options != undefined){
			this['opts']['number'] = options['number'] || 0;
		}
	}
	extend(numberedMarker, marker);

	numberedMarker.prototype['number'] = function(number){
		if(typeof number == 'number'){
			this['opts']['number'] = number;
			this['fire']('content_changed');
		}
		return this['opts']['number'];
	}

	numberedMarker.prototype['content2DOM'] = function(){
		var
			content = marker.prototype['content2DOM']['call'](this),
			img     = this['img'],
			DOM     = createElement('div'),
			number  = createElement('p'),
			value   = parseInt(this['opts']['number'])
		;
		number['appendChild'](createText(value));
		number['setAttribute']('title', value);

		delClass(content, 'mapapi-ui-marker');
		addClass(content, 'mapapi-ui-marker-img');

		DOM['style']['width']  = img['width'] + 'px';
		DOM['style']['height'] = img['height'] + 'px';

		addClass(number, 'mapapi-ui-marker-number');

		DOM['appendChild'](content);
		DOM['appendChild'](number);

		return DOM;
	}
	numberedMarker.prototype['DOMclasses'] = [
		'mapapi-ui-marker',
		'mapapi-ui-marker-numbered'
	];

	mapapi['numberedMarker'] = numberedMarker;
})(window);