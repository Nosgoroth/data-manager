(function(){

	/*

	Array-like object for Data object Collections

	//Can be used like an array:
	var fooCOL = Foo.COL(someRawDataArray);
	fooCOL.length
	fooCOL[1]
	fooCOL.forEach(...)
	fooCOL.push(fooDO)

	//Some methods are augmented
	fooCOL.filter(..., in_place);
	fooCOL.push(do_obj, allow_duplicates)

	//Also adds methods
	fooCOL.getById(7) //also as .get()
	fooCOL.asDOArray()
	fooCOL.asRawArray()
	fooCOL.run(methodname, methodparams)
	fooCOL.runAsArray(methodname, methodparams)
	fooCOL.filterByPropertyValue(prop, val, in_place)
	fooCOL.sortByProperty(propertyname)


	Limitations:
		* Objects set manually with fooCOL[i] don't persist, use set(i, DO)
		* Does not implement the following methods: join copyWithin
		* proto.splice only accepts one item
		* There may be minor differences in method signatures

	*/



	DataObjects.COL = Object.extends({

		_dataobjects: [],
		_byKey: {},
		length: 0,
		
		__construct: function(rawdataArray, oftype, parent){

			this._dataobjects = [];
			this._byKey = {};
			this.length = 0;

			if (!oftype) {
				throw new Error("Need to specify type of COL");
			}
			if (!oftype.DOname) {
				oftype = DataObjects.get(oftype);
			}
			this.type = oftype;

			if (!Array.isArray(rawdataArray) || !rawdataArray.length) {
				return;
			}

			var isRawdataInstanced = (rawdataArray[0] instanceof this.type);

			for (var i = 0; i < rawdataArray.length; i++) {
				var item = rawdataArray[i]
				if (isRawdataInstanced && item instanceof this.type) {
					this._dataobjects.push(item);
				} else if (!isRawdataInstanced && item) {
					this._dataobjects.push( this.type.DO(item, parent) );
				} else {
					continue;
				}
			}

			this._recalculate();
		},

		_recalculate: function(){
			//Remove indexed from prototype
			var ud = {}.undef;
			for(var i = 0; i < this.length; i++) {
				this[i] = ud;
			}

			//Recalculate length
			this.length = this._dataobjects.length;

			//Recalculate indexes
			this._byKey = {};
			for (var i = 0; i < this._dataobjects.length; i++) {
				var do_obj = this._dataobjects[i];
				this._byKey[ do_obj.pkGet() ] = do_obj;
			}

			//Readd indexed to prototype
			for(var i = 0; i < this.length; i++) {
				this[i] = this._dataobjects[i];
			}

		},

		getNextNumericPrimaryKey: function(){
			var max = Math.max.apply(null, Object.keys(this._byKey));
			if (max < 1) {
				return 1;
			}
			return max+1;
		},

		indexOf: function(do_obj, fromIndex){
			if (!(do_obj instanceof this.type)) { return -1; }
			var pk = do_obj.pkGet();
			for (var i = (fromIndex?fromIndex:0); i < this._dataobjects.length; i++) {
				if (this._dataobjects[i].pkGet() === pk) {
					return i;
				}
			}
			return -1;
		},

		lastIndexOf: function(do_obj, fromIndex){
			if (!(do_obj instanceof this.type)) { return -1; }
			var pk = do_obj.pkGet();
			for (var i = (fromIndex?fromIndex:this._dataobjects.length-1); i >= 0; i--) {
				if (this._dataobjects[i].pkGet() === pk) {
					return i;
				}
			}
			return -1;
		},

		remove: function(do_obj){
			var index = this.indexOf(do_obj);
			if (index === -1) {
				return false;
			}
			return this.splice(index, 1);
		},


		clone: function(){
			return new DataObjects.COL(this._dataobjects, this.type);
		},


		set: function(index, do_obj){
			if (!(do_obj instanceof this.type)) { return false; }
			this._dataobjects[index] = do_obj;
			this._recalculate();
		},

		replaceByPrimaryKey: function(do_obj, insertOrUpdate) {
			var pk = do_obj.pkGet();
			for (var i = 0; i < this._dataobjects.length; i++) {
				if (this._dataobjects[i].pkGet() === pk) {
					this._dataobjects[i] = do_obj;
					return true;
				}
			}
			if (insertOrUpdate) {
				return this.push(do_obj);
			}
			return false
		},

		push: function(do_obj, allowDuplicates){
			if (do_obj instanceof this.constructor) {
				for (var i = 0; i < do_obj.length; i++) {
					this.push(do_obj[i], allowDuplicates);
				}
				return true;
			}
			if (!(do_obj instanceof this.type)) { return false; }
			if (!allowDuplicates && this.includes(do_obj)) {
				return false;
			}
			this._dataobjects.push(do_obj);
			this._recalculate();
			return true;
		},
		concat: function(COL){ this.push(COL); },
		pop: function(){
			var DO = this._dataobjects.pop();
			this._recalculate();
			return DO;
		},
		shift: function(){
			var DO = this._dataobjects.shift();
			this._recalculate();
			return DO;
		},
		unshift: function(do_obj, allowDuplicates){
			if (do_obj instanceof this.constructor) {
				for (var i = 0; i < do_obj.length; i++) {
					this.unshift(do_obj[i], allowDuplicates);
				}
				return true;
			}
			if (!(do_obj instanceof this.type)) { return false; }
			if (!allowDuplicates && this.includes(do_obj)) {
				return false;
			}
			this._dataobjects.unshift(do_obj);
			this._recalculate();
			return true;
		},


		getByIndex: function(index){
			return this._dataobjects[index] ? this._dataobjects[index] : null;
		},
		at: function(index){ return this.getByIndex(index); },

		getById: function(id) {
			return this._byKey[id] ? this._byKey[id] : null;
		},
		get: function(id){ return this.getById(id); },

		includes: function(do_obj){
			if (!(do_obj instanceof this.type)) { return false; }
			return !!this.getById(do_obj.pkGet());
		},

		forEach: function(callback) {
			for (var i = 0; i < this._dataobjects.length; i++) {
				callback(this._dataobjects[i], i);
			}
		},

		asDOArray: function(){
			return this._dataobjects.slice(0);
		},

		asRawArray: function(){
			var raw = [];
			for(var i = 0; i < this._dataobjects.length; i++) {
				raw.push( this._dataobjects[i].get() );
			}
			return raw;
		},

		sort: function(callback){
			if (!callback) {
				return this.sortByProperty();
			}
			this._dataobjects.sort(callback);
			this._recalculate();
		},

		sortByProperty: function(property, reverse){
			if (!this._dataobjects.length) { return; }

			if (!property) {
				property = this.type.primaryKey;
			}
			
			var type = this._dataobjects[0].getTypeOfProperty(property);

			if (Array.isArray(type) && type.length && typeof type[0] === "string") {
				type = type[0];
			}
			var labelmethodname = DataObjects._makeMethodName(property,"labelOf");
			
			this._dataobjects.sort(function(a,b){
				var av, bv;
				if (type === "enum") {
					av = a[labelmethodname]().toLowerCase();
					bv = b[labelmethodname]().toLowerCase();
				} else {
					av = a.get(property);
					bv = b.get(property);
				}
				if (type==="string" || type==="str" || type==="multilang") {
					av = av.toLowerCase();
					bv = bv.toLowerCase();
				}
				if (type === "int" || type === "integer" || type === "number" || type === "float") {
					if (isNaN(av)) {
						av = null;
					}
					if (isNaN(bv)) {
						bv = null;
					}
				}
				if (av < bv) { return (reverse?1:-1); }
				else if (av > bv) { return (reverse?-1:1); }
				else { return 0; }
				
			});
			this._recalculate();
		},



		reverse: function(){
			this._dataobjects.reverse();
			this._recalculate();
		},

		map: function(callback){
			var values = [];
			for(var i = 0; i < this._dataobjects.length; i++) {
				var DO = this._dataobjects[i];
				var pkval = DO.pkGet();
				values.push(callback(DO));
			}
			return values;
		},

		mapObject: function(callback){
			var values = {};
			for(var i = 0; i < this._dataobjects.length; i++) {
				var DO = this._dataobjects[i];
				var pkval = DO.pkGet();
				values[pkval] = callback(DO);
			}
			return values;
		},

		run: function(methodName, methodParams){
			return this.mapObject(function(DO){
				return ((typeof DO[methodName] === "function")
						  	? DO[methodName].apply(DO, methodParams)
						  	: null
						 );
			});
		},


		runAsArray: function(methodName, methodParams){
			return this.map(function(DO){
				return ((typeof DO[methodName] === "function")
						  	? DO[methodName].apply(DO, methodParams)
						  	: null
						 );
			});
		},

		runAndJoin: function(methodName, methodParams, glue) {
			methodName = methodName ? methodName : "toString";
			glue = glue ? glue : "\n";
			return this.runAsArray(methodName, methodParams).join(glue);
		},
			
		filter: function(callback, in_place){
			var newCOL = [];
			for(var i = 0; i < this._dataobjects.length; i++) {
				var DO = this._dataobjects[i];
				if (callback(DO)) {
					newCOL.push(DO);
				}
			}
			if (in_place) {
				this._dataobjects = newCOL;
				this._recalculate();
				return this.length;
			} else {
				return new DataObjects.COL(newCOL, this.type);
			}
		},
			
		filterByPropertyValue: function(property, value, comparisonCallback){
			return this.filter(function(DO){
				if (comparisonCallback) {
					return comparisonCallback(DO.get(property), value, DO);
				}
				if (Array.isArray(value)) {
					if (value.indexOf(DO.get(property)) !== -1) {
						return true;
					}
				} else {
					if (DO.get(property) === value) {
						return true;
					}
				}
				return false;
			});
		},

		_fixDateFormat: function(value) {
			if (!value || !value.match) { return value; }
			let m;
			if (m = value.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)) {
				return m[3]+"-"+m[2]+"-"+m[1];
			}
			return value;
		},

		_getDateObject: function(value) {
			if (value instanceof Date) { return value; }
			value = this._fixDateFormat(value);
			return new Date(value);
		},


		filterByCustom: function(property, callback) {
			return this.filterByPropertyValue(property, null, callback);
		},
		filterByEquals: function(property, value) {
			return this.filterByCustom(property, dovalue => dovalue == value);
		},
		filterByLessThan: function(property, value) {
			return this.filterByCustom(property, dovalue => dovalue < value);
		},
		filterByLessThanOrEqual: function(property, value) {
			return this.filterByCustom(property, dovalue => dovalue <= value);
		},
		filterByGreaterThan: function(property, value) {
			return this.filterByCustom(property, dovalue => dovalue > value);
		},
		filterByGreaterThanOrEqual: function(property, value) {
			return this.filterByCustom(property, dovalue => dovalue >= value);
		},

		filterByDateBefore: function(property, date) {
			date = this._getDateObject(date);
			return this.filterByCustom(property, value => this._getDateObject(value) < date);
		},
		filterByDateBeforeOrEqual: function(property, date) {
			date = this._getDateObject(date);
			return this.filterByCustom(property, value => this._getDateObject(value) <= date);
		},
		filterByDateAfter: function(property, date) {
			date = this._getDateObject(date);
			return this.filterByCustom(property, value => this._getDateObject(value) > date);
		},
		filterByDateAfterOrEqual: function(property, date) {
			date = this._getDateObject(date);
			return this.filterByCustom(property, value => this._getDateObject(value) >= date);
		},

		slice: function(begin, end){
			var newCOL = this._dataobjects.slice(begin, end);
			return new DataObjects.COL(newCOL, this.type);
		},

		splice: function(start, deleteCount) {
			var ret = this._dataobjects.splice(start, deleteCount);
			this._recalculate();
			return ret;
		},

		toString: function(){
			return "[object COL<"+this.type.DOname+"DO>]";
		},
		toLocaleString: function(){
			return this.toString();
		},

		reduce: function(callback, initialValue){
			return this._dataobjects.reduce(callback, initialValue);
		},
		reduceRight: function(callback, initialValue){
			return this._dataobjects.reduceRight(callback, initialValue);
		},
		some: function(callback, thisArg){
			return this._dataobjects.some(callback, thisArg);
		},
		every: function(callback, thisArg){
			return this._dataobjects.every(callback, thisArg);
		},

		values: function(){
			return this._dataobjects.values();
		},
		entries: function(){
			return this._dataobjects.entries();
		},

	}, {
		name: "DataObjectCollection"
	});

	DataObjects.Base.COL = function(rawdataArray, parent){
		return new DataObjects.COL(rawdataArray, this, parent);
	}
	DataObjects.Base.COLFromIndexed = function(rawdataIDX, parent){
		var rawdataArray = [];
		for(var i in rawdataIDX) {
			rawdataArray.push(rawdataIDX[i]);
		}
		return this.COL(rawdataArray, parent);
	}

})();