(function(){
	
	/*
	JS data object system. Depends on Object.extends() and Object.shallowExtend()
	
	== DataObjects manager ==
	
	DataObject manager public API, accessible from window.DataObjects:
		
		//Creates a new data object type and returns it. If you don't want
		//  to handle its stoare, you will be able to retrieve it later
		//  using the get method.
		//  The "add" method is an alias.
		createDataObjectType({
			name: "",			//Required. Do not add "DO" to the end.
			types: {},			//Multi-level object associating keys to data types.
								//  Getter and setter methods for each defined type
								//  will be created automatically. See further below.
			extraPrototype: {},	//Define methods for instance of the data object type
			extraStatic: {}		//Define static methods and values for the type. The
								// "primaryKey" key should be set. Defaults to "id".
		})
		
		//Returns a type by name
		get(DOname)
		
		//Gets rid of a defined type
		removeDataObjectType(name)

		//Add an extra object for the dataobject to extend from
		addToParentChain(newParentObjectDefinition)
		
		//Set the language (en|es|de|...) DataObject instances will use this language key
		//  for handling of "multilang" types.
		setLang(lang)
		
		//Sets the language priority chain for a particular language to use as fallback.
		//  The "chain" paramenter must be an array of language 
		setLangPriorityChain(baselang, chain)
		
		//Add a callback for generating methods for each data type. The callback
		//	will be called for each data type. The callback signature must be:
		//		function(pathkeys, pathkeys_value, type, extraPrototype)
		//	Where:
		//		pathkeys: array of recursive keys that form the access name, to
		//			generate the method name
		//		pathkeys_value: same, but to get the value. Will usually be the same
		//			as pathkeys, but will differ for aliases.
		//		type: The type string. All possible built-in types are defined below,
		//			but you can define your own by inspecting this variable.
		//		extraPrototype: Pointer to the DO prototype object. Set your methods
		//			here and be careful not to override builtins.
		//	The callback can return false (literal bool false, not null or undefined)
		//	to prevent further calls to be made for the current data type.
		addUserMethodGeneratorFunction(callback)
		
		//Helper methods for working with COLs (arrays of DO instances)
			
			//Run a method on each DO and return the result for each in a litera object
			//  indexed by DO primary key. methodParams is optional and expected to be
			//  an array if it is specified.
			runOnCOL(COL, methodName, methodParams)
			
			//Returns an array of primary keys of DOs in COL
			getCOLIDs(COL)
			
			//Returns an array of raw data of DOs
			getRawCOL(COL)
			
			//Returns a boolean stating if a DO with the same primary key as DOinst exists in COL 
			itemInCOL(DOinst, COL)

	
	== Types ==
		
		//Basic types
		integer, int	//Cast with parseInt
		number, float	//Cast with parseFloat
		string, str,	//Cast to string
		boolean, bool	//Cast to bool
		array, arr		//Cast to array
		
		//Special types
		raw				//The value as it is
		multilang		//Returns the value of the foobar_langkey key, where
						//  foobar is the name of the key with "multilang" type and
						//  langkey is the string set with DataObjects.setLang(langkey)
		alias:propname  //Makes this type an alias of another one. For example, for
						//	the following:
						//		{ foo: "integer", bar: "alias:foo" }
						//	Both "getFoo()" and "getBar()" methods will be created, but
						//  they will both read the integer in "foo".
						//  This works with recursive properties by supplying a
						//	stringified array:
						//		{ foo: { baz: "integer" }, bar: "alias:['foo','bar']" }
						//	Both "getFooBaz()" and "getBar()" methods will be created for
						//	the same "foo.baz" integer.
						//  This also works for relation types without modification:
						//		{ foo: "<Foo>", bar: "alias:foo" }
						//	And:
						//		{ foo: "[Foo]", bar: "alias:foo" }
		enum 			//Yeah! Must be defined as follows:
						//		["enum", ["Foo", "Bar", "Baz"]]
						//	What actually gets stored is the 1-based index as an int. The
						//	value definitions can be accessed from the statics at DOType.Enum.
						//	Get the label with labelOfFoo()
						
		//Date types. If moment.js is available, it will be used instead of the Date object.
		date			//Returns a new Date object, treating the value as a string
		unix			//Returns a new Date object, treating the value as a unix timestamp in seconds
		unixms			//Returns a new Date object, treating the value as a unix timestamp in milliseconds
		
		//Relations
		<DO Type name>	//Use for keys that contain a nested data structure corresponding
						//  to another DO type.
		[DO Type name]	//Use for keys that contain an array of nested data structures
						//  corresponding to another DO type.
		
	
	== DataObject methods ==
	
	For each basic/special/date and single relation type, using foo_bar as an example:

		getFooBar()
		setFooBar(val) //Expects the appropriate type, as returned by the getter

	For each relation of multiple type ("[DO type name]"):

		getFooBar() 		//Returns a COL
		pkGetFooBar(x) 		//Finds a DO by primary key and returns it. x can be the
							//  primary key value or a DO instance.
		pushFooBar(DOinst)	//Adds a DO to the end of the COL
		popFooBar(x)		//Finds a DO, removes it from the COL and returns it. x can be:
							//  1) Nothing. Selects the last DO.
							//  2) A primary key. Selects by it.
							//  3) A DO instance. Selects by its primary key.
		lengthOfFooBar()	//Returns the number of elements

	Additionally, instance methods:

		lang()				//Gets the lang the DO instance is using. If none is set,
							//  uses the lang set in the DataObjects handler.
		lang(lang)			//Sets a lang specifically for this DO instance.
		unsetLang()			//Removes the specific lang of this DO instance and goes
							//  back to using the lang key in DataObjects handler.
		withLang(lang)		//Sets a temporary language just for the next getter request.
							//  Returns the DO instance. To be used as follows:
							//  doinst.withLang("en").getFooBar()

		clone()				//Returns a new DO instanced cloned from the data in the current one.

		pkGetKey()			//Gets the primary key keyname. Same as reading DOinst.__static.primaryKey
		pkGet()				//Gets the primary key value without needing to know its keyname.
		pkSet(val)			//Sets the primary key value without needing to know its keyname.

		//Advanced usage. Type specific methods use these internally.
		//  Property keys can be a string, or an array of strings for nested access.
		get(property, defaultval, astype)
		set(property, value)
		getTypeOfProperty(property)
		typeConvert(val, astype)
		...
		
	Static methods:
	
		DO(rawdata)			//Instances a new DO with supplied rawdata. Same as "new TypeDO(rawdata)"
		
		COL(rawdataArray)	//Instances an array of DOs with supplied array of rawdata. Same as a
							//	for loop of calls to TypeDO.DO(rawdataArray[i])
		
		is(thing)			//Returns bool whether thing is instance of DO type. Same as
							//	"thing instanceof TypeDO".

	You're welcome to extend BaseDO using:

		DataObjects.Base.__extend({})
		DataObjects.Base.__extendStatic({})
	
	*/
	
	if (typeof (String.prototype.capitalize) === "undefined") { 
	    String.prototype.capitalize = function() {
	        return this.charAt(0).toUpperCase() + this.slice(1);
	    }
	}

	window.populateDefaultOptions = function(options, defaults) {
	    if (!options) { options = {}; }
	    if (!defaults) { return options; }
	    return Object.shallowExtend({}, defaults, options);
	}

	

	
	var BaseDO = Object.extends({
		
		_types: {},
		
		__construct: function(rawdata, parent){
			this._rawdata = rawdata ? rawdata : {};
			this.parent = parent ? parent : null;
			this._lang = null;
	    },
		
		lang: function(lang){
			if (typeof lang === "undefined"){
				return this._getLang();
            } else {
				this._setLang(lang);
            }
        },
		unsetLang: function(){
			this._setLang(null);
        },
		
		clone: function(){
			return new this.__static(this.get());
		},
		
		_setLang: function(lang){
			this._lang = lang;
        },
		_getLang: function(){
			if (this._templang) {
				return this._templang;
            }
			return this._lang ? this._lang : this._controller.getLang();
        },
		_restoreLang: function(){
			this._templang = null;
		},
		
		withLang: function(lang){
			this._templang = lang;
			return this;
        },
		
		pkGetKey: function(){
			return this.__static.primaryKey;
		},
		
		pkGet: function(){
			return this.get( this.pkGetKey() );
		},
		
		pkSet: function(val){
			return this.set( this.pkGetKey(), val );
		},
		
		getTypeOfProperty: function(property) {
			var def = "raw",
				cprop,
				ptr = Object.shallowExtend({},this._types)
				;
			if (Array.isArray(property)) {
				property = property.slice(0);
	        } else {
				property = [property];
	        }
			while(property.length > 0) {
				cprop = property.shift();
				if (typeof cprop === "number") {
					cprop = 0;
                }
				if (cprop === null || typeof ptr[cprop] === "undefined") {
					return def;
	            }
				ptr = ptr[cprop];
	        }
			return ptr;
	    },
		
		
		get: function(property, defaultValue, astype) {
			var retval;
			if (!property) {
				this._restoreLang();
				return Object.shallowExtend({}, this._rawdata);
            }
			defaultValue = (typeof defaultValue !== "undefined") ? defaultValue : null;
			if (!astype) {
				astype = this.getTypeOfProperty(property);
	        }

	        //Typeoptions
	        var typeoptions = {};
	        if (Array.isArray(astype) && astype.length === 2 && typeof astype[0] === "string") {
	        	typeoptions = astype[1];
	        	astype = astype[0];
	        }

			if (astype==="multilang") {
				var suffixed,
					lang = this._getLang(),
					chain = this._controller.getLangPriorityChain(lang)
					;
				chain.unshift(lang);
				for (var i = 0; i < chain.length; i++) {
					lang = chain[i];
					suffixed = this._addPropertySuffix(property, lang.capitalize() );
					retval = this._getRecursiveProperty(suffixed, defaultValue);
					if (retval) {
						break;
					}
				}
            }
			if (astype!=="multilang" || !retval) {
				retval = this._getRecursiveProperty(property, defaultValue);
            }
			this._restoreLang();
			return this.typeConvert(retval, astype, typeoptions);
	    },

		set: function(property, value) {
			if (typeof value === "undefined") {
				this._rawdata = property;
            } else {
				this._setRecursiveProperty(property, value);
            }
			return this;
		},

		delete: function(property) {
			this._setRecursiveProperty(
				property
				//, undefined
			);
			return this;
		},
		
		_addPropertySuffix: function(prop, suffix){
			if (!Array.isArray(prop)){
				prop = [prop];
            } else {
				prop = prop.slice(0);
            }
			prop[prop.length-1] += suffix;
			return prop;
        },
		
		_getRecursiveProperty: function(property, defaultValue) {
			return this.__static.getRecursiveProperty(property, defaultValue, this._rawdata);
	    },
		
		_setRecursiveProperty: function(property, value) {
			var cprop,
				ptr = this._rawdata
				;
			if (Array.isArray(property)) {
				property = property.slice(0);
	        } else {
				property = [property];
	        }
			while(property.length > 1) {
				cprop = property.shift();
				if (!cprop || typeof ptr[cprop] === "undefined") {
					ptr[cprop] = {};
	            }
				ptr = ptr[cprop];
	        }
			cprop = property.shift();
			if (typeof value === "undefined") {
				delete ptr[cprop];
			} else {
				ptr[cprop] = value;
			}
	    },
		
		typeConvert: function(val, astype, typeoptions) {
			var tempbool = false;
			switch(astype){
				case "raw":
				default: return val;
				case "integer":
				case "int": return parseInt(val);
				case "number":
				case "float": return parseFloat(val);
				case "string":
				case "str": 
					if (val || val === 0) {
						return ""+val;
					} else {
						return "";
					}
				case "multilang":
					if (typeof val === "string") {
						return val;
					}
					var lang = this._getLang();
					if (val && val[lang]) {
						return val[lang];
					}
					return "";
				case "boolean":
				case "bool": return !!val;
				case "array":
				case "arr":
					if (!Array.isArray(val)) {
						if (val) {
							return [val];
						} else {
							return [];
						}
					} else {
						return val;
					}
				case "length":
					return this.typeConvert(val,"array").length;
				case "date":
					if (!val) { return null; }
					if (window.moment){
						return moment(val);
					} else {
						return new Date(val);
					}
				case "unix":
					if (!val) { return null; }
					if (window.moment) {
						return moment.unix(parseInt(val));
					} else {
						return new Date(parseInt(val)*1000);
					}
				case "unixms":
					if (!val) { return null; }
					if (window.moment) {
						return moment(parseInt(val));
					} else {
						return new Date(parseInt(val));
					}
				case "enumlabel":
					tempbool = true;
				case "enum":
					var intval = parseInt(val);
					var enumresult = {
						value: intval,
						label: ""
					};
					if (isNaN(intval)) {
						enumresult.value = null;
					} else if (!typeoptions || !Array.isArray(typeoptions) || !typeoptions.length) {
						throw new Error("No values defined for enum type");
					} else if (typeoptions[intval-1]) {
						enumresult.label = typeoptions[intval-1];
					}
					return tempbool ? enumresult.label : enumresult.value;

			}
		},
		
		
		typeGet: function(property, dotype, index, isarray){
			if (isarray && (typeof index === "undefined") || (index === null)) {
				return this._controller.get(dotype)
					.COL( this.get(property, [], "array"), this );
			} else {
				var fullprop = property.slice(0);
				if (typeof index !== "undefined") {
					fullprop = fullprop.concat(index)
				}
				return this._controller.get(dotype)
					.DO( this.get(fullprop, {}, "raw"), this );
			}
		},
		typeSet: function(property, dotype, DOinst){
			var DOtype = this._controller.get(dotype);
			if (!(DOinst instanceof DOtype)) {
				throw new Error("Trying to set invalid type");
			}
			this.set(property, DOinst.get() );
		},
		typePush: function(property, dotype, DOinst){
			var DOtype = this._controller.get(dotype);
			if (!(DOinst instanceof DOtype)) {
				throw new Error("Trying to push invalid type");
			}
			var arr = this.get(property, [], "array");
			arr.push( DOinst.get() );
			this.set(property, arr);
		},
		typePop: function(property, dotype, id){
			var DOtype = this._controller.get(dotype);
			var pk = DOtype.primaryKey;
			var arr = this.get(property, [], "array");
			var newarr = [], popped = null;

			if ((id instanceof DOtype)) {
				id = id.pkGet();
			}

			if (typeof id === "undefined") {
				var raw = arr.pop();
				newarr = arr;
				popped = new DOtype(raw);
			} else {
				for (var i = 0; i < arr.length; i++) {
					var raw = arr[i];
					if (!raw) { continue; }
					if (raw && (typeof raw[pk] !== "undefined") && raw[pk]===id) {
						popped = new DOtype(raw);
						continue;
					}
					newarr.push(raw);
				}
			}

			this.set(property, newarr);
			return popped;
		},
		typePkGet: function(property, dotype, id){
			var DOtype = this._controller.get(dotype);
			var pk = DOtype.primaryKey;
			var arr = this.get(property, [], "array");

			if ((id instanceof DOtype)) {
				id = id.pkGet();
			}

			for (var i = 0; i < arr.length; i++) {
				var raw = arr[i];
				if (raw && (typeof raw[pk] !== "undefined") && raw[pk]===id) {
					return new DOtype(raw);
				}
			}

			return null;
		},
		
	}, {
		name: "BaseDO",
		extraStatic: {
			primaryKey: "id",
			sortProperty: null,
			
			is: function(inst){
				return inst instanceof this;
			},
			
			DO: function(rawdata, parent){
				return new this(rawdata, parent);
			},
			
			COL: function(rawdataArray, parent){
				if (!rawdataArray) {
					return [];
				}
				if (!Array.isArray(rawdataArray)){
					rawdataArray = [rawdataArray];
				}
				var col = [];
				for(var i = 0; i < rawdataArray.length; i++){
					col.push( new this(rawdataArray[i], parent) );
				}
				return col;
			},
			
			sortCOL: function(COL, reverse){
				return DataObjects.sortCOLByProperty(
					COL,
					(this.sortProperty ? this.sortProperty : this.primaryKey),
					!!reverse
				);
            },
			reverseSortCOL: function(COL){
				return this.sortCOL(COL, true);
            },
			
			asPkType: function(val) {
				var pkType = this.getRecursiveProperty(this.primaryKey, "raw", this.prototype._types);
				return this.prototype.typeConvert(val, pkType);
			},



			enumLabelOfValue: function(property, value, defaultLabel){
				var proptype = this.getTypeOfProperty(property);
				if (!Array.isArray(proptype) || !proptype.length>=2 || !Array.isArray(proptype[1])) {
					return defaultLabel ? defaultLabel : "";
				}
				return ((typeof proptype[1][value-1] !== "undefined") ? proptype[1][value-1] : defaultLabel);
			},


			getTypeOfProperty: function(property) {
				var def = "raw",
					cprop,
					ptr = Object.shallowExtend({},this.types)
					;
				if (Array.isArray(property)) {
					property = property.slice(0);
		        } else {
					property = [property];
		        }
				while(property.length > 0) {
					cprop = property.shift();
					if (typeof cprop === "number") {
						cprop = 0;
	                }
					if (cprop === null || typeof ptr[cprop] === "undefined") {
						return def;
		            }
					ptr = ptr[cprop];
		        }
				return ptr;
		    },
			
			getRecursiveProperty: function(property, defaultValue, source) {
				var def = (typeof defaultValue !== "undefined") ? defaultValue : null,
					cprop,
					ptr = Object.shallowExtend({}, source)
					;
				if (Array.isArray(property)) {
					property = property.slice(0);
				} else {
					property = [property];
				}
				while(property.length > 0) {
					cprop = property.shift();
					if (typeof ptr[cprop] === "undefined") {
						return def;
					}
					ptr = ptr[cprop];
				}
				return ptr;
			},
			
		}
	});
	
	

	var DataObjects = Object.extends({
		
		__construct: function(){
			this.type = {};
			this.lang = "en";
			this.langPriorityChain = {};
	    },

		Base: BaseDO,
		extraBase: [],
		
		getLang: function(){
			return this.lang;
        },
		
		addToParentChain: function(newParentObjectDefinition){
			this.extraBase.push(newParentObjectDefinition);
        },
		
		setLang: function(lang){
			this.lang = (""+lang).toLowerCase();
			return this;
        },
		
		getLangPriorityChain: function(lang) {
			if (!lang) { lang = this.getLang(); }
			return (Array.isArray(this.langPriorityChain[lang]) ? this.langPriorityChain[lang] : []);
		},
		
		setLangPriorityChain: function(baselang, chain){
			if (!baselang) {
				throw new Error("Invalid baselang");
			}
			if (!Array.isArray(chain)) {
				throw new Error("Priority chain must be an array");
			}
			this.langPriorityChain[baselang] = chain;
		},
		
		get: function(name) {
			if (this.type && this.type[name]) {
				return this.type[name];
	        } else {
				throw new Error("No such data object");
	        }
	    },
		
		add: function(){
			this.createDataObjectType.apply(this, arguments);
		},
		
		createDataObjectType: function(name, types, extraPrototype, extraStatic) {
			
			//Handle call with object parameter pattern
			if (!types && typeof name === "object") {
				var options = populateDefaultOptions(name, {
					name: null,
					types: {},
					extraPrototype: {},
					extraStatic: {}
                });
				
				name = options.name;
				types = options.types;
				extraPrototype = options.extraPrototype;
				extraStatic = options.extraStatic;
            }
			
			
			//Handle default values
			if (!name) { throw new Error("Can't create data object without name"); }
			types = types ? types : {};
			extraPrototype = extraPrototype ? extraPrototype : {};
			extraStatic = extraStatic ? extraStatic : {};

			
			//Handle extra prototype
			var extendedExtraPrototype = {};
			var extendedExtraStatic = {};
			this._addMethodsToPrototype(types, extendedExtraPrototype, extendedExtraStatic);
			if (!Array.isArray(extraPrototype)){
				extraPrototype = [extraPrototype];
            }
			extraPrototype.push({
				_controller: this,
				_types: types,
				_name: name
            });
			for(var i = 0; i < extraPrototype.length; i++) {
				Object.shallowExtend(extendedExtraPrototype, extraPrototype[i] );
            }
			
			var parents = this.extraBase.slice(0);
			parents.push(this.Base);
			
			
			//Handle extra static
			if (!Array.isArray(extraStatic)){
				extraStatic = [extraStatic];
            }
			extraStatic.push({
				DOname: name,
				types: types
            });
			extraStatic.push(extendedExtraStatic);
			var nxst = {};
			for(var i = 0; i < extraStatic.length; i++) {
				Object.shallowExtend(nxst, extraStatic[i] );
            }
			extraStatic = nxst;
			
			this.type[name] = Object.extends(extendedExtraPrototype,{
				name: name+"DO",
				parent: parents,
				extraStatic: extraStatic
            });
			
			//Return the DO
			return this.type[name];
	    },
		
		removeDataObjectType: function(name){
			delete this.type[name];
			return (typeof this.type[name] === "undefined");
        },
		
		userMethodGeneratorFunctions: [],
		
		addUserMethodGeneratorFunction: function(callback){
			if (typeof callback !== "function") {
				throw new Error("Method generators must be functions");
			}
			this.userMethodGeneratorFunctions.push(callback);
		},
		
		_addMethodsToPrototype: function(types, extraPrototype, extraStatic, prevKeys, fulltypedef){
			prevKeys = prevKeys ? prevKeys : [];
			fulltypedef = fulltypedef ? fulltypedef : types;
			extraStatic = extraStatic ? extraStatic : {};
			extraStatic.Enum = extraStatic.Enum ? extraStatic.Enum : {};
			for (var key in types) {
				if (!types.hasOwnProperty(key)) { continue; }
				
				var pathkeys = prevKeys.slice(0);
				pathkeys.push(key);
				var type = types[key];

				var typeoptions = {};
				if (Array.isArray(type) && type.length===2 && typeof type[0]==="string") {
					typeoptions = type[1];
					type = type[0];
				}
				
				/*
				if (Array.isArray(type)) {
					extraPrototype[ this._makeMethodName(pathkeys,"get") ] =
						this.__static.methodFactory.makeArrayGetter(pathkeys_value);
					pathkeys.push(0);
					this._addMethodsToPrototype(types[key], extraPrototype, pathkeys, fulltypedef);
					continue;
	            }
				*/
				
				//Recursive call here!
				if (typeof type !== "string") {
					extraPrototype[ this._makeMethodName(pathkeys,"get") ] =
						this.__static.methodFactory.makeGetter(pathkeys);
					this._addMethodsToPrototype(types[key], extraPrototype, extraStatic, pathkeys, fulltypedef);
					continue;
	            }
				
				var pathkeys_value = pathkeys;
				
				//Aliases
				if (type.slice(0,6)==="alias:") {
					var aliasname = types[key].slice(6);
					try {
						aliasname = aliasname.replace(/\'/g,'"');
						aliasname = JSON.parse(aliasname);
					} catch(e) {
						//pass
					}
					if (aliasname) {
						if (!Array.isArray(aliasname)) {
							aliasname = [aliasname];
						}
						type = this.Base.getRecursiveProperty(aliasname, type, fulltypedef);
						pathkeys_value = aliasname;
					}
                }
				
				var userGeneratorResult = null;
				for (var i = 0; i < this.userMethodGeneratorFunctions.length; i++) {
					var generator = this.userMethodGeneratorFunctions[i];
					userGeneratorResult = generator.bind(this)(pathkeys, pathkeys_value, type, extraPrototype, fulltypedef);
					if (userGeneratorResult === false) {
						break;
					}
				}
				if (userGeneratorResult === false) {
					continue;
				}
				
				//Subtype
				if (type.slice(0,1)==="<" && type.slice(-1)===">") {
					var dotype = type.slice(1,-1);
					extraPrototype[ this._makeMethodName(pathkeys,"get") ] =
						this.__static.methodFactory.makeTypeGetter(pathkeys_value, dotype, false);
					extraPrototype[ this._makeMethodName(pathkeys,"set") ] =
						this.__static.methodFactory.makeTypeSetter(pathkeys_value, dotype);
					continue;
                }
				//Subtype array
				if (type.slice(0,1)==="[" && type.slice(-1)==="]") {
					var dotype = type.slice(1,-1);
					extraPrototype[ this._makeMethodName(pathkeys,"get") ] =
						this.__static.methodFactory.makeTypeGetter(pathkeys_value, dotype, true);
					extraPrototype[ this._makeMethodName(pathkeys,"pkGet") ] =
						this.__static.methodFactory.makeTypePkGetter(pathkeys_value, dotype);
					extraPrototype[ this._makeMethodName(pathkeys,"push") ] =
						this.__static.methodFactory.makeTypePusher(pathkeys_value, dotype);
					extraPrototype[ this._makeMethodName(pathkeys,"pop") ] =
						this.__static.methodFactory.makeTypePopper(pathkeys_value, dotype);
					extraPrototype[ this._makeMethodName(pathkeys,"lengthOf") ] =
						this.__static.methodFactory.makeLengthGetter(pathkeys_value);
					continue;
                }
				
				if (type==="boolean" || type==="bool") {
					extraPrototype[ this._makeMethodName(pathkeys,"is") ] =
						this.__static.methodFactory.makeGetter(pathkeys_value);
                }
				
				if (type==="enum") {
					extraPrototype[ this._makeMethodName(pathkeys,"labelOf") ] =
						this.__static.methodFactory.makeEnumLabelGetter(pathkeys_value, typeoptions);
					extraStatic[ this._makeMethodName(pathkeys,"enumLabelOf","Value") ] =
							this.__static.methodFactory.makeStaticEnumLabelGetter(pathkeys_value);
					
					if (typeoptions && typeoptions.length) {
						var enumdefs = {};
						for (var i = 0; i < typeoptions.length; i++) {
							enumdefs[typeoptions[i]] = i+1;
						}
						extraStatic.Enum[this._makeMethodName(pathkeys)] = enumdefs;
					}
                }
				
				//Just type inference
				extraPrototype[ this._makeMethodName(pathkeys,"get") ] =
					this.__static.methodFactory.makeGetter(pathkeys_value);
				extraPrototype[ this._makeMethodName(pathkeys,"set") ] =
					this.__static.methodFactory.makeSetter(pathkeys_value);
				extraPrototype[ this._makeMethodName(pathkeys,"delete") ] =
					this.__static.methodFactory.makeRemover(pathkeys_value);
				
	        }
	    },
		
		ucfirst: function(s) {
		    return s.charAt(0).toUpperCase() + s.slice(1);
		},
		
		_makeMethodName: function(parts, prefix, suffix) {
			parts = Array.isArray(parts) ? parts : [parts];
			prefix = prefix ? prefix : "";
			suffix = suffix ? suffix : "";
			var methodName = "";
			for(var i = 0; i < parts.length; i++) {
				var part = parts[i];
				if (typeof part === "number") {
					part = "array";
				} else if (typeof part !== "string") {
					part = ""+part;
                }
				part = part.replace(/_([\d\w])/g, function(m, mchar){ return mchar.toUpperCase(); })
				methodName += this.ucfirst(part);
			}
			return prefix+methodName+suffix;
	    },
		
		
		
		
		
		runOnCOL: function(COL, methodName, methodParams){
			if (!COL) {
				return {};
			}
			if (!Array.isArray(COL)) {
				COL = [COL];
			}
			var values = {};
			for(var i = 0; i < COL.length; i++) {
				var DO = COL[i];
				var pkval = DO.pkGet();
				var result = ((typeof DO[methodName] === "function")
							  	? DO[methodName].apply(DO, methodParams)
							  	: null
							 );
				values[pkval] = result;
			}
			return values;
		},
		
		runOnCOLAsArray: function(COL, methodName, methodParams){
			var valsindexed = this.runOnCOL(COL, methodName, methodParams);
			var arr = [];
			jQuery.each(valsindexed, function(i,v){ arr.push(v); });
			return arr;
		},
		
		getCOLIDs: function(COL) {
			if (!COL) {
				return;
			}
			if (!Array.isArray(COL)) {
				COL = [COL];
			}
			var values = [];
			for(var i = 0; i < COL.length; i++) {
				values.push( COL[i].pkGet() );
			}
			return values;
		},
		
		getRawCOL: function(COL){
			if (!COL) {
				return;
			}
			if (!Array.isArray(COL)) {
				COL = [COL];
			}
			var raw = [];
			for(var i = 0; i < COL.length; i++) {
				raw.push( COL[i].get() );
			}
			return raw;
		},
		
		itemInCOL: function(item, COL){
			return (this.runOnCOLAsArray(COL, "pkGet").indexOf( item.pkGet() ) !== -1);
		},
		
		sortCOLByProperty: function(COL, property, reverse){
			if (!COL) { return; }
			if (!Array.isArray(COL)) { return; }
			if (!COL.length || !COL[0] || !COL[0].getTypeOfProperty) { return; }
			
			var type = COL[0].getTypeOfProperty(property);
			
			COL.sort(function(a,b){
				var av = a.get(property);
				var bv = b.get(property);
				if (type==="string" || type==="str" || type==="multilang") {
					av = av.toLowerCase();
					bv = bv.toLowerCase();
                }
				if (av < bv) { return (reverse?1:-1); }
				else if (av > bv) { return (reverse?-1:1); }
				else { return 0; }
				
            });
        },
		reverseSortCOLByProperty: function(COL, property){
			return this.sortCOLByProperty(COL, property, true);
        },
		
		filterCOLByPropertyValue: function(COL, property, value){
			var newCOL = [];
			for(var i = 0; i < COL.length; i++) {
				var DO = COL[i];
				if (Array.isArray(value)) {
					if (value.indexOf(DO.get(property)) !== -1) {
						newCOL.push(DO);
					}
				} else {
					if (DO.get(property) === value) {
						newCOL.push(DO);
					}
				}
			}
			return newCOL;
		}
		
	}, {
		name: "DataObjectController",
		instance: true,
		extraStatic: {
			methodFactory: {

				//Static data object getter
				makeStaticEnumLabelGetter: function(property){
					return function(value, defaultLabel){
						var proptype = this.getTypeOfProperty(property);
						if (!Array.isArray(proptype) || !proptype.length>=2 || !Array.isArray(proptype[1])) {
							return defaultLabel ? defaultLabel : "";
						}
						return ((typeof proptype[1][value-1] !== "undefined") ? proptype[1][value-1] : defaultLabel);
					};
				},

				//The functions returned by these methods are expected to run
				//in the context of a data object.
				makeGetter: function(property){
					return function(defaultValue, astype){
						return this.get(property, defaultValue, astype);
					};
				},
				makeRemover: function(property){
					return function(){
						return this.delete(property);
					};
				},
				makeEnumLabelGetter: function(property, typeoptions){
					if (!Array.isArray(typeoptions)) {
						return function(defaultValue){
							return defaultValue ? defaultValue : "";
						}
					}
					typeoptions = typeoptions.slice(0);
					return function(defaultValue){
						var proptype = this.getTypeOfProperty(property);
						
						return this.get(property, defaultValue, ["enumlabel", typeoptions]);
					};
				},
				makeGetterAsType: function(property, astype){
					return function(defaultValue){
						return this.get(property, defaultValue, astype);
					};
				},
				makeSetter: function(property){
					return function(value){
						if(typeof value === "undefined") {
							return this.delete(property);
						}
						return this.set(property, value);
					};
				},
				makeLengthGetter: function(property){
					return function(){
						return this.get(property, 0, "length");
					};
				},
				makeTypeGetter: function(property, dotype, isarray){
					return function(index){
						return this.typeGet(property, dotype, index, isarray);
					};
				},
				makeTypePusher: function(property, dotype){
					return function(DOinst){
						return this.typePush(property, dotype, DOinst);
					};
				},
				makeTypePopper: function(property, dotype){
					return function(id){
						return this.typePop(property, dotype, id);
					};
				},
				makeTypePkGetter: function(property, dotype){
					return function(id){
						return this.typePkGet(property, dotype, id);
					};
				},
				makeTypeSetter: function(property, dotype){
					return function(DOinst){
						return this.typeSet(property, dotype, DOinst);
					};
				},
				makeArrayGetter: function(property){
					return function(index,subprop,defaultValue,asType){
						if (typeof index === "undefined") {
							return this.get(property, [], "array");
						} else {
							return this.get(property.concat(index,subprop), defaultValue, asType);
						}
					};
				},
			},
		}
    });

	window.DataObjects = DataObjects;
	
}());