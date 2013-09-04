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
		mapapi = window['mapapi'],
		Error  = window['Error']
	;

	if(!mapapi){
		throw new Error('mapapi.js not loaded');
	}

	var
		Array  = window['Array'],
		uiitem = mapapi['uiitem']
	;

	function validateIndex(index){
		if(index instanceof Array){
			index.forEach(function(e, i){
				if(['object', 'string'].indexOf(typeof(e)) == -1){
					throw new Error('Index entries must be objects or strings');
				}
				if(typeof(e) == 'string'){
					index[i] = e = {'entry':e};
				}
				if(!e['entry']){
					throw new Error('Index entries must have an entry property');
				}else if(!(e['entry'] instanceof uiitem) && typeof(e['entry']) != 'string'){
					throw new Error('Index entries must be strings or instances of mapap.uiitem');
				}
				if(typeof(e['entry']) == 'string' && !e['keywords']){
					index[i]['keywords'] = e['keywords'] = [e['entry']];
				}
				if(!e['keywords']){
					throw new Error('Index entries must have a keywords property');
				}else if((!e['keywords'] instanceof Array)){
					throw new Error('Index entry keywords must be specified as an array');
				}
			});
		}else if(index){
			throw new Error('If specified, index must be an Array');
		}
	}

	function tryFail(fail, msg){
		if(fail){
			fail(msg);
		}else{
			throw new Error(msg)
		}
	}

	function arrayUnique(){
		var
			obj         = this,
			removeThese = []
		;
		this.forEach(function(e, i){
			var
				pos = i + 1
			;
			while((pos = obj['indexOf'](e, pos)) >= 0){
				removeThese.push(pos);
			}
		});
		removeThese.sort();
		removeThese.reverse();
		removeThese.forEach(function(e){
			obj['splice'](e, 1);
		});
	}

	function search(index){
		validateIndex(index);
		this.index = index || [];
		this.index.forEach(function(e){
			arrayUnique['call'](e['keywords']);
		});
	}

	search.prototype['remove'] = function(){
		var
			removeThese = []
		;
		for(var i=0;i<arguments.length;++i){
			this.index.forEach(function(e, j){
				if(e['entry'] == arguments[i]){
					removeThese.push(j);
				}
			});
		}
		removeThese.sort();
		removeThese.reverse();
		removeThese.forEach(function(e){
			this.index.splice(e, 1);
		});
	}

	search.prototype['add'] = function(){
		var
			addIndex = Array.prototype.slice.call(arguments)
		;
		validateIndex(addIndex);
		addIndex.forEach(function(e){
			var
				found = false
			;
			for(var i=0;i<this.index.length;++i){
				if(this.index[i]['entry'] == e['entry']){
					this.index[i]['keywords']['concat'](e['keywords']);
					arrayUnique['call'](this.index[i]['keywords']);
					found = true;
					break;
				}
			}
			if(!found){
				arrayUnique['call'](e['keywords']);
				this.index.push(e);
			}
		});
	}

	search.prototype['search'] = function(term, success, fail){
		if(!success){
			tryFail(fail, 'No success handler');
		}
		var
			rawTerm = term,
			term = (term + '').replace(/^\s+|\s+$/g,'').replace(/\s+/g, ' '),
			results = []
		;
		if(term.length > 0){
			var
				termArray = term.split(' ')
			;
			for(var i=0;i<this.index.length;++i){
				var
					found = false
				;
				for(var j=0;j<this.index[i]['keywords']['length'];++j){
					for(var k=0;k<termArray.length;++k){
						if(
							this.index[i]['keywords'][j]['indexOf'](termArray[k]) >= 0 ||
							this.index[i]['keywords'][j]['toLowerCase']()['indexOf'](termArray[k]['toLowerCase']()) >= 0
						){
							found = true;
							break;
						}
					}
					if(found){
						break;
					}
				}
				if(found){
					results.push(this.index[i]['entry']);
				}
			}
		}
		success({
			'rawTerm' : rawTerm,
			'term':term,
			'results' : results
		});
	}

	mapapi['search'] = search;
})(window);
