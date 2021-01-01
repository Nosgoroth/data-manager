
window.Logger = Object.extends({
	
	LV_ALL: 0,
	LV_DEBUG: 1,
	LV_INFO: 2,
	LV_WARN: 3,
	LV_ERROR: 4,
	LV_NONE: 9,
	
	__construct: function(){
		this._level = this.LV_ALL;
		this.enable = true;
		this.show_timing = false;
    },
	
	setLevel: function(level){
		this._level = level;
    },
	
	with: function(level) {
		switch(level){
			default:
			case this.LV_DEBUG: return this.debug;
			case this.LV_INFO:  return this.info;
			case this.LV_WARN:  return this.warn;
			case this.LV_ERROR: return this.error;
        }
    },

    showTiming: function(val){
    	if (typeof val === "undefined") { val = true; }
    	this.show_timing = !!val;
    },
	
	
	debug: function(){ return this._log(arguments, this.LV_DEBUG); },
	log:   function(){ return this._log(arguments, this.LV_DEBUG); },
	info:  function(){ return this._log(arguments, this.LV_INFO ); },
	warn:  function(){ return this._log(arguments, this.LV_WARN ); },
	error: function(){ return this._log(arguments, this.LV_ERROR); },
	
	_log: function(args, level){
		if (level < this._level) {
			return;
        }
		var args = Array.prototype.slice.call(args);
		
		//Show timing if appropriate
	    if (this.show_timing) {
			args.push( this._getTimingString() );
	    }
		
		
		if (window.console) {
			switch(level){
				default:
				case this.LV_DEBUG: console.log.apply(console, args); break;
				case this.LV_INFO:  console.info.apply(console, args); break;
				case this.LV_WARN:  console.warn.apply(console, args); break;
				case this.LV_ERROR: console.error.apply(console, args); break;
	        }
        }
		
		//Set level into message for log history
		switch(level){
			default:
			case this.LV_DEBUG: args.unshift("[DEBUG]"); break;
			case this.LV_INFO:  args.unshift("[INFO]" ); break;
			case this.LV_WARN:  args.unshift("[WARN]" ); break;
			case this.LV_ERROR: args.unshift("[ERROR]"); break;
        }
		
		this._handleLogHistory(args);
    },
	
	_getTimingString: function(){
		var now = Date.now();
        if (this._timelog_latest) {
            var diff = now - this._timelog_latest, unit = 'ms', precision = 0;
            if (diff>=1000) {
                diff = diff/1000; precision = 2; unit = 's';
            }
            if (unit!=='ms') {
                var pow = Math.pow(10, precision); diff = Math.round(diff*pow)/pow;
            }
			this._timelog_latest = now;
            return "<"+diff+unit+">";
        } else {
			this._timelog_latest = now;
            return "<Timing start>";
        }
        
    },
	
	_handleLogHistory: function(args){
		if (window.app && window.app.DebugLog && window.appconfig.get("debuglog")) {
	        window.app.DebugLog.add( args );
	    }
		if (window.app && window.app.kmvc && window.appconfig) {
	        
	        var page = window.appconfig.get("lastInterceptedPageID");
	        if (!page || page==="/") { return; }
	        window.app.kmvc
	            .getPageElement( page )
	            .find(".debug-container")
	            .text( args.join(" ") )
	            ;
	    }
    },
	
}, {
	name: "Logger",
	instance: true
});

window.log = function(){ window.Logger.debug.apply(window.Logger, arguments); };



window.LoggableObject = Object.extends({
	
	__isLoggableObject: true,
	
	log: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift("["+this.__classname+"]");
		Logger.debug.apply(Logger, args);
	},
	debug: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift("["+this.__classname+"]");
		Logger.debug.apply(Logger, args);
	},
	info: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift("["+this.__classname+"]");
		Logger.info.apply(Logger, args);
	},
	warn: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift("["+this.__classname+"]");
		Logger.warn.apply(Logger, args);
	},
	error: function(){
		var args = Array.prototype.slice.call(arguments);
		args.unshift("["+this.__classname+"]");
		Logger.error.apply(Logger, args);
	},
	
}, {
	name: "LoggableObject"
});

if (window.DataObjects) {
	window.DataObjects.addToParentChain(LoggableObject);
}

