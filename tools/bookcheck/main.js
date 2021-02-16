

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
				.text(
					`${this.volumeDO.getReleaseDateMoment()?.fromNow()} (${this.volumeDO.getReleaseDate()})`
				)
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
			  <ul class="dropdown-menu pull-right text-right"></ul>
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
	__construct: function(jsonAjaxInterface, bookSeriesDO, issue) {
		this.jsonAjaxInterface = jsonAjaxInterface;
		this.bookSeriesDO = bookSeriesDO;
		this.issue = issue;

		const volumesCOL = this.bookSeriesDO.getVolumes();

		this.lastVolume = volumesCOL[volumesCOL.length - 1];
		this.nextVolumeColorder = this.lastVolume ? this.lastVolume.getColorder() + 1 : 1;
		this.firstUnownedVolume = this.bookSeriesDO.getFirstUnownedVolume();
		this.firstUnownedColorder = this.firstUnownedVolume?.getColorder() ?? 1;
	},

	save: function(complete) {
		this.jsonAjaxInterface.jsonAjaxSave(
			() => {
				complete?.();
				this.jsonAjaxInterface.rerender();
			},
			() => {
				complete?.();
				alert("Error: couldn't save");
			}
		);
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

		this.$actions = $interface.appendR('<span class="actions">');


		// TODO: Support for multiple actions
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
				this.generateDropdownActionItem(
					action.label,
					action.icon,
					action.callback ?? (() => window.open(action.url, "_blank"))
				).appendTo($dropdownActions);
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
		  <ul class="dropdown-menu pull-right text-right">
		    <!-- dropdown menu links -->
		  </ul>
		</div>`);
		$x.find("button").first()
			.text(label)
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


	// For sorting
	getDateUnix: function() {
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.AwaitingStoreAvailability:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
				return this.firstUnownedVolume?.getReleaseDateMoment()?.unix() ?? Infinity;

			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				return this.bookSeriesDO.getNextVolumeExpectedDateUncorrected()?.unix() ?? 0;
				
			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:
				return this.bookSeriesDO.getNextSourceVolumeExpectedDateUncorrected()?.unix() ?? Infinity;

			default:
				return Infinity;
		}
	},

	getDateText: function() {
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.AwaitingStoreAvailability:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
				{
					const date = this.firstUnownedVolume.getReleaseDateMoment()?.fromNow() ?? '';
					return `Vol. ${this.firstUnownedColorder} ${date}`;
				}

			case BookSeriesIssue.WaitingForLocal:
				volumeDO = this.firstUnownedVolume?.previousVolumeDO ?? null;
				if (volumeDO) {
					const prevVolumeColorder = volumeDO.getColorder();
					const prevVolumeDate = volumeDO.getReleaseDateMoment()?.fromNow();
					const nextVolumeColorder = this.firstUnownedColorder;
					const nextVolumeDate = this.bookSeriesDO.getNextVolumeExpectedDate()?.fromNow(true);
					if (nextVolumeDate) {
						return `Vol. ${nextVolumeColorder} in about ${nextVolumeDate}, prev ${prevVolumeDate}`;
					} else {
						return `Vol. ${prevVolumeColorder} was last ${prevVolumeDate}`
					}
				}
				{
					const note = this.bookSeriesDO.getForcednotes();
					return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
				}

			case BookSeriesIssue.LocalVolumeOverdue:
				return `Vol. ${this.firstUnownedColorder} overdue ${this.bookSeriesDO.getOverdueText()}`;
				
			case BookSeriesIssue.WaitingForSource:
				if (this.lastVolume) {
					const prevVolumeColorder = this.lastVolume.getColorder();
					const prevVolumeDate = this.lastVolume.getReleaseDateSourceMoment()?.fromNow();
					const nextVolumeColorder = prevVolumeColorder + 1;
					const nextVolumeDate = this.bookSeriesDO.getNextSourceVolumeExpectedDate()?.fromNow(true);
					if (nextVolumeDate) {
						return `Vol. ${nextVolumeColorder} in about ${nextVolumeDate}, prev ${prevVolumeDate}`;
					} else {
						return `Vol. ${prevVolumeColorder} was last ${prevVolumeDate}`
					}
				}
				{
					const note = this.bookSeriesDO.getForcednotes();
					return note ? `Note: ${this.bookSeriesDO.getForcednotes()}` : '';
				}

			case BookSeriesIssue.SourceVolumeOverdue:
				return `Vol. ${this.lastVolume.getColorder() + 1} overdue ${this.bookSeriesDO.getSourceOverdueText()}`;

			default:
				return '';
		}
	},

	getActions: function() {
		// Array<{ url?: string, callback?: () => void, label: string }>
		let actions = null;
		switch (this.issue) {
			case BookSeriesIssue.AwaitingDigitalVersion:
			case BookSeriesIssue.VolumeAvailable:
			case BookSeriesIssue.PreorderAvailable:
				actions = this.firstUnownedVolume?.getStoreLinkActions();
				break;
			case BookSeriesIssue.WaitingForLocal:
			case BookSeriesIssue.LocalVolumeOverdue:
				actions = this.bookSeriesDO.getStoreSearchActions(this.firstUnownedColorder);
				break;
			case BookSeriesIssue.WaitingForSource:
			case BookSeriesIssue.SourceVolumeOverdue:
				actions = this.bookSeriesDO.getSourceStoreSearchActions(this.nextVolumeColorder);
				break;
			case BookSeriesIssue.AwaitingStoreAvailability:
				actions = this.bookSeriesDO.getStoreSearchActions(this.firstUnownedColorder);
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
				}]
				break;
			default:
				break;
		}

		if (!Array.isArray(actions)) { actions = []; }

		if (this.bookSeriesDO.canResolveIssueWithAsin(this.issue)) {
			actions.push({
				label: "Set ASIN",
				icon: "icon-edit",
				callback: () => {
					try {
						const asin = prompt("ASIN to resolve:");
						if (!asin) { return; }
						this.bookSeriesDO.resolveIssueWithAsin(this.issue, asin);
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

		if (this.bookSeriesDO.canResolveIssueWithStatus(this.issue)) {
			actions.push({
				label: "Set status",
				icon: "icon-chevron-right",
				callback: () => {
					try {
						const legend = Object.keys(BookSeriesVolumeDO.Enum.Status)
							.map(x => `${x} = ${BookSeriesVolumeDO.Enum.Status[x]}`)
							.join(", ")
							;
						const status = prompt("Status to resolve:\n"+legend);
						if (!status) { return; }
						this.bookSeriesDO.resolveIssueWithStatus(this.issue, status);
						this.save();
					} catch(err) {
						alert(err.message);
					}
					
				}
			});
		}

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
						this.bookSeriesDO.resolveIssueWithReleaseDate(this.issue, releaseDate);
						this.save();
					} catch(err) {
						alert(err.message);
					}
					
				}
			});
		}

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

		return actions;
	},

},{
	name: "BookSeriesIssueItem"
});



window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_ajaxendpoint: "../../ajax.php",
	JsonAjaxInterface_afterDomReady: function(){},
	rerender: function(){
		this.JsonAjaxInterface_afterDataReady();
	},
	JsonAjaxInterface_afterDataReady: async function(){

		window._ajaxBookseriesUri = "../../ajax_bookseries.php";
		
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

			const issueInfo = bookSeriesDO.getIssue({
				ignoreAllIssuesOnBacklog: true,
				ignorePreorderAvailableForAnnounced: true,
			});
			if (issueInfo) {
				const [issue, volumeDO] = issueInfo;
				const issueobj = new BookSeriesIssueItem(this, bookSeriesDO, issue);
				issues.push(issueobj);
			}

			if (!bookSeriesDO.hasStatus(statusesToIgnore) && bookSeriesDO.isSourceVolumeOverdue()) {
				const issueobj = new BookSeriesIssueItem(
					this,
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
			
			const $tpbdigital = jQuery("#tpbdigital-app").empty();
			
			window._vtpbq = new VolumeTpbQueueHandler(vtpbs, () => {
				this.jsonAjaxSave(async () => {
					this.rerender();
				}, () => {
					alert("Error: couldn't save");
				});
			}, $tpbdigital);
		}

		{
			sourceOverdue = sourceOverdue.sort((a, b) => {
				return a.getDateUnix() - b.getDateUnix();
			});
			sourceOverdue.reverse();
			const $overdue = jQuery("#source-overdue-app").empty();
			const $ul = $overdue.appendR('<ul class="issues">');
			for (const issue of sourceOverdue) {
				issue.render().appendTo($ul);
			}
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
				BookSeriesIssue.MissingInformation,
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