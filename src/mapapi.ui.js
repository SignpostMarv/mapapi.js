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
	window['mapapi'] = window['mapapi'] || {};
	var
		document      = window['document'],
		EventTarget   = window['EventTarget'],
		Image         = window['Image'],
		Array         = window['Array'],
		mapapi        = window['mapapi'],
		createElement = mapapi['utils']['createElement'],
		gridPoint     = mapapi['gridPoint'],
		bounds        = mapapi['bounds'],
		utils         = mapapi['utils'],
		addClass      = utils ? utils['addClass']    : undefined,
		delClass      = utils ? utils['delClass']    : undefined,
		hasClass      = utils ? utils['hasClass']    : undefined,
		toggleClass   = utils ? utils['toggleClass'] : undefined,
		empty         = utils ? utils['empty']       : undefined,
		ctype_digit   = utils ? utils['ctype_digit'] : undefined,
		trimRegex     = /^\s+|\s+$/g
	;

	function extend(a,b){
		a.prototype = new b;
		a.prototype['constructor'] = a;
	}

	var
		uiID = 0,
		uiregex = /(mapapi\.ui\.js|mapapi-complete.js)$/,
		testStyle  = createElement('a')['style'],
		transformProps = ['transform', 'webkitTransform'],
		hasTransform = false,
		transformProp
	;
	for(var i=0;i<transformProps['length'];++i){
		transformProp = transformProps[i];
		if(transformProp in testStyle){
			hasTransform = true;
			break;
		}
	}
	var
		setCSSPos = hasTransform ? function(element, top, left){
			element['style'][transformProp] = 'translateX(' + left + 'px) translateY(' + top + 'px)';
		} : function(element, top, left){
			element['style']['top'] = top + 'px';
			element['style']['left'] = left + 'px';
		}
	;

	function ui(options){
		if(options == undefined){
			return;
		}
		var
			obj               = this,
			options           = options || {},
			container         = options['container'],
			renderer          = options['renderer'],
			gridConfig        = options['gridConfig'],
			rendererNode      = createElement('div'),
			sidebarsContainer = createElement('ul'),
			mapuijs           = this.jsPath()
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
					renderer = mapapi['renderers']['canvas'];
				}
			}catch(e){}
			if(renderer == undefined){
				renderer = mapapi['renderers']['google3'];
			}
			if(renderer == undefined){
				throw 'Could not locate any renderers';
			}
			renderer = new renderer({
				'container'  : rendererNode,
				'gridConfig' : gridConfig
			});
		}else if(!(renderer.prototype instanceof mapapi['renderer'])){
			throw 'Specified renderer is not an instance of mapapi.renderer';
		}else{
			renderer = new renderer({
				'container' : rendererNode,
				'gridConfig' : gridConfig
			});
		}
		empty(container);
		container['appendChild'](rendererNode);
		container['appendChild'](sidebarsContainer);

		addClass(container, 'mapapi-ui');
		if(this['name']){
			addClass(container, 'mapapi-ui-' + this['name']['toLowerCase']()['replace'](/\s+/g,''));
		}
		addClass(rendererNode, 'mapapi-ui-renderer');
		addClass(sidebarsContainer, 'mapapi-ui-sidebars');

		obj['renderer']          = renderer;
		obj['rendererNode']      = rendererNode;
		obj['contentNode']       = container;
		obj['sidebars']          = {};
		obj['sidebarLabels']     = [];
		obj['sidebarsContainer'] = sidebarsContainer;
		obj['markerManager']     = new markerManager({
			'ui'                  : obj,
			'defaultMarkerImage'  : options['defaultMarkerImage'] || mapuijs.replace(uiregex, 'ui/marker-shadows.png'),
			'defaultMarkerAnchor' : options['defaultMarkerAnchor'] || {'x':16, 'y': 64}
		});
		obj['ID']                = uiID++;

		obj['loadCSS']();
	}

	ui.prototype['css'] = [
		'reset.css',
		'ui.css'
	];

	ui.prototype.jsPath = function(){
		var
			scripts = document.querySelectorAll('head script')
		;
		for(var i=0;i<scripts.length;++i){
			if(uiregex.test(scripts[i]['src'])){
				return scripts[i]['src'];
			}
		}
		throw 'Could not find mapapi.js UI file';
	}

	ui.prototype['loadCSS'] = function(){
		var
			obj     = this,
			head    = document.getElementsByTagName('head')[0],
			links   = head.getElementsByTagName('link'),
			regexp  = /./,
			exregex = /^https?/,
			styles  = [],
			css     = [],
			mapuijs = obj.jsPath(),
			csspath,
			csspathregex,
			cssfound,
			newcss,
			jspath
		;
		for(var i=0;i<links.length;++i){
			if(/\bstylesheet\b/.test(links[i]['rel'])){
				styles.push(links[i]);
			}
		}
		links = [];
		jspath = mapuijs['replace'](uiregex,'');
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
				regexp.compile('^' + jspath.replace(/\./g,'\.').replace(/\//g,'\/') + csspathregex + '$');
			}
			for(var j=0;j<styles.length;++j){
				if(regexp.test(styles[j]['href'])){
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

	ui.prototype['addSidebar'] = function(sidebarName, sidebarObj){
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
			lname = sidebarName['toLowerCase']()
		;
		if(this['sidebars'][lname] != undefined){
			throw 'A sidebar with that name has already been assigned';
		}else{
			var
				DOM = this['sidebar2DOM'](sidebarName, sidebarObj)
			;
			this['sidebars'][lname] = sidebarObj;
			this['sidebarLabels']['push'](lname);
			this['sidebarsContainer']['appendChild'](DOM);
			mapapi['events']['fire']('sidebaradded',{'ui':this,'sidebar':sidebarObj,'DOM':DOM,'name':sidebarName});
			return DOM;
		}
	}

	function sectionsAddedListener(e){
		var
			sections = e['sections']
		;
		if(sections && sections instanceof Array){
			for(var i=0;i<sections['length'];++i){
				if(sections[i] instanceof section){
					var
						subsection = sections[i],
						text       = subsection['text'](),
						li         = createElement('li'),
						h1         = createElement('h1', text),
						ul         = createElement('ul')
					;
					h1['onclick'] = function(){
						toggleClass(this['parentNode'], 'toggled');
						subsection['fire']('click');
					};
					li['appendChild'](h1);
					if(!(sections[i] instanceof stubSection)){
						li['appendChild'](ul);
						subsection['DOM'] = ul;
					}else if(subsection['content2DOM']){
						li['appendChild'](subsection['content2DOM'](true));
					}
					addClass(li, text['toLowerCase']()['replace'](/[^A-z\d]+/g,''));
					addClass(li, 'childless');
					this['DOM']['appendChild'](li);
					delClass(this['DOM']['parentNode'], 'childless');
					subsection['addListener']('sectionsadded', sectionsAddedListener);
					if(subsection['sections'] && subsection['sections'] instanceof Array && subsection['sections']['length'] > 0){
						subsection['fire']('sectionsadded', {'sections':subsection['sections']});
					}
					subsection['addListener']('sectionsremoved', sectionsRemovedListener);
				}
			}
		}
	}

	function sectionsRemovedListener(e){
		var
			sections = e['sections'],
			parents  = []
		;
		if(sections && sections instanceof Array){
			for(var i=0;i<sections['length'];++i){
				var
					DOM    = sections[i]['DOM']['parentNode'],
					parent = DOM['parentNode']
				;
				if(parents['indexOf'](parent) == -1){
					parents.push(parent);
				}
				parent['removeChild'](DOM);
			}
			for(var i=0;i<parents.length;++i){
				if(!parents[i]['hasChildNodes']()){
					addClass(parents[i], 'childless');
				}
			}
		}
	}
	ui.prototype['sidebar2DOM'] = function(sidebarName, sidebarObj){
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
			li  = createElement('li'),
			ul  = createElement('ul')
		;
		addClass(li, sidebarName['toLowerCase']()['replace'](/\s+/g,''));
		li['appendChild'](ul);
		sidebarObj['DOM'] = ul;
		sidebarObj['addListener']('sectionsadded', sectionsAddedListener);
		sidebarObj['addListener']('sectionsremoved', sectionsRemovedListener);
		return li;
	}

	ui.prototype['sidebar'] = function(index, disableFallback){
		if(typeof disableFallback != 'boolean'){
			disableFallback = false;
		}else if(typeof index != 'number'){
			throw 'Sidebar indexes must be specified as integers';
		}
		var
			index        = Math.floor(index),
			labelLengths = this['sidebarLabels']['length']
		;
		if(labelLengths >= 1){
			if(index < 0){
				throw 'Negative indexes are not supported';
			}else if(index >= labelLengths){
				if(!disableFallback){
					return this['sidebars'][this['sidebarLabels'][labelLengths - 1]];
				}
			}else if(this['sidebarLabels'][index] != undefined){
				return this['sidebars'][this['sidebarLabels'][index]];
			}
		}
		return false;
	}

	mapapi['ui'] = ui;
	mapapi['userinterfaces'] = {};

	function uiItem(){
		if(EventTarget == undefined){
			throw 'EventTarget not loaded';
		}
		var
			obj        = this,
			DOMclasses = obj['DOMclasses']
		;
		EventTarget['call'](obj);

		obj['opts'] = {
			'shown' : false,
			'open'  : false
		};

		obj['rendererEvents'] = {
			'focus_changed'  : [],
			'bounds_changed' : []
		};

		obj['DOM'] = undefined;
		obj['addListener']('content_changed', function(){
			var
				oldDOM = obj['DOM']
			;
			addClass(obj['content2DOM'](), DOMclasses['join'](' '));
			if(obj['DOM']['parentNode']){
				obj['content2DOM'](true);
			}
			if(oldDOM && oldDOM != obj['DOM'] && oldDOM['parentNode']){
				oldDOM['parentNode']['replaceChild'](obj['DOM'], oldDOM);
			}
			if(this['opts']['shown']){
				this['show']();
			}
			if(this['opts']['open'] && this['ui']){
				this['open'](this['ui']);
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
		var
			obj = this
		;
		if(obj['DOM']){
			obj['DOM']['style']['display'] = 'none';
			if(obj['zIndex']){
				obj['DOM']['style']['zIndex'] = -1;
			}
		}
		obj['opts']['shown'] = false;
	}

	uiItem.prototype['show'] = function(){
		var
			obj = this
		;
		if(obj['DOM'] && obj['DOM']['parentNode']){
			obj['DOM']['style']['display'] = 'block';
			if(obj['zIndex']){
				obj['DOM']['style']['zIndex'] = obj['zIndex']();
			}
		}
		obj['opts']['shown'] = true;
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

	uiItem.prototype['content2DOM'] = function(wipe){
		var
			wipe = !!wipe,
			obj = this
		;

		if(wipe || !this['DOM']){
			var
				content = obj['content'](),
				content = content == undefined ? '' : content,
				DOM     = createElement('div')
			;

			if(typeof content == 'string'){
				content.split("\n")['forEach'](function(e){
					DOM['appendChild'](createElement('p', e));
				});
			}else if(content['appendChild'] != undefined || content instanceof Image){
				DOM['appendChild'](content);
			}

			addClass(DOM, 'mapapi-ui-item-contents');

			this['DOM'] = DOM;
		}
		return this['DOM'];
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
			DOM     = obj['content2DOM'](),
			DOMp    = DOM ? (DOM['parentNode'] == undefined ? undefined : DOM['parentNode']) : undefined,
			dest    = ui['rendererNode']
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
							wasHidden = (style['display'] == '' || style['display'] == 'none'),
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
							top         = (obj instanceof infoWindow) ? (top - height) : top,
							left        = csspos['x'],
							contentNode = ui['renderer']['contentNode'],
							vertical    = height > 0 && top >= 0  && (top + height) <= contentNode['clientHeight'],
							horizontal  = width > 0  && left >= 0 && (left + DOM['clientWidth']) <= contentNode['clientWidth']
						;
						if((vertical && horizontal) || (height == 0 && obj['ui']['renderer']['bounds']()['isWithin'](obj['position']()))){
							setCSSPos(DOM, top, left);
							if(obj['opts']['disableAutoShow'] != true){
								obj['show']();
							}else{
								obj['hide']();
							}
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
		obj['hide']();
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

	mapapi['uiitem'] = uiItem;

	function infoWindow(options){
		uiItem['call'](this, options);
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

	infoWindow.prototype['content2DOM'] = function(wipe){
		var
			wipe    = !!wipe,
			obj     = this
		;
		if(wipe || !obj['DOM']){
			var
				content = uiItem.prototype['content2DOM']['call'](obj, true),
				DOM     = createElement('aside'),
				div     = createElement('div'),
				close   = createElement('p', '×')
			;
			addClass(DOM, obj['DOMclasses'].join(' '));
			addClass(close, 'mapapi-ui-infowindow-close');
			addClass(div,   'mapapi-ui-wrapper');

			close['setAttribute']('title', 'Close');
			div.appendChild(content);
			content.appendChild(close);
			if(obj['maxWidth']() != undefined){
				DOM['style']['maxWidth'] = obj['maxWidth']();
			}
			close['onclick'] = function(){
				obj['close']();
			}
			DOM['appendChild'](div);

			obj['DOM'] = DOM;
		}
		return obj['DOM'];
	}

	infoWindow.prototype['DOMclasses'] = [
		'mapapi-ui-infowindow'
	];

	mapapi['infoWindow'] = infoWindow;
	ui.prototype['infoWindow'] = function(options){
		return new infoWindow(options);
	}

	var
		markerID = 0
	;

	function marker(){
		uiItem.apply(this, arguments);
		if(arguments.length == 0){
			return;
		}
		var
			obj     = this,
			options = arguments[0] || {},
			anchor  = options['anchor'],
			imgSrc  = options['image'],
			infoW   = options['infoWindow'],
			img     = createElement('img')
		;
		obj['position'](options['position']);
		if(anchor != undefined){
			obj['anchor'](anchor);
		}
		img['onload'] = function(){
			if(anchor == undefined){
				obj['anchor']({'x':img['width'] / 2, 'y' : img['height']});
			}
			obj['content'](this);
		}
		img['onclick'] = function(){
			obj['fire']('click');
		}
		img['src'] = imgSrc;

		obj['id']   = ++markerID;
		obj['name'] = options['name'] || ('Marker ' + obj['id']);

		if(infoW instanceof infoWindow){
			infoW['position'](obj['position']());
			obj['addListener']('click', function(){
				obj['opts']['disableAutoShow'] = true;
				obj['hide']();
				infoW['open'](obj['ui']);
			});
			infoW['addListener']('closed', function(){
				obj['opts']['disableAutoShow'] = false;
				obj['show']();
			});
		}
	}

	extend(marker, uiItem);

	marker.prototype['DOMclasses'] = [
		'mapapi-ui-marker'
	];

	marker.prototype['content2DOM'] = function(wipe){
		var
			wipe = !!wipe
		;
		if(wipe || !this['DOM']){
			this['DOM'] = this['content']();
		}
		return this['DOM'];
	}

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

	mapapi['marker'] = marker;

	function markerManager(options){
		if(options == undefined){
			throw new Error('Options not specified');
		}else{
			['ui', 'defaultMarkerImage', 'defaultMarkerAnchor'].forEach(function(e){
				if(!options.hasOwnProperty(e)){
					throw new Error(e + ' not specified in options');
				}
			});
		}
		var
			obj                 = this,
			ui                  = options['ui'],
			defaultMarkerImage  = options['defaultMarkerImage'],
			defaultMarkerAnchor = options['defaultMarkerAnchor'],
			defaultCellWidth    = options['defaultCellWidth'] ? Math.max(16, parseInt(options['defaultCellWidth'])) : 96,
			defaultCellHeight   = options['defaultCellHeight'] ? Math.max(16, parseInt(options['defaultCellHeight'])) : 96,
			useSearchableList   = true,
			objM, boundsTimeout,
			clusterListBounds   = function(e){
				obj.clusterList['close']();
				obj.clusterList = new uiItem[useSearchableList ? 'searchList' : 'list']();
				obj.clusterClosed.forEach(function(e){
					e['open'](obj['ui']);
				});
				obj.clusterClosed = [];
				var
					renderer   = this,
					cellWidth  = renderer['contentNode']['clientWidth']  /  Math.floor(renderer['contentNode']['clientWidth']  / defaultCellWidth),
					cellHeight = renderer['contentNode']['clientHeight'] /  Math.floor(renderer['contentNode']['clientHeight'] / defaultCellHeight),
					horizontal = [],
					vertical = [],
					bounds = [],
					boundMarkers = []
				;
				for(var i=0;i<=renderer['contentNode']['clientWidth'];i+=cellWidth){
					horizontal.push(renderer['px2point'](i, 0)['x']);
				}
				for(var i=0;i<=renderer['contentNode']['clientHeight'];i+=cellHeight){
					vertical.push(renderer['px2point'](0, i)['y']);
				}
				for(var i=0;i<(horizontal.length - 1);++i){
					for(var j=0;j<(vertical.length - 1);++j){
						bounds.push(new mapapi['bounds']({
							'x' : horizontal[i],
							'y' : vertical[j + 1]
						},{
							'x' : horizontal[i + 1],
							'y' : vertical[j]
						}));
						boundMarkers.push([]);
					}
				}
				vertical = horizontal = undefined;
				obj['markers'].forEach(function(e){
					if(e['opts']['shown']){
						for(var i=0;i<bounds.length;++i){
							if(bounds[i]['isWithin'](e['position']())){
								boundMarkers[i].push(e);
								obj.clusterClosed.push(e);
								e['close']();
								break;
							}
						}
					}
				});
				obj.clustered.forEach(function(e){
					if(e){
						e['close']();
					}
				});
				obj.clustered = [];
				boundMarkers.forEach(function(e, i){
					if(e.length == 1){
						e[0]['open'](obj['ui']);
						obj.clustered.push(false);
					}else if(e.length > 1){
						var
							cellBounds = bounds[i],
							x=0,
							y=0,
							clusteredStandin
						;
						e.forEach(function(f){
							var
								pos = f['position']()
							;
							x += pos['x'];
							y += pos['y'];
						});
						clusteredStandin = new numberedMarker({
								'image'    : defaultMarkerImage,
								'anchor'     : defaultMarkerAnchor,
								'position' : new gridPoint(
									x / e.length,
									y / e.length
								),
								'number' : e.length
							})
						;
						clusteredStandin['addListener']('click', function(){
							var
								content = []
							;
							if(objM){
								objM['show']();
							}
							objM = this;
							e.forEach(function(f){
								content.push(f['name']);
							});
							objM['hide']();
							obj.clusterList['close']();
							obj.clusterList['content'](content);
							obj.clusterList['position'](objM['position']());
							obj.clusterList['open'](obj['ui']);
							obj.clusterList['show']();
							obj.clusterList['fire']('click');
							obj.clusterList['addListener']('click', function(f){
								if(f['child']){
									var
										pos = Array.prototype['slice']['call'](obj.clusterList['DOM']['querySelectorAll']('ul > li'))['indexOf'](f['child'])
									;
									if(pos >= 0){
										e[pos]['fire']('click');
									}
								}else if(hasClass(this['DOM'], 'toggled')){
									obj.clusterList['hide']();
									objM['show']();
								}
							});
						});
						obj.clustered.push(clusteredStandin);
					}
				});
				obj.clustered.forEach(function(e){
					if(e){
						e['open'](obj['ui']);
					}
				});
			},
			searchSectionCreator = function(e){
				if(e['ui'] == ui && e['name'] == 'Menu'){
					var
						searchSection = e['sidebar']['findOrCreateSection']('Search')
					;
					obj.markerSearchSection = searchSection['findOrCreateSection']('Markers', uiItem['searchSection']);
					obj.markerSearchSection['addListener']('click', function(e){
						if(e['child']){
							var
								pos = Array.prototype['slice']['call'](obj.markerSearchSection['DOM']['querySelectorAll']('ul > li'))['indexOf'](e['child'])
							;
							if(pos >= 0){
								obj['markers'][pos]['fire']('click');
							}
						}
					});

					mapapi['events']['removeListener']('sidebaradded', searchSectionCreator);
				}
			}
		;
		mapapi['events']['addListener']('sidebaradded', searchSectionCreator);
		EventTarget['call'](obj);
		obj['markers'] = [];
		obj.clustered = [];
		obj.clusterClosed = [];
		obj.clusterList = new uiItem[useSearchableList ? 'searchList' : 'list']();
		obj['ui'] = ui;
		ui['renderer']['addListener']('click', function(){
			if(obj.clusterList['opts']['shown']){
				obj.clusterList['close']();
				if(objM){
					objM['show']();
				}
			}
		});
		ui['renderer']['addListener']('bounds_changed', function(e){
			if(boundsTimeout){
				clearTimeout(boundsTimeout);
			}
			boundsTimeout = setTimeout(function(){
				clusterListBounds['call'](ui['renderer'], e);
			}, 200);
		});
	}
	extend(markerManager, EventTarget);

	markerManager.prototype['add'] = function(){
		if(arguments.length < 1){
			throw 'No marker specified';
		}
		var
			names = []
		;
		for(var i=0;i<arguments.length;++i){
			var
				one = arguments[i]
			;
			if(one instanceof marker){
				if(this['markers']['indexOf'](one) == -1){
					this['markers']['push'](one);
					if(this.markerSearchSection){
						names.push(one['name']);
					}
				}
			}else{
				throw 'value is not a marker';
			}
		}
		if(names.length > 0){
			this.markerSearchSection['searchEngine']['add']['apply'](this.markerSearchSection['searchEngine'], names);
		}
	}

	markerManager.prototype['remove'] = function(){
		var
			names = []
		;
		for(var i=0;i<arguments.length;++i){
			var
				one = arguments[i],
				pos = this['markers']['indexOf'](one)
			;
			if(pos >= 0){
				this['markers'][i]['close']();
				this['markers']['splice'](pos, 1);
				if(this.markerSearchSection){
					names.push(one['name']);
				}
			}
		}
		if(names.length > 0){
			this.markerSearchSection['searchEngine']['remove']['apply'](this.markerSearchSection['searchEngine'], names);
		}
	}

	markerManager.prototype['open'] = function(){
		var
			ui = this['ui'],
			firstLoadOpen = function(){
				this['open'](ui);
				this['removeListener']('content_changed', firstLoadOpen);
			}
		;
		this['markers']['forEach'](function(e){
			e['open'](ui);
			e['addListener']('content_changed', firstLoadOpen);
		});
		this['fire']('opened');
	}

	markerManager.prototype['close'] = function(){
		for(var i=0;i<this['markers']['length'];++i){
			this['markers'][i]['close']();
		}
		this['fire']('closed');
	}

	mapapi['markerManager'] = markerManager;
	ui.prototype['addMarker'] = function(){
		this['markerManager']['add']['apply'](this['markerManager'], arguments);
	}
	ui.prototype['removeMarker'] = function(){
		this['markerManager']['remove']['apply'](this['markerManager'], arguments);
	}

	function numberedMarker(options){
		marker['call'](this, options);
		if(options == undefined){
			return;
		}
		this['opts']['number'] = options['number'] || 0;
	}
	extend(numberedMarker, marker);

	numberedMarker.prototype['DOMclasses'] = [
		'mapapi-ui-marker',
		'mapapi-ui-marker-numbered'
	];

	numberedMarker.prototype['number'] = function(number){
		if(typeof number == 'number'){
			this['opts']['number'] = number;
			this['fire']('content_changed');
		}
		return this['opts']['number'];
	}

	numberedMarker.prototype['content2DOM'] = function(wipe){
		var
			wipe            = !!wipe,
			obj             = this
		;
		if(wipe || !obj['DOM']){
			var
				content = obj['content'](),
				value   = parseInt(obj['opts']['number']),
				DOM     = createElement('div'),
				number  = createElement('p', value)
			;
			number['setAttribute']('title', value);
			number['onclick'] = function(){
				obj['fire']('click');
			}

			while(DOM['hasChildNodes']()){
				DOM['removeChild'](DOM['firstChild']);
			}

			if(content){
				content['onclick'] = function(){}
				delete content['onclick'];

				content['className'] = '';
				addClass(content, 'mapapi-ui-marker-img');

				DOM['style']['width']  = content['width'] + 'px';
				DOM['style']['height'] = content['height'] + 'px';

				DOM['appendChild'](content);
			}

			addClass(number, 'mapapi-ui-marker-number');

			addClass(DOM, obj['DOMclasses'].join(' '));
			DOM['appendChild'](number);

			obj['DOM'] = DOM;
		}

		return obj['DOM'];
	}

	mapapi['numberedMarker'] = numberedMarker;

	var
		sectionID = 0
	;

	function sidebar(){
		EventTarget['call'](this);
		this['sections'] = [];
		this['DOM']      = undefined;
		this['ID'] = sectionID++;
	}

	extend(sidebar, EventTarget);

	sidebar.prototype['addSection'] = function(){
		var
			addThese = []
		;
		for(var i=0;i<arguments['length'];++i){
			if(!(arguments[i] instanceof section || (arguments[i].prototype != undefined && arguments[i].prototype instanceof section))){
				throw 'sub-section should be instanceof mapapi.ui.section';
			}else if(this['sections']['indexOf'](arguments[i]) == -1){
				addThese['push'](arguments[i]);
			}
		}
		if(addThese['length'] > 0){
			this['sections']['push']['apply'](this['sections'], addThese);
			this['fire']('sectionsadded',{'sections':addThese});
		}
	}

	sidebar.prototype['removeSection'] = function(){
		var
			removeThese = [],
			pos
		;
		for(var i=0;i<arguments['length'];++i){
			if(!(arguments[i] instanceof section || (arguments[i].prototype != undefined && arguments[i].prototype instanceof section))){
				throw 'sub-section should be instanceof mapapi.ui.section';
			}else if(this['sections']['indexOf'](arguments[i]) > -1){
				removeThese['push'](arguments[i]);
			}
		}
		if(removeThese['length'] > 0){
			for(var i=0;i<removeThese['length'];++i){
				this['sections']['splice'](this['sections']['indexOf'](removeThese[i]), 1);
			}
			this['fire']('sectionsremoved',{'sections':removeThese});
		}
	}

	sidebar.prototype['findSection'] = function(text){
		for(var i=0;i<this['sections']['length'];++i){
			if(this['sections'][i]['text']() == text){
				return this['sections'][i];
			}
		}
		return false;
	}

	sidebar.prototype['findOrCreateSection'] = function(text){
		var
			type  = arguments['length'] > 1 ? arguments[1] : section,
			found = this['findSection'](text)
		;
		if(type == undefined){
			throw new Error('Type not found');
		}else if(!found){
			if(type != section && !(type.prototype instanceof section) && !(type.prototype instanceof stubSection)){
				throw new Error('Type should be instance of mapap.ui.section or child class thereof.');
			}
			found = new type(text);
			this['addSection'](found);
		}
		return found;
	}

	ui['sidebar'] = sidebar;

	function section(options){
		sidebar['call'](this);
		this['opts'] = {};
		if(options != undefined){
			if(typeof options == 'string'){
				options = {'text':options};
			}
			this['options'](options);
		}
		this['DOM'] = undefined;
	}

	extend(section, sidebar);

	section.prototype['options'] = function(options){
		var
			options = options || {},
			opts    = this['opts'],
			text    = options['text']
		;
		if(text != undefined){
			if(text + '' != text){
				throw 'text should be a string!';
			}
			text = text['replace'](/^\s+|\s+$/,'');
			if(text == ''){
				throw 'text is empt!';
			}
			if(text != opts['text']){
				this['fire']('changedtext');
				opts['text'] = text;
			}
		}
	}

	section.prototype['text'] = function(text){
		if(text != undefined){
			this['options']({'text':text});
		}
		return this['opts']['text'];
	}

	ui['section'] = section;


	function stubSection(options){
		section['call'](this, options);
		if(!options){
			return;
		}
	}

	extend(stubSection, section);

	stubSection.prototype['addSection']  = function(){
		throw new Error('Cannot add sections to a stub section');
	}

	stubSection.prototype['findSection'] = function(){
		return false;
	}

	stubSection.prototype['findOrCreateSection'] = function(){
		throw new Error('Cannot add sections to a stub section');
	}

	stubSection.prototype['addListener'] = function(){
		if(arguments.length > 0 && arguments[0] == 'sectionsadded'){
			return;
		}
		section.prototype['addListener']['apply'](this, arguments);
	}

	section['stub'] = stubSection;
})(window);