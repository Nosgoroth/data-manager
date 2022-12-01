

function sleep(ms) {
	return new Promise(resolve => { setTimeout(resolve, ms); });
}


window.VolumePhysHandler = Object.extends({

	volumeDO: null,
	bookSeriesDO: null,

	kindleAsin: null,
	kindlePubdate: null,
	saved: false,

	__construct: function(volumeDO, isSource){
		this.volumeDO = volumeDO;
		this._isSource = !!isSource;
		try {
			const pubIndex = volumeDO.parent.getPublisher();
			const pubDO = window.bookPublisherCOL.getByIndex(pubIndex - 1);
			this.pubIconUrl = pubDO.getIconUrl();
		} catch (error) {
			
		}
	},

	isEligiblePhys: function() {
		const status = this.volumeDO.getStatus();
		const store = this.volumeDO.parent.getStore();
		
		if (status !== BookSeriesVolumeDO.Enum.Status.Phys) {
			return false;
		}
		if (store === BookSeriesDO.Enum.Store.Phys) {
			return false;
		}
		if (!this.volumeDO.getAsin()) {
			return false;
		}
		if (this.volumeDO.getReleaseDateMoment()?.isBefore(moment())) {
			return false;
		}
		return true;
	},

	isEligiblePhysSource: function() {
		const asin = this.volumeDO?.getSourceAsin();
		
		const retval = !!(asin && !(asin?.toLowerCase()?.startsWith("b")));


		if (retval) {
			if (this.volumeDO.getReleaseDateSourceMoment()?.isBefore(moment())) {
				return false;
			}
		}

		return retval;
	},

	render: function(baseGenerator){
		baseGenerator = baseGenerator ? baseGenerator : '<li>';
		const asin = this._isSource
			? this.volumeDO.getSourceAsin()
			: this.volumeDO.getAsin()
			;

		const phys_url = this._isSource
			? `https://www.amazon.co.jp/dp/${asin}`
			: `https://smile.amazon.com/dp/${asin}`;

		const date = this._isSource
			? this.volumeDO.getReleaseDateSource()
			: this.volumeDO.getReleaseDate();

		const dateMoment = this._isSource
			? this.volumeDO.getReleaseDateSourceMoment()
			: this.volumeDO.getReleaseDateMoment();


		const $li = jQuery('<li>').addClass(this._isSource ? "aspect_source" : "aspect_local");
		$li.appendR('<span class="title">')
			.appendR('<span class="icon aspectMode">')
			.parent()
			.appendR('<span class="icon">')
				.css('background-image', 'url(\''+this.pubIconUrl+'\')')
			.parent()
			.appendR('<a class="name">')
		    	.attr("href", phys_url)
		    	.attr("target", "_blank")
				.text(this.getName())
			.parent()
			.appendR('<span class="date">')
				.text(
					`${dateMoment?.fromNow()} (${date})`
				)
			;
		const $interface = $li.appendR('<span class="interface">');
		this.$result = $interface.appendR('<span class="result">');
		this.$actions = $interface.appendR('<span class="actions">');
		this.$li = $li;

		this.writeActions();
		if (this.volumeDO.isManualPhysKindleCheckOnly()) {
			this.setManualOnlyStatus();
		}
		return $li;
	},

	setItemStatus: function(status) {
		switch(status) {
			case "success":
				this.$li.toggleClass("success", true);
				this.$li.toggleClass("noresult", false);
				this.$li.toggleClass("error", false);
				break;
			case "noresult":
				this.$li.toggleClass("success", false);
				this.$li.toggleClass("noresult", true);
				this.$li.toggleClass("error", false);
				break;
			case "error":
				this.$li.toggleClass("success", false);
				this.$li.toggleClass("noresult", false);
				this.$li.toggleClass("error", true);
				break;
			case "none":
			default:
				this.$li.toggleClass("success", false);
				this.$li.toggleClass("noresult", false);
				this.$li.toggleClass("error", false);
				break;
		}
	},
	setItemStatusSuccess: function() { return this.setItemStatus("success") },
	setItemStatusNoResult: function() { return this.setItemStatus("noresult") },
	setItemStatusError: function() { return this.setItemStatus("error") },
	unsetItemStatus: function() { return this.setItemStatus("none") },

	setResultText: function(str){
		this.$result.text(str);
	},

	setResultIcon: function(iconName){
		this.$result.empty().appendR(`<i class="${iconName} icon-white"></i>`);
	},

	setResultAsinButton: function(){
		const kindle_url = this._isSource
			? `https://www.amazon.co.jp/dp/${this.kindleAsin}`
			: `https://smile.amazon.com/dp/${this.kindleAsin}`
			;

		this.$result.empty().appendR('<a>')
	    	.addClass("btn btn-mini")
	    	.attr("href", kindle_url)
	    	.attr("target", "_blank")
	    	.text(this.kindleAsin)
	    	;
	},

	setKindleAsin: function(asin){
		this.kindleAsin = asin;
	},
	setReleaseDate: function(pubdate){
		this.kindlePubdate = pubdate;
	},

	save: function(status){
		if (this._isSource) {
			if (status) {
				this.volumeDO.setStatusSource(status);
			}

			if (this.kindleAsin) {
				this.volumeDO.setSourceAsin(this.kindleAsin);
			}
			if (this.kindlePubdate) {
		    	var pd = moment(this.kindlePubdate, "MMMM DD, YYYY").format("DD/MM/YYYY")
		    	this.volumeDO.setReleaseDateSource(pd);
		    }

		} else {
			if (status) {
				this.volumeDO.setStatus(status);
			}

			if (this.kindleAsin) {
				this.volumeDO.setAsin(this.kindleAsin);
			}
		    
		    if (this.kindlePubdate) {
		    	var pd = moment(this.kindlePubdate, "MMMM DD, YYYY").format("DD/MM/YYYY")
		    	this.volumeDO.setReleaseDate(pd);
		    }

		    if (this.volumeDO.isManualPhysKindleCheckOnly()) {
		    	try {
		    		this.volumeDO.deleteManualPhysKindleCheckOnly();
		    	} catch (err) {
		    		this.volumeDO.setManualPhysKindleCheckOnly(false);
		    	}
		    	
		    }
		}

	    this.volumeDO.save();

	    this.saved = true;
	    this.setResultText('Ready to save');
	    this.writeActions();
	},

	saveAsManualCheckOnly: function(val){
		this.volumeDO.setManualPhysKindleCheckOnly(val);

	    this.volumeDO.save();

	    this.saved = true;
	    this.setResultText('Ready to save');
	    this.writeActions();
	},

	writeActions: function(){

		this.$actions.empty();

		if (this.saved) {
			return;
		}

		const $dropdownActions = this.$actions.appendR(`
			<div class="btn-group">
			  <a class="btn btn-inverse btn-mini dropdown-toggle" data-toggle="dropdown" href="#">
			    Actions
			    <span class="caret"></span>
			  </a>
			  <ul class="dropdown-menu pull-right text-right"></ul>
			</div>
		`).find('ul');

		if (this._isSource) {
			this.writeActionsSource($dropdownActions);
			return;
		}

		if (this.kindleAsin) {

			this.generateDropdownActionItem('Save as-is', null, () => {
				this.save(null);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Preorder', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Preorder);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Available', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Available);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Store Wait', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.StoreWait);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Backlog', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Backlog);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Read', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Read);
			}).appendTo($dropdownActions);

			jQuery('<li class="divider"></li>').appendTo($dropdownActions);

		}

		this.generateDropdownActionItem('Enter Kindle ASIN', "icon-edit", () => {
			const kindleAsin = prompt("Enter Kindle ASIN");
    		if (kindleAsin) {
    			this.setKindleAsin(kindleAsin);
    			this.setItemStatusSuccess();
    			this.writeActions();
    		}
		}).appendTo($dropdownActions);

		jQuery('<li class="divider"></li>').appendTo($dropdownActions);

		if (this.volumeDO.isManualPhysKindleCheckOnly()) {
			this.generateDropdownActionItem('Unset manual only', "icon-ok-sign", () => {
				this.setItemStatusSuccess();
				this.saveAsManualCheckOnly(false);
			}).appendTo($dropdownActions);
		} else {
			this.generateDropdownActionItem('Set manual only', "icon-remove-sign", () => {
				this.setItemStatusSuccess();
				this.saveAsManualCheckOnly(true);
			}).appendTo($dropdownActions);	
		}

		this.generateDropdownActionItem('Run check', "icon-play", () => {
			this.setQueuedStatus(true);
			this.process(true);
		}).appendTo($dropdownActions);

	},

	writeActionsSource: function($dropdownActions){

		if (this.kindleAsin) {

			this.generateDropdownActionItem('Save as-is', null, () => {
				this.save(null);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Preorder', null, () => {
				this.save(BookSeriesVolumeDO.Enum.StatusSource.Preorder);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Available', null, () => {
				this.save(BookSeriesVolumeDO.Enum.StatusSource.Available);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Backlog', null, () => {
				this.save(BookSeriesVolumeDO.Enum.StatusSource.Backlog);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Read', null, () => {
				this.save(BookSeriesVolumeDO.Enum.StatusSource.Read);
			}).appendTo($dropdownActions);

			jQuery('<li class="divider"></li>').appendTo($dropdownActions);

		}

		this.generateDropdownActionItem('Enter Kindle ASIN', "icon-edit", () => {
			const kindleAsin = prompt("Enter Kindle ASIN");
    		if (kindleAsin) {
    			this.setKindleAsin(kindleAsin);
    			this.setItemStatusSuccess();
    			this.writeActions();
    		}
		}).appendTo($dropdownActions);

		jQuery('<li class="divider"></li>').appendTo($dropdownActions);

		if (this.volumeDO.isManualPhysKindleCheckOnly()) {
			this.generateDropdownActionItem('Unset manual only', "icon-ok-sign", () => {
				this.setItemStatusSuccess();
				this.saveAsManualCheckOnly(false);
			}).appendTo($dropdownActions);
		} else {
			this.generateDropdownActionItem('Set manual only', "icon-remove-sign", () => {
				this.setItemStatusSuccess();
				this.saveAsManualCheckOnly(true);
			}).appendTo($dropdownActions);	
		}

		this.generateDropdownActionItem('Run check', "icon-play", () => {
			this.setQueuedStatus(true);
			this.process(true);
		}).appendTo($dropdownActions);

	},

	generateDropdownActionItem: function(label, iconName, action) {
		const $li = jQuery('<li>');
		const $a = $li.appendR('<a>')
			.click(evt => {
				evt.preventDefault();
				action();
			})
			;
		if (iconName) {
			$a.appendR(`<i class="${iconName} icon-white"></i>`);
			$a.appendText(" ");
		}
		$a.appendText(label);
		return $li ;
	},

	getReleaseDateSortable: function(){
		return this._isSource
			? this.volumeDO.getReleaseDateSourceSortable()
			: this.volumeDO.getReleaseDateSortable()
			;
	},
	getReleaseDateLocalSortable: function(){
		return this.volumeDO.getReleaseDateSortable();
	},
	getReleaseDateSourceSortable: function(){
		return this.volumeDO.getReleaseDateSourceSortable();
	},

	getName: function() {
		return `${this.volumeDO.parent.getName()} ${this.volumeDO.getCollectionOrderLabel()}`;
	},

	onProcessEnd: async function(itemStatus) {
		await sleep(1000);
    	this.setItemStatus(itemStatus);
    	switch(itemStatus) {
			case "success":
				this.setResultAsinButton();
				break;
			case "noresult":
				this.setResultIcon("icon-remove");
				break;
			case "error":
				this.setResultIcon("icon-warning-sign");
				break;
			case "none":
			default:
				this.setResultText();
				break;
		}
    	this.writeActions();
	},


	setQueuedStatus: function(manual) {
		if (!manual && this.volumeDO.isManualPhysKindleCheckOnly()) {
			this.setManualOnlyStatus();
			return;
		}
		this.unsetItemStatus();
		this.setResultIcon("icon-time");
	},

	setManualOnlyStatus: function() {
		this.setItemStatus("error");
		this.setResultText("Manual only");
	},

	process: async function(manual) {
		this.setResultIcon("icon-refresh");

		if (!manual && this.volumeDO.isManualPhysKindleCheckOnly()) {
			this.setManualOnlyStatus();
			return;
		}

		const asin = this._isSource
			? this.volumeDO.getSourceAsin()
			: this.volumeDO.getAsin()
			;


	    let result;
	    try {
	    	result = await jQuery.ajax({
		    	url: '../../ajax_bookseries.php',
		    	data: {
		    		action: "getkindleasin",
		    		lang: this._isSource ? "jp" : "en",
		    		asin: asin,
		    	}
		    });
	    } catch (err) {
	    	return await this.onProcessEnd("error");
	    }

	    if (!result || !result.kindleAsin) {
	    	return await this.onProcessEnd("noresult");
	    }

	    
	    let dateresult;
	    try {
	    	dateresult = await jQuery.ajax({
		    	url: '../../ajax_bookseries.php',
		    	data: {
		    		action: "getpubdateasin",
		    		lang: "en",
		    		asin: result.kindleAsin,
		    	}
		    });
	    } catch (err) {
	    	// pass
	    }

	    this.setKindleAsin(result.kindleAsin);
	    if (dateresult) {
	    	this.setReleaseDate(dateresult.pubdate);
	    }

	    return await this.onProcessEnd("success");
		
	},



},{
	name: "VolumePhysHandler"
});








window.VolumePhysQueueHandler = Object.extends({

	volumePhysList: null,
	saveCallback: null,
	$container: null,
	queue: null,

	__construct: function(volumePhysList, saveCallback, $container, isSource){
		this.volumePhysList = volumePhysList;
		this.saveCallback = saveCallback;
		this.$container = $container;
		this._isSource = !!isSource;

		this.queue = async.queue(
			async (vphys, callback) => this.queueItemAction(vphys, callback),
			3
		);
		this.queue.drain(() => this.onQueueComplete());

		this.render();
		
	},

	getItemMatching: function(str) {
		const rx = new RegExp(".*" + str.toLowerCase().replace(" ", ".*") + ".*", "g");
		return this.volumePhysList.find(x => {
			return x.getName().toLowerCase().match(rx);
		});
	},

	queueItemAction: async function(vphys, callback) {
		await vphys.process();
		callback();
	},

	startQueue: function(){
		this.volumePhysList.forEach(vphys => {
			vphys.setQueuedStatus();
		});
		this.queue.remove(() => true);
		if (this.queue.paused) {
			this.queue.resume();
		}
		this.queue.push(this.volumePhysList);
	},

	togglePauseQueue:  function() {
		if (this.queue.paused) {
			this.queue.resume();
		} else {
			this.queue.pause();
		}
	},

	onQueueComplete: function() {
		console.info("Complete");
	},

	render: function(){
		this.$container.empty();

		if (!this.volumePhysList.length) {
			this.$container.remove();
			return;
		}

		
		this.$container.appendR('<h3>').text("Physical to digital");


		const $buttons = this.$container.appendR('<div class="buttons">');

		$buttons
			.appendR('<button class="btn btn-primary">')
			.click(() => this.startQueue())
			.appendR('<i class="icon-play icon-white"></i>')
			;
		$buttons
			.appendR('<button class="btn btn-warning">')
			.click(() => this.togglePauseQueue())
			.appendR('<i class="icon-pause icon-white"></i>')
			;
		$buttons
			.appendR('<button class="btn btn-success">')
			.click(() => {
				if(confirm("Save?")) {
					this.saveCallback();
				}
			})
			.appendR('<i class="icon-upload icon-white"></i>')
			;

		$buttons
			.appendR('<a class="btn">')
	    	.attr("href", "../../?type=bookseries")
	    	.attr("target", "_blank")
			.text('Manager')
			;

		const $ul = this.$container.appendR('<ul class="volumes">');

		this.volumePhysList.forEach(vphys => {
			vphys.render('<li>').appendTo($ul);
		});
	},
}, {
	name: "VolumePhysQueueHandler"
})



window.BookSeriesIssueItem = Object.extends({
	__construct: function(jsonAjaxInterface, bookSeriesDO, issue, volumeWithIssueDO) {
		this.jsonAjaxInterface = jsonAjaxInterface;
		this.bookSeriesDO = bookSeriesDO;
		this.issue = issue;
		this.volumeWithIssueDO = volumeWithIssueDO;
		this.volumeWithIssueColorder = volumeWithIssueDO?.getColorder();

		this.bookPublisherDO = window.bookPublisherCOL.getByIndex(bookSeriesDO.getPublisher() - 1);

		const volumesCOL = this.bookSeriesDO.getVolumes();

		this.lastVolume = volumesCOL[volumesCOL.length - 1];
		this.nextVolumeColorder = this.lastVolume ? this.lastVolume.getColorder() + 1 : 1;
		this.lastOwnedVolume = this.bookSeriesDO.getLastOwnedVolume();
		this.lastOwnedVolumeSource = this.bookSeriesDO.getLastOwnedVolumeSource();
		this.firstUnownedVolume = this.bookSeriesDO.getFirstUnownedVolume();
		this.firstUnownedColorder = this.firstUnownedVolume?.getColorder() ?? this.nextVolumeColorder;
		this.firstUnavailableSourceVolume = this.bookSeriesDO.getFirstUnavailableSourceVolume();
		this.firstUnavailableSourceColorder = this.firstUnavailableSourceVolume?.getColorder() ?? this.nextVolumeColorder;
	},

	save: function(complete) {
		this.jsonAjaxInterface.save(complete);
	},

	getIssueName: function() {
		return getBookSeriesIssueName(this.issue);
	},

	render: function(prevIssue) {
		const $li = jQuery('<li>')
			.attr("data-issuetype", this.issue)
			.toggleClass(
				"separateFromPrevious",
				this.shouldHaveSeparator(prevIssue)
			)
			;

		$li.appendR('<span class="title">')
			.appendR('<span class="icon">')
				.css('background-image', 'url(\''+(this.bookPublisherDO?.getIconUrl() ?? '')+'\')')
			.parent()
			.appendR('<span class="text">')
				.text(this.bookSeriesDO.getName())
			.parent()
			.appendR('<span class="date">')
				.text(this.getDateText())
			;

		const $interface = $li.appendR('<span class="interface">');

		this.$actions = $interface.appendR('<span class="actions">');


		const actions = this.getActions();
		if (actions?.length > 1) {
			const $dropdownActions = this.generateButtonWithDropdown(
					actions[0].label,
					actions[0].callback ?? (() => window.open(actions[0].url, "_blank"))
				)
				.appendTo(this.$actions)
				.find("ul")
				;
			for (var i = 1; i < actions.length; i++) {
				let action = actions[i];
				if (!action) { continue; }
				if (action.divider) {
					this.generateDropdownActionItemDivider()
						.appendTo($dropdownActions);
				} else {
					this.generateDropdownActionItem(
						action.label,
						action.icon,
						action.callback ?? (() => window.open(action.url, "_blank"))
						).appendTo($dropdownActions);
				}
			}
		} else if (actions?.length) {
			this.generateButton(
				actions[0].label,
				actions[0].callback ?? (() => window.open(actions[0].url, "_blank"))
			).appendTo(this.$actions);
		}

		this.$li = $li;
		return $li;
	},

	shouldHaveSeparator: function(prevIssue) {
		switch (this.issue) {
			case BookSeriesIssue.WaitingForLocal: {
				const prev = prevIssue?.bookSeriesDO.getNextVolumeExpectedDate()?.fromNow(true);
				const curr = this.bookSeriesDO.getNextVolumeExpectedDate()?.fromNow(true);
				return !!(prevIssue && !prev && curr);
			}
			case BookSeriesIssue.LocalVolumeOverdue: {
				const prev = prevIssue?.bookSeriesDO.isOverdue();
				const curr = this.bookSeriesDO.isOverdue();
				return !!(prevIssue && !prev && curr);
			}
			case BookSeriesIssue.SourceVolumeOverdue: {
				const prev = prevIssue?.bookSeriesDO.isSourceOverdue();
				const curr = this.bookSeriesDO.isSourceOverdue();
				return !!(prevIssue && !prev && curr);
			}
			default: {
				return false;
			}
		}
	},

	generateButton: function(label, action) {
		return jQuery('<a>')
			.addClass("btn btn-mini btn-inverse")
			.click(evt => {
				evt.preventDefault();
				action();
			})
			.attr("target", "_blank")
			.text(label)
			;
	},

	generateButtonWithDropdown: function(label, action) {
		const $x = jQuery(`<div class="btn-group">
		  <button class="btn btn-inverse btn-mini">Action</button>
		  <button class="btn btn-inverse btn-mini dropdown-toggle" data-toggle="dropdown">
		    <span class="caret"></span>
		  </button>
		  <ul class="dropdown-menu pull-right ">
		    <!-- dropdown menu links -->
		  </ul>
		</div>`);
		$x.find("button").first()
			.text(label ? label : "No action")
			.click(evt => {
				evt.preventDefault();
				action();
			})
			;
		return $x;
	},

	generateDropdownActionItem: function(label, iconName, action) {
		const $li = jQuery('<li>');
		const $a = $li.appendR('<a>')
			.click(evt => {
				evt.preventDefault();
				action();
			})
			;
		if (iconName) {
			$a.appendR(`<i class="${iconName} icon-white"></i>`);
			$a.appendText(" ");
		}
		$a.appendText(label);
		return $li;
	},
	generateDropdownActionItemDivider: function(label, iconName, action) {
		return jQuery('<li class="divider">');
	},


	// For sorting
	getDateUnix: function() {
		switch (this.issue) {
			case BookSeriesIssue.PrintPreorderAwaitingArrival:
			case BookSeriesIssue.DelayedReleaseForPreorder:
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.AwaitingStoreAvailability:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
			case BookSeriesIssue.NoLocalStoreReferences:
				const vol = this.volumeWithIssueDO ?? this.firstUnownedVolume;
				return vol?.getReleaseDateMoment()?.unix() ?? Infinity;

			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				{
					const nextDate = this.bookSeriesDO.getNextVolumeExpectedDateUncorrected()?.unix();
					if (nextDate) { return nextDate; }
					const latestDate = this.lastOwnedVolume?.getReleaseDateMoment().unix();
					if (latestDate) { return latestDate; }
					return 0;
				}
			
			case BookSeriesIssue.AwaitingStoreAvailabilitySource:
			case BookSeriesIssue.NoSourceStoreReferences:
			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:
			case BookSeriesIssue.CancelledAtSource:
			case BookSeriesIssue.AwaitingDigitalVersionSource:
				{
					const nextDate = this.bookSeriesDO.getNextSourceVolumeExpectedDateUncorrected()?.unix();
					if (nextDate) { return nextDate; }
					const latestDate = this.lastOwnedVolumeSource?.getReleaseDateSourceMoment().unix();
					if (latestDate) { return latestDate; }
					return Infinity;
				}

			default:
				return Infinity;
		}
	},

	getDateText: function() {
		switch (this.issue) {
			case BookSeriesIssue.PrintPreorderAwaitingArrival:
			case BookSeriesIssue.DelayedReleaseForPreorder:
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.AwaitingStoreAvailability:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
				{
					const vol = this.volumeWithIssueDO ?? this.firstUnownedVolume;
					const colorder = vol?.getColorder() ?? this.firstUnownedColorder;
					const date = vol.getReleaseDateMoment()?.fromNow() ?? '';
					return `Vol. ${colorder} ${date}`;
				}
			
			case BookSeriesIssue.NoLocalStoreReferences:
				{
					if (this.volumeWithIssueDO) {
						const colorder = this.volumeWithIssueDO.getColorder();
						const date = this.volumeWithIssueDO.getReleaseDateMoment()?.fromNow();
						return `Vol. ${colorder} ${date}`;
					} else {
						const note = this.bookSeriesDO.getForcednotes();
						return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
					}
				}

			case BookSeriesIssue.WaitingForLocal:
				volumeDO = this.firstUnavailableSourceVolume?.previousVolumeDO ?? null;
				if (volumeDO) {
					const prevVolumeColorder = volumeDO.getColorder();
					const prevVolumeDate = volumeDO.getReleaseDateMoment()?.fromNow();
					const nextVolumeColorder = this.firstUnownedColorder;
					const nextVolumeDate = this.bookSeriesDO.getNextVolumeExpectedDate()?.fromNow(true);
					if (nextVolumeDate) {
						return `Vol. ${nextVolumeColorder} in about ${nextVolumeDate}, prev ${prevVolumeDate}`;
					} else {
						return `Vol. ${prevVolumeColorder} published ${prevVolumeDate}`;
					}
				}
				{
					const note = this.bookSeriesDO.getForcednotes();
					return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
				}

			case BookSeriesIssue.LocalVolumeOverdue:
				return `Vol. ${this.firstUnavailableSourceColorder} overdue ${this.bookSeriesDO.getOverdueText()}`;

			case BookSeriesIssue.AwaitingStoreAvailabilitySource:
			case BookSeriesIssue.AwaitingDigitalVersionSource:
			case BookSeriesIssue.NoSourceStoreReferences:
				{
					if (this.volumeWithIssueDO) {
						const colorder = this.volumeWithIssueDO.getColorder();
						const date = this.volumeWithIssueDO.getReleaseDateSourceMoment()?.fromNow();
						return `Vol. ${colorder} ${date}`;
					} else {
						const note = this.bookSeriesDO.getForcednotes();
						return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
					}
				}
			case BookSeriesIssue.WaitingForSource:
				if (this.lastVolume) {
					const prevVolumeColorder = this.lastVolume.getColorder();
					const prevVolumeDate = this.lastVolume.getReleaseDateSourceMoment()?.fromNow();
					const nextVolumeColorder = prevVolumeColorder + 1;
					const nextVolumeDate = this.bookSeriesDO.getNextSourceVolumeExpectedDate()?.fromNow(true);
					if (nextVolumeDate) {
						return `Vol. ${nextVolumeColorder} in about ${nextVolumeDate}, prev ${prevVolumeDate}`;
					} else {
						return `Vol. ${prevVolumeColorder} published ${prevVolumeDate}`;
					}
				}
				{
					const note = this.bookSeriesDO.getForcednotes();
					return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
				}

			case BookSeriesIssue.SourceVolumeOverdue:
			case BookSeriesIssue.CancelledAtSource:
				return `Vol. ${this.lastVolume.getColorder() + 1} overdue ${this.bookSeriesDO.getSourceOverdueText()}`;

			default:
				return '';
		}
	},

	getActions: function() {
		// Array<{ url?: string, callback?: () => void, label: string }>
		let actions = null;
		let lastActionsLength = 0;

		switch (this.issue) {
			case BookSeriesIssue.PrintPreorderAwaitingArrival:
			case BookSeriesIssue.DelayedReleaseForPreorder:
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
				actions = this.volumeWithIssueDO?.getStoreLinkActions();
				if (actions?.length) {
					actions.push({ divider: true });
				}
				actions = actions.concat(this.bookSeriesDO.getStoreSearchActions(this.firstUnownedColorder));
				break;

			case BookSeriesIssue.AwaitingStoreAvailability:
				actions = this.bookSeriesDO.getStoreSearchActions(this.firstUnownedColorder);
				if (actions?.length) {
					actions.push({ divider: true });
				}
				actions = actions.concat(this.volumeWithIssueDO?.getStoreLinkActions());
				break;
			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				actions = this.bookSeriesDO.getStoreSearchActions(
					this.volumeWithIssueColorder ?? this.firstUnavailableSourceColorder
				);
				break;
			case BookSeriesIssue.NoLocalStoreReferences:
				actions = this.bookSeriesDO.getStoreSearchActions(this.volumeWithIssueDO?.getColorder());
				break;
			case BookSeriesIssue.AwaitingStoreAvailabilitySource:
			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:
			case BookSeriesIssue.CancelledAtSource:
				actions = this.bookSeriesDO.getSourceStoreSearchActions(this.nextVolumeColorder);
				if (actions?.length) {
					actions.push({ divider: true });
				}
				actions = actions.concat(this.volumeWithIssueDO?.getStoreLinkActions());
				break;
			case BookSeriesIssue.NoSourceStoreReferences:
				actions = this.bookSeriesDO.getSourceStoreSearchActions(this.volumeWithIssueDO.getColorder());
				break;
			case BookSeriesIssue.AwaitingDigitalVersionSource:
				actions = this.volumeWithIssueDO?.getSourceStoreLinkActions();
				break;
			case BookSeriesIssue.AnnouncedSeriesAvailable:
				actions = this.volumeWithIssueDO?.getStoreLinkActions();
				actions.push({ divider: true });
				actions = actions.concat([
					{
						label: "Set backlog",
						callback: () => {
							this.volumeWithIssueDO?.setStatus(BookSeriesVolumeDO.Enum.Status.Backlog);
							this.volumeWithIssueDO.parent.saveUpdatedVolume(this.volumeWithIssueDO, true);
							this.save();
						}
					},
					{
						label: "Set series consider",
						callback: () => {
							this.bookSeriesDO.setStatus(BookSeriesDO.Enum.Status.Consider);
							this.save();
						}
					}
				]);
				break;
			case BookSeriesIssue.MissingInformation:
				
				actions = [{
					label: "Scrape info",
					callback: () => {
						this.bookSeriesDO.getPubDatesFromAsins(() => {
							this.save();
							alert("Complete");
						}, false);
						alert("Now scraping...\nClose this message and don't do any more operations until complete.\nYou can see progress information in the console. Press F12 / Ctrl+Shift+i / Cmd+Opt+i to open it.");
					}
				}];
				actions = actions.concat(this.volumeWithIssueDO?.getStoreLinkActions());
				break;
			default:
				break;
		}

		if (!Array.isArray(actions)) { actions = []; }
		
		if (actions.length > lastActionsLength) {
			actions.push({ divider: true });
			lastActionsLength = actions.length;
		}


		if (this.issue === BookSeriesIssue.SourceVolumeOverdue) {
			actions.push({
				label: "Set cancelled at source",
				icon: "icon-warning-sign",
				callback: () => {
					try {
						this.bookSeriesDO.setCancelledAtSource(true);
						this.save();
					} catch(err) {
						alert(err.message);
					}
				}
			});
		}
		if (this.issue === BookSeriesIssue.CancelledAtSource) {
			actions.push({
				label: "Unset cancelled",
				icon: "icon-warning-sign",
				callback: () => {
					try {
						this.bookSeriesDO.setCancelledAtSource(false);
						this.save();
					} catch(err) {
						alert(err.message);
					}
				}
			});
		}

		if (this.bookSeriesDO.canResolveIssueWithAsin(this.issue)) {
			actions.push({
				label: "Set ASIN",
				icon: "icon-edit",
				callback: () => {
					try {
						const asin = prompt("ASIN to resolve:");
						if (!asin) { return; }
						this.bookSeriesDO.resolveIssueWithAsin(this.issue, asin, this.volumeWithIssueDO);
						this.save();
					} catch(err) {
						alert(err.message);
					}
				}
			});
		}

		if (this.bookSeriesDO.canResolveIssueWithKoboId(this.issue)) {
			actions.push({
				label: "Set Kobo ID",
				icon: "icon-edit",
				callback: () => {
					try {
						const koboId = prompt("ASIN to resolve:");
						if (!koboId) { return; }
						this.bookSeriesDO.resolveIssueWithKoboId(this.issue, koboId);
						this.save();
					} catch(err) {
						alert(err.message);
					}
				}
			});
		}

		if (this.bookSeriesDO.canResolveIssueWithVolumeStatus(this.issue)) {
			
			const nextStatuses = this.firstUnownedVolume.getNextStatusesForIssueTracker(this.issue);
			if (nextStatuses?.length) {
				for (var i = 0; i < nextStatuses.length; i++) {
					const nextStatus = nextStatuses[i];
					const nextStatusId = nextStatus[0];
					const nextStatusLabel = nextStatus[1];
					actions.push({
						label: "Set "+nextStatusLabel,
						icon: "icon-chevron-right",
						callback: () => {
							try {
								this.bookSeriesDO.resolveIssueWithVolumeStatus(this.issue, nextStatusId);
								this.save();
							} catch(err) {
								alert(err.message);
							}
							
						}
					});
				}
			}
		}

		actions.push({
			label: "Set volume status",
			icon: "icon-chevron-right",
			callback: () => {
				try {
					const legend = Object.keys(BookSeriesVolumeDO.Enum.Status)
						.map(x => `${x} = ${BookSeriesVolumeDO.Enum.Status[x]}`)
						.join(", ")
						;
					const status = prompt("Status to resolve:\n"+legend);
					if (!status) { return; }
					if (this.bookSeriesDO.canResolveIssueWithVolumeStatus(this.issue)) {
						this.bookSeriesDO.resolveIssueWithVolumeStatus(this.issue, status);
						this.save();
					} else {
						this.volumeWithIssueDO.setStatus(status);
						this.volumeWithIssueDO.parent.saveUpdatedVolume(this.volumeWithIssueDO, true);
						this.save();
					}
				} catch(err) {
					alert(err.message);
				}
				
			}
		});
		actions.push({
			label: "Set volume status src",
			icon: "icon-chevron-right",
			callback: () => {
				try {
					const legend = Object.keys(BookSeriesVolumeDO.Enum.StatusSource)
						.map(x => `${x} = ${BookSeriesVolumeDO.Enum.StatusSource[x]}`)
						.join(", ")
						;
					const status = prompt("Source status to resolve:\n"+legend);
					if (!status) { return; }
					if (this.bookSeriesDO.canResolveIssueWithVolumeStatusSource(this.issue)) {
						this.bookSeriesDO.resolveIssueWithVolumeStatusSource(this.issue, status, this.volumeWithIssueDO);
						this.save();
					} else {
						this.volumeWithIssueDO.setStatusSource(status);
						this.volumeWithIssueDO.parent.saveUpdatedVolume(this.volumeWithIssueDO, true);
						this.save();
					}
				} catch(err) {
					alert(err.message);
				}
				
			}
		});

		actions.push({
			label: "Set series status",
			icon: "icon-chevron-right",
			callback: () => {
				try {
					const legend = Object.keys(BookSeriesDO.Enum.Status)
						.map(x => `${x} = ${BookSeriesDO.Enum.Status[x]}`)
						.join(", ")
						;
					const status = prompt("Status to resolve:\n"+legend);
					if (!status) { return; }
					this.bookSeriesDO.setStatus(status);
					this.save();
				} catch(err) {
					alert(err.message);
				}
				
			}
		});

		if (this.bookSeriesDO.canResolveIssueWithReleaseDate(this.issue)) {
			actions.push({
				label: "Set release date",
				icon: "icon-calendar",
				callback: () => {
					try {
						const releaseDate = prompt("Release date to set:\n(DD/MM/YYYY)");
						if (!releaseDate) { return; }
						if (!releaseDate.match(/^[\d]{1,2}\/[\d]{1,2}\/[\d]{4}$/)) {
							alert('Invalid date format');
							return;
						}
						this.bookSeriesDO.resolveIssueWithReleaseDate(this.issue, releaseDate, this.volumeWithIssueDO);
						this.save();
					} catch(err) {
						alert(err.message);
					}
					
				}
			});
		} else if (this.volumeWithIssueDO && this.volumeWithIssueDO.getReleaseDate()) {
			actions.push({
				label: "Change release date",
				icon: "icon-calendar",
				callback: () => {
					try {
						const releaseDate = prompt(
							"New release date (DD/MM/YYYY):"
							+"\nCurrent one is: " + this.volumeWithIssueDO.getReleaseDate()
						);
						if (!releaseDate) { return; }
						if (!releaseDate.match(/^[\d]{1,2}\/[\d]{1,2}\/[\d]{4}$/)) {
							alert('Invalid date format');
							return;
						}
						this.volumeWithIssueDO.setReleaseDate(releaseDate);
						this.volumeWithIssueDO.parent.saveUpdatedVolume(this.volumeWithIssueDO, true);
						this.save();
						console.log("saved", releaseDate);
					} catch(err) {
						alert(err.message);
					}
					
				}
			});
		}



		if (actions.length > lastActionsLength) {
			lastActionsLength = actions.length;
			actions.push({ divider: true });
		}

		actions.push({
			label: "Edit notes",
			icon: "icon-pencil",
			callback: () => {
				const ret = this.bookSeriesDO.promptForForcedNotes();
				if (ret) {
					this.save();
				}
				
			}
		});

		if (this.bookSeriesDO.canShowPublicationGraph()) {
			actions.push({
				label: "Publication graph",
				icon: "icon-signal",
				callback: () => {
					try {
						this.bookSeriesDO.showPublicationGraph();
					} catch(err) {
						alert(err.message);
					}
					
				}
			});
		}

		// Collapse multiple contiguous dividers to a single one
		/*
		const newActions = [];
		let lastWasDivider = false;
		for (let action of actions) {
			const isDivider = !!action?.divider;
			if (!isDivider || !lastWasDivider) {
				newActions.push(action);
			}
			lastWasDivider = isDivider;
		}
		actions = newActions;
		*/
		for (var i = 0; i < actions.length; i++) {
			while (actions[i]?.divider && actions[i+1]?.divider) {
				actions.splice(i+1, 1);
			}
		}


		// Since the first action will be the button, it shouldn't be a divider
		while (actions[0]?.divider) {
			actions.splice(0, 1);
		}
		// Since the first action will be the button, the second action shouldn't be a divider
		while (actions[1]?.divider) {
			actions.splice(1, 1);
		}

		return actions;
	},

},{
	name: "BookSeriesIssueItem"
});



window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_dataset: window._dataset,
	_ajaxendpoint: "../../ajax.php",
	JsonAjaxInterface_afterDomReady: function(){},

	_jsonAjaxAutostartCheckingRemoteModificationWithInterval: 5000,
	JsonAjaxInterface_onDataUpdatedRemotely: function(){
		window.location.reload();
	},

	rerender: function(){
		this.JsonAjaxInterface_afterDataReady();
	},

	_issuesOptions: {
		ignoreLocalIssuesOnBacklog: true,
		ignorePreorderAvailableForAnnounced: true,
	}, // Defaults
	setIssuesOptions: function(options) {
		console.log("Using custom issue options:", options);
		this._issuesOptions = options;
	},
	getIssuesOptions: function(){
		return Object.assign({}, this._issuesOptions);
	},

	scrapeInfoFromIssues: async function(issues) {
		const promiseGenerators = issues.map(issue => {
			return () => {
				return new Promise(complete => {
					issue.bookSeriesDO.getPubDatesFromAsins(() => {
						complete();
					}, false);
				})
			};
		});
		alert("Now scraping...\nClose this message and don't do any more operations until complete.\nYou can see progress information in the console. Press F12 / Ctrl+Shift+i / Cmd+Opt+i to open it.");
		for (var i = 0; i < promiseGenerators.length; i++) {
			await promiseGenerators[i]();
		}
		alert("Complete. Saving and reloading...");
		this.save();
	},

	save: function(complete) {
		this.jsonAjaxSave(
			() => {
				complete?.();
				this.rerender();
			},
			() => {
				complete?.();
				alert("Error: couldn't save");
			}
		);
	},

	JsonAjaxInterface_afterDataReady: async function(){

		window._ajaxBookseriesUri = "../../ajax_bookseries.php";
		
		const vphyss = [];
		const vphyss_local = [];
		const vphyss_src = [];
		let issues = [];

		const issuesOptions = this.getIssuesOptions();

		this._COL.forEach(bookSeriesDO => {

			if (bookSeriesDO.isIgnoreIssues()) {
				return;
			}
			
			const issuesInfo = bookSeriesDO.getIssues(issuesOptions);
			for (const issueInfo of issuesInfo) {
				const [issue, volumeDO] = issueInfo;
				const issueobj = new BookSeriesIssueItem(this, bookSeriesDO, issue, volumeDO);
				issues.push(issueobj);
			}

			// If print series, don't add to VolumePhysHandler
			if (bookSeriesDO.getName()?.toLowerCase().includes("(print)")) {
				return;
			}

			const volumes = bookSeriesDO.getVolumes();

			volumes.forEach(volumeDO => {
				const vphys = new VolumePhysHandler(volumeDO);
				const vphys_src = new VolumePhysHandler(volumeDO, true);
				if (vphys.isEligiblePhys()) {
					vphyss.push(vphys);
					vphyss_local.push(vphys);
				}
				if (vphys_src.isEligiblePhysSource()) {
					vphyss.push(vphys_src);
					vphyss_src.push(vphys_src);
				}
			});
		});
		
		{
			vphyss.sort((a,b)=>{
				return a.getReleaseDateSortable()?.localeCompare(b.getReleaseDateSortable());
			});
			
			const $physdigital = jQuery("#physdigital-app").empty();
			
			
			window._vphysq = new VolumePhysQueueHandler(vphyss, () => {
				this.jsonAjaxSave(async () => {
					this.rerender();
				}, () => {
					alert("Error: couldn't save");
				});
			}, $physdigital);
			
		}
		

		{
			const issueTypesToSortReversed = [
				//BookSeriesIssue.MissingInformation,
				//BookSeriesIssue.VolumeAvailable,
				//BookSeriesIssue.PreorderAvailable,
				//BookSeriesIssue.AwaitingStoreAvailability,
				//BookSeriesIssue.AwaitingDigitalVersion,
				//BookSeriesIssue.WaitingForLocal,
				BookSeriesIssue.LocalVolumeOverdue,
				//BookSeriesIssue.WaitingForSource,
				BookSeriesIssue.SourceVolumeOverdue,
				BookSeriesIssue.CancelledAtSource,
			]

			issues = issues.sort((a, b) => {
				return a.getDateUnix() - b.getDateUnix();
			});
			const issuesSorted = {};
			for (const issue of issues) {
				const i = issue.issue;
				if (!issuesSorted[i]) {
					issuesSorted[i] = [];
				}
				issuesSorted[i].push(issue);
			}
			for (const key of Object.keys(issuesSorted)) {
				issuesSorted[key].sort((a, b) => {
					return a.getDateUnix() - b.getDateUnix();
				});
				if (issueTypesToSortReversed.includes(parseInt(key))) {
					issuesSorted[key].reverse();
				}
			}


			const $issues = jQuery("#issues-app").empty();
			const existingIssueTypesUnsorted = Object.keys(issuesSorted).map(x => parseInt(x));
			const existingIssueTypes = [
				BookSeriesIssue.DelayedReleaseForPreorder,
				BookSeriesIssue.AnnouncedSeriesAvailable,
				BookSeriesIssue.PrintPreorderAwaitingArrival,
				BookSeriesIssue.MissingInformation,
				BookSeriesIssue.VolumeAvailable,
				BookSeriesIssue.PreorderAvailable,
				BookSeriesIssue.AwaitingStoreAvailability,
				// BookSeriesIssue.AwaitingDigitalVersion,
				BookSeriesIssue.NoLocalStoreReferences,
				BookSeriesIssue.WaitingForLocal,
				BookSeriesIssue.LocalVolumeOverdue,

				BookSeriesIssue.NoSourceStoreReferences,
				// BookSeriesIssue.AwaitingDigitalVersionSource,
				BookSeriesIssue.AwaitingStoreAvailabilitySource,
				BookSeriesIssue.WaitingForSource,
				BookSeriesIssue.SourceVolumeOverdue,
				BookSeriesIssue.CancelledAtSource,
			].filter(x => existingIssueTypesUnsorted.indexOf(x) !== -1);
			
			for (const issueType of existingIssueTypes) {
				const $header = $issues.appendR('<div>').addClass("issueHeader");
				$header.appendR('<h4>').text( getBookSeriesIssueName(issueType) );

				if (issueType === BookSeriesIssue.MissingInformation) {
					$header.appendR('<button>').addClass("btn btn-mini btn-inverse").text("Scrape info for all").click(event => {
						event.preventDefault(); event.stopPropagation();
						this.scrapeInfoFromIssues(issuesSorted[issueType]);
					});
				}

				const $ul = $issues.appendR('<ul class="issues">');
				let prevIssue = null;
				for (const issue of issuesSorted[issueType]) {
					issue.render(prevIssue).appendTo($ul);
					prevIssue = issue;
				}
			}

			
			window._issues = issues;
		}
		
	}

	// jsonAjaxSave: function(success, error){
},{
	name: "JsonAjaxInterfaceForBookSeries",
	instance: true,
	parent: JsonAjaxInterface
});




/*

window.BookSeriesIssue = {
	AwaitingDigitalVersion: 1, // First unowned volume is Phys
	VolumeAvailable: 2, // First unowned volume is Available and series isn't Backlog or Dropped
	PreorderAvailable: 3,
	WaitingForLocal: 4, // Next unowned volume is Source
	WaitingForSource: 5, // All volumes owned and series isn 't Ended
	AwaitingStoreAvailability: 6,
};

*/