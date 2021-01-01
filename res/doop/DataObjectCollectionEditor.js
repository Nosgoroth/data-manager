window.DataObjectCollectionEditor = Object.extends({

	_ajaxendpoint: "./",
	_type: null,
	_tableContainerSelector: null,
	_actionsContainerSelector: null,
	_formContainerSelector: null,
	_renderOptions: {},
	_formOptions: {},
	_COLsort: null,
	_allow_resort: true,
	_reverseSort: false,
	_afterRender: function(){},

	_editLabelHtml: "Edit",

	DataObjectCollectionEditor_afterDomReady: function(){},
	DataObjectCollectionEditor_afterDataReady: function(){},
	DataObjectCollectionEditor_beforeRender: function(){},
	DataObjectCollectionEditor_onShowForm: function(){},
	DataObjectCollectionEditor_onHideForm: function(){},
	DataObjectCollectionEditor_onRenderTable: function(){},

	//Implements

	JsonAjaxInterface_afterDomReady: function(){
		this.$container = jQuery(this._tableContainerSelector);
		if (!this.$container.length) {
			throw new Error("Table container does not exist");
		}

		this.$actionsContainer = jQuery(this._actionsContainerSelector);
		if (!this.$actionsContainer.length) {
			this.$actionsContainer = jQuery("<div>").insertAfter(this.$container);
		}
		this.$actionsContainer.addClass("actionsContainer");

		this.$formContainer = jQuery(this._formContainerSelector);
		if (!this.$formContainer.length) {
			throw new Error("Form container does not exist");
		}

		this.$formContainer.hide();

		this.DataObjectCollectionEditor_afterDomReady();

	},

	JsonAjaxInterface_afterDataReady: function(){
		this.DataObjectCollectionEditor_beforeRender();

		this.render();
		
		jQuery('<button class="btn btn-small btn-primary">').text("Add new").appendTo(this.$actionsContainer).click(function(e){
			e.preventDefault(); e.stopPropagation();
			this.showForm();
		}.bind(this));
		
		this.DataObjectCollectionEditor_afterDataReady();
	},


	render: function(){
		var renderOptions = Object.shallowExtend({}, {
			insertActionsColumn: true,
		}, this._renderOptions);

		if (this._COLsort) {
			if (typeof this._COLsort === "function") {
				this._COL.sort(this._COLsort);
			} else if (Array.isArray(this._COLsort)) {
				for (var i = this._COLsort.length - 1; i >= 0; i--) {
					this._COL.sortByProperty(this._COLsort[i]);
				}
			} else if (typeof this._COLsort === "string") {
				this._COL.sortByProperty(this._COLsort);
			} else {
				this._COL.sort();
			}
			if (this._reverseSort) {
				this._COL.reverse();
			}
		}
		
		var $table = this._COL.renderAsTable(renderOptions);

		$table.addClass("table table-hover table-condensed");

		$table.find("thead tr th").each(function(i,v){
			var $v = jQuery(v);
			var field = $v.attr("data-field");
			if (typeof this._COLsort === "string" && field === this._COLsort) {
				$v.addClass("selected");
				if (this._reverseSort) {
					$v.addClass("reversed");
				}
			}
			if (this._allow_resort) {
				$v.click(function(){
					if (this._COLsort === field) {
						this._reverseSort = !this._reverseSort;
					} else {
						this._COLsort = field;
						this._reverseSort = false;
					}
					this.render();
				}.bind(this));
			}
		}.bind(this));

		$table.find("tbody td.actions").each(function(i,v){
			var $actions = jQuery(v);
			var id = parseInt($actions.attr("data-id"));
			var ksDO = this._COL.get(id);
			if (!ksDO) {
				return;
			}

			jQuery('<button class="btn btn-mini btn-warning btn-action-edit">')
				.html(this._editLabelHtml)
				.click(function(){
					this.showForm(ksDO);
				}.bind(this))
				.appendTo($actions)
				;
		}.bind(this));

		this.$container.empty().append($table);

		this._afterRender();

		this.DataObjectCollectionEditor_onRenderTable($table);
	},


	showForm: function(ksDO){
		var $form;
		var formOptions = Object.shallowExtend({},{
			submitClass: "btn btn-small btn-success btn-submit",
		}, this._formOptions);

		if (ksDO && ksDO instanceof this._type) {

			$form = ksDO.renderAsForm(Object.shallowExtend(formOptions, {
				submitText: "Save"
			}));
			$form.find(".btn-submit").click(function(e){
				e.preventDefault(); e.stopPropagation();
				this._COL.get( ksDO.pkGet() ).ingestForm($form);
				this.render();
				this.jsonAjaxSave(function(){
					this.closeForm();
				}.bind(this), function(e){
					alert("Error editing element");
				});
			}.bind(this));

			jQuery('<button class="btn btn-small btn-danger btn-action-delete">')
				.text("Del")
				.click(function(e){
					e.preventDefault(); e.stopPropagation();
					if (!confirm("Delete element "+ksDO.getName()+"?")) {
						return;
					}
					this.closeForm();
					this._COL.remove(ksDO);
					this.jsonAjaxSave(function(){
						this.render();
					}.bind(this), function(e){
						alert("Error deleting element");
					});
				}.bind(this))
				.appendTo($form)
				;

		} else {

			$form = (new this._type()).renderAsForm(Object.shallowExtend(formOptions, {
				submitText: "Create"
			}));

			$form.find(".btn-submit").click(function(e){
				e.preventDefault(); e.stopPropagation();
				var newDO = this._type.DOFromForm($form);
				newDO.pkSet( this._COL.getNextNumericPrimaryKey() );
				this._COL.push(newDO);
				this.render();
				this.jsonAjaxSave(function(){
					this.closeForm();
				}.bind(this), function(e){
					alert("Error editing element");
				});
			}.bind(this));

		}

		this.showArbitraryForm($form);
	},
	showArbitraryForm: function($form){

		this.$formContainer.empty().hide().append($form);

		jQuery('<button class="btn btn-small btn-inverse">').text("Close").appendTo($form).click(function(e){
			e.preventDefault(); e.stopPropagation();
			this.closeForm();
		}.bind(this));

		this.$formContainer.fadeIn();
		this.DataObjectCollectionEditor_onShowForm();
	},

	closeForm: function(){
		this.DataObjectCollectionEditor_onHideForm();
		this.$formContainer.fadeOut('fast', function(){
			this.$formContainer.empty();
		}.bind(this));
	},

}, {
	name: "DataObjectCollectionEditor",
	parent: JsonAjaxInterface
});