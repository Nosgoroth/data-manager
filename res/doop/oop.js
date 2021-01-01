(function(){
	
	/*
	JS inheritance system
	
	
	
	
	== Object.shallowExtend ==
	
	Helper static function Object.shallowExtend is a dumbed down copy of
	jQuery.extend to remove dependencies. It doesn't do deep copy.
	
	Docs: https://api.jquery.com/jquery.extend/
	
	
	
	
	== Object.extends ==
	
	Object extension method. Static method of Object. Will extend prototype and
	static methods, and add in-place static helpers to the type.
	
		Function signature:

			Object.extends({
				//Extra prototype
				__construct: function(){},		//The __construct method will be called on instance
												//  of this type and its children, if it exists.
				someOtherMethod: function(){}
			}, {
				//Options, all optional
				name: "MyObjectName",	//Defaults to "Class",
				instance: false, 		//Defaults to false. If true returns instance of object
				parent: MyParentObject, //Parent to inherit from. Its __construct method will
										//  be called on object instance if it exists. Can be an
										//  array of parents for multiple inheritance.
										//  Defaults to Object.
				extraStatic: {
					//Optional extra static methods to be added to the object definition
					someStaticMethod: function(){}
				}
			});

		Extended prototype:
		
			Class.protototype.__parent		//Parent class of this type
			Class.protototype.__classname	//The class name
			Class.protototype.__static		//Convenience access to the object definition
		
		Extended static:
		
			Class.__parent					//Parent class of this type
			Class.__classname				//The class name
			
			//In-place extensions
			Class.__extend({})
			Class.__extendStatic({})
	
	
	
	
	
	*/
	
	//Polyfill Array.isArray
	Array.isArray||(Array.isArray=function(a){return''+a!==a&&{}.toString.call(a)=='[object Array]'});
	
	//Adapted/simplified from Object.shallowExtend source
	Object.shallowExtend = function() {
		var options, name, src, copy,
			target = arguments[ 0 ] || {},
			i = 1;

		// Handle case when target is a string or something (possible in deep copy)
		if ( (typeof target !== "object") && (typeof target !== "function") ) {
			target = {};
		}

		for ( ; i < arguments.length; i++ ) {
			options = arguments[i];
			if (options == null) { continue; }
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];
				if ( target === copy ) { continue; }
				if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
		
		return target;
	}
	

	Object.extends = function(parent, name, extraPrototype, instance) {
		var extraStatic = {};
		
		if (!extraPrototype) {
			extraPrototype = parent;
			var options = Object.shallowExtend({}, {
				parent: Object,
				name: null,
				instance: false,
				extraStatic: {}
            }, (name ? name : {}));
			parent = options.parent;
			name = options.name;
			instance = options.instance;
			extraStatic = options.extraStatic;
        }
		
		if (!parent) { parent = Object; }
		
		if (Array.isArray(parent)){
			var intermediate = Object;
			for(var i = 0; i < parent.length; i++){
				intermediate = Object.extends(parent[i].prototype,{
					name: parent[i].__classname ? parent[i].__classname : "IntermediateObject",
					parent: intermediate,
					extraStatic: parent[i]
                });
			}
			parent = intermediate;
        }
		
		if (!name) { name = "Class"; }
		name = (""+name).replace(/[^\d\w]+/gi, "");
		if (!extraPrototype) { extraPrototype = {}; }
		if (!extraPrototype.__construct) { extraPrototype.__construct = function(){}; }
		instance = !!instance;
		
		//Convenience methods to quickly add stuff to an object
		extraStatic.__extend = function(extra){ Object.shallowExtend(this.prototype, extra); }
		extraStatic.__extendstatic = function(extra){ Object.shallowExtend(this, extra); }
		extraStatic.__extendStatic = extraStatic.__extendstatic;
		
		//Run through the parent constructors, then construct, from parent to children.
		//Runs on instance time.
		extraPrototype.__inheritance_init = function(){
			var parentpointer = this.__parent;
			var constructors = [];
			if (this.__construct) {
				constructors.push(this.__construct);
            }
			while(parentpointer){
				if (parentpointer.prototype && parentpointer.prototype.__construct){
					constructors.push(parentpointer.prototype.__construct);
				}
				parentpointer = parentpointer.__parent;
            }
			for(var i = constructors.length - 1; i >= 0; i--){
				constructors[i].apply(this, arguments);
			}
	    }
		
		//Create a new object with the specified name. Yeah. I know.
		var Class = new Function(
			"return function " + name + "(){ this.__inheritance_init.apply(this, arguments); }"
		)();
		
		//Extend its prototype
		Object.shallowExtend(Class.prototype, parent.prototype, extraPrototype);
		
		//Extend its static methods
		Object.shallowExtend(Class, parent, extraStatic);
		
		//Set the parent pointer and readable name
		Class.__parent = parent;
		Class.__classname = name;
		Class.prototype.__parent = parent;
		Class.prototype.__classname = name;
		Class.prototype.__static = Class;
		
		//Return it either as is or instanced.
		if (instance){
			return new Class();
        } else {
			return Class;
        }
	}

}());