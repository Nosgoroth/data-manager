;



function FlowHandler(containerSelector){
	this.containerSelector = containerSelector;
	this.elms = [];
	this._mas = null;
	this._autoints = [];
}
FlowHandler.prototype.getUpdates = function() {
	jQuery.ajax({
		url: '',
		data: {
			action: 'getlatest',
			latest: this.getLatestUpdated()
		},
		success: function(data){
			if (!data || !data.length) { return; }
			for (var i=data.length; i>0; i--) {
				var elm = data[i-1];
				this.unshift(elm.src, elm.href, elm.mtime);
				var $li = this.renderElement(elm.src, elm.href, true);
				this.autoincrement();
				this.saveAutoIncrementItem($li, elm);
			}
			this.relayout();
		}.bind(this),
		error: function(){}
	});
}
FlowHandler.prototype.autoincrement = function() {
	jQuery.each(this._autoints, function(i,v){
		v.data.index += 1;
		v.href = v.data.hreftemplate.replace("%index%", v.data.index);
		v.$elm.find("a").attr("href", v.href);
	}.bind(this));
}
FlowHandler.prototype.saveAutoIncrementItem = function($elm, data) {
	this._autoints.push({
		$elm: $elm,
		data: data
	});
}
FlowHandler.prototype.getLatestUpdated = function() {
	try {
		return this.elms[0].mtime;
	} catch(e) {
		return 0;
	}
	//console.log("Added", src);
}
FlowHandler.prototype.push = function(src, href, mtime) {
	this.elms.push({ src: src, href: href, mtime: mtime });
}
FlowHandler.prototype.addItemRaw = function(item) {
	this.elms.push(item);
}
FlowHandler.prototype.unshift = function(src, href, mtime) {
	this.elms.unshift({ src: src, href: href, mtime: mtime });
}
FlowHandler.prototype.render = function(complete) {
	if (!complete) { complete = function(){}; }
	this.renderNext(0, complete);
	this.relayout();
}
FlowHandler.prototype.renderNext = function(i, complete) {
	if (!i) { i = 0; }
	if ( i > this.elms.length-1) {
		return complete();
	}

	var $li = this.renderElement(this.elms[i].src, this.elms[i].href);

	this.saveAutoIncrementItem($li, this.elms[i]);

	this.renderNext(i+1, complete);

	/*
	if (window._monitor) {
	} else {
		setTimeout(function(){
			this.renderNext(i+1, complete);
		}.bind(this), 100);
		this.relayout();
	}
	*/
	
}
FlowHandler.prototype.renderElement = function(src, href, prepend) {
	//console.log("Render", src);

	var error_retries = 3;

	var $li = jQuery('<li class="image"><div class="content"></div></li>');
	var $a = jQuery("<a>").attr("target", "_blank").attr("href", href);
	var $img = jQuery("<img>").css('visibility','hidden').attr("src", src).load(function(e){
		jQuery(e.target).css('visibility','visible');
		this.relayout();
	}.bind(this)).error(function(){
		if (error_retries<=0) { return; }
        error_retries -= 1;
        jQuery(this).attr('src', jQuery(this).attr('src')+"&ts="+(Date.now()));
	});
	$a.append($img);
	$li.find(".content").append($a);

	if (prepend) {
		jQuery(this.containerSelector).prepend($li);
	} else {
		jQuery(this.containerSelector).append($li);
	}

	this.reloadMasonryItems();
	this.relayout(true);

	return $li;
}


FlowHandler.prototype.initMasonry = function() {
	this._mas = new Masonry( jQuery(this.containerSelector).get(0) ,{
		itemSelector: 'li.image'
	});
	jQuery(window).on("resize, orientationchange", function(){ this.relayout(); }.bind(this));
}


FlowHandler.prototype.reloadMasonryItems = function() {
	if (!this._mas) {
		return;
	}
	this._mas.reloadItems();
}
FlowHandler.prototype.relayout = function(immediate) {
	if (this.layoutFireEvent) {
		clearTimeout(this.layoutFireEvent);
		this.layoutFireEvent = null;
	}
	if (immediate) {
		this._mas.layout();
		return;
	}
	this.layoutFireEvent = setTimeout(function(){
		this._mas.layout();
	}.bind(this), 150);
}










window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_ajaxendpoint: "../../ajax.php",


	JsonAjaxInterface_afterDomReady: function(){},
	JsonAjaxInterface_afterDataReady: async function(){

		window._flow = new FlowHandler("#bookshelf");

		const VolumeStatus = BookSeriesVolumeDO.Enum.Status;
		
		this._COL.forEach(bookSeriesDO => {
			if (bookSeriesDO.getStore() === BookSeriesDO.Enum.Store.Phys) { return; }
			const volumes = bookSeriesDO.getVolumes();

			volumes.forEach(volumeDO => {
				const status = volumeDO.getStatus();
				if (![
					VolumeStatus.Read,
					VolumeStatus.Backlog
					].includes(status)) {
					return;
				}
				let cover = volumeDO.getCoverUrl(60);
				if (!cover) { return; }
				cover = "../../"+cover;
				const url = volumeDO.getAmazonLink()
					|| volumeDO.getKoboLink()
					|| volumeDO.getAmazonJpLink()
					;
				const mtime = volumeDO.getReleaseDateMoment()?.unix();
				if (!url) {
					//console.log(bookSeriesDO.getName()+" "+volumeDO.getColorder());
				}
				//console.log(url);
				window._flow.push(cover, url, mtime);
				
			});
		});


		window._flow.initMasonry();
		window._flow.render();
		window._flow.relayout();


	},
},{
	name: "JsonAjaxInterfaceForBookSeries",
	instance: true,
	parent: JsonAjaxInterface
});
