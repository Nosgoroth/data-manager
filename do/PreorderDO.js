(function(){

	window.PreorderDO = DataObjects.createDataObjectType({
		name: "Preorder",
		types: {
			id: "int",
			name: "string",
			series: "string",
			type: ["enum", ["Nendoroid", "Figure", "Book", "Music", "Video", "Other"]],
			status: ["enum", ["Announced", "PreorderOpen", "Preordered", "Paid", "Shipped", "Received", "Released", "OutOfPrint", "PreorderWait"]],
			store: ["enum", ["AmiAmi", "CD Japan", "Other"]],
			release: "string",
			notes: "string",
			thumbUrl: "string",
			mfc: "string",
			link: "string",
		},
		extraPrototype: {
			getMfcId: function(){
				try {
					var mfclink = this.getMfc();
					if (!mfclink) {
						throw new Error("No MFC link");
					}
					var m = mfclink.match(/\/item\/([\d]+)/);
					if (!m || !m[1]) {
						throw new Error("Couldn't extract MFC ID");
					}
					var id = parseInt(m[1]);
					if (isNaN(id)) {
						throw new Error("What");
					}
					return id;
				} catch(e) {
					return null;
				}
			},
			getThumbnailUrl: function(){
				
				var thumbUrl = this.getThumbUrl();
				if (thumbUrl) {
					return thumbUrl;
				}

				var id = this.getMfcId();
				if (id) {
					return 'https://static.myfigurecollection.net/pics/figure/big/'+id+'.jpg';
				}

				return null;
			},

			renderDropdownMenuWithButton: function(){
				var $ctr = jQuery('<div class="preorderDropdownMenuContainer">');
				var $btngrp = $ctr.appendR('<div class="btn-group"><button class="btn btn-mini btn-link dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button></div>');
				$btngrp.appendR( this.renderDropdownMenu() );
				return $ctr;
			},


			renderDropdownMenu: function(){

				var $dropdown = jQuery('<ul class="dropdown-menu" role="menu">');

				var lastWasSeparator = true;
				var addOption = function(){
					lastWasSeparator = false;
					return $dropdown.appendR('<li>').appendR('<a>');
				}
				var addSeparator = function(){
					if (lastWasSeparator) { return; }
					lastWasSeparator = true;
					return $dropdown.appendR('<li>').addClass('divider');
				}
				var changeCb = function(cb){
					return function(e){
						if (e) { e.preventDefault(); e.stopPropagation(); }
						var result = cb(e);
						if (result === false) { return; }
						this.save();
					}.bind(this);
				}.bind(this);
				
				var addSetStatusOption = function(newstatus, name){
					return addOption().html('<i class="icon-chevron-right"></i> Set '+name).click(function(){
						this.setStatus(newstatus);
						this.save();
					}.bind(this));
				}.bind(this);

				var status = this.getStatus();

				switch(status) {
					//["Announced", "Preorder open", "Preordered", "Paid", "Shipped", "Received", "Released", "Out of print", "Preorder wait"]
					default: break;
					case this.__static.Enum.Status.Announced:
					case this.__static.Enum.Status.PreorderWait:
						addSetStatusOption(this.__static.Enum.Status.PreorderOpen, "preorder open");
						addSetStatusOption(this.__static.Enum.Status.Released, "released");
						addSetStatusOption(this.__static.Enum.Status.Preordered, "preordered");
						addSetStatusOption(this.__static.Enum.Status.Paid, "paid");
						addSetStatusOption(this.__static.Enum.Status.Shipped, "shipped");
						break;
					case this.__static.Enum.Status.PreorderOpen:
						addSetStatusOption(this.__static.Enum.Status.Preordered, "preordered");
						addSetStatusOption(this.__static.Enum.Status.Paid, "paid");
						addSetStatusOption(this.__static.Enum.Status.Shipped, "shipped");
						addSetStatusOption(this.__static.Enum.Status.OutOfPrint, "out of print");
						break;
					case this.__static.Enum.Status.Preordered:
						addSetStatusOption(this.__static.Enum.Status.Paid, "paid");
						break;
					case this.__static.Enum.Status.Paid:
						addSetStatusOption(this.__static.Enum.Status.Shipped, "shipped");
						break;
					case this.__static.Enum.Status.Shipped:
						addSetStatusOption(this.__static.Enum.Status.Received, "received");
						break;
				}

				addSeparator();
				
				addOption().html('<i class="icon-pencil"></i> Edit release').click(changeCb(function(e){
					var release = this.getRelease();
					var newrelease = prompt("Edit release", release);
					if (release === newrelease || newrelease === null) {
						return false;
					}
					this.setRelease(newrelease);
				}.bind(this)));

				addOption().html('<i class="icon-pencil"></i> Edit notes').click(changeCb(function(e){
					var notes = this.getNotes();
					var newnotes = prompt("Edit notes", notes);
					if (notes === newnotes || newnotes === null) {
						return false;
					}
					this.setNotes(newnotes);
				}.bind(this)));

				addOption().html('<i class="icon-pencil"></i> Edit link').click(changeCb(function(e){
					var link = this.getLink();
					var newlink = prompt("Edit notes", link);
					if (link === newlink || newlink === null) {
						return false;
					}
					this.setLink(newlink);
				}.bind(this)));


				addSeparator();

				var mfclink = this.getMfc();
				if (mfclink) {
					var title = "MyFigureCollection";
					addOption().html('<i class="icon-info-sign"></i> '+title).attr({
						href: mfclink,
						target: "_blank"
					});
				}

				var link = this.getLink();
				if (link) {
					var title = "Link";
					addOption().html('<i class="icon-info-sign"></i> '+title).attr({
						href: link,
						target: "_blank"
					});
				}

				return $dropdown;
			},

			save: function(){
				window.customMultiDataObjectEditor.saveAndUpdate();
			},
		}
	});












	customMultiDataObjectEditor.registerDataObject(PreorderDO, {
		_COLsort: "release",

		_renderOptions: {
			typeoptions: {
				name: {
					transform: function($container, name, value, options) {
						if (!value) { return; }
						var $val = $container.find(".value");
						var $pic = $val.prependR('<span class="mfcThumbnail">');
						var thumbUrl = this.getThumbnailUrl();
						if (thumbUrl) {
							$pic.css("background-image", 'url("'+thumbUrl+'")');
						}
					}
				},
				mfc: {
					label: " ",
					transform: function($container, name, value, options) {
						//if (!value) { return; }

						/*$container.find(".value").empty().append(
							jQuery('<a target="_blank" class="btn btn-mini btn-inverse">')
								.attr("href", value)
								.html("&raquo;")
						);*/
						$container.find(".value").empty().appendR( 
							this.renderDropdownMenuWithButton()
						).find("ul").addClass("pull-right");
						;
					}
				},
				link: {
					label: "lnk",
					transform: function($container, name, value, options) {
						if (!value) { return; }
						$container.find(".value").empty().append(
							jQuery('<a target="_blank" class="btn btn-mini btn-inverse">')
								.attr("href", value)
								.html("&raquo;")
						);
					}
				},
			},
			hideFields: ["id", "link", "thumbUrl"]
		},
		_formOptions: {
			hideFields: ["id"]
		},
		_classToggles: [
			{ title: "Inactive", class: "hide-inactive", default: true },
			{ title: "Announced", class: "hide-announced", default: false },
		],
	});

}());