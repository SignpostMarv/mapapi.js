

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
		createElement = function(a){ return document['createElement'](a); },
		mapapi        = window['mapapi'],
		gridPoint     = mapapi['gridPoint'],
		bounds        = mapapi['bounds']
	;

	function each(array, cb){
		for(var i=0;i<array.length;++i){
			cb(array[i],i);
		}
	}

	var	ui = function(options){
		var
			obj          = this,
			options      = options || {},
			container    = options['container'],
			renderer     = options['renderer'],
			gridConfig   = options['gridConfig'],
			rendererNode = createElement('div')
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
		obj['renderer']     = renderer;
		obj['rendererNode'] = rendererNode;
		container['appendChild'](rendererNode);

		container['setAttribute']('class', ((container['getAttribute']('class') || '') + ' mapapi-ui')['replace'](/^\ +/,''));
		rendererNode['setAttribute']('class', 'mapapi-renderer-container');

		obj.loadCSS();
	}

	ui.prototype.css = [
		'reset.css',
		'ui.css'
	];
	ui.prototype.loadCSS = function(){
		var
			obj     = this,
			scripts = document.getElementsByTagName('script'),
			links   = document.getElementsByTagName('link'),
			head    = document.getElementsByTagName('head')[0],
			regexp  = /./,
			uiregex = /mapapi\.ui\.js$/,
			exregex = /^https?/,
			styles = [],
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
			for(var i=0;i<obj['css']['length'];++i){
				cssfound     = false;
				csspath      = obj['css'][i];
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

})(window);