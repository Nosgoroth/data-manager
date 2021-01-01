/*
Requires jQuery.

Adds methods to render a data object or a collection to HTML.

do_inst.render()
someCOL.render() //Unordered list of items
someCOL.renderAsTable() //Table with type headers
someCOL.debugRender() //Same as renderAsTable() but appends to <body>

*/




DataObjects.Base.__extend({

	_dataObjectRenderer_renderFieldContainer: function(name, options){
		options = populateDefaultOptions(options, {
			elementtype: "span"
		});
		return jQuery('<'+options.elementtype+' class="dataObjectField">')
			.attr("data-doname", this._name)
			.attr("data-typename", name)
			.attr("data-id", this.pkGet())
			;
	},

	_dataObjectRenderer_renderFieldAsText: function(name, value, options) {
		options = populateDefaultOptions(options, {
			label: name.capitalize(),
			class: ""
		});
		var $container = this._dataObjectRenderer_renderFieldContainer(name, options).attr("data-fieldtype", "text");
		if (options.label) {
			jQuery("<strong>").text(options.label).appendTo($container);
		}
		jQuery('<span class="value">').text(value).appendTo($container);

		if (typeof options.transform === "function") {
			options.transform.bind(this)($container, name, value, options);
		}
		return $container;
	},

	_dataObjectRenderer_renderFieldAsBool: function(name, value, options) {
		var boolvalue = value ? "✔" : "✘";
		return this._dataObjectRenderer_renderFieldAsText(name, boolvalue, options);
	},

	_dataObjectRenderer_renderField: function(type, name, value, typeoptions) {
		var astype = ((typeoptions && typeoptions.astype) ? typeoptions.astype : type);
		switch(astype){
			case "raw":
			default:
				value = JSON.stringify(value);
				return this._dataObjectRenderer_renderFieldAsText(name, value, typeoptions);

			case "string":
			case "str":
				return this._dataObjectRenderer_renderFieldAsText(name, value, typeoptions);

			case "boolean":
			case "bool":
				return this._dataObjectRenderer_renderFieldAsBool(name, value, typeoptions);

			case "integer":
			case "int":
			case "number":
			case "float":
				value = (typeof value === "number" && !isNaN(value)) ? value : "-";
				return this._dataObjectRenderer_renderFieldAsText(name, value, typeoptions);

			case "enum":
				value = this.__static.enumLabelOfValue(name, value);
				return this._dataObjectRenderer_renderFieldAsText(name, value, typeoptions);

			case "length":
				return null;
		}
	},

	render: function(options){
		options = populateDefaultOptions(options, {
			containertype: "div",
			itemtype: null,
			supressLabels: false,
			typeoptions: {},
			hideFields: []
		});

		var $container = jQuery("<"+options.containertype+">")
			.addClass("dataObjectItem")
			.attr("data-doname", this._name)
			.attr("data-id", this.pkGet())
			;

		for (var key in this.__static.types) {

			if (options.hideFields.indexOf(key) !== -1) {
				continue;
			}

			var val = this.get(key);
			var type = this.__static.types[key];
			
			var typeoptions = Object.shallowExtend({},options.typeoptions[key]);
			if (Array.isArray(type) && type.length===2 && typeof type[0] === "string") {
				typeoptions.rawoptions = type[1];
				type = type[0];
			}

			if (options.supressLabels) {
				typeoptions.label = null;
			}
			if (options.itemtype) {
				typeoptions.elementtype = options.itemtype;
			}

			var $elm = this._dataObjectRenderer_renderField(type, key, val, typeoptions);
			$container.append($elm);

			if (type === "enum") {
				$container.attr("data-fieldvalue-"+key, val);
				$container.attr("data-fieldvaluelabel-"+key, this.__static.enumLabelOfValue(key, val) );
			} else {
				if (isNaN(val)) {
					val = "";
				}
				$container.attr("data-fieldvalue-"+key, val);
			}
		}


		return $container;
		
	},

	renderAsList: function(options){
		return this.render(Object.shallowExtend({}, {
			containertype: "ul",
			itemtype: "li"
		}, options));
	},

	renderAsTableRow: function(options){
		options = populateDefaultOptions(options, {
			insertActionsColumn: false
		});

		var $row = this.render(Object.shallowExtend({}, {
			containertype: "tr",
			itemtype: "td"
		}, options));

		if (options.insertActionsColumn) {
			jQuery("<td>").addClass("actions").attr("data-id", this.pkGet()).appendTo($row);
		}

		return $row;
	}

});


DataObjects.COL.__extend({
	render: function(options){
		options = populateDefaultOptions(options, {
			containertype: "li"
		});
		var $container = jQuery("<ul>")
			.addClass("dataObjectCollection asList")
			.attr("data-doname", this.type.DOname)
			;
		for (var i = 0; i < this.length; i++) {
			this[i].render(options).appendTo($container)
		}
		return $container;
	},
	renderAsTable: function(options){
		options = populateDefaultOptions(options, {
			containertype: "tr",
			typeoptions: {},
			insertActionsColumn: false,
			supressLabels: true,
			hideFields: [],
			afterRenderRow: function($row, $tbody, options){},
		});
		var $table = jQuery("<table>")
			.addClass("dataObjectCollection asTable")
			.attr("data-doname", this.type.DOname)
			;

		var $thead = jQuery("<thead>").appendTo($table);
		var $head_tr = jQuery("<tr>").appendTo($thead);
		var $tbody = jQuery("<tbody>").appendTo($table);

		for (var key in this.type.types) {
			if (options.hideFields.indexOf(key) !== -1) {
				continue;
			}
			var label;
			if (options.typeoptions[key] && options.typeoptions[key].label) {
				label = options.typeoptions[key].label;
			} else {
				label = key.capitalize();
			}
			jQuery("<th>").text(label).attr("data-field", key).appendTo($head_tr);
		}
		if (options.insertActionsColumn) {
			jQuery("<th>").appendTo($head_tr);
		}

		for (var i = 0; i < this.length; i++) {
			var DOinst = this[i];
			var $row = DOinst.renderAsTableRow(options).appendTo($tbody);
			options.afterRenderRow.bind(DOinst)($row, $tbody, options);

		}
		return $table;
	},
	debugRender: function(options){
		this.renderAsTable(options).appendTo("body");
	}
});