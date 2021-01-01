window.customMultiDataObjectEditor = Object.extends({

	_types: [],
	_types_idx: {},
	_typeoptions: {},

	toggleStatuses: {},
	filterStatuses: {},
	extraValues: {},

	registerDataObject: function(_type, options){
		this._types.push(_type);
		var key = _type.DOname.toLowerCase();
		this._types_idx[key] = _type;
		this._typeoptions[key] = options ? options : {};
		if (!this.defaultType) {
			//this.defaultType = key;
		}
	},

	setDefaultType: function(typename){
		this.defaultType = typename.toLowerCase();
	},

	ready: function(){
		this._originalTitle = document.title;

		this.$app = jQuery("#app");
		this.$title = this.$app.find("header h3");
		this.$typeSelector = this.$app.find("header .typeselector");
		this.$editorContainer = this.$app.find(".adoe_container");

		for (var i = 0; i < this._types.length; i++) {
			var _type = this._types[i];
			var label = _type.DOname[0]+_type.DOname.substr(1).replace(/[A-Z]/g, function(match){
				return " "+match.toLowerCase();
			});
			jQuery("<option>")
				.attr("value", _type.DOname.toLowerCase())
				.text(label)
				.appendTo(this.$typeSelector)
				;
		}
		if (this.defaultType) {
			this.$typeSelector.val(this.defaultType);
		}
		this.$typeSelector.on('change', function(e){
			this.renderTypeEditor(this.$typeSelector.val());
		}.bind(this));

		if (this.defaultType) {

			if (document.location.hash) {
				var statuses = {};
				var filters = {};
				var extravalues = {};
				var rawstatuses = document.location.hash.replace(/^#/,"").split("|");
				for (var i = 0; i < rawstatuses.length; i++) {
					var rawstatus = rawstatuses[i].split("=");
					if (rawstatus.length!==2) { continue; }
					if (rawstatus[0].startsWith("filter-")) {
						var field = rawstatus[0].replace("filter-", "");
						filters[field] = rawstatus[1];
					} else if (rawstatus[0].startsWith("ev-")) {
						var key = rawstatus[0].replace("ev-", "");
						extravalues[key] = rawstatus[1];
					} else {
						statuses[rawstatus[0]] = (rawstatus[1]==="true");
					}
				}
				this.filterStatuses[this.defaultType] = filters;
				this.toggleStatuses[this.defaultType] = statuses;
				this.extraValues[this.defaultType] = extravalues;
			}


			this.renderTypeEditor(this.defaultType);
		
		} else {

			this.renderTypeEditorSelector();

		}

	},

	updateBrowserUri: function(){
		var title = this._originalTitle;
		var value;
		if (this._editor) {
			title = this._editor._type.DOname + " manager";
			value = this._editor._type.DOname.toLowerCase();
		} else {
			title = "Data manager";
		}
		var newUri = updateUrlParameter(document.location.href, "type", value);
		newUri = newUri.replace(/#.*$/, "");

		if (this._editor) {
			var toggleStates = this._editor.getToggleStates();
			var arrStates = [];
			jQuery.each(toggleStates, function(className, state){
				arrStates.push( className+"="+(state?"true":"false") );
			});
			var filterStates = this._editor.getFilterStates();
			jQuery.each(filterStates, function(field, filterVal){
				arrStates.push( "filter-"+field+"="+filterVal );
			});
			var extraValues = this._editor.getExtraValues();
			jQuery.each(extraValues, function(key, value){
				arrStates.push( "ev-"+key+"="+value );
			});

			newUri += "#"+arrStates.join("|");


		}

		title = title[0]+title.substr(1).replace(/[A-Z]/g, function(match){
			return " "+match.toLowerCase();
		});

		history.replaceState( {} , title, newUri );
		document.title = title;
		this.$title.text(title);
	},

	renderTypeEditorSelector: function(){
		this.$editorContainer.empty();

		for (var i = 0; i < this._types.length; i++) {
			var _type = this._types[i];
			var label = _type.DOname[0]+_type.DOname.substr(1).replace(/[A-Z]/g, function(match){
				return " "+match.toLowerCase();
			});
			jQuery("<button>")
				.addClass("btn btn-inverse btn-type-selector")
				.attr("data-type", _type.DOname.toLowerCase())
				.click(function(e){
					e.preventDefault(); e.stopPropagation();
					var $this = jQuery(e.delegateTarget);
					this.renderTypeEditor($this.attr("data-type"))
				}.bind(this))
				.text(label)
				.appendTo(this.$editorContainer)
				;
		}
	},

	renderTypeEditor: function(typename){
		var key = typename.toLowerCase();
		var _type = this._types_idx[key];
		var _options = this._typeoptions[key];

		
		if (this._editor) {
			this.toggleStatuses[this._editor._type.DOname.toLowerCase()] = this._editor.getToggleStates();
			this.filterStatuses[this._editor._type.DOname.toLowerCase()] = this._editor.getFilterStates();
			this.extraValues[this._editor._type.DOname.toLowerCase()] = this._editor.getExtraValues();
			this._editor = null;
		}
		this.$editorContainer.empty();

		this.$typeSelector.val(typename);

		if (!_type){
			this.warn("No such type:", typename);
			this.updateBrowserUri();
			this.renderTypeEditorSelector();
			return;
		}

		this.$editorContainer.attr("data-type", _type.DOname);

		this._editor = Object.extends(Object.shallowExtend({}, _options, {
			_type: _type,
			_tableContainerSelector: jQuery("<div>").addClass("tableContainer").appendTo(this.$editorContainer),
			_formContainerSelector: jQuery("<div>").addClass("formContainer").appendTo(this.$editorContainer),
			DataObjectCollectionEditor_beforeRender: function(){
				if (this.toggleStatuses[key]) {
					this._editor.setToggleStates(this.toggleStatuses[key]);
					this._editor.addFilterStates(this.filterStatuses[key]);
					this._editor.setAllExtraValues(this.extraValues[key]);
				}
			}.bind(this),
			CustomDataObjectEditor_afterDataReady: function(){

				if (this.toggleStatuses[key]) {
					this._editor.setToggleStates(this.toggleStatuses[key]);
					this._editor.addFilterStates(this.filterStatuses[key]);
					this._editor.setAllExtraValues(this.extraValues[key]);
				}

				this._editor.$actionsContainer.find(".btn.classToggle").on('click', function(){
					setTimeout(function(){
						this.updateBrowserUri();
					}.bind(this), 0);
				}.bind(this));

				this.updateBrowserUri();
			}.bind(this),
			CustomDataObjectEditor_onFilterUpdate: function(){
				this.updateBrowserUri();
			}.bind(this)
		}),{
			name: "CustomDataObjectEditorFor"+_type.DOname,
			instance: true,
			parent: CustomDataObjectEditor
		});
	},

	saveAndUpdate: function(success, error){
		success = ((typeof success === "function") ? success : function(){});
		error = ((typeof error === "function") ? error : function(){});
		if (!this._editor) { setImmediate(error); return; }
		return this._editor.jsonAjaxSave(function(){
			this._editor.render();
			success();
		}.bind(this), error);
	}



},{
	name: "CustomMultiDataObjectEditor",
	instance: true,
	parent: [LoggableObject, ReadyObject]
});






window.CustomDataObjectEditor = Object.extends({
	_type: null,
	_tableContainerSelector: null,
	_formContainerSelector: null,
	_links: [],
	_classToggles: [],
	_filterOptions: {},
	_filterValues: {},


	_ajaxendpoint: "./ajax.php",

	CustomDataObjectEditor_afterDataReady: function(){},
	CustomDataObjectEditor_onFilterUpdate: function(){},

	DataObjectCollectionEditor_afterDomReady: function(){
		this.$formContainer.click(function(e){
			if (!e.target.isSameNode(e.delegateTarget)) {
				return;
			}
			this.closeForm();
		}.bind(this));
		
	},
	DataObjectCollectionEditor_onShowForm: function(){
	},

	setState: function(state) {
		if (!state) { return; }
		var needsRender = false;

		//Class toggles
		if (state.classToggles) {
			this.setAllToggleStates(state.classToggles);
		}


		//Sort, reverse
		if (state.sort) {
			this._COLsort = state.sort;
			this._reverseSort = !!state.reverseSort;
			needsRender = true;
		}


		//Filter
		if (state.filters) {
			this.setAllFilterStates(state.filters);
			this.onUpdateFilterStates();
		}


		//Refresh actions
		if (needsRender) {
			this.render();
		}
	},

	DataObjectCollectionEditor_afterDataReady: function(){

		if (this._states && this._states.length) {

			var $btnDropdown = this.$actionsContainer.appendR('<div class="btn-group"><a class="btn btn-small btn-info dropdown-toggle" data-toggle="dropdown" href="#">States <span class="caret"></span></a><ul class="dropdown-menu"></ul></div>');
			var $ul = $btnDropdown.find("ul.dropdown-menu");
			
			jQuery.each(this._states, function(i,state){
				$ul.appendR('<li>').appendR('<a>')
					.text(state.label)
					.click(function(e){
						e.preventDefault(); e.stopPropagation();
						this.setState(state);
					}.bind(this))
					;
			}.bind(this));
		}

		jQuery.each(this._classToggles, function(i,classToggle){
			if (!classToggle.class) {
				this.warn("Invalid toggle", classToggle);
				return;
			}
			if (!classToggle.title) { classToggle.title = classToggle.class; }

			if (!classToggle.nobutton) {
				var $btn = jQuery('<button class="btn btn-small btn-inverse classToggle">')
					.attr("data-classToggle", classToggle.class)
					.text((classToggle.default ? "✘" : "✔") + " " + classToggle.title)
					.appendTo(this.$actionsContainer)
					.click(function(e){
						e.preventDefault(); e.stopPropagation();
						this.$container.toggleClass(classToggle.class);
						$btn.text((this.$container.hasClass(classToggle.class) ? "✘" : "✔") + " " + classToggle.title);
					}.bind(this))
					;
			}

			this.$container.toggleClass(classToggle.class, !!classToggle.default);
		}.bind(this));

		if (this._links.length) {
			var $btnDropdown = this.$actionsContainer.appendR('<div class="btn-group"><a class="btn btn-small  dropdown-toggle" data-toggle="dropdown" href="#">Links <span class="caret"></span></a><ul class="dropdown-menu"></ul></div>');
			var $ul = $btnDropdown.find("ul.dropdown-menu");

			for (var i = 0; i < this._links.length; i++) {
				var link = this._links[i];
				if (!link.url) {
					this.warn("Invalid link", link);
					continue;
				}
				if (!link.title) { link.title = link.url; }
				$ul.appendR('<li>').appendR('<a>')
					.attr("target", "_blank")
					.attr("href", link.url)
					.text(link.title)
					;
			}
		}
		this.CustomDataObjectEditor_afterDataReady();
	},

	DataObjectCollectionEditor_onRenderTable: function($table){
		this.addFilterFooterToTable($table);
	},

	getclassToggleByClass: function(className) {
		for (var i = 0; i < this._classToggles.length; i++) {
			if (className === this._classToggles[i].class) {
				return this._classToggles[i];
			}
		}
		return null;
	},
	getToggleStateByClass: function(toggleClass){
		return this.getToggleStates()[toggleClass];
	},
	setToggleStateByClass: function(toggleClass, value){
		var x = {};
		x[toggleClass] = !!value;
		this.setToggleStates(x);
	},
	getToggleStates: function(){
		var states = {};
		if (this.$container) {
			for (var i = 0; i < this._classToggles.length; i++) {
				var toggleClass = this._classToggles[i].class;
				states[toggleClass] = !!this.$container.hasClass(toggleClass);
			}
		}
		return states;
	},
	setToggleStates: function(states){
		jQuery.each(states, function(className, state){
			var classToggle = this.getclassToggleByClass(className);
			if (!classToggle) { return; }
			this.$container.toggleClass(classToggle.class, !!state);
			this.$actionsContainer.find('.btn.classToggle[data-classToggle="'+classToggle.class+'"]')
				.text((state ? "✘" : "✔") + " " + classToggle.title);
		}.bind(this))
	},
	setAllToggleStates: function(states){
		jQuery.each(this._classToggles, function(i, classToggle){
			if (typeof states[classToggle.class] === "undefined") {
				states[classToggle.class] = false;
			}
		});
		this.setToggleStates(states);
	},

	extraValues: {},
	getExtraValues: function(){
		return Object.shallowExtend(this.extraValues);
	},
	getExtraValueByKey: function(key){
		return this.extraValues[key];
	},
	setExtraValue: function(key, val){
		this.extraValues[key] = val;
	},
	setExtraValues: function(keyvals){
		jQuery.each(keyvals, this.setExtraValue.bind(this));
	},
	setAllExtraValues: function(keyvals){
		this.extraValues = {};
		this.setExtraValues(keyvals);
	},


	addFilterFooterToTable: function($table){

		if ($table.find("tfoot.filters").length) { return; }

		var $tfoot = $table.appendR('<tfoot class="filters">').appendR("<tr>");


		$table.find("thead tr th").each(function(i, dom_th){
			var $th = $tfoot.appendR("<th>");

			var field = jQuery(dom_th).attr("data-field");
			if (!field) { return; }
			var fieldLabel = null;
			try { fieldLabel = this._renderOptions.typeoptions[field].label;
			} catch(e){}
			fieldLabel = fieldLabel ? fieldLabel : field.capitalize();
			var type = this._type.types[field];
			var typeoptions = null;
			if (Array.isArray(type) && type.length===2 && typeof type[0] === "string") {
				typeoptions = type[1];
				type = type[0];
			}

			$th.attr("data-field", field);

			var defaultLabel = "["+fieldLabel+"]";

			var selectOptions = [
				{ name: "-", value: "" }
			];
			switch(type) {
				case "bool":
				case "boolean":
					selectOptions.push({ name: fieldLabel+" ✔", value: "true" });
					selectOptions.push({ name: fieldLabel+" ✘", value: "false" });
					break;
				case "enum":
					for(var j = 0; j < typeoptions.length; j++) {
						var ev = typeoptions[j];
						selectOptions.push({ name: ev, value: j+1 });
					}
					break;
				default:
					return;
					break;
			}

			var $select = $th.appendR("<select>");
			var $selectVal = $th.appendR('<span class="selectval">');

			for (var j= 0; j < selectOptions.length; j++) {
				var so = selectOptions[j];
				$select.appendR('<option>').text(so.name).attr("value", so.value);
			}

			var defaultValue;
			try {
				defaultValue = this._filterOptions[field].defaultValue;
			} catch(e) {
			}
			defaultValue = defaultValue ? defaultValue : "";
			if (typeof this._filterValues[field] !== "undefined") {
				defaultValue = this._filterValues[field];
			}
			//$selectVal.text( $select.find("option:selected").text() );

			$select.on('change', function(){
				var filterval = $select.val();
				$selectVal.text( filterval ? $select.find("option:selected").text() : defaultLabel );
				$th.toggleClass("filtering", !!filterval);
				this._filterValues[field] = filterval;
				this.runFiltersOnTable($table);
			}.bind(this));

			$select.val(defaultValue);
			$select.trigger("change");

		}.bind(this));
	},

	runFiltersOnTable: function($table) {
		$table.find("tbody .dataObjectItem").each(function(i, dom_dataObjectItem){
			var $dataObjectItem = jQuery(dom_dataObjectItem);
			var shouldFilter = false;

			jQuery.each(this._filterValues, function(field, filterVal){
				if (shouldFilter) { return; } //If any filter was true, no need to keep looking 
				var attr = "data-fieldvalue-"+field;
				if (!dom_dataObjectItem.hasAttribute(attr)) { return; }
				var rowval = $dataObjectItem.attr(attr);
				if (filterVal !== "" && filterVal !== rowval) {
					shouldFilter = true;
				}
			});
			$dataObjectItem.toggleClass("filter-hidden", shouldFilter);
		}.bind(this));


		this.CustomDataObjectEditor_onFilterUpdate();
	},

	getFilterStates: function(){
		var filterStates = {};
		jQuery.each(this._filterValues, function(field, filterVal){
			var defaultValue;
			try {
				defaultValue = this._filterOptions[field].defaultValue;
			} catch(e) {
			}
			defaultValue = defaultValue ? defaultValue : "";

			if (filterVal !== defaultValue) {
				filterStates[field] = (filterVal !== "") ? filterVal : "~any~";
			}
		}.bind(this));
		return filterStates;
	},

	setFilterStates: function(states){
		this._filterValues = states;
		this.onUpdateFilterStates();
	},
	setAllFilterStates: function(states){
		jQuery.each(this._type.types, function(field, type){
			if (typeof states[field] === "undefined") {
				states[field] = "";
			}
		});
		this.setFilterStates(states);
	},
	addFilterStates: function(states){
		this._filterValues = jQuery.extend({}, this._filterValues, states);
		this.onUpdateFilterStates();
	},
	onUpdateFilterStates: function(states){
		jQuery.each(this._filterValues, function(field, filterVal){
			if (filterVal === "~any~") {
				this._filterValues[field] = "";
			}
		}.bind(this));
		this.runFiltersOnTable( this.$container.find("table") );

		var $table = this.$container.find("table");

		jQuery.each(this._filterValues, function(field, filterVal){
			var $th = $table.find("tfoot tr th").filter(function(j, th){
				return (jQuery(th).attr("data-field") === field);
			});
			if (!$th.length) { return; }
			$th.find("select").val(filterVal).trigger("change");
		});
	},

}, {
	name: "CustomDataObjectEditor",
	parent: DataObjectCollectionEditor
});



function updateUrlParameter(uri, key, value) {
  // remove the hash part before operating on the uri
  var i = uri.indexOf('#');
  var hash = i === -1 ? ''  : uri.substr(i);
  uri = i === -1 ? uri : uri.substr(0, i);

  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";

  if (!value) {
    // remove key-value pair if value is empty
    uri = uri.replace(new RegExp("([?&]?)" + key + "=[^&]*", "i"), '');
    if (uri.slice(-1) === '?') {
      uri = uri.slice(0, -1);
    }
    // replace first occurrence of & by ? if no ? is present
    if (uri.indexOf('?') === -1) uri = uri.replace(/&/, '?');
  } else if (uri.match(re)) {
    uri = uri.replace(re, '$1' + key + "=" + value + '$2');
  } else {
    uri = uri + separator + key + "=" + value;
  }
  return uri + hash;
}