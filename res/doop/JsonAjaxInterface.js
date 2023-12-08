
window.JsonAjaxInterface = Object.extends({

	_ajaxendpoint: "./",
	_type: null,
	_dataset: null,
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

		let modificationCheckInterval = this._jsonAjaxAutostartCheckingRemoteModificationWithInterval;
		if (window._globalConfig) {
			modificationCheckInterval = window._globalConfig.get("intervalForDataUpdatedRemotelyCheckMs", modificationCheckInterval);
		}

		if (modificationCheckInterval && modificationCheckInterval > 0) {
			this.jsonAjaxStartCheckingRemoteModification(modificationCheckInterval);
		}

		this.jsonAjaxAddBlockerHtmlToPage();
	},

	jsonAjaxLoad: function(success, error){
		success = ((typeof success === "function") ? success : function(){});
		error = ((typeof error === "function") ? error : function(){});

		var data = {
			action: "ajaxload",
			domain: this._type.DOname,
			dataset: this._dataset,
		};

		if (!this._allowCacheResponses) {
			data["t"] = Date.now();
		}

		jQuery.ajax({
			url: this._ajaxendpoint,
			data: data,
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
				dataset: this._dataset,
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
				domain: this._type.DOname,
				dataset: this._dataset,
			},
			method: "POST",
			dataType: "json",
			success: function(data){
				if (data && data.lastmodified) {
					if (data.lastmodified > this._lastModified) {


						let reloadAutomaticallyOnDataUpdatedRemotely = false;
						let showBlockerOnDataUpdatedRemotely = true;
						if (window._globalConfig) {
							reloadAutomaticallyOnDataUpdatedRemotely = window._globalConfig.get("reloadAutomaticallyOnDataUpdatedRemotely", false);
							showBlockerOnDataUpdatedRemotely = window._globalConfig.get("showBlockerOnDataUpdatedRemotely", true);
						}

						if (showBlockerOnDataUpdatedRemotely) {
							this.jsonAjaxShowBlocker();
							this.jsonAjaxStopCheckingRemoteModification();
						}

						if (reloadAutomaticallyOnDataUpdatedRemotely) {
							this.jsonAjaxDisableBlockerButton();
							setTimeout(()=>{
								this.JsonAjaxInterface_onDataUpdatedRemotely();
							}, 100);
						}
					}
					this._lastModified = data.lastmodified;
				}
			}.bind(this),
			error: function(e){
				
			}.bind(this)
		});
	},


	jsonAjaxShowBlocker: function() {
		this.jsonAjaxEnableBlockerButton();
		this.$blockerContainer.css({
			display: "flex",
		});
	},
	jsonAjaxHideBlocker: function() {
		this.$blockerContainer.css({
			display: "none",
		});
	},

	jsonAjaxOnBlockerClick: function() {
		this.jsonAjaxDisableBlockerButton();
		setTimeout(()=>{
			this.JsonAjaxInterface_onDataUpdatedRemotely();
		}, 100);
	},

	jsonAjaxEnableBlockerButton: function() {
		this.$blockerReloadButton.removeAttr("disabled");
	},
	jsonAjaxDisableBlockerButton: function() {
		this.$blockerReloadButton.attr("disabled", "disabled");
	},


	jsonAjaxAddBlockerHtmlToPage: function() {
		if (this.$blockerContainer) { return this.$blockerContainer; }
		this.$blockerContainer = jQuery("#ReloadHandler_ActionBlocker");
		if (this.$blockerContainer.length) { return this.$blockerContainer; }
		this.$blockerContainer = jQuery("body").appendR('<div id="ReloadHandler_ActionBlocker">');
		this.$blockerContainer.css({
			position: "fixed",
			"z-index": 10000,
			display: "none",
			top: 0, left: 0, bottom: 0, right: 0,
			background: "black",
			color: "white",
		    "align-items": "center",
		    "justify-content": "center",
		});
		const $subcont = this.$blockerContainer.appendR('<div class="subblockerContainer">');
		$subcont.css({
			"max-width": "80vw"
		});
		$subcont.appendR('<h3>').text('Reload needed');
		$subcont.appendR('<p>').text('The data has changed on the server and the page needs to reload.');
		this.$blockerReloadButton = $subcont.appendR('<button class="btn btn-inverse">').text('Reload now');
		this.$blockerReloadButton.click(e => {
			e.preventDefault(); e.stopPropagation();
			this.jsonAjaxOnBlockerClick();
		});
		return this.$blockerContainer;
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