(function(window, undefined){
	'use strict';
	var
		Error        = window['Error'],
		JSON         = window['JSON'],
		mapapi       = window['mapapi'],
		EventTarget  = window['EventTarget'],
		defaultError = function(e){
			throw (!Error) ? e : new Error(e);
		},
		trySuccess   = function(success, fail, successArg){
			try{
				success ? success(successArg) : tryFail(fail, 'No success handler');
			}catch(e){
				tryFail(fail, e);
			}
		},
		tryFail      = function(fail, e){
			try{
				fail ? fail(e) : defaultError(e);
			}catch(f){
				defaultError(f);
			}
		}
	;
	if(!Error){
		throw 'Error not available';
	}else if(!mapapi){
		throw new Error('mapapi.js not loaded');
	}else if(!EventTarget){
		throw new Error('EventTarget not loaded');
	}
	var
		wLocal         = window['localStorage'],
		wSess          = window['sessionStorage'],
		extend         = function (a,b){
			a.prototype = new b;
			a.prototype['constructor'] = a;
		},
		storage        = function(success, fail){
			EventTarget['call'](this);
		},
		memoryStorage  = function(success, fail){
			storage['call'](this);
			this.data = {};
			try{
				trySuccess(success, fail, this);
			}catch(e){
				tryFail(fail, e);
			}
		},
		domStorage     = function(success, fail){
			storage['call'](this);
		},
		localStorage   = function(success, fail){
			this.data = wLocal;
			domStorage['call'](this, success, fail);
			try{
				trySuccess(success, fail, this);
			}catch(e){
				tryFail(fail, e);
			}
		},
		sessionStorage = function(success, fail){
			this.data = wSess;
			domStorage['call'](this, success, fail);
			try{
				trySuccess(success, fail, this);
			}catch(e){
				tryFail(fail, e);
			}
		}
	;

	extend(storage, EventTarget);
	[
		memoryStorage,
		domStorage
	].forEach(function(e){
		extend(e, storage);
	});

	[
		localStorage,
		sessionStorage
	].forEach(function(e){
		extend(e, domStorage);
	});

	[
		storage,
		domStorage
	].forEach(function(e){
		e['enabled'] = false;
	});
	storage['enabled']        = false;
	memoryStorage['enabled']  = true;
	localStorage['enabled']   = wLocal != undefined;
	sessionStorage['enabled'] = wSess  != undefined;

	storage.prototype['get'] = function(key, success, fail){
		this['fire']('get', [key]);
		tryFail(fail, 'Not implemented');
	}

	storage.prototype['set'] = function(key, value, success, fail){
		this['fire']('set', [key, val]);
		tryFail(fail, 'Not implemented');
	}

	storage.prototype['del'] = function(key, success, fail){
		this['fire']('del', [key]);
		tryFail(fail, 'Not implemented');
	}


	memoryStorage.prototype['get'] = function(key, success, fail){
		try{
			if(this.data.hasOwnProperty(key)){
				trySuccess(success, fail, {
					'key': key,
					'value': this.data[key]
				});
			}else{
				tryFail(fail, {'key':key, 'error':'Key not found'});
			}
		}catch(e){
			tryFail(fail, e);
		}
	}

	memoryStorage.prototype['set'] = function(key, value, success, fail){
		try{
			this.data[key] = value;
			trySuccess(success, fail, {'key': key});
		}catch(e){
			tryFail(fail, e);
		}
	}

	memoryStorage.prototype['del'] = function(key, success, fail){
		try{
			if(this.data[key]){
				delete this.data[key];
			}
			trySuccess(success, fail, {'key': key});
		}catch(e){
			tryFail(fail, e);
		}
	}

	domStorage.prototype['get'] = function(key, success, fail){
		if(!this.data){
			storage.prototype['get']['apply'](this, [key, success, fail]);
			return;
		}
		try{
			trySuccess(success, fail, {
				'key'  : key,
				'value': JSON['parse'](this.data['getItem'](key))
			});
		}catch(e){
			tryFail(fail, e);
		}
	}

	domStorage.prototype['set'] = function(key, value, success, fail){
		if(!this.data){
			storage.prototype['set']['apply'](this, [key, value, success, fail]);
			return;
		}
		try{
			this.data['setItem'](key, JSON.stringify(value));
			trySuccess(success, fail, {
				'key': key
			});
		}catch(e){
			tryFail(fail, e);
		}
	}

	domStorage.prototype['del'] = function(key, success, fail){
		if(!this.data){
			storage.prototype['del']['apply'](this, [key, success, fail]);
			return;
		}
		try{
			this.data['removeItem'](key);
			trySuccess(success, fail, {
				'key': key
			});
		}catch(e){
			tryFail(fail, e);
		}
	}

	var
		persistantStorage,
		temporaryStorage
	;
	storage['registry'] = function(persistant, success, fail){
		if(persistant){
			if(!persistantStorage){
				if(localStorage['enabled']){
					persistantStorage = new localStorage(success, fail)
				}else{
					tryFail(fail, 'No persistant storage mechanisms available');
				}
			}else{
				trySuccess(success, fail, persistantStorage);
			}
			return persistantStorage;
		}else{
			if(!temporaryStorage){
				if(sessionStorage['enabled']){
					temporaryStorage = new sessionStorage(success, fail);
				}else if(memoryStorage['enabled']){
					temporaryStorage = new memoryStorage(success, fail);
				}else{
					tryFail(fail, 'No temporary storage mechanisms available');
				}
			}else{
				trySuccess(success, fail, temporaryStorage);
			}
			return temporaryStorage;
		}
	}
	mapapi['storage']         = storage;

	storage['memory']         = memoryStorage;
	storage['localStorage']   = localStorage;
	storage['sessionStorage'] = sessionStorage;
})(window);
