

function sleep(ms) {
	return new Promise(resolve => { setTimeout(resolve, ms); });
}


window.VolumeTpbHandler = Object.extends({

	volumeDO: null,
	bookSeriesDO: null,

	kindleAsin: null,
	kindlePubdate: null,
	saved: false,

	__construct: function(volumeDO){
		this.volumeDO = volumeDO;
	},

	isEligibleTpb: function() {
		if (this.volumeDO.getStatus() !== BookSeriesVolumeDO.Enum.Status.TPB) {
			return false;
		}
		if (!this.volumeDO.getAsin()) { return false; }
		return true;
	},

	render: function(baseGenerator){
		baseGenerator = baseGenerator ? baseGenerator : '<li>';
		const asin = this.volumeDO.getAsin();
		const $li = jQuery('<li>');
		$li.appendR('<span class="title">')
			.appendR('<a class="name">')
		    	.attr("href", "https://smile.amazon.com/dp/"+asin)
		    	.attr("target", "_blank")
				.text(this.getName())
			.parent()
			.appendR('<span class="date">')
				.text(this.volumeDO.getReleaseDate())
			;
		const $interface = $li.appendR('<span class="interface">');
		this.$result = $interface.appendR('<span class="result">');
		this.$actions = $interface.appendR('<span class="actions">');
		this.$li = $li;

		this.writeActions();
		if (this.volumeDO.isManualTpbKindleCheckOnly()) {
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
		this.$result.empty().appendR('<a>')
	    	.addClass("btn btn-mini")
	    	.attr("href", "https://smile.amazon.com/dp/"+this.kindleAsin)
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
		status = status ? status : BookSeriesVolumeDO.Enum.Status.Available;
		this.volumeDO.setStatus(status);

		if (this.kindleAsin) {
			this.volumeDO.setAsin(this.kindleAsin);
		}
	    
	    if (this.kindlePubdate) {
	    	var pd = moment(this.kindlePubdate, "MMMM DD, YYYY").format("DD/MM/YYYY")
	    	this.volumeDO.setReleaseDate(pd);
	    }

	    if (this.volumeDO.isManualTpbKindleCheckOnly()) {
	    	try {
	    		this.volumeDO.deleteManualTpbKindleCheckOnly();
	    	} catch (err) {
	    		this.volumeDO.setManualTpbKindleCheckOnly(false);
	    	}
	    	
	    }

	    this.volumeDO.save();

	    this.saved = true;
	    this.setResultText('Ready to save');
	    this.writeActions();
	},

	saveAsManualCheckOnly: function(val){
		this.volumeDO.setManualTpbKindleCheckOnly(val);

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
			  <ul class="dropdown-menu pull-right"></ul>
			</div>
		`).find('ul');

		if (this.kindleAsin) {

			this.generateDropdownActionItem('Set as Preorder', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Preorder);
			}).appendTo($dropdownActions);

			this.generateDropdownActionItem('Set as Available', null, () => {
				this.save(BookSeriesVolumeDO.Enum.Status.Available);
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

		if (this.volumeDO.isManualTpbKindleCheckOnly()) {
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
		return this.volumeDO.getReleaseDateSortable();
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
		if (!manual && this.volumeDO.isManualTpbKindleCheckOnly()) {
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

		if (!manual && this.volumeDO.isManualTpbKindleCheckOnly()) {
			this.setManualOnlyStatus();
			return;
		}


	    let result;
	    try {
	    	result = await jQuery.ajax({
		    	url: '../../ajax_bookseries.php',
		    	data: {
		    		action: "getkindleasin",
		    		lang: "en",
		    		asin: this.volumeDO.getAsin(),
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
	name: "VolumeTpbHandler"
});








window.VolumeTpbQueueHandler = Object.extends({

	volumeTpbList: null,
	saveCallback: null,
	$container: null,
	queue: null,

	__construct: function(volumeTpbList, saveCallback, $container){
		this.volumeTpbList = volumeTpbList;
		this.saveCallback = saveCallback;
		this.$container = $container;

		this.queue = async.queue(
			async (vtpb, callback) => this.queueItemAction(vtpb, callback),
			3
		);
		this.queue.drain(() => this.onQueueComplete());

		this.render();
		
	},

	getItemMatching: function(str) {
		const rx = new RegExp(".*" + str.toLowerCase().replace(" ", ".*") + ".*", "g");
		return this.volumeTpbList.find(x => {
			return x.getName().toLowerCase().match(rx);
		});
	},

	queueItemAction: async function(vtpb, callback) {
		await vtpb.process();
		callback();
	},

	startQueue: function(){
		this.volumeTpbList.forEach(vtpb => {
			vtpb.setQueuedStatus();
		});
		this.queue.remove(() => true);
		if (this.queue.paused) {
			this.queue.resume();
		}
		this.queue.push(this.volumeTpbList);
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

		this.volumeTpbList.forEach(vtpb => {
			vtpb.render('<li>').appendTo($ul);
		});
	},
}, {
	name: "VolumeTpbQueueHandler"
})



window.BookSeriesIssueItem = Object.extends({
	__construct: function(bookSeriesDO, issue) {
		this.bookSeriesDO = bookSeriesDO;
		this.issue = issue;
	},

	getIssueName: function() {
		return getBookSeriesIssueName(this.issue);
	},

	render: function() {
		const $li = jQuery('<li>')
			.attr("data-issuetype", this.issue)
			;

		$li
			;
		$li.appendR('<span class="title">')
			.appendR('<span class="title">')
				.text(this.bookSeriesDO.getName())
			.parent()
			.appendR('<span class="date">')
				.text(this.getDateText())
			;

		const $interface = $li.appendR('<span class="interface">');
		/*
		this.$issue = $interface.appendR('<span class="issue">')
			.text( this.getIssueName() )
			;
		*/
		this.$actions = $interface.appendR('<span class="actions">');

		const url = this.getActionUrl();
		if (url) {
			this.$actions.appendR('<a>')
				.addClass("btn btn-mini btn-inverse")
				.attr("href", this.getActionUrl())
				.attr("target", "_blank")
				.text(this.getActionLabel())
				;
		}

		this.$li = $li;
		return $li;
	},



	getDateUnix: function() {
		let date;
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				date = volumeDO.getReleaseDate();
				break;

			case BookSeriesIssue.AwaitingStoreAvailability:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				date = volumeDO.getReleaseDate();
				break;

			case BookSeriesIssue.VolumeAvailable:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				date = volumeDO.getReleaseDate();
				break;

			case BookSeriesIssue.PreorderAvailable:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				date = volumeDO.getReleaseDate();
				break;

			case BookSeriesIssue.WaitingForLocal:
				
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				volumeDO = volumeDO ? volumeDO.previousVolumeDO : null;
				if (volumeDO) {
					date = 'Prev at ' + volumeDO.getReleaseDate();
				} else {
					return Infinity;
				}
				break;
				
			case BookSeriesIssue.WaitingForSource:
				const volumesCOL = this.bookSeriesDO.getVolumes();
				volumeDO = volumesCOL.length ? volumesCOL[volumesCOL.length - 1] : null;
				if (volumeDO) {
					date = volumeDO.getReleaseDateSource();
				} else {
					return Infinity;
				}
				break;

			default:
				return Infinity;
		}

		return moment(date, 'DD/MM/YYYY').unix();
	},

	getDateText: function() {
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				return volumeDO.getReleaseDate();

			case BookSeriesIssue.AwaitingStoreAvailability:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				return volumeDO.getReleaseDate();

			case BookSeriesIssue.VolumeAvailable:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				return volumeDO.getReleaseDate();

			case BookSeriesIssue.PreorderAvailable:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				return volumeDO.getReleaseDate();

			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				volumeDO = volumeDO ? volumeDO.previousVolumeDO : null;
				if (volumeDO) {
					return 'Prev at ' + volumeDO.getReleaseDate();
				}
				return this.bookSeriesDO.getForcednotes();

			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:

				const volumesCOL = this.bookSeriesDO.getVolumes();
				volumeDO = volumesCOL.length ? volumesCOL[volumesCOL.length - 1] : null;
				if (volumeDO) {
					return 'Last at ' + volumeDO.getReleaseDateSource();
				} else {
					return '';
				}

				return '';

				return '';

			default:
				return 'Unknown issue';
		}
	},

	getActionLabel: function() {
		switch(this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion: return 'View physical';
			case BookSeriesIssue.VolumeAvailable: return 'View volume';
			case BookSeriesIssue.PreorderAvailable: return 'View volume';
			case BookSeriesIssue.WaitingForLocal: return 'Search on store';
			case BookSeriesIssue.WaitingForSource: return 'Search on Amazon JP';
			case BookSeriesIssue.AwaitingStoreAvailability: return 'Search on store';
			case BookSeriesIssue.LocalVolumeOverdue: return 'Search on store';
			case BookSeriesIssue.SourceVolumeOverdue: return 'Search on Amazon JP';
			default: return 'Unknown issue';
		}
	},

	getActionUrl: function() {
		let order;
		let volumeDO;
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
				return this.bookSeriesDO.getFirstUnownedVolume().getPreferredStoreLink();
			case BookSeriesIssue.VolumeAvailable:
				return this.bookSeriesDO.getFirstUnownedVolume().getPreferredStoreLink();
			case BookSeriesIssue.PreorderAvailable:
				return this.bookSeriesDO.getFirstUnownedVolume().getPreferredStoreLink();
			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				if (!volumeDO) { return null; }
				return this.bookSeriesDO.getPreferredStoreSearchLink(volumeDO.getColorder(), true);
			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:
				const volumesCOL = this.bookSeriesDO.getVolumes();
				order = volumesCOL.length ? volumesCOL[volumesCOL.length - 1].getColorder() : 0;
				return this.bookSeriesDO.getKindleSearchLinkSource(order + 1);
			case BookSeriesIssue.AwaitingStoreAvailability:
				volumeDO = this.bookSeriesDO.getFirstUnownedVolume();
				return this.bookSeriesDO.getPreferredStoreSearchLink(volumeDO.getColorder(), true);
			default:
				return null;
		}
		
	}

},{
	name: "BookSeriesIssueItem"
});



window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_ajaxendpoint: "../../ajax.php",
	JsonAjaxInterface_afterDomReady: function(){},
	JsonAjaxInterface_afterDataReady: async function(){
		
		const vtpbs = [];
		let issues = [];
		let sourceOverdue = [];

		const statusesToIgnore = [
			BookSeriesDO.Enum.Status.Drop,
			BookSeriesDO.Enum.Status.Consider,
			BookSeriesDO.Enum.Status.Unlicensed
		];

		this._COL.forEach(bookSeriesDO => {

			if (bookSeriesDO.isIgnoreIssues()) {
				return;
			}

			const issue = bookSeriesDO.getIssue({
				ignoreAllIssuesOnBacklog: true,
				ignorePreorderAvailableForAnnounced: true,
			});
			if (issue) {
				const issueobj = new BookSeriesIssueItem(bookSeriesDO, issue);
				issues.push(issueobj);
			}

			if (!bookSeriesDO.hasStatus(statusesToIgnore) && bookSeriesDO.isSourceVolumeOverdue()) {
				const issueobj = new BookSeriesIssueItem(
					bookSeriesDO,
					BookSeriesIssue.SourceVolumeOverdue
				);
				sourceOverdue.push(issueobj);
			}

			const volumes = bookSeriesDO.getVolumes();

			volumes.forEach(volumeDO => {
				const vtpb = new VolumeTpbHandler(volumeDO);
				if (vtpb.isEligibleTpb()) {
					vtpbs.push(vtpb);
				}
			});
		});
		
		{
			vtpbs.sort((a,b)=>{
				return a.getReleaseDateSortable().localeCompare(b.getReleaseDateSortable());
			});
			
			const $tpbdigital = jQuery("#tpbdigital-app");
			
			window._vtpbq = new VolumeTpbQueueHandler(vtpbs, () => {
				this.jsonAjaxSave(async () => {
					await sleep(3000);
					window.location.reload();	
				}, () => {
					alert("Error: couldn't save");
				});
			}, $tpbdigital);
		}

		{
			sourceOverdue = sourceOverdue.sort((a, b) => {
				return a.getDateUnix() - b.getDateUnix();
			});
			const $overdue = jQuery("#source-overdue-app");
			const $ul = $overdue.appendR('<ul class="issues">');
			for (const issue of sourceOverdue) {
				issue.render().appendTo($ul);
			}
		}
		

		{
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


			const $issues = jQuery("#issues-app");
			const existingIssueTypesUnsorted = Object.keys(issuesSorted).map(x => parseInt(x));
			const existingIssueTypes = [
				BookSeriesIssue.VolumeAvailable,
				BookSeriesIssue.PreorderAvailable,
				BookSeriesIssue.AwaitingStoreAvailability,
				BookSeriesIssue.AwaitingDigitalVersion,
				BookSeriesIssue.WaitingForLocal,
				BookSeriesIssue.LocalVolumeOverdue,
				BookSeriesIssue.WaitingForSource,
				BookSeriesIssue.SourceVolumeOverdue,
			].filter(x => existingIssueTypesUnsorted.indexOf(x) !== -1);
			
			for (const issueType of existingIssueTypes) {
				$issues.appendR('<h4>').text( getBookSeriesIssueName(issueType) );
				const $ul = $issues.appendR('<ul class="issues">');
				for (const issue of issuesSorted[issueType]) {
					issue.render().appendTo($ul);
				}
			}

			
			window._issues = issues;
		}
		
	},
	// jsonAjaxSave: function(success, error){
},{
	name: "JsonAjaxInterfaceForBookSeries",
	instance: true,
	parent: JsonAjaxInterface
});


/*

window.BookSeriesIssue = {
	AwaitingDigitalVersion: 1, // First unowned volume is TPB
	VolumeAvailable: 2, // First unowned volume is Available and series isn't Backlog or Dropped
	PreorderAvailable: 3,
	WaitingForLocal: 4, // Next unowned volume is Source
	WaitingForSource: 5, // All volumes owned and series isn 't Ended
	AwaitingStoreAvailability: 6,
};

*/