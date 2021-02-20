
window.JsonAjaxInterface = Object.extends({

	_ajaxendpoint: "./",
	_type: null,
	_jsonAjaxAutostartCheckingRemoteModificationWithInterval: null,

	//private
	_COL: [],

	_lastModifiedCheckingInterval: null,
	_lastModified: Infinity,

	ready: function(){
		if (!this._type) {
			throw new Error("Type not defined");
		}
		this._COL = [];
		this.jsonAjaxLoad(this.JsonAjaxInterface_afterDataReady.bind(this));
		this.JsonAjaxInterface_afterDomReady();

		if (this._jsonAjaxAutostartCheckingRemoteModificationWithInterval) {
			this.jsonAjaxStartCheckingRemoteModification(
				this._jsonAjaxAutostartCheckingRemoteModificationWithInterval
			);
		}
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
		var fallback = this._lastModified;
		this._lastModified = Infinity;
		return jQuery.ajax({
			url: this._ajaxendpoint,
			data: {
				action: "ajaxsave",
				domain: this._type.DOname,
				data: JSON.stringify(this._COL.asRawArray())
			},
			method: "POST",
			success: function(){
				this._lastModified = Infinity;
				success();
			}.bind(this),
			error: function(e){
				this._lastModified = fallback;
				this.error("Error saving data", e);
				error(e);
			}.bind(this)
		});
	},

	// _lastModifiedCheckingInterval: null,
	// _lastModified: 0,

	jsonAjaxStartCheckingRemoteModification: function(interval) {
		this.jsonAjaxStopCheckingRemoteModification();
		this._lastModifiedCheckingInterval = setInterval(
			this.jsonAjaxRetrieveRemoteLastModified.bind(this),
			interval ?? 10000
		);
		this.jsonAjaxRetrieveRemoteLastModified();
	},

	jsonAjaxStopCheckingRemoteModification: function() {
		clearInterval(this._lastModifiedCheckingInterval);
	},

	jsonAjaxRetrieveRemoteLastModified: function(){
		jQuery.ajax({
			url: this._ajaxendpoint,
			data: {
				action: "lastmodified",
				domain: this._type.DOname
			},
			method: "POST",
			dataType: "json",
			success: function(data){
				if (data && data.lastmodified) {
					if (data.lastmodified > this._lastModified) {
						this.JsonAjaxInterface_onDataUpdatedRemotely();
					}
					this._lastModified = data.lastmodified;
				}
			}.bind(this),
			error: function(e){
				
			}.bind(this)
		});
	},

	JsonAjaxInterface_afterDomReady: function(){
		throw new Error("Domready must be implemented");
	},

	JsonAjaxInterface_afterDataReady: function(){
		throw new Error("Dataready must be implemented");
	},

	JsonAjaxInterface_onDataUpdatedRemotely: function(){
		console.info('onDataUpdatedRemotely is not implemented');
	},



}, {
	name: "JsonAjaxInterface",
	parent: [LoggableObject, ReadyObject]
});