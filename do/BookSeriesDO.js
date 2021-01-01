(function(){

	var isIos = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);

	// https://tc39.github.io/ecma262/#sec-array.prototype.includes
	if (!Array.prototype.includes) {
	  Object.defineProperty(Array.prototype, 'includes', {
	    value: function(searchElement, fromIndex) {
	      if (this == null) {
	        throw new TypeError('"this" is null or not defined');
	      }
	      var o = Object(this);
	      var len = o.length >>> 0;
	      if (len === 0) {
	        return false;
	      }
	      var n = fromIndex | 0;
	      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

	      function sameValueZero(x, y) {
	        return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
	      }

	      while (k < len) {
	        if (sameValueZero(o[k], searchElement)) {
	          return true;
	        }
	        k++;
	      }
	      return false;
	    }
	  });
	}

	function timeSinceShort(unixms, seconds) {
		if (unixms && !seconds) {
			seconds = Math.floor((new Date() - unixms) / 1000);
		}
		var interval = Math.floor(seconds / (60*60*24*365));

		if (interval > 0) {
			return interval + "y";
		}
		interval = Math.floor(seconds / (60*60*24*30));
		if (interval > 0) {
			return interval + "mo";
		}
		interval = Math.floor(seconds / (60*60*24*7));
		if (interval > 0) {
			return interval + "w";
		}
		interval = Math.floor(seconds / (60*60*24)) ;
		if (interval > 0) {
			return interval + "d";
		}

		//Because for this we don't care about precision lower than 24h
		return "now";

		interval = Math.floor(seconds / (60*60));
		if (interval > 0) {
			return interval + "h";
		}
		interval = Math.floor(seconds / 60);
		if (interval > 0) {
			return interval + "m";
		}
		if (seconds > 10) {
			return Math.floor(seconds) + "s";
		}
		return "now";
	}
	window.timeSinceShort = timeSinceShort;


	function drawPubGraph(container, data, isFinished) {

		const dataJP = data.jp.map(function(v) {
			return {
				x: v[0] + 1000*60*60*12,
				y: v[1],
				z: v[2]
			}
		});
		const dataEN = data.en.map(function(v) {
			return {
				x: v[0] + 1000*60*60*12,
				y: v[1],
				z: v[2]
			}
		});

		const now = moment();

		if (data.nextjp) {
			dataJP.push({
				x: data.nextjp.unix()*1000,
				y: data.maxjp+1,
				z: "Next?",
				marker: {
					fillColor: "#999"
				},
				color: "#999"
			});
		}
		if (data.nexten) {
			dataEN.push({
				x: data.nexten.unix()*1000,
				y: data.maxen+1,
				z: "Next?",
				marker: {
					fillColor: "#999"
				},
				color: "#999"
			});
		}



		Highcharts.chart(container, {
		    chart: { type: 'spline' },
		    title: { text:'' },
		    xAxis: {
		        type: 'datetime',
		        dateTimeLabelFormats: {
		            month: '%b %y',
		            year: '%Y'
		        },
		        title: {
		            text: 'Publication'
		        },
		        plotLines: [{
			        color: '#FF0000', // Red
			        width: 2,
			        value: now.unix()*1000
			    }]
		    },
		    yAxis: {
		        title: { text: 'Volume' },
		        min: 1,
		        allowDecimals: false
		    },
		    tooltip: {
		        headerFormat: 'Volume <b>{point.y}</b> ({series.name})<br/>',
		        pointFormat: 'Publish date {point.x:%e/%b/%Y}'
		    },
		    plotOptions: {
		        spline: {
		            marker: {
		                enabled: true
		            }
		        }
		    },
		    series: [{
		        name: "JP",
		        color: "#584CCB",
		        data: dataJP,
		        dataLabels: {
		        	enabled: true,
		        	format: "{point.z}",
		        	style: { fontSize: "10px", fontWeight: "normal" }
		        }
		    }, {
		        name: "EN",
		        color: "#85CD8F",
		        data: dataEN,
		        dataLabels: {
		        	enabled: true,
		        	format: "{point.z}",
		        	style: { fontSize: "10px", fontWeight: "normal" }
		        }
		    }]
		});
	}


	const sumArrayValues = function(values) { return values.reduce(function(p, c){ return p + c }, 0); }

	function mean(values) {
		return sumArrayValues(values)/values.length;
	}

	function indexWeightedMean(values) {
		const weight = function(pos, len) { return (pos+1)/(len-pos); }
		const weights = values.map(function(x, i){ return weight(i, values.length)});
		return sumArrayValues(values.map(function(factor, index){ return factor * weights[index] })) / sumArrayValues(weights);
	}
	function lowestArrayValue(values) {
		return values.reduce((p,c) => (p<c ? p : c), Infinity);
	}
	function highestArrayValue(values) {
		return values.reduce((p,c) => (p>c ? p : c), -Infinity);
	}


	function nextOcurrenceInList(momentArray) {
		try {
			var l = momentArray.length;
			if (l < 2) {
				return null;
			}

			var last = momentArray[l-1];
			var slast = momentArray[l-2];
			return last.add( last.diff(slast, "seconds"), "seconds" );
		} catch(e) {
			return null;
		}
	}


	function nextOcurrenceInListWeighted(momentArray) {
		try {
			// console.log(momentArray.map(x => x.format("DD/MMM/YYYY")));
			var l = momentArray.length;
			if (l < 2) {
				return null;
			}

			var items = momentArray.map(function(x){ return x.unix(); }),
				dists = items.slice(1).map((v, i) => v - items[i]),
				avg = indexWeightedMean(dists)
			;
			res = moment(momentArray[l-1]).add( avg, "seconds" );
			/*
			const secondsInMonth = 60*60*24*30;
			console.log(
				momentArray.map(x => x.format("DD/MMM/YYYY")),
				dists.map(x=>x/secondsInMonth),
				avg/secondsInMonth,
				res.format("DD/MMM/YYYY")
			);
			*/
			return res;
		} catch(e) {
			console.log(e);
			return null;
		}
	}


	var twoCharMonth = ["Ja", "Fb", "Mr", "Ap", "My", "Jn", "Jl", "Ag", "Sp", "Oc", "Nv", "Dc"];





















	window.BookSeriesIssue = {
		AwaitingDigitalVersion: 1, // First unowned volume is TPB
		VolumeAvailable: 2, // First unowned volume is Available and series isn't Backlog or Dropped
		PreorderAvailable: 3,
		WaitingForLocal: 4, // Next unowned volume is Source
		WaitingForSource: 5, // All volumes owned and series isn 't Ended
		AwaitingStoreAvailability: 6,
		LocalVolumeOverdue: 7, // Some heuristics here
		SourceVolumeOverdue: 8, // Some heuristics here
	};

	window.getBookSeriesIssueName = function(issue) {
		switch(issue) {
			case BookSeriesIssue.AwaitingDigitalVersion: return 'Awaiting digital version';
			case BookSeriesIssue.VolumeAvailable: return 'Volume available';
			case BookSeriesIssue.PreorderAvailable: return 'Preorder available';
			case BookSeriesIssue.WaitingForLocal: return 'Waiting for local';
			case BookSeriesIssue.WaitingForSource: return 'Waiting for source';
			case BookSeriesIssue.AwaitingStoreAvailability: return 'Waiting for store';
			case BookSeriesIssue.LocalVolumeOverdue: return 'Local volume overdue';
			case BookSeriesIssue.SourceVolumeOverdue: return 'Source volume overdue';
			default: return 'Unknown issue';
		}
	}



	window.BookPublisherDO = DataObjects.createDataObjectType({
		name: "BookSeries",
		types: {
			name: "string",
			link: "string"
		},
		extraStatic: { primaryKey: "name" }
	});
	window.bookPublisherCOL = BookPublisherDO.COL([
		{ name: "Yen Press", link: "https://twitter.com/YenPress" },
		{ name: "VIZ", link: "https://twitter.com/VIZMedia" },
		{ name: "Kodansha", link: "https://twitter.com/KodanshaUSA" },
		{ name: "JNC", link: "https://twitter.com/jnovelclub" },
		{ name: "Kadokawa", link: null },
		{ name: "Seven Seas", link: "https://twitter.com/gomanga" },
		{ name: "Other", link: null },
		{ name: "Sol Press", link: "https://solpress.co/light-novels" },
		{ name: "Vertical", link: "https://twitter.com/vertical_staff" },
		{ name: "Tentai", link: "https://twitter.com/tentaibooks" },
	]);



	window.BookSeriesVolumeDO = DataObjects.createDataObjectType({
		name: "BookSeriesVolume",
		types: {
			colorder: "float",
			orderLabel: "string",
			asin: "string",
			status: ["enum", [
				"Read", "Backlog", "Preorder", "TPB",
				"None", "Source", "Available", "StoreWait"
			]],
			notes: "string",
			releaseDate: "string", //DD/MM/YYYY
			releaseDateSource: "string", //DD/MM/YYYY
			imageAsin: "string",
			sourceAsin: "string",
			link: "string",
			linkTitle: "string",
			isbn: "string",
			ibooksId: "string",
			koboId: "string",
			bookwalkerJpId: "string",
			preorderDate: "string", // DD/MM/YYYY
			purchasedDate: "string", //DD/MM/YYYY
			readDate: "string", //DD/MM/YYYY
			mangaCalendarId: "string",
			mangaCalendarEnabled: "boolean",
			manualTpbKindleCheckOnly: "boolean",
			treatAsNotSequential: "boolean",
		},
		extraPrototype: {
			__construct: function(rawdata, parent, options){
				if (typeof rawdata === "string") {
					if (rawdata[0] === "{") {
						rawdata = JSON.parse(rawdata);
						this._rawdata = rawdata;
						return;
					} else {
						rawdata = rawdata.split(";");
					}
				}
				/*
				1;B012345678;1
				2;B012345678;3
				//Read = 1, Backlog = 2, Source = 6 (ASIN will be interpreted as source asin)
				*/

				if (Array.isArray(rawdata)) {
					this._rawdata = {};
					this._rawdata.colorder = rawdata[0] ? rawdata[0].trim() : window.undefined;
					this._rawdata.asin = rawdata[1] ? rawdata[1].trim() : window.undefined;
					this._rawdata.status = this.statusFromString(rawdata[2]);
					if (this._rawdata.status === this.__static.Enum.Status.Source) {
						this._rawdata.sourceAsin = this._rawdata.asin;
						this._rawdata.asin = window.undefined;
					}
					if (rawdata[3]) {
						this._rawdata.sourceAsin = rawdata[3].trim();
					}
					this._rawdata.notes = rawdata[4] ? rawdata[4].trim() : window.undefined;
					this._rawdata.orderLabel = rawdata[5] ? rawdata[5].trim() : window.undefined;
				}

				this.options = populateDefaultOptions(options, {
					index: 0,
					total: 999,
					nextVolumeDO: null,
				});

				this.nextVolumeDO = this.options.nextVolumeDO;
			},

			setNextVolume: function(nextVolumeDO){
				this.nextVolumeDO = nextVolumeDO;
			},
			setPreviousVolume: function (previousVolumeDO) {
				this.previousVolumeDO = previousVolumeDO;
			},

			getPreferredStoreLink: function(){
				const store = this.parent.getStore();
				const amazonLink = this.getAmazonLink();
				const amazonJpLink = this.getAmazonJpLink();
				const koboLink = this.getKoboLink();
				if (koboLink && store === BookSeriesDO.Enum.Store.Kobo) {
					return koboLink;
				} else if (amazonLink) {
					return amazonLink;
				} else {
					return amazonJpLink;
				}
			},

			getAmazonLink: function(){
				const asin = this.getAsin();
				if (!asin) { return null; }
				return "https://smile.amazon.com/dp/"+asin
			},
			getAmazonJpLink: function(){
				const sourceAsin = this.getSourceAsin();
				if (!sourceAsin) { return null; }
				return "https://www.amazon.co.jp/dp/"+sourceAsin;
			},
			getKoboLink: function(){
				const koboId = this.getKoboId();
				if (!koboId) { return null; }
				return "https://www.kobo.com/es/en/ebook/"+koboId;
			},
			getBookwalkerJpLink: function(){
				const bwjpid = this.getBookwalkerJpId();
				if (!bwjpid) { return null; }
				return "https://bookwalker.jp/"+bwjpid;
			},



			isLastVolumeOfCollection: function(){
				return (this.options.index >= (this.options.total-1));
			},


			canScrapeForPubDates: function(){
				return (
					this.canScrapeForSourcePubDate()
					|| this.canScrapeForEnPubDate()
					|| this.canScrapeForKoboData()
				);
			},

			canScrapeForSourcePubDate: function(){
				if (this.getReleaseDateSource()) { return false; }
				if (!this.getSourceAsin()) { return false; }
				return true;
			},

			canScrapeForEnPubDate: function(){
				if (this.getReleaseDate()) { return false; }
				if (!this.getAsin()) { return false; }
				return true;
			},

			canScrapeForKoboData: function() {
				return (
					this.canScrapeForKoboPubDate()
					|| this.canScrapeForKoboIsbn()
					|| this.canScrapeForKoboImage()
				);
			},
			canScrapeForKoboPubDate: function() {
				if (!this.getKoboId()) { return false; }
				if (this.canScrapeForEnPubDate()) { return false; } // Prefer Amazon release date
				return !this.getReleaseDate();
			},
			canScrapeForKoboIsbn: function() {
				if (!this.getKoboId()) { return false; }
				return !this.getIsbn();
			},
			canScrapeForKoboImage: function() {
				if (!this.getKoboId()) { return false; }
				return !(this.getImageAsin() || this.getAsin());
			},


			getPubDatesFromAsins: function(complete) {
				complete = complete ? complete : function(){};
				async.parallel({
					en: function(cb){
						this.getEnPubDateFromAsin(function(err, res){
							cb(null, {error: err, newvalue: res});
						});
					}.bind(this),
					jp: function(cb){
						this.getSourcePubDateFromAsin(function(err, res){
							cb(null, {error: err, newvalue: res});
						});
					}.bind(this),
					kobo: function(cb){
						this.getKoboDataFromId(function(err, res){
							cb(null, {error: err, data: res});
						});
					}.bind(this),
				}, complete);
			},

			getKoboDataFromId: function(complete, maxRetries, currentRetry) {
				complete = complete ? complete : function(){};
				maxRetries = maxRetries ? maxRetries : 3;
				currentRetry = currentRetry ? currentRetry : 1;

				if (!this.canScrapeForKoboData()) {
					complete(null);
					return;
				}

				const id = this.getKoboId();

				jQuery.ajax({
					url: "./ajax_bookseries.php",
					dataType: "json",
					data: {
						action: "getkoboinfo",
						id: id
					},
					success: function(data){
						if (!data || !data.data) {
							if (maxRetries && currentRetry < maxRetries) {
								this.getSourcePubDateFromAsin(complete, maxRetries, currentRetry+1);
							} else {
								complete("Couldn't scrape");
							}
							return;
						}

						if (data.data.date && this.canScrapeForKoboPubDate()) {
							var pd = moment(data.data.date, "MMM DD, YYYY").format("DD/MM/YYYY")
							this.setReleaseDate(pd);
						}

						if (data.data.isbn && this.canScrapeForKoboIsbn()) {
							this.setIsbn(data.data.isbn)
						}

						if (data.data.cover && this.canScrapeForKoboImage()) {
							this.setImageAsin(data.data.cover)
						}

						complete(null, data.data);
					}.bind(this),
					error: function(jqXHR,textstatus,errorthrown){
						complete(errorthrown ? errorthrown : textstatus);
					}
				});
			},

			getSourcePubDateFromAsin: function(complete, maxRetries, currentRetry) {
				complete = complete ? complete : function(){};
				maxRetries = maxRetries ? maxRetries : 3;
				currentRetry = currentRetry ? currentRetry : 1;

				if (this.getReleaseDateSource()) {
					complete(null);
					return;
				}

				var asin = this.getSourceAsin();
				if (!asin) {
					complete("NO ASIN");
					return;
				}

				jQuery.ajax({
					url: "./ajax_bookseries.php",
					data: {
						action: "getpubdateasin",
						asin: asin,
						lang: "jp"
					},
					success: function(data){
						if (!data || !data.pubdate) {
							if (maxRetries && currentRetry < maxRetries) {
								this.getSourcePubDateFromAsin(complete, maxRetries, currentRetry+1);
							} else {
								complete("Couldn't scrape");
							}
							return;
						}
						var pd = moment(data.pubdate, "YYYY/MM/DD").format("DD/MM/YYYY")
						this.setReleaseDateSource(pd);
						complete(null, pd);
					}.bind(this),
					error: function(jqXHR,textstatus,errorthrown){
						complete(errorthrown ? errorthrown : textstatus);
					}
				});
			},

			getEnPubDateFromAsin: function(complete, maxRetries, currentRetry) {
				complete = complete ? complete : complete;
				maxRetries = maxRetries ? maxRetries : 3;
				currentRetry = currentRetry ? currentRetry : 1;

				if (this.getReleaseDate()) {
					complete(null);
					return;
				}

				var asin = this.getAsin();
				if (!asin) {
					complete("NO ASIN");
					return;
				}

				jQuery.ajax({
					url: "./ajax_bookseries.php",
					data: {
						action: "getpubdateasin",
						asin: asin,
						lang: "en"
					},
					success: function(data){
						if (!data || !data.pubdate) {
							if (maxRetries && currentRetry < maxRetries) {
								this.getEnPubDateFromAsin(complete, maxRetries, currentRetry+1);
							} else {
								complete("Couldn't scrape");
							}
							return;
						}
						var pd = moment(data.pubdate, "MMMM DD, YYYY").format("DD/MM/YYYY")
						this.setReleaseDate(pd);
						complete(null, pd);
					}.bind(this),
					error: function(jqXHR,textstatus,errorthrown){
						complete(errorthrown ? errorthrown : textstatus);
					}
				});
			},

			getBestAsinForImage: function(){
				return this.getImageAsin() || this.getAsin() || this.getSourceAsin();
			},
			getBestAsinForLink: function(){
				return this.getAsin() || this.getImageAsin() || this.getSourceAsin();
			},
			getCollectionOrderLabel: function(){
				var ol = this.getOrderLabel();
				var co = this.getColorder();
				return (ol ? ol : ( isNaN(co) ? '-' : co ));
			},
			getCoverUrl: function(width, refresh){
				var asin = this.getBestAsinForImage();
				if (!asin) {
					return "";
				}
				let url;
				if (asin.startsWith("http") || asin.startsWith("//")) {
					url = asin;
					if (asin.startsWith("//")) {
						url = 'http:'+url;
					}
				} else {
					url = "http://images.amazon.com/images/P/"+asin;
				}
				
				var w = parseInt(width);
				var params = {
					context: "bookseries",
					action: isNaN(w) ? "echo" : "thumb",
					url: url,
					path: "amazoncovers\\"+md5(asin)+".jpg",
					w: w,
					maxage: 60*60*24*7
				};
				if (refresh) { params.refresh = 1; params.t = Date.now(); }

				return "thumb?"+jQuery.param(params);
			},
			getOpenLibraryCover: function() {
				const isbn = this.getIsbn();
				return "http://covers.openlibrary.org/b/isbn/"+isbn+"-S.jpg"; // isbn/9780385533225-S.jpg
			},
			statusFromString: function(str){
				if (!isNaN(parseInt(str))) {
					return parseInt(str);
				}
				if (!str) { str = ""; }
				switch(str.toLowerCase().trim()) {
					case "read": return 1;
					case "back": case "backlog": return 2;
					case "pre": case "preorder": return 3;
					case "tpb": return 4;
					case "none": default: return 5;
					case "source": case "src": case "jp": return 6;
					case "available": case "avail": case "av": return 7;
				}
			},
			getBestReleaseDate: function(){
				return this.getReleaseDate() || this.getReleaseDateSource();
			},
			hasReleaseDate: function(){
				return !!this.getBestReleaseDate();
			},
			getBestReleaseDateMoment: function(){
				return moment(this.getBestReleaseDate(), "DD/MM/YYYY");
			},
			getReleaseDateMoment: function(){
				var rd = this.getReleaseDate();
				if (!rd) { return null; }
				return moment(rd, "DD/MM/YYYY");
			},
			getReleaseDateSourceMoment: function(){
				var rd = this.getReleaseDateSource();
				if (!rd) { return null; }
				return moment(rd, "DD/MM/YYYY");
			},
			getReleaseDateShort: function(){

				var d = this.getBestReleaseDateMoment();
				var isCurrentYear = (moment().year() === d.year());

				if (isCurrentYear) {
					return d.format("D MMM");
				} else {
					return d.format("D")
						+" "+
						twoCharMonth[d.month()]
						+" "+
						d.format("YY")
						;
				}
			},
			getReleaseDateLong: function(){
				return this.getBestReleaseDateMoment().format("D MMM YY");
			},
			getReleaseDateSortable: function(){
				return this.getBestReleaseDateMoment().format("YYYY-MM-DD");
			},

			getReadDateMoment: function() {
				const m = moment(this.getReadDate(), 'DD/MM/YYYY');
				return m.isValid() ? m : null;
			},
			getPurchasedDateMoment: function() {
				const m = moment(this.getPurchasedDate(), 'DD/MM/YYYY');
				return m.isValid() ? m : null;
			},
			getPreorderDateMoment: function() {
				const m = moment(this.getPreorderDate(), 'DD/MM/YYYY');
				return m.isValid() ? m : null;
			},

			hasNotes: function(){
				switch(this.getStatus()) {
					default:
						return false;
					case this.__static.Enum.Status.StoreWait:
					case this.__static.Enum.Status.Available:
					case this.__static.Enum.Status.Preorder:
					case this.__static.Enum.Status.TPB:
						return !!this.getBestReleaseDate();
					case this.__static.Enum.Status.None:
						return !!this.getNotes();
					case this.__static.Enum.Status.Source:
						return true;
				}
			},
			render: function(options){
				options = populateDefaultOptions(options, {
					renderNotes: true
				});
				var seriesname = this.parent.getName();
				var colorder = this.getColorder(),
					orderLabel = this.getCollectionOrderLabel(),
					status = this.getStatus(),
					coverSize = 120,
					coverUrl = this.getCoverUrl(coverSize),
					notes = this.getNotes();
				var $ctr = jQuery('<span class="bookSeriesVolume">')
					.attr('data-status', status);
				var $cc = $ctr.appendR('<span class="coverContainer">');
				var $co = $cc.appendR('<span class="colorder">').text(orderLabel);
				var $c = $cc.appendR('<span class="cover">')
					.css('background-image', 'url('+coverUrl+')')
					;

				let errorCount = 0;

				const addErrorHandler = function(){

					$c.waitForImages(()=>{
						//console.log("All images loaded");
						// (No info on whether there were any errors)
					}, (loaded,count,success) => {
						if (!success) {
							if (++errorCount > 3) { return; }
							//console.log("Error loading cover image for", seriesname, colorder, "errorCount =", errorCount);
							$c.css('background-image', '');
							setTimeout(() => {
								$c.css('background-image', 'url('+coverUrl+')');
								addErrorHandler();
							}, 0);
						}
					}, true);
				};
				addErrorHandler();

				if (options.renderNotes) {
					var $notes = $ctr.appendR('<span class="notes">');
					switch(status) {
						case this.__static.Enum.Status.StoreWait:
						case this.__static.Enum.Status.Available:
						case this.__static.Enum.Status.Preorder:
						case this.__static.Enum.Status.TPB:
							$notes.text( this.getReleaseDateShort() );
							break;
						default:
						case this.__static.Enum.Status.None:
							$notes.text(notes);
							break;
						case this.__static.Enum.Status.Source:
							var text = "JP";
							if (notes) {
								text = notes;
							} else if (this.hasReleaseDate()) {
								text = this.getReleaseDateShort();
							}
							$notes.text(text);
							break;
					}
				}

				//$cc.on('click', this.throwEditForm.bind(this));

				$cc.attr("data-toggle", "dropdown")
					.on('click', function(){
						$cc.dropdown();
					}.bind(this))
					;
				$ctr.appendR( this.renderDropdownMenu($ctr, coverSize) );

				return $ctr;
			},
			renderTile: function(options) {
				options = populateDefaultOptions(options, {
					container: '<li>',
					releaseDateLong: false,
					weekday: false
				});

				var seriesname = this.parent.getName(),
					colorder = this.getColorder(),
					orderLabel = this.getCollectionOrderLabel()
					status = this.getStatus(),
					parentStatus = this.parent.getStatus(),
					coverSize = 500,
					coverUrl = this.getCoverUrl(coverSize),
					notes = this.getNotes()
					;

				var $container = jQuery(options.container)
					.addClass("bookSeriesVolumeTile")
					.attr({
						"data-status": status,
						"data-parentstatus": parentStatus
					})
					;
				var $content = $container.appendR('<div class="content">');

				var $cover = $content.appendR('<div class="cover">')
					.css('background-image', 'url('+coverUrl+')')
					;

				$dataContent = $content.appendR('<div class="dataContent">');

				var title = seriesname;
				if (orderLabel !== "-") {
					title += ", Vol. "+orderLabel;
				}

				$dataContent.appendR('<p class="title">').text(title);

				var $status = $dataContent.appendR('<p class="statusContainer">').hide().append('<span class="status">');
				switch(status) {
					case this.__static.Enum.Status.Preorder:
						$status.show().find(".status").text("Preordered");
						break;
					case this.__static.Enum.Status.Available:
						$status.show().find(".status").text("Available");
						break;
					case this.__static.Enum.Status.StoreWait:
						$status.show().find(".status").text("Wait on store");
						break;
					case this.__static.Enum.Status.TPB:
						$status.show().find(".status").text("TPB");
						break;
					case this.__static.Enum.Status.Source:
						$status.show().find(".status").text("JP");
						break;
					default: break;
				}

				if (notes) {
					$dataContent.appendR('<p class="notes">').text(notes);
				}

				var date = options.releaseDateLong ? this.getReleaseDateLong() : this.getReleaseDateShort();
				if (options.weekday) {
					date = this.getBestReleaseDateMoment().format("ddd") + ", " + date;
				}
				$dataContent.appendR('<span class="releaseDate">')
					.text(date)
					;

				
				$cover.attr("data-toggle", "dropdown")
					.on('click', function(){
						$cover.dropdown();
					}.bind(this))
					;
				$content.appendR( this.renderDropdownMenu($container, coverSize) );

				return $container;
			},
			renderDropdownMenu: function($container, coverSize){

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
				
				var addSetStatusOption = function(newstatus, name){
					return addOption().html('<i class="icon-chevron-right"></i> Set '+name).click(function(){
						this.setStatus(newstatus);
						this.save();
					}.bind(this));
				}.bind(this);



				addOption().html('<i class="icon-pencil"></i> Edit volume').click(this.throwEditForm.bind(this));
				addSeparator();

				

				var status = this.getStatus();

				switch(status) {
					default: break;
					case this.__static.Enum.Status.Read:
						addSetStatusOption(this.__static.Enum.Status.Backlog, "backlog");
						break;
					case this.__static.Enum.Status.Backlog:
						addSetStatusOption(this.__static.Enum.Status.Read, "read");
						break;
					case this.__static.Enum.Status.Preorder:
						addSetStatusOption(this.__static.Enum.Status.Available, "available");
						addSetStatusOption(this.__static.Enum.Status.Backlog, "backlog");
						addSetStatusOption(this.__static.Enum.Status.Read, "read");
						break;
					case this.__static.Enum.Status.StoreWait:
						addSetStatusOption(this.__static.Enum.Status.Available, "available");
						addSetStatusOption(this.__static.Enum.Status.Preorder, "preorder");
						addSetStatusOption(this.__static.Enum.Status.Backlog, "backlog");
						addSetStatusOption(this.__static.Enum.Status.Read, "read");
						break;
					case this.__static.Enum.Status.None:
						addSetStatusOption(this.__static.Enum.Status.Source, "source");
					case this.__static.Enum.Status.Source:
						addSetStatusOption(this.__static.Enum.Status.Preorder, "preorder");
						addSetStatusOption(this.__static.Enum.Status.Available, "available");
						addSetStatusOption(this.__static.Enum.Status.TPB, "TPB");
						addSetStatusOption(this.__static.Enum.Status.Backlog, "backlog");
						addSetStatusOption(this.__static.Enum.Status.Read, "read");
						break;
					case this.__static.Enum.Status.TPB:
						addSetStatusOption(this.__static.Enum.Status.Preorder, "preorder");
						addSetStatusOption(this.__static.Enum.Status.Available, "available");
						break;
					case this.__static.Enum.Status.Available:
						addSetStatusOption(this.__static.Enum.Status.Preorder, "preorder");
						addSetStatusOption(this.__static.Enum.Status.Backlog, "backlog");
						addSetStatusOption(this.__static.Enum.Status.Read, "read");
						break;
				}


				addSeparator();



				var asin = this.getBestAsinForLink();
				var mainAsin = this.getAsin();
				var sourceAsin = this.getSourceAsin();
				var imageAsin = this.getImageAsin();
				var ibooksId = this.getIbooksId();
				var isbn = this.getIsbn();

				var slinkvol = this.parent.getKindleSearchLink(this.getColorder());
				var slinksrcvol = this.parent.getKindleSearchLinkSource(this.getColorder());
				var anyAsinLinkShown = false;

				var bwJpId = this.getBookwalkerJpId();

				var koboId = this.getKoboId();
				var koboslinkvol = this.parent.getKoboSearchLink(this.getColorder());

				var isKindleSeries = (this.parent.getStore() === BookSeriesDO.Enum.Store.Kindle);
				var isKoboSeries = (this.parent.getStore() === BookSeriesDO.Enum.Store.Kobo);
				var isPhysSeries = (this.parent.getStore() === BookSeriesDO.Enum.Store.Phys);

				if (isbn && isPhysSeries) {
					isbn = (""+isbn).replace(/[^\d]+/gi, "");
					addOption().html('<i class="icon-shopping-cart"></i> Book Depository store page').attr({
						href: "https://www.bookdepository.com/book/"+isbn,
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}

				if (ibooksId) {
					ibooksId = "id"+(""+ibooksId).replace(/^id/gi, "");
					addOption().html('<i class="icon-shopping-cart"></i> Open in Apple Books').attr({
						href: "https://books.apple.com/us/book/"+ibooksId,
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}

				if (koboId) {
					addOption().html('<i class="icon-shopping-cart"></i> Kobo store page').attr({
						href: this.getKoboLink(),
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}


				if (koboslinkvol && !koboId) {
					addOption().html('<i class="icon-shopping-cart"></i> Search volume on Kobo').attr({
						href: koboslinkvol,
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}

				if (mainAsin) {
					addOption().html('<i class="icon-shopping-cart"></i> Amazon store page').attr({
						href: this.getAmazonLink(),
						target: "_blank"
					});
					anyAsinLinkShown = true;
				} else if (slinkvol) {
					addOption().html('<i class="icon-shopping-cart"></i> Search volume on Amazon').attr({
						href: slinkvol,
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}

				if (sourceAsin) {
					addOption().html('<i class="icon-shopping-cart"></i> Amazon JP store page').attr({
						href: this.getAmazonJpLink(),
						target: "_blank"
					});
					anyAsinLinkShown = true;
				} else if (slinksrcvol) {
					addOption().html('<i class="icon-shopping-cart"></i> Search volume on Amazon JP').attr({
						href: slinksrcvol,
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}

				if (isKindleSeries &&
					(
						status === this.__static.Enum.Status.Read
						|| status === this.__static.Enum.Status.Backlog
					)
					&& mainAsin && mainAsin.toUpperCase()[0] === "B") {
					addOption().html('<i class="icon-book"></i> Open on Kindle Cloud Reader').attr({
						href: "https://read.amazon.com/?asin="+mainAsin,
						target: "_blank"
					});
					if (!isIos) {
						addOption().html('<i class="icon-bookmark"></i> Open on Kindle app').attr({
							href: "kindle://book?action=open&asin="+mainAsin+"&location=0",
							target: "_blank"
						});
					}
					anyAsinLinkShown = true;
				}

				if (bwJpId) {
					addOption().html('<i class="icon-shopping-cart"></i> Bookwalker JP store page').attr({
						href: this.getBookwalkerJpLink(),
						target: "_blank"
					});
					anyAsinLinkShown = true;
				}


				if (anyAsinLinkShown) {
					addSeparator();
				}


				var slinkvolnext = this.parent.getKindleSearchLink(this.getColorder()+1);
				var slinksrcvolnext = this.parent.getKindleSearchLinkSource(this.getColorder()+1);
				var anyNextVolumeSearchLinkShown = false;
				var nextasin = this.nextVolumeDO ? this.nextVolumeDO.getAsin() : null;
				var nextasinsrc = this.nextVolumeDO ? this.nextVolumeDO.getSourceAsin() : null;
				
				var koboslinkvolnext = this.parent.getKoboSearchLink(this.getColorder()+1);
				var nextKoboId = this.nextVolumeDO ? this.nextVolumeDO.getKoboId() : null;

				//console.log(this.parent.getName(), this.getColorder(), mainAsin, "|", !!this.nextVolumeDO, nextasin, !!slinkvolnext, nextasinsrc, !!slinksrcvolnext);

				if (koboslinkvolnext && koboId && !nextKoboId) {
					addOption().html('<i class="icon-shopping-cart"></i> Search next on Kobo').attr({
						href: koboslinkvolnext,
						target: "_blank"
					});
					anyNextVolumeSearchLinkShown = true;
				}

				if (slinkvolnext && mainAsin && !nextasin && !nextasinsrc) {
					addOption().html('<i class="icon-shopping-cart"></i> Search next on Amazon').attr({
						href: slinkvolnext,
						target: "_blank"
					});
					anyNextVolumeSearchLinkShown = true;
				}
				if (slinksrcvolnext && !nextasinsrc) {
					addOption().html('<i class="icon-shopping-cart"></i> Search next on Amazon JP').attr({
						href: slinksrcvolnext,
						target: "_blank"
					});
					anyNextVolumeSearchLinkShown = true;
				}
				if (anyNextVolumeSearchLinkShown) {
					addSeparator();
				}


				var link = this.getLink();
				var slink = this.parent.getSeriesLink();
				var slinksrc = this.parent.getKindleSearchLinkSource();
				var koboslink = this.parent.getKoboSearchLink();
				var anySeriesLinkShown = false;


				if (link) {
					var title = this.getLinkTitle();
					title = title ? title : "Link";
					addOption().html('<i class="icon-info-sign"></i> '+title).attr({
						href: link,
						target: "_blank"
					});
					anySeriesLinkShown = true;
				}

				if (isKoboSeries) {
					addOption().html('<i class="icon-info-sign"></i> Search series on Kobo').attr({
						href: koboslink,
						target: "_blank"
					});
					anySeriesLinkShown = true;
				}

				if (slink) {
					addOption().html('<i class="icon-info-sign"></i> Search series on Amazon').attr({
						href: slink,
						target: "_blank"
					});
					anySeriesLinkShown = true;
				}

				if (slinksrc) {
					addOption().html('<i class="icon-info-sign"></i> Search series on Amazon JP').attr({
						href: slinksrc,
						target: "_blank"
					});
					anySeriesLinkShown = true;
				}

				if (this.parent.canShowPublicationGraph()) {
					addOption().html('<i class="icon-signal"></i> Publication graph').click(this.parent.showPublicationGraph.bind(this.parent));
					anySeriesLinkShown = true;
				}

				if (anySeriesLinkShown) {
					addSeparator();
				}

				

				if (asin) {
					addOption().html('<i class="icon-refresh"></i> Refresh image').click(function(){
						$container.find(".cover").css('background-image', 'url('+this.getCoverUrl(coverSize, true)+')');
					}.bind(this));

				}

				if (imageAsin && (mainAsin || sourceAsin)) {
					addOption().html('<i class="icon-remove"></i> Remove forced image').click(function(){
						this.setImageAsin("");
						this.save();
					}.bind(this));
				}

				addOption().html('<i class="icon-eye-close"></i> Hide').click(function(){
					$container.hide();
				}.bind(this));

				addSeparator();

				addOption().html('<i class="icon-pencil"></i> Edit series').click(this.throwParentEditForm.bind(this));

				return $dropdown;
			},
			beforeSave: function() {

				const status = this.getStatus();
				const today_ddmmyyyy = moment().format("DD/MM/YYYY");

				switch(status) {
					case this.__static.Enum.Status.Read:
						if (!this.getReadDate()) {
							this.setReadDate(today_ddmmyyyy);
						}
						// break; // CONTINUE LOL
					case this.__static.Enum.Status.Backlog:
						if (!this.getPurchasedDate()) {
							this.setPurchasedDate(today_ddmmyyyy);
						}
						break;
					case this.__static.Enum.Status.Preorder:
						if (!this.getPreorderDate()) {
							this.setPreorderDate(today_ddmmyyyy);
						}
						break;
					default:
						break;
				}

			},
			save: function(){
				this.beforeSave();
				var volumesCOL = this.parent.getVolumes();
				volumesCOL.get( this.pkGet() ).set(this.get());
				this.parent.saveVolumesFromCOL(volumesCOL);
				if (window.customMultiDataObjectEditor) {
					window.customMultiDataObjectEditor._editor.closeForm();
				}
			},
			throwEditForm: function(){
				var $form = this.renderAsForm(Object.shallowExtend({},{
					submitText: "Save",
					submitClass: "btn btn-small btn-success btn-submit",
				}, this.__static._formOptions));

				$form.find(".btn-submit").click(function(e){
					e.preventDefault(); e.stopPropagation();
					var volumesCOL = this.parent.getVolumes();
					const volumeDO = volumesCOL.get( this.pkGet() );
					volumeDO.ingestForm($form);
					volumeDO.beforeSave();
					this.parent.saveVolumesFromCOL(volumesCOL);
					window.customMultiDataObjectEditor._editor.closeForm();
				}.bind(this));

				jQuery('<button class="btn btn-small btn-danger btn-action-delete">')
					.text("Del")
					.click(function(e){
						e.preventDefault(); e.stopPropagation();
						if (!confirm("Delete volume "+this.pkGet()+"?")) {
							return;
						}
						var volumesCOL = this.parent.getVolumes();
						volumesCOL.remove(this);

						this.parent.saveVolumesFromCOL(volumesCOL);
						window.customMultiDataObjectEditor._editor.closeForm();
					}.bind(this))
					.appendTo($form)
					;

				window.customMultiDataObjectEditor._editor.showArbitraryForm($form);
			},

			throwParentEditForm: function(){
				var $form = this.parent.renderAsForm(Object.shallowExtend({},{
					submitText: "Save",
					submitClass: "btn btn-small btn-success btn-submit",
				}, this.__static._formOptions));

				$form.find(".btn-submit").click(function(e){
					e.preventDefault(); e.stopPropagation();
					var volumesCOL = this.parent.getVolumes();
					this.parent.saveVolumesFromCOL(volumesCOL);
					window.customMultiDataObjectEditor._editor.closeForm();
				}.bind(this));

				window.customMultiDataObjectEditor._editor.showArbitraryForm($form);
			},
			toString: function(){
				var strparams = [];
				
				var colorder = this.getColorder();
				strparams.push( isNaN(colorder) ? "" : colorder );

				var asin = this.getAsin();
				strparams.push( asin ? asin : "" );

				strparams.push( this.getStatus() );

				var releaseDate = this.getBestReleaseDate();
				strparams.push( releaseDate ? releaseDate : "" );

				var notes = this.getNotes();
				strparams.push( notes ? notes : "" );

				var iasin = this.getImageAsin();
				strparams.push( iasin ? iasin : "" );

				return strparams.join("; ").trim();
			},
		},
		extraStatic: {
			primaryKey: "colorder",
			_formOptions: {
				event: {},
				typeoptions: {},
				hideFields: [
					"ibooksId", "mangaCalendarId", "mangaCalendarEnabled"
				]
			},
			sortByReleaseDate: function(volumesCOL, reverse) {
				volumesCOL.sort(function(aDO, bDO){
					return aDO.getBestReleaseDateMoment() - bDO.getBestReleaseDateMoment();
				});
				if (reverse) {
					volumesCOL.reverse();
				}
			},
			throwCreateForm: function(parent){
				var newDO = this.DO({}, parent);

				var $form = newDO.renderAsForm(Object.shallowExtend({},{
					submitText: "Create",
					submitClass: "btn btn-small btn-success btn-submit",
				}, this._formOptions));

				$form.find(".btn-submit").click(function(e){
					e.preventDefault(); e.stopPropagation();

					var volumesCOL = parent.getVolumes();
					newDO.ingestForm($form);
					volumesCOL.push(newDO);

					parent.saveVolumesFromCOL(volumesCOL);
					window.customMultiDataObjectEditor._editor.closeForm();
				}.bind(this));

				window.customMultiDataObjectEditor._editor.showArbitraryForm($form);
			},
			stringFromCOL: function(COL){
				COL.sortByProperty("colorder", true);
				var strings = [];
				for (var i = 0; i < COL.length; i++) {
					strings.push(COL[i].toString());
				}
				return strings.join("\n");
			}
		}
	});















	window.BookSeriesDO = DataObjects.createDataObjectType({
		name: "BookSeries",
		types: {
			id: "int",
			name: "string",
			type: ["enum", ["Novel", "Manga", "Other"]],
			store: ["enum", [
				"Phys",
				"Kindle",
				"BookWk",
				"JNC",
				"Other",
				"iBooks",
				"Kobo",
			]],
			status: ["enum", [
				"✔",
				"Backlog",
				"Ended",
				"Drop",
				"Consider",
				"Avail",
				"Stall",
				"Announced",
				"Unlicensed",
				"Prepub",
			]],
			publisher: ["enum", bookPublisherCOL.asRawArray().map(function(d){ return d.name })],
			lang: ["enum", ["EN", "JP", "ES"]],
			read: "int",
			owned: "int",
			publishedVolumes: "int",
			finishedPublication: "bool",
			precount: "int",
			preorder: "bool",
			notes: "string",
			lastupdate: "int",
			lastcheck: "int",
			link: "string",
			kindleSearchString: "string",
			kindleSearchStringSource: "string",
			volumes: "string",
			morenotes: "string",
			forcednotes: "string",
			ignoreIssues: "boolean",
			koboSeriesId: "string",
		},

		extraPrototype: {

			getSeriesLink: function(){
				var ksl = this.getKindleSearchLink();
				return ksl ? ksl : this.getLink();
			},
			getPreferredStoreSearchLink: function(volumeNumber, asPhysicalBook){
				if (this.getStore() === BookSeriesDO.Enum.Store.Kobo) {
					return this.getKoboSearchLink(volumeNumber);
				} else {
					return this.getKindleSearchLink(volumeNumber, asPhysicalBook); 
				}
			},
			getKindleSearchLink: function(volumeNumber, asPhysicalBook){
				var kss = this.getKindleSearchString();
				if (!kss) { return null; }
				if (volumeNumber) {
					kss += " "+volumeNumber;
				}
				if (asPhysicalBook) {
					return "https://smile.amazon.com/s?i=stripbooks-intl-ship&s=date-desc-rank&field-keywords=" + encodeURIComponent(kss);
				} else {
					return "https://smile.amazon.com/gp/search/?search-alias=digital-text&unfiltered=1&field-language=English&sort=daterank&field-keywords="+encodeURIComponent(kss);
				}
			},
			getKindleSearchLinkSource: function(volumeNumber){
				var kss = this.getKindleSearchStringSource();
				if (!kss) { return null; }
				if (volumeNumber) {
					kss += " "+volumeNumber;
				}
				// return "https://www.amazon.co.jp/gp/search/?search-alias=digital-text&sort=date-desc-rank&keywords="+encodeURIComponent(kss);
				return "https://www.amazon.co.jp/gp/search/?search-alias=digital-text&keywords="+encodeURIComponent(kss);
			},
			getKoboSearchLink: function(volumeNumber){
				var kss = this.getKindleSearchString();
				if (!kss) { return null; }
				if (volumeNumber) {
					kss += " "+volumeNumber;
				}
				var koboSeriesId = this.getKoboSeriesId();
				if (koboSeriesId && !volumeNumber) {
					return "https://www.kobo.com/es/en/search?query="+encodeURIComponent(kss)+"&fcsearchfield=Series&seriesId="+encodeURIComponent(koboSeriesId)+"&sort=PublicationDateDesc"
				} else {
					return "https://www.kobo.com/es/en/search?query="+encodeURIComponent(kss);
				}
			},
			getVolumes: function(){
				var volumesraw = this.get("volumes");
				if (volumesraw && volumesraw[0]==="[") {
					var _col = BookSeriesVolumeDO.COL(JSON.parse(volumesraw), this);
					_col = this._afterInstanceVolumes(_col);
					return _col;
				}
				var _col = [];
				var vols = volumesraw.split("\n");
				for (var i = 0; i < vols.length; i++) {
					var vol = vols[i].trim();
					if (!vol) { continue; }
					_col.push( BookSeriesVolumeDO.DO(vol, this) );
				}
				_col = BookSeriesVolumeDO.COL(_col);
				_col = this._afterInstanceVolumes(_col);
				return _col;
			},
			_afterInstanceVolumes: function(_col){
				_col.sort();
				for (var i = 0; i < _col.length; i++) {
					if (_col[i + 1]) {
						_col[i].setNextVolume(_col[i + 1]);
					}
					if (_col[i-1]) {
						_col[i].setPreviousVolume(_col[i-1]);
					}
				}
				return _col;
			},
			saveVolumesFromCOL: function(volumesCOL, dontSaveAndUpdate){
				volumesCOL.sortByProperty("colorder", true);
				var strings = [];
				for (var i = 0; i < volumesCOL.length; i++) {
					strings.push(volumesCOL[i].get());
				}
				var volumesString =  JSON.stringify(strings);
				this.setVolumes(volumesString);
				this.setLastupdate( Date.now() );
				this.onChange();
				if (!dontSaveAndUpdate && window.customMultiDataObjectEditor) {
					window.customMultiDataObjectEditor.saveAndUpdate();
				}
			},
			processVolumes: function(callback, dontSaveAndUpdate) {
				const volumesCOL = this.getVolumes();
				const newVolumesCOL = callback(volumesCOL);
				if (newVolumesCOL) {
					this.saveVolumesFromCOL(newVolumesCOL, dontSaveAndUpdate);
				}
				return !!newVolumesCOL;
			},

			getFirstUnownedVolume: function() {
				const volumesCOL = this.getVolumes();
				return volumesCOL.filter(x => {
					if (x.isTreatAsNotSequential()) {
						return false;
					}
					const st = x.getStatus();
					return (
						st !== BookSeriesVolumeDO.Enum.Status.Read &&
						st !== BookSeriesVolumeDO.Enum.Status.Backlog
					);
				})[0];
			},

			hasStatus: function(status) {
				const seriesStatus = this.getStatus();
				if (!Array.isArray(status)) {
					status = [status];
				}
				return (status.indexOf(seriesStatus) !== -1);
			},

			getIssue: function(options){

				options = options ? options : {};

				if (this.isIgnoreIssues()) {
					return null;
				}

				const seriesStatus = this.getStatus();
				const statusesToIgnore = [
					BookSeriesDO.Enum.Status.Drop,
					BookSeriesDO.Enum.Status.Consider,
					BookSeriesDO.Enum.Status.Unlicensed
				];

				if (this.hasStatus(statusesToIgnore)) {
					return null;
				}

				if (seriesStatus === BookSeriesDO.Enum.Status.Backlog && options.ignoreAllIssuesOnBacklog) {
					return null;
				}

				const firstUnowned = this.getFirstUnownedVolume();
				const firstUnownedStatus = firstUnowned ? firstUnowned.getStatus() : null;
				const isFinishedPublication = this.isFinishedPublication();

				if (firstUnownedStatus === BookSeriesVolumeDO.Enum.Status.TPB) {
					return BookSeriesIssue.AwaitingDigitalVersion;
				}

				if (firstUnownedStatus === BookSeriesVolumeDO.Enum.Status.StoreWait) {
					return BookSeriesIssue.AwaitingStoreAvailability;
				}

				if (
					firstUnownedStatus === BookSeriesVolumeDO.Enum.Status.Available
					&& seriesStatus !== BookSeriesDO.Enum.Status.Backlog
				) {
					const releaseDate = firstUnowned.getReleaseDateMoment();
					const now = moment();
					if (releaseDate.isAfter(now)) {
						if (seriesStatus === BookSeriesDO.Enum.Status.Announced && options.ignorePreorderAvailableForAnnounced) {
							return null;
						}
						return BookSeriesIssue.PreorderAvailable;
					} else {
						return BookSeriesIssue.VolumeAvailable;
					}
				}

				const graphData = this.getPublicationGraphData();
				if (this.isSourceVolumeOverdue(graphData)) {
					return BookSeriesIssue.SourceVolumeOverdue;
				}


				if (this.isLocalVolumeOverdue(graphData, 60*60*24*30)) {
					return BookSeriesIssue.LocalVolumeOverdue;
				}

				if (firstUnownedStatus === BookSeriesVolumeDO.Enum.Status.Source) {
					return BookSeriesIssue.WaitingForLocal;
				}

				if (!firstUnowned && !(isFinishedPublication || seriesStatus === BookSeriesDO.Enum.Status.Ended)) {
					return BookSeriesIssue.WaitingForSource;
				}
				/*
				BookSeriesIssue:
					AwaitingDigitalVersion = First unowned volume is TPB
					VolumeAvailable = First unowned volume is Available
										and series isn't Backlog
					WaitingForLocal = First unowned volume is Source
					WaitingForSource = All volumes owned and series isn't Ended
				*/

				return null;
			},

			isLocalVolumeOverdue: function(cachedPubGraphData, offsetSeconds){
				if (this.isFinishedPublication()) { return false; }
				const data = cachedPubGraphData ? cachedPubGraphData : this.getPublicationGraphData();
				return data.nexten
					? moment().add(offsetSeconds, 'seconds').isSameOrAfter(data.nexten, 'days')
					: null
					;
			},

			isSourceVolumeOverdue: function(cachedPubGraphData){
				if (this.isFinishedPublication()) { return false; }
				const data = cachedPubGraphData ? cachedPubGraphData : this.getPublicationGraphData();
				return data.nextjp ? moment().isSameOrAfter(data.nextjp, 'days') : null;
			},

			canScrapeForPubDates: function(){
				var volumesCOL = this.getVolumes();
				for (var i = 0; i < volumesCOL.length; i++) {
					if (volumesCOL[i].canScrapeForPubDates()) {
						return true;
					}
				}
				return false;
			},

			getPubDatesFromAsins: function(complete, autosave){
				complete = complete ? complete : function(){ console.log("COMPLETE"); };

				var volumesCOL = this.getVolumes();

				if (!volumesCOL.length) {
					complete();
					return;
				}

				console.log("---------");
				console.log("--- Starting scrape for", this.getName());
				console.log("--- ("+volumesCOL.length,"volumes)");
				console.log("---------");

				volumesCOL.sortByProperty("colorder");
				var vq = async.queue(function(volumeDO, volumeComplete){
					volumeDO.getPubDatesFromAsins(function(error, results){

						var params = ["Vol.", volumeDO.getCollectionOrderLabel()];

						params.push("JP");
						if (results.jp.error) {
							params.push("ERROR", results.jp.error);
						} else if (results.jp.newvalue) {
							params.push("OK", results.jp.newvalue);
						} else {
							params.push("SKIPPED");
						}

						params.push("EN");
						if (results.en.error) {
							params.push("ERROR", results.en.error);
						} else if (results.en.newvalue) {
							params.push("OK", results.en.newvalue);
						} else {
							params.push("SKIPPED");
						}

						params.push("KOBO");
						if (results.kobo.error) {
							params.push("ERROR", results.kobo.error);
						} else if (results.kobo.data) {
							params.push("OK");
						} else {
							params.push("SKIPPED");
						}

						console.log.apply(console, params);

						volumeComplete();
					}.bind(this));
				}.bind(this), 1);
				vq.drain = function(){
					this.saveVolumesFromCOL(volumesCOL, !autosave);
					complete();
				}.bind(this)
				volumesCOL.forEach(function(volumeDO){
					vq.push(volumeDO);
				});
			},
			getSourcePubDatesFromAsin: function(complete, autosave){
				complete = complete ? complete : function(){ console.log("COMPLETE"); };

				var volumesCOL = this.getVolumes();

				if (!volumesCOL.length) {
					complete();
					return;
				}

				console.log("---------");
				console.log("--- Starting scrape for", this.getName());
				console.log("--- ("+volumesCOL.length,"volumes)");
				console.log("---------");

				volumesCOL.sortByProperty("colorder");
				var vq = async.queue(function(volumeDO, volumeComplete){
					volumeDO.getSourcePubDateFromAsin(function(error, newvalue){
						if (error) {
							console.log("Vol.", volumeDO.getCollectionOrderLabel(), "ERROR", error);
						} else if (newvalue) {
							console.log("Vol.", volumeDO.getCollectionOrderLabel(), "OK", newvalue);
						} else {
							console.log("Vol.", volumeDO.getCollectionOrderLabel(), "SKIPPED");
						}
						volumeComplete();
					}.bind(this));
				}.bind(this), 1);
				vq.drain = function(){
					this.saveVolumesFromCOL(volumesCOL, !autosave);
					complete();
				}.bind(this)
				volumesCOL.forEach(function(volumeDO){
					vq.push(volumeDO);
				});
			},

			parseNotesDate: function(){
				var notes = this.getNotes();
				if (!notes) { return null; }
				var r = notes.match(/^([\d]+\/[\d]+\/[\d]+)(\s|$)/);
				if (!r) { return null; }
				return moment(r[1], "YYYY/MM/DD");
			},

			getPublicationGraphData: function(){

				var jp = [], en = [], jpdate = [], endate = [];
				var volumesCOL = this.getVolumes();
				volumesCOL.sortByProperty("colorder");

				var leadtimes = [];

				for (var i = 0; i < volumesCOL.length; i++) {
					var volumeDO = volumesCOL[i],
						colorder = volumeDO.getColorder(),
						releasejp = volumeDO.getReleaseDateSourceMoment(),
						releaseen = volumeDO.getReleaseDateMoment()
						;

					/*
					if (releasejp) {
						console.log(this.getName(), colorder, volumeDO.getReleaseDateSource(), releasejp.format("DD/MMM/YYYY"));
					}
					*/

					if (releasejp) {
						jp.push([ releasejp.unix()*1000, colorder, volumeDO.getCollectionOrderLabel() ]);
						jpdate.push(releasejp);
					}
					if (releaseen) {
						en.push([ releaseen.unix()*1000, colorder, volumeDO.getCollectionOrderLabel() ]);
						endate.push(releaseen);
					}

					if (releaseen && releasejp) {
						leadtimes.push( releaseen.diff(releasejp, 'seconds') );
					}
				}


				const now = moment();
				const isFinished = this.isFinishedPublication();
				let nextjp;
				let nexten;
				let maxjp;
				let maxen;

				try {

					if (!isFinished) {

						nextjp = nextOcurrenceInListWeighted(jpdate);
						maxjp = jp.reduce((a,v) => (a>v[1] ? a : v[1]), 0);

						try {
							nexten = nextOcurrenceInListWeighted(endate);
							maxen = en.reduce((a,v) => (a>v[1] ? a : v[1]), 0);
						} catch(e) {
							maxen = 0;
						}

						if (nextjp && nextjp.isBefore(now)) { nextjp = now; }
						if (nexten && nexten.isBefore(now)) { nexten = now; }

						//Don't allow predict if predicted date doesn't account for weighted mean loc time (max 6 months)
						if (nexten && nextjp && leadtimes.length) {
							const targetjp = maxen+1;
							let _item;
							if (maxjp === maxen) {
								_item = moment(nextjp);
							} else {
								const item = jp.filter(x => x[1] == targetjp)[0];
								if (item) {
									_item = moment.unix(item[0] / 1000);
								}
							}
							if (_item){
								//let lead = indexWeightedMean(leadtimes);
								//let lead = leadtimes[leadtimes.length-1];
								const lead = leadtimes.reduce((a,v) => (a<v ? a : v), Infinity);

								/*
								const sixmonths = 60*60*24*(365/12)*12;
								if (lead > sixmonths) {
									lead = sixmonths;
								}
								*/

								const nexten_withlead = _item.add(lead, "seconds");
								if (nexten.isBefore(nexten_withlead)) {
									nexten = nexten_withlead;
								}
							}
						}
						
					}

				} catch (e) {
					//pass
					console.warn(e);
				}

				// console.log("JP:", jpdate.map(x=>x.format("DD/MMM/YYYY")), 'NEXT', nextjp ? nextjp.format("DD/MMM/YYYY") : null);
				// console.log("EN:", endate.map(x=>x.format("DD/MMM/YYYY")), 'NEXT', nexten ? nexten.format("DD/MMM/YYYY") : null);

				return {
					jp: jp,
					en: en,
					jpdate: jpdate,
					endate: endate,
					nextjp: nextjp,
					nexten: nexten,
					maxjp: maxjp,
					maxen: maxen,
					leadtimes: leadtimes,
					COL: volumesCOL
				};
			},


			canShowPublicationGraph: function(){

				const volumesCOL = this.getVolumes();

				for (let i = 0; i < volumesCOL.length; i++) {
					if (volumesCOL[i].getReleaseDateSource() || volumesCOL[i].getReleaseDate()) {
						return true;
					}
				}

				return false;
			},


			showPublicationGraph: function(){
				var data = this.getPublicationGraphData();

				var $form = jQuery('<div class="pubgraphPopup">');

				$form.appendR("<h3>").text(this.getName()).appendR("<em>").text(this.labelOfPublisher());

				$form.appendR('<div id="pubgraphContainer">');


				if (data.en.length > 1 || data.jp.length > 1) {

					var $p = $form.appendR('<p>').appendR("<span>").text("Publish rate -- Average: ").back();

					if (data.en.length > 1) {
						var items = data.en.map(function(x){ return x[0]; }),
							dists = items.slice(1).map((v, i) => v - items[i]),
							sum = dists.reduce(function(a, b) { return a + b; })
							avg = (sum / dists.length) / (30*24*60*60*1000)
							;
						var unit = "months";
	    				if (avg > 12) {
	    					avg /= 12;
	    					unit = "years";
	    				}
						avg = Math.floor(avg*10)/10;

						$p.appendR("<span>").text("EN ").back()
							.appendR("<strong>").text(avg+" "+unit).back()
							.appendR("<span>").text(" ")
							;
					}

					if (data.jp.length > 1) {
						var items = data.jp.map(function(x){ return x[0]; }),
							dists = items.slice(1).map((v, i) => v - items[i]),
							sum = dists.reduce(function(a, b) { return a + b; })
							avg = sum / dists.length / (30*24*60*60*1000)
							;
						var unit = "months";
	    				if (avg > 12) {
	    					avg /= 12;
	    					unit = "years";
	    				}
						avg = Math.floor(avg*10)/10;

						$p.appendR("<span>").text("JP ").back()
							.appendR("<strong>").text(avg+" "+unit).back()
							;
					}

					$p.appendR("<span>").text(" Weighted: ").back();

					if (data.en.length > 1) {
						var items = data.en.map(function(x){ return x[0]; }),
							dists = items.slice(1).map((v, i) => v - items[i]),
							avg = indexWeightedMean(dists) / (30*24*60*60*1000)
							;
						var unit = "months";
	    				if (avg > 12) {
	    					avg /= 12;
	    					unit = "years";
	    				}
						avg = Math.floor(avg*10)/10;

						$p.appendR("<span>").text("EN ").back()
							.appendR("<strong>").text(avg+" "+unit).back()
							.appendR("<span>").text(" ")
							;
					}

					if (data.jp.length > 1) {
						var items = data.jp.map(function(x){ return x[0]; }),
							dists = items.slice(1).map((v, i) => v - items[i]),
							avg = indexWeightedMean(dists) / (30*24*60*60*1000)
							;
						var unit = "months";
	    				if (avg > 12) {
	    					avg /= 12;
	    					unit = "years";
	    				}
						avg = Math.floor(avg*10)/10;

						$p.appendR("<span>").text("JP ").back()
							.appendR("<strong>").text(avg+" "+unit).back()
							;
					}

				}

				if (data.leadtimes.length) {

    				var avg = mean(data.leadtimes) / (30*24*60*60);
    				var unit = "months";
    				if (avg > 12) {
    					avg /= 12;
    					unit = "years";
    				}
    				avg = Math.floor(avg*10)/10;

    				var wavg = indexWeightedMean(data.leadtimes) / (30*24*60*60);
    				var wunit = "months";
    				if (wavg > 12) {
    					wavg /= 12;
    					wunit = "years";
    				}
    				wavg = Math.floor(wavg*10)/10;

    				var min = lowestArrayValue(data.leadtimes) / (30*24*60*60);
    				var minunit = "months";
    				if (min > 12) {
    					min /= 12;
    					minunit = "years";
    				}
    				min = Math.floor(min*10)/10;
    				var max = highestArrayValue(data.leadtimes) / (30*24*60*60);
    				var maxunit = "months";
    				if (max > 12) {
    					max /= 12;
    					maxunit = "years";
    				}
    				max = Math.floor(max*10)/10;


					$form.appendR('<p>')
						.appendR("<span>").text("Loc time -- Average: ").back()
						.appendR("<strong>").text(avg+" "+unit).back()
						.appendR("<span>").text(" Weighted: ").back()
						.appendR("<strong>").text(wavg+" "+wunit).back()
						.appendR("<span>").text(" Min: ").back()
						.appendR("<strong>").text(min+" "+minunit).back()
						.appendR("<span>").text(" Max: ").back()
						.appendR("<strong>").text(max+" "+maxunit).back()
						//.appendR("<em>").text(" (%s data points)".replace("%s", data.leadtimes.length))
						;
				}


				window.customMultiDataObjectEditor._editor.showArbitraryForm($form);

				drawPubGraph("pubgraphContainer", data, this.isFinishedPublication());
			},

			/*
			saveVolumesFromCOL: function(volumesCOL){
				volumesCOL.sortByProperty("colorder", true);
				var strings = [];
				for (var i = 0; i < volumesCOL.length; i++) {
					strings.push(volumesCOL[i].toString());
				}
				var volumesString =  strings.join("\n");
				this.setVolumes(volumesString);
				this.setLastupdate( Date.now() );
				this.onChange();
				window.customMultiDataObjectEditor.saveAndUpdate();
			},
			*/
			onChange: function(){
				var read, owned, preordered, available;

				const seriesStatus = this.getStatus();
				const stickyStatuses = [ //Statuses that won't change automatically
					BookSeriesDO.Enum.Status.Ended,
					BookSeriesDO.Enum.Status.Drop,
					BookSeriesDO.Enum.Status.Consider,
					BookSeriesDO.Enum.Status.Stall,
					BookSeriesDO.Enum.Status.Announced,
					BookSeriesDO.Enum.Status.Unlicensed,
					BookSeriesDO.Enum.Status.Prepub,
				];
				const isStatusSticky = (stickyStatuses.indexOf(seriesStatus) !== -1);

				var volumesCOL = this.getVolumes();
				if (volumesCOL.length > 0) {
					read = 0; owned = 0; preordered = 0; available = 0;
					var earliestPreorder = null;
					var earliestPreorderIsTPB = false;
					var earliestPreorderIsSource = false;
					var earliestPreorderIsSW = false;
					for (var i = 0; i < volumesCOL.length; i++) {
						var volumeDO = volumesCOL[i];

						var status = volumeDO.getStatus();

						switch (status) {
							case BookSeriesVolumeDO.Enum.Status.Read:
								available += 1;
								owned += 1;
								read += 1;
								break;
							case BookSeriesVolumeDO.Enum.Status.Backlog:
								available += 1;
								owned += 1;
								break;
							case BookSeriesVolumeDO.Enum.Status.Preorder:
								preordered += 1;
								// NO BREAK
							case BookSeriesVolumeDO.Enum.Status.Available:
								available += 1;
								// NO BREAK
							case BookSeriesVolumeDO.Enum.Status.StoreWait:
							case BookSeriesVolumeDO.Enum.Status.TPB:
							case BookSeriesVolumeDO.Enum.Status.Source:
								
								var _release = volumeDO.getBestReleaseDateMoment();

								if (!_release.isValid()) {
									break;
								}
								
								var currentIsTPB = (status===BookSeriesVolumeDO.Enum.Status.TPB),
									currentIsSource = (status===BookSeriesVolumeDO.Enum.Status.Source),
									currentIsSW = (status===BookSeriesVolumeDO.Enum.Status.StoreWait),
									currentIsEarlier = _release.isBefore(earliestPreorder)
									;

								if (
									// We have none saved yet
									!earliestPreorder
									// Or we do have one but the current one is earlier and we're not overwriting
									//   something that's not source with a source
									|| (currentIsEarlier && !(currentIsSource && !earliestPreorderIsSource))
									// Or the current one is not earlier but the one we have is a source and this isn't
									|| (earliestPreorderIsSource && !currentIsSource)
									) {
									earliestPreorder = _release;
									earliestPreorderIsTPB = currentIsTPB;
									earliestPreorderIsSource = currentIsSource;
									earliestPreorderIsSW = currentIsSW;
								}

								break;
							case BookSeriesVolumeDO.Enum.Status.None:
							default: break;
						}
					}
					this.setOwned(owned); this.setRead(read); this.setPrecount(preordered);

					if (earliestPreorder) {
						var text = earliestPreorder.format("YYYY/MM/DD");
						if (earliestPreorderIsTPB) {
							text += " TPB";
						} else if (earliestPreorderIsSW) {
							text += " SW";
						} else if (earliestPreorderIsSource) {
							text = "JP "+text;
						}
						this.setNotes(text);
					} else {
						this.setNotes("");
					}

				} else {
					read = this.getRead(); read = isNaN(read) ? 0 : read;
					owned = this.getOwned(); owned = isNaN(owned) ? 0 : owned;
					preordered = this.getPrecount(); preordered = isNaN(preordered) ? 0 : preordered;
					this.setNotes("");
				}
				
				if (seriesStatus === BookSeriesDO.Enum.Status.Stall) {
					this.setNotes("STALL");
				}
				if (seriesStatus === BookSeriesDO.Enum.Status.Unlicensed) {
					this.setNotes("UNLICENSED");
				}

				if (this.getForcednotes()) {
					this.setNotes(this.getForcednotes()+" (!)");
				}

				//Automatically set new status for valid (non-sticky) statuses
				if (!isStatusSticky) {
					if (read < owned) {
						this.setStatus( BookSeriesDO.Enum.Status.Backlog );
					} else if (available === owned + preordered) {
						this.setStatus( BookSeriesDO.Enum.Status["✔"] );
					} else {
						this.setStatus( BookSeriesDO.Enum.Status.Avail );
					}
				}

				//Set preorder bool
				this.setPreorder( !!(preordered>0) );
			}
		},

		extraStatic: {
			primaryKey: "id",


			getStats: function(seriesCOL){
				var stats = {
					series: { total: 0, active: 0, uptodate: 0, backlog: 0, preorder: 0 },
					volumes: { owned: 0, read: 0, backlog: 0, preorder: 0 }
				};

				for (var i = 0; i < seriesCOL.length; i++) {
					var seriesDO = seriesCOL[i];
					stats.series.total += 1;
					if (seriesDO.isPreorder()) { stats.series.preorder += 1; }
					switch(seriesDO.getStatus()) {
						case BookSeriesDO.Enum.Status["✔"]:
							stats.series.active += 1;
							stats.series.uptodate += 1; break;
						case BookSeriesDO.Enum.Status.Backlog:
							stats.series.active += 1;
							stats.series.backlog += 1; break;
						default: break;
					}
					var volumesCOL = seriesDO.getVolumes();
					for (var j = 0; j < volumesCOL.length; j++) {
						switch(volumesCOL[j].getStatus()) {
							default: break;
							case BookSeriesVolumeDO.Enum.Status.Read:
								stats.volumes.owned += 1;
								stats.volumes.read += 1; break;
							case BookSeriesVolumeDO.Enum.Status.Backlog:
								stats.volumes.owned += 1;
								stats.volumes.backlog += 1; break;
							case BookSeriesVolumeDO.Enum.Status.Preorder:
								stats.volumes.preorder += 1; break;
						}
					}
				}

				return stats;
			}
		}
	});









	window.bookSeriesVolumeExpandedController = Object.extends({
		_expanded: {},
		isExpanded: function(id){
			if (id instanceof BookSeriesDO) { id = id.pkGet(); }
			return !!this._expanded[id];
		},
		setExpanded: function(id, expanded){
			if (id instanceof BookSeriesDO) { id = id.pkGet(); }
			this._expanded[id] = !!expanded;
		},
		getItemById: function(id){
			if (id instanceof BookSeriesDO) { id = id.pkGet(); }
			return jQuery('.dataObjectItem.volumesRow[data-id="'+id+'"]');
		},
		isItemExpanded: function(id){
			if (id instanceof BookSeriesDO) { id = id.pkGet(); }
			return this.getItemById(id).is(":visible");
		},
		expand: function(seriesDO, expanded){
			expanded = ((typeof expanded !== "undefined") ? !!expanded : true);
			var $item = this.getItemById(seriesDO);
			if (expanded) {
				this.render(seriesDO, $item);
				$item.show();
			} else {
				$item.hide();
			}
			this.setExpanded(seriesDO.pkGet(), !!expanded);
		},
		isRendered: function(seriesDO, $volRow){
			$volRow = $volRow ? $volRow : this.getItemById(seriesDO);
			return $volRow.hasClass("rendered-volumes");
		},
		setRendered: function(seriesDO, $volRow){
			$volRow = $volRow ? $volRow : this.getItemById(seriesDO);
			$volRow.toggleClass("rendered-volumes", true);
		},
		render: function(seriesDO, $volRow){
			$volRow = $volRow ? $volRow : this.getItemById(seriesDO);
			if (this.isRendered(seriesDO, $volRow)) { return; }

			var volumeCOL = seriesDO.getVolumes();
			var $row = $volRow.parent().find('.dataObjectItem.infoRow[data-id="'+seriesDO.pkGet()+'"]');
			var $volumes = $volRow.appendR('<td>').attr('colspan', $row.find('td').length);
			volumeCOL.sortByProperty("colorder");
			var anyNotes = false;
			var firstVolumeNotOwned = null;
			for (var i = 0; i < volumeCOL.length; i++) {
				anyNotes = anyNotes || volumeCOL[i].hasNotes();

				volumeCOL[i].render({
					renderNotes: !!anyNotes
				}).appendTo($volumes);

				var status = volumeCOL[i].getStatus();
				if (!firstVolumeNotOwned && (
					status !== BookSeriesVolumeDO.Enum.Status.Read
					&& status !== BookSeriesVolumeDO.Enum.Status.Backlog
					)) {
					firstVolumeNotOwned = volumeCOL[i];
				}
			}
			if (firstVolumeNotOwned && firstVolumeNotOwned.getStatus() === BookSeriesVolumeDO.Enum.Status.Source) {
				$row.add($volRow).addClass("nextNotOwnedVolumeIsSource");
			}
			if (seriesDO.isFinishedPublication()) {
				$volumes.appendR('<span class="seriesend">');
			}

			this.setRendered(seriesDO, $volRow);
		},
		toggleExpand: function(seriesDO){
			this.expand(seriesDO, !this.isItemExpanded(seriesDO));
		},
	},{
		name: "BookSeriesVolumeExpandedController",
		instance: true
	});

	function toggleVolumesRow(seriesDO){
		window.bookSeriesVolumeExpandedController.toggleExpand(seriesDO);
	}






	if (window.customMultiDataObjectEditor) {
		customMultiDataObjectEditor.registerDataObject(BookSeriesDO, {


			_defaultRender: window.DataObjectCollectionEditor.prototype.render,
			_tileRenderUpcoming: function(){

				var $container = jQuery('<div class="bookSeriesTiles">');

				var BSEnumStatus = BookSeriesDO.Enum.Status;
				var BSVEnumStatus = BookSeriesVolumeDO.Enum.Status;

				var volumesCOL = [];
				this._COL.forEach(function(bookSeriesDO){

					var status = bookSeriesDO.getStatus();
					if ([BSEnumStatus.Drop].includes(status)) {
						return;
					}

					Array.prototype.push.apply(volumesCOL,bookSeriesDO.getVolumes());
				});
				volumesCOL = BookSeriesVolumeDO.COL(volumesCOL);

				
				var _now = moment().subtract(3, "days");

				var months = {}, monthKeys = [];
				volumesCOL.forEach(function(volumeDO){
					var _d = volumeDO.getBestReleaseDateMoment();
					if (!_d || !_d.isValid() || _d.isBefore(_now)) {
						return;
					}
					var status = volumeDO.getStatus();

					if ([BSVEnumStatus.Read, BSVEnumStatus.Backlog, BSVEnumStatus.Source].includes(status)) {
						return;
					}

					var monthkey = _d.endOf('isoweek').format("YYYY-WW");
					if (!months[monthkey]) {
						months[monthkey] = {
							volumes: [],
							date: _d,
							month: parseInt(_d.format("MM")),
							weekNumber: parseInt(_d.format("W")),
							weekStart: _d.startOf('isoweek').format("DD/MMM"),
							weekEnd: _d.endOf('isoweek').format("DD/MMM"),
							monthName: _d.format("MMMM"),
							year: parseInt(_d.format("YYYY")),
						};
						monthKeys.push(monthkey);
					}
					months[monthkey].volumes.push(volumeDO);
				});

				monthKeys.sort();

				let _monthPrev = null;

				jQuery.each(monthKeys, function(i, monthkey){
					var _month = months[monthkey];
					var volumesCOL = BookSeriesVolumeDO.COL(_month.volumes);
					BookSeriesVolumeDO.sortByReleaseDate(volumesCOL);

					if (_monthPrev) {
						const weekNumber = _month.weekNumber;
						let prevWeekNumber = _monthPrev.weekNumber
						if (_monthPrev.year < _month.year) {
							prevWeekNumber = -1 * (_monthPrev.date.weeksInYear() - prevWeekNumber);
						}
						const weekdiff = weekNumber - prevWeekNumber - 1;
						if (weekdiff > 0) {
							const $weekgap = $container.appendR('<div class="bookSeriesTilesMonthGap">');
							$weekgap.text(
								"("
								+((weekdiff === 1) ? "1 week" : weekdiff + " weeks")
								+" in between)"
							);
						}
					}

					var $month = $container.appendR('<div class="bookSeriesTilesMonth">');

					$month.appendR('<h3>').text(_month.weekStart + " -  " + _month.weekEnd + " " + _month.year + " (Week "+_month.weekNumber+")");
					var $tiles = $month.appendR('<ul class="monthTiles">');

					volumesCOL.forEach(function(volumeDO){
						$tiles.appendR(volumeDO.renderTile({
							weekday: true
						}));
					});

					_monthPrev = _month;

				});


				this.$container.empty().append($container);
			},


			_tileRenderBacklog: function(){

				var $container = jQuery('<div class="bookSeriesTiles">');

				var BSEnumStatus = BookSeriesDO.Enum.Status;
				var BSVEnumStatus = BookSeriesVolumeDO.Enum.Status;

				var volumesCOL = [];
				this._COL.forEach(function(bookSeriesDO){

					var status = bookSeriesDO.getStatus();
					if (![BSEnumStatus.Backlog].includes(status)) {
						return;
					}

					var seriesVolumesCOL = bookSeriesDO.getVolumes();

					seriesVolumesCOL.forEach(function(volumeDO){
						if (!volumeDO.hasReleaseDate()) {
							return;
						}
						var volstatus = volumeDO.getStatus();
						if (![BSVEnumStatus.Backlog].includes(volstatus)) {
							return;
						}
						volumesCOL.push(volumeDO);
					});

				});
				volumesCOL = BookSeriesVolumeDO.COL(volumesCOL);
				
				BookSeriesVolumeDO.sortByReleaseDate(volumesCOL, true);

				var $backlog = $container.appendR('<div class="bookSeriesTilesBacklog">');
				$backlog.appendR('<h3>').text("Volumes in backlog");
				$backlog.appendR('<small>').text("Most recent first, only volumes with a release date registered");
				var $tiles = $backlog.appendR('<ul class="tiles">');
				
				volumesCOL.forEach(function(volumeDO){
					$tiles.appendR(volumeDO.renderTile({
						releaseDateLong: true
					}));
				});


				this.$container.empty().append($container);
			},


			render: function(){
				var renderMode = this.getExtraValueByKey("rendermode");
				renderMode = renderMode ? renderMode : "table";

				switch(renderMode) {
					default:
					case "tiles":
						this._defaultRender();
						break;
					case "volumetiles_upcoming":
						this._tileRenderUpcoming();
						break;
					case "volumetiles_backlog":
						this._tileRenderBacklog();
						break;
				}

				var $topRow = this.$container.prependR('<div id="topRow">');

				var $rendermode = $topRow.appendR('<span class="form-inline">')
					.append('<strong>Render:</strong>&nbsp;')
					.appendR('<select>')
						.append('<option value="table">Table</option>')
						.append('<option value="volumetiles_upcoming">Upcoming volumes</option>')
						.append('<option value="volumetiles_backlog">Latest backlog</option>')
					.val(renderMode)
					.on('change', function(){
						this.setExtraValue("rendermode", $rendermode.val());
						window.customMultiDataObjectEditor.updateBrowserUri();
						this.render();
					}.bind(this))
					;

				$topRow.appendR('<a class="btn">')
					.attr("href", "./tools/bookcheck/")
					.attr("target", "_blank")
					.text("BookCheck")
					;
				$topRow.appendR('<a class="btn">')
					.attr("href", "./tools/bookstats/")
					.attr("target", "_blank")
					.text("Stats")
					;
			},

			_afterRender: function(){

				//Future separator
				setTimeout(function(){
					if (this._COLsort === "notes" && !this._reverseSort) {
						var now = moment();

						for (var i = 0; i < this._COL.length; i++) {
							var do_inst = this._COL[i];
							var $row = this.$container.find('.dataObjectItem.infoRow[data-id="'+do_inst.pkGet()+'"]');
							if (!$row.is(":visible")) { continue; }
							var date = do_inst.parseNotesDate();
							if (!date) { continue; }
							if (date.isAfter(now)) {
								$row.addClass("futureSeparator");
								break;
							}
						}
					}
				}.bind(this), 200)





				var stats = BookSeriesDO.getStats(this._COL);

				var $progress = this.$container.appendR('<div class="progress">');
				var total = stats.volumes.owned + stats.volumes.preorder;
				$progress.appendR('<div class="bar bar-info">')
					.text(stats.volumes.read)
					.css("width",(100*stats.volumes.read/total)+"%")
					;
				$progress.appendR('<div class="bar bar-warning">')
					.text(stats.volumes.backlog)
					.css("width",(100*stats.volumes.backlog/total)+"%")
					;
				$progress.appendR('<div class="bar bar-success">')
					.text(stats.volumes.preorder)
					.css("width",(100*stats.volumes.preorder/total)+"%")
					;


				this.$container.appendR('<p>').html(
					"<strong>%pre%</strong> series with active preorders, <strong>%backlog%</strong> backlogged, <strong>%utd%</strong> up to date."
						.replace( "%pre%", stats.series.preorder )
						.replace( "%backlog%", stats.series.backlog )
						.replace( "%utd%", stats.series.uptodate )
				);
			},

			_editLabelHtml: '<i class="icon-edit icon-white"></i>',

			_renderOptions: {
				afterRenderRow: function($row, $tbody){
					var volumeCOL = this.getVolumes();
					
					if (volumeCOL.length > 0) {

						var $volRow = $row.clone().empty().appendTo($tbody).addClass("volumesRow").hide();
						$row.addClass("infoRow");
						

						if (window.bookSeriesVolumeExpandedController.isExpanded(this)) {
							window.bookSeriesVolumeExpandedController.expand(this);
						}


						$row.find('td[data-typename="name"]').on('click', function(e){
							toggleVolumesRow(this);
						}.bind(this));

					}

				},
				typeoptions: {
					name: {
						/*
						transform: function($container, name, value, options) {
							var $val = $container.find(".value").empty();
							
							$val.appendR('<span class="title">').text(value);

							var $volumes = $val.appendR('<span class="volumes">');
							var volumeCOL = this.getVolumes();
							volumeCOL.sortByProperty("colorder");
							volumeCOL = volumeCOL.slice(-5);
							for (var i = 0; i < volumeCOL.length; i++) {
								volumeCOL[i].render().appendTo($volumes);
							}
						}
						*/
					},
					publisher: {
						transform: function($container, name, value, options) {
							if (!value) { return; }
							var bookPublisherDO = bookPublisherCOL.get(value);
							if (!bookPublisherDO) { return; }
							var link = bookPublisherDO.getLink();
							if (!link) { return; }
							$container.find(".value").empty().append(
								jQuery('<a target="_blank" class="publisherLink">')
									.attr("href", link)
									.text(value)
							);
						}
					},
					preorder: { label: "Pre", },
					owned: {
						label: "Vol",
						transform: function($container, name, value, options){
							var $v = $container.find(".value").empty();


							var read = this.getRead(); read = isNaN(read) ? 0 : read;
							var owned = this.getOwned(); owned = isNaN(owned) ? 0 : owned;
							var preordered = this.getPrecount(); preordered = isNaN(preordered) ? 0 : preordered;
							var publishedVolumes = this.getPublishedVolumes(); publishedVolumes = isNaN(publishedVolumes) ? null : publishedVolumes;

							
							var text = "";
							if (read < owned) {
								text += "<em>"+read+" / </em>"+owned;
							} else {
								text += owned;
							}
							if (preordered>0) {
								text += "<strong> +"+preordered+"</strong>";
							}
							if (publishedVolumes) {
								text += "<em> / "+publishedVolumes;
								if (!this.isFinishedPublication()) {
									text += "+";
								}
								text += "</em>";
							}

							$v.appendR('<span class="volumes">').html(text);
						}
					},
					notes: {
						transform: function($container, name, value, options){
							var $v = $container.find(".value").empty();
							$v.appendR('<span class="note">').text(value);

							var $ddm = $v.appendR('<div class="btn-group"><button class="btn btn-mini btn-link dropdown-toggle" data-toggle="dropdown"><span class="caret"></span></button><ul class="dropdown-menu pull-right"></ul></div>').find(".dropdown-menu");

							var _addSeparatorNext = false;
							var addOption = function(){
								if (_addSeparatorNext) {
									actuallyAddSeparator();
									_addSeparatorNext = false;
								}
								return $ddm.appendR('<li>').appendR('<a>');
							}
							var addSeparator = function(){ _addSeparatorNext = true; }
							var actuallyAddSeparator = function(){ return $ddm.appendR('<li>').addClass('divider'); }
							var changeCb = function(cb){
								return function(e){
									if (e) { e.preventDefault(); e.stopPropagation(); }
									var result = cb(e);
									if (result === false) { return; }
									this.setLastupdate( Date.now() );
									this.onChange();
									window.customMultiDataObjectEditor.saveAndUpdate();
								}.bind(this);
							}.bind(this);



							var read = this.getRead(); read = isNaN(read) ? 0 : read;
							var owned = this.getOwned(); owned = isNaN(owned) ? 0 : owned;
							var preordered = this.getPrecount(); preordered = isNaN(preordered) ? 0 : preordered;
							var publishedVolumes = this.getPublishedVolumes(); publishedVolumes = isNaN(publishedVolumes) ? 0 : publishedVolumes;
							


							addOption().html('<i class="icon-plus"></i> Add volume item').click(changeCb(function(e){
								BookSeriesVolumeDO.throwCreateForm(this);
							}.bind(this)));


							addSeparator();

							if (this.canShowPublicationGraph()) {
								addOption().html('<i class="icon-signal"></i> Publication graph').click(function(e){
									this.showPublicationGraph();
								}.bind(this));
							}

							if (this.canScrapeForPubDates()) {
								addOption().html('<i class="icon-search"></i> Scrape info').click(function(e){
									this.getPubDatesFromAsins(function(){
										alert("Complete");
									}, true);
								}.bind(this));
							}

							addSeparator();

							if (this.getLink()) {
								addOption().html('<i class="icon-share"></i> Link').attr({
									href: this.getLink(),
									target: "_blank"
								});
							}
							if (this.getKindleSearchLink()) {
								addOption().html('<i class="icon-shopping-cart"></i> Search on Amazon').attr({
									href: this.getKindleSearchLink(),
									target: "_blank"
								});
							}
							if (this.getKindleSearchLinkSource()) {
								addOption().html('<i class="icon-shopping-cart"></i> Search on Amazon JP').attr({
									href: this.getKindleSearchLinkSource(),
									target: "_blank"
								});
							}


							addSeparator();
							addOption().html('<i class="icon-pencil"></i> Edit notes').click(changeCb(function(e){
								var notes = this.getForcednotes();
								var newnotes = prompt("Edit notes", notes);
								if (notes === newnotes || newnotes === null) {
									return false;
								}
								this.setForcednotes(newnotes);
							}.bind(this)));
							addOption().html('<i class="icon-pencil"></i> Edit link').click(changeCb(function(e){
								var link = this.getLink();
								var newlink = prompt("Edit link", link);
								if (link === newlink || newlink === null) {
									return false;
								}
								this.setLink(newlink);
							}.bind(this)));

							addSeparator();

							if (this.getStatus() !== BookSeriesDO.Enum.Status.Stall) {
								addOption().html('<i class="icon-exclamation-sign"></i> Set stalled').click(changeCb(function (e) {
									this.setStatus(BookSeriesDO.Enum.Status.Stall);
								}.bind(this)));
							} else {
								addOption().html('<i class="icon-leaf"></i> Unset stalled').click(changeCb(function (e) {
									this.setStatus(BookSeriesDO.Enum.Status.Backlog);
									this.setNotes("");
								}.bind(this)));
							}

							if (this.getStatus() !== BookSeriesDO.Enum.Status.Unlicensed) {
								addOption().html('<i class="icon-exclamation-sign"></i> Set unlicensed').click(changeCb(function (e) {
									this.setStatus(BookSeriesDO.Enum.Status.Unlicensed);
								}.bind(this)));
							} else {
								addOption().html('<i class="icon-leaf"></i> Unset unlicensed').click(changeCb(function (e) {
									this.setStatus(BookSeriesDO.Enum.Status.Announced);
									this.setNotes("");
								}.bind(this)));
							}

							addOption().html('<i class="icon-refresh"></i> Force update').click(changeCb(function(e){
							}.bind(this)));
						}
					},
					lastupdate: {
						label: "upd",
						transform: function($container, name, value, options){
							var $v = $container.find(".value").empty();
							if (value && !isNaN(parseInt(value))) {

								var diff = Date.now() - value, diffclass = "";
								if (diff > 1000*60*60*24*30*2) {
									diffclass = "long";
								} else if (diff > 1000*60*60*24*7*2) {
									diffclass = "mid"
								} else {
									diffclass = "short";
								}
								
								$v.append(
									jQuery('<span class="checkedAgo ago_'+diffclass+'">').text( timeSinceShort(parseInt(value)) )
								);
							}
						}
					},
					lastcheck: {
						label: "chk",
						transform: function($container, name, value, options){
							var $v = $container.find(".value").empty();
							if (value && !isNaN(parseInt(value))) {

								var diff = Date.now() - value, diffclass = "";
								if (diff > 1000*60*60*24*30*2) {
									diffclass = "long";
								} else if (diff > 1000*60*60*24*7*2) {
									diffclass = "mid"
								} else {
									diffclass = "short";
								}

								$v.append(
									jQuery('<span class="checkedAgo ago_'+diffclass+'">').text( timeSinceShort(parseInt(value)) )
								);
							}
							$v.append(
								jQuery('<button class="btn btn-mini btn-success updateChecked">')
									.click(function(e){
										e.preventDefault(); e.stopPropagation();
										this.setLastcheck( Date.now() );
										window.customMultiDataObjectEditor.saveAndUpdate();
									}.bind(this))
									.html('<i class="icon-check icon-white"></i>')
							);
						}
					},
					link: {
						label: " ",
						transform: function($container, name, value, options) {
							value = this.getSeriesLink();
							if (!value) { return; }
							$container.find(".value").empty().append(
								jQuery('<a target="_blank" class="btn btn-mini btn-inverse">')
									.attr("href", value)
									.html('<i class="icon-shopping-cart icon-white"></i>')
							);
						}
					},
				},
				hideFields: [
					"id", "lang", "read", "precount",
					"lastcheck", "lastupdate",
					"publishedVolumes", "finishedPublication", "volumes", "forcednotes", "morenotes",
					"link", "kindleSearchString", "kindleSearchStringSource", "ignoreIssues",
					"koboSeriesId",
				]
			},
			
			_formOptions: {
				typeoptions: {
					publishedVolumes: {
						label: "Published volumes"
					},
					finishedPublication: {
						label: "Finished publication"	
					},
					volumes: {
						textarea: true,
					},
					morenotes: {
						textarea: true,
					}
				},
				hideFields: [
					"id",
					"lastcheck", "lastupdate",
					"read", "owned", "publishedVolumes",
					"precount", "preorder",
					"notes", "forcednotes", "link"
				]
			},




			_COLsort: "notes",

			_classToggles: [
				{ title: "Inactive", class: "hide-inactive", default: true },
				{ title: "Considering", class: "hide-considering", default: true },
				{ title: "Unlicensed", class: "hide-unlicensed", default: false },
				{ title: "Prepub", class: "hide-prepub", default: false },
				{ title: "Stalled", class: "hide-stalled", default: false },
				{ title: "Announced", class: "hide-unreleased", default: false },
				{ title: "Up to date", class: "hide-up-to-date", default: false },
				{ title: "UTD+Pre", class: "hide-up-to-date-preordered", default: false },
				//{ title: "Volumes", class: "hide-volumes", default: true },
				//{ title: "Vol inforow", class: "hide-volume-inforow", default: false },
				{ title: "Tiles", nobutton: true, class: "render-volume-tiles", default: false },
			],

			_filterOptions: {
				"preorder": {
					//defaultValue: "false"
				}
			},

			/*
			_states: [
				{
					label: "Upcoming",
					classToggles: { "hide-inactive": true, "hide-considering": true, },
					sort: "notes", reverseSort: false,
					filters: { },
				},
				{
					label: "Preorders",
					classToggles: { "hide-inactive": true, "hide-considering": true, },
					sort: "notes", reverseSort: false,
					filters: { preorder: "true" },
				},
				{
					label: "Novel backlog",
					classToggles: { "hide-inactive": true, "hide-considering": true, },
					sort: "name", reverseSort: false,
					filters: { type: 1, status: 2, },
				},
				{
					label: "Manga backlog",
					classToggles: { "hide-inactive": true, "hide-considering": true, },
					sort: "name", reverseSort: false,
					filters: { type: 2, status: 2, },
				},
			],
			*/




			_links: [
				// { title: "Kindle series", url: "https://www.amazon.com/gp/search/other/ref=sr_sa_p_lbr_books_series_b?rh=n%3A133140011%2Cn%3A%21133141011%2Cn%3A154606011%2Cn%3A156104011%2Cp_n_feature_eight_browse-bin%3A11468724011&bbn=156104011&pickerToList=lbr_books_series_browse-bin&ie=UTF8&qid=1470479475" },
				{ title: "Kindle price tracker", url: "https://www.ereaderiq.com/account/watching/drops/" },
				{ title: "Upcoming LN", url: "https://www.reddit.com/r/LightNovels/wiki/upcomingreleases" },
				{ title: "---", url: "" },
				{ title: "Seven Seas", url: "https://sevenseasentertainment.com/digital/" },
				{ title: "Yen Press", url: "http://yenpress.com/digital/" },
				{ title: "VIZ", url: "https://www.viz.com/calendar" },
				{ title: "Kodansha", url: "http://kodanshacomics.com/new-releases/" },
				{ title: "JNC", url: "https://www.amazon.com/s/ref=sr_st_date-desc-rank?keywords=%22J-Novel+Club%22&rh=i%3Aaps%2Ck%3A%22J-Novel+Club%22&qid=1498999001&sort=date-desc-rank" },
			]
		});
	}




}());



BookSeriesDO.scrapePubDates = function(complete, actuallysave){
	complete = complete ? complete : function(){ console.log("COMPLETE") };

	var bookSeriesCOL = window.customMultiDataObjectEditor._editor._COL;

	var q = async.queue(function(bookSeriesDO, complete){
		bookSeriesDO.getPubDatesFromAsins(complete);
	}, 1);
	q.drain = function(){
		if (actuallysave) {
			window.customMultiDataObjectEditor.saveAndUpdate();
		}
		complete();
	}

	bookSeriesCOL.forEach(function(bookSeriesDO){
		q.push(bookSeriesDO);
	});
}

BookSeriesDO.iterateAllSeries = function(callback) {
	const bookSeriesCOL = window.customMultiDataObjectEditor._editor._COL;
	let actuallysave = false;
	bookSeriesCOL.forEach(function(bookSeriesDO){
		const saved = bookSeriesDO.processVolumes(function(volumesCOL){
			return callback(bookSeriesDO, volumesCOL);
		}, true);
		if (saved) {
			console.log(bookSeriesDO.getName(), "was saved");
			actuallysave = true;
		}
	});
	if (actuallysave) {
		window.customMultiDataObjectEditor.saveAndUpdate();
	}
}

BookSeriesDO.setDummyReadDates = function() {
	BookSeriesDO.iterateAllSeries((bookSeriesDO, volumesCOL) => {
		let updated = 0;
		volumesCOL.forEach(volumeDO => {
			const status = volumeDO.getStatus();
			let volumeUpdated = false;
			
			// Consider all books purchased upon release, and read immediately upon purchase
			const readMoment = volumeDO.getReadDateMoment();
			const purchasedMoment = volumeDO.getPurchasedDateMoment();
			const publishedMoment = volumeDO.getReleaseDateMoment();
			const published_ddmmyyyy = publishedMoment ? publishedMoment.format('DD/MM/YYYY') : '-';

			switch(status) {
				case BookSeriesVolumeDO.Enum.Status.Read:
					if (!readMoment) {
						volumeDO.setReadDate(published_ddmmyyyy);
						volumeUpdated = true;
					}
					// break; // CONTINUE
				case BookSeriesVolumeDO.Enum.Status.Backlog:
					if (!purchasedMoment) {
						volumeDO.setPurchasedDate(published_ddmmyyyy);
						volumeUpdated = true;
					}
					break;
				default:
					break;
			}
			if (volumeUpdated) {
				updated += 1;
			}
		});
		if (updated) {
			console.log(bookSeriesDO.getName(), "updated", updated);
			return volumesCOL;
		}
	});
}

