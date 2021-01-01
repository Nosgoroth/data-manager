
window.JsonAjaxInterface = Object.extends({

	_ajaxendpoint: "./",
	_type: null,

	//private
	_COL: [],

	ready: function(){
		if (!this._type) {
			throw new Error("Type not defined");
		}
		this._COL = [];
		this.jsonAjaxLoad(this.JsonAjaxInterface_afterDataReady.bind(this));
		this.JsonAjaxInterface_afterDomReady();
	},

	jsonAjaxLoad: function(success, error){
		success = ((typeof success === "function") ? success : function(){});
		error = ((typeof error === "function") ? error : function(){});
		jQuery.ajax({
			url: this._ajaxendpoint,
			data: {
				action: "ajaxload",
				domain: this._type.DOname
			},
			method: "POST",
			dataType: "json",
			success: function(data){
				this._COL = this._type.COL(data);
				success();
			}.bind(this),
			error: function(e){
				this.error("Error loading data", e);
				error(e);
			}.bind(this)
		});
	},

	jsonAjaxSave: function(success, error){
		success = ((typeof success === "function") ? success : function(){});
		error = ((typeof error === "function") ? error : function(){});
		return jQuery.ajax({
			url: this._ajaxendpoint,
			data: {
				action: "ajaxsave",
				domain: this._type.DOname,
				data: JSON.stringify(this._COL.asRawArray())
			},
			method: "POST",
			success: function(){
				success();
			}.bind(this),
			error: function(e){
				this.error("Error saving data", e);
				error(e);
			}.bind(this)
		});
	},

	JsonAjaxInterface_afterDomReady: function(){
		throw new Error("Domready must be implemented");
	},

	JsonAjaxInterface_afterDataReady: function(){
		throw new Error("Dataready must be implemented");
	},



}, {
	name: "JsonAjaxInterface",
	parent: [LoggableObject, ReadyObject]
});