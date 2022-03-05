DataObjects.Base.__extend({

	_dataObjectFormRenderer_renderTypeAsInputHidden: function(name, value){
		return jQuery('<input type="hidden">')
			.attr("data-doname", this._name)
			.attr("data-typename", name)
			.attr("data-id", this.pkGet())
			.attr("name", name)
			.val(value)
			;
	},

	_dataObjectFormRenderer_renderTypeContainer: function(name){
		return jQuery('<span class="dataObjectFormItem">')
			.attr("data-doname", this._name)
			.attr("data-typename", name)
			.attr("data-id", this.pkGet())
			;
	},
	_dataObjectFormRenderer_renderTypeAsInputText: function(name, value, options){
		options = populateDefaultOptions(options, {
			label: name.capitalize(),
			class: "",
			textarea: false,
			attr: {},
			event: {}
		});
		var id = this._name+"_"+name+"_"+this.pkGet();
		var $container = this._dataObjectFormRenderer_renderTypeContainer(name).attr("data-formtype", "text");

		if (!value && options.defaultValue) {
			defval = options.defaultValue;
			if (typeof defval === "function") {
				defval = defval();
			}
			if (typeof defval !== "string") {
				defval = JSON.stringify(defval);
			}
			value = defval;
		}

		jQuery('<label>').appendTo($container)
			.attr("for", id)
			.text(options.label)
			;
		var $input = jQuery(options.textarea ? '<textarea>' : '<input type="text">').appendTo($container)
			.addClass(options.class)
			.attr("id", id)
			.attr("name", name)
			.val(value)
			;

		for (var attrname in options.attr) {
			$input.attr(attrname, options.attr[attrname]);
		}
		for (var eventname in options.event) {
			$input.on(eventname, options.event[eventname]);
		}


		if (typeof options.transform === "function") {
			options.transform($container, name, value, options);
		}

		return $container;
	},
	_dataObjectFormRenderer_renderTypeAsInputNumber: function(name, value, options){
		options = populateDefaultOptions(options, {
			label: name.capitalize(),
			class: "",
			attr: {},
			event: {}
		});
		var id = this._name+"_"+name+"_"+this.pkGet();
		var $container = this._dataObjectFormRenderer_renderTypeContainer(name).attr("data-formtype", "number");

		if (!value && options.defaultValue) {
			defval = options.defaultValue;
			if (typeof defval === "function") {
				defval = defval();
			}
			if (typeof defval !== "number") {
				defval = parseInt(defval);
			}
			if (isNaN(defval)) {
				defval = null;
			}
			value = defval;
		}

		jQuery('<label>').appendTo($container)
			.attr("for", id)
			.text(options.label)
			;
		var $input = jQuery('<input type="number">').appendTo($container)
			.addClass(options.class)
			.attr("id", id)
			.attr("name", name)
			.val(value)
			;

		for (var attrname in options.attr) {
			$input.attr(attrname, options.attr[attrname]);
		}
		for (var eventname in options.event) {
			$input.on(eventname, options.event[eventname]);
		}

		if (typeof options.transform === "function") {
			options.transform($container, name, value, options);
		}

		return $container;
	},
	_dataObjectFormRenderer_renderTypeAsInputCheckbox: function(name, value, options){
		options = populateDefaultOptions(options, {
			label: name.capitalize(),
			class: "",
			attr: {},
			event: {}
		});
		var id = this._name+"_"+name+"_"+this.pkGet();
		var $container = this._dataObjectFormRenderer_renderTypeContainer(name).attr("data-formtype", "checkbox");

		if (!value && options.defaultValue) {
			defval = options.defaultValue;
			if (typeof defval === "function") {
				defval = defval();
			}
			value = !!defval;
		}

		var $input = jQuery('<input type="checkbox">').appendTo($container)
			.addClass(options.class)
			.attr("id", id)
			.attr("name", name)
			;

		if (!!value) {
			$input.attr("checked", "checked");
		}

		jQuery('<label>').appendTo($container)
			.attr("for", id)
			.text(options.label)
			;

		for (var attrname in options.attr) {
			$input.attr(attrname, options.attr[attrname]);
		}
		for (var eventname in options.event) {
			$input.on(eventname, options.event[eventname]);
		}

		if (typeof options.transform === "function") {
			options.transform($container, name, value, options);
		}

		return $container;
	},

	_dataObjectFormRenderer_renderTypeAsSelect: function(name, value, options){
		options = populateDefaultOptions(options, {
			label: name.capitalize(),
			class: "",
			rawoptions: [],
			attr: {},
			event: {}
		});
		var id = this._name+"_"+name+"_"+this.pkGet();
		var $container = this._dataObjectFormRenderer_renderTypeContainer(name).attr("data-formtype", "enum");

		if (!value && options.defaultValue) {
			defval = options.defaultValue;
			if (typeof defval === "function") {
				defval = defval();
			}
			if (typeof defval !== "number") {
				defval = parseInt(defval);
			}
			if (isNaN(defvl)) {
				defval = null;
			}
			value = defval;
		}

		jQuery('<label>').appendTo($container)
			.attr("for", id)
			.text(options.label)
			;
		var $select = jQuery('<select>').appendTo($container)
			.addClass(options.class)
			.attr("id", id)
			.attr("name", name)
			;

		$ph = jQuery("<option>").attr("value", "").text("- Select one -").appendTo($select);

		for (var i = 0; i < options.rawoptions.length; i++) {
			var intval = i+1;
			var label = options.rawoptions[i];
			jQuery("<option>").attr("value", intval).text(label).appendTo($select);
		}

		$select.val(value);

		for (var attrname in options.attr) {
			$select.attr(attrname, options.attr[attrname]);
		}
		for (var eventname in options.event) {
			$select.on(eventname, options.event[eventname]);
		}

		if (typeof options.transform === "function") {
			options.transform($container, name, value, options);
		}

		return $container;
	},

	_dataObjectFormRenderer_renderType: function(type, name, value, typeoptions){
		var astype = ((typeoptions && typeoptions.astype) ? typeoptions.astype : type);
		switch(astype){
			case "raw":
			default:
				value = JSON.stringify(value);
				return this._dataObjectFormRenderer_renderTypeAsInputText(name, value, typeoptions);

			case "string":
			case "str":
				return this._dataObjectFormRenderer_renderTypeAsInputText(name, value, typeoptions);

			case "boolean":
			case "bool":
				return this._dataObjectFormRenderer_renderTypeAsInputCheckbox(name, value, typeoptions);

			case "integer":
			case "int":
			case "number":
			case "float":
				value = (typeof value === "number") ? value : "";
				return this._dataObjectFormRenderer_renderTypeAsInputNumber(name, value, typeoptions);

			case "enum":
				return this._dataObjectFormRenderer_renderTypeAsSelect(name, value, typeoptions);

			case "length":
				return null;
			/*
			
			case "multilang":
				if (typeof val === "string") {
					return val;
				}
				var lang = this._getLang();
				if (val && val[lang]) {
					return val[lang];
				}
				return "";

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
			*/
		}
	},

	renderAsForm: function(options){
		options = populateDefaultOptions(options, {
			event: {},
			typeoptions: {},
			submitText: "Submit",
			submitClass: "",
			hideFields: []
		});

		var $form = jQuery("<form>");

		for (var key in this.__static.types) {
			var type = this.__static.types[key];
			var val = this.get(key);
			
			if (options.hideFields.indexOf(key) !== -1) {
				if (type==="bool" || type ==="boolean") {
					val = (val ? "1" : "");
				}
				this._dataObjectFormRenderer_renderTypeAsInputHidden(key, val).appendTo($form);
				continue;
			}

			
			var typeoptions = Object.shallowExtend({},options.typeoptions[key]);
			if (Array.isArray(type) && type.length===2 && typeof type[0] === "string") {
				typeoptions.rawoptions = type[1];
				type = type[0];
			}

			var $elm = this._dataObjectFormRenderer_renderType(type, key, val, typeoptions);
			$form.append($elm);
		}

		jQuery("<button>").addClass(options.submitClass).attr("type", "submit").text(options.submitText).appendTo($form);

		for (var eventname in options.event) {
			$form.on(eventname, options.event[eventname]);
		}

		return $form;
		
	},

	ingestForm: function($form){
		var rawdata = {};

		var data = $form.serializeArray();
		for (var i = 0; i < data.length; i++) {
			var val = data[i].value;
			try {
				val = val.trim();
			} catch (error) {
				// pass
			}
			rawdata[data[i].name] = val;
		}

		var booldata = $form.find('input:checkbox').map(function() {
			return { name: this.name, value: !!this.checked };
		});
		for (var i = 0; i < booldata.length; i++) {
			rawdata[booldata[i].name] = booldata[i].value;
		}

		this._rawdata = rawdata;
		return this;
	}



});

DataObjects.Base.__extendStatic({
	DOFromForm: function($form){
		return this.DO().ingestForm($form);
	}
});
