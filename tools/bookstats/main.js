

function instanceGraph(dateCols) {

	if (BookSeriesDO.getConfigValue("statsDrawZeroes", false)) {
		console.log("Filling zeroes");
		try {
			dateCols.bought.fillZeroes();
			dateCols.read.fillZeroes();
		} catch(e) {
			console.log(e);
		}
	}
	

	const boughtDataYear = dateCols.bought.getGraphPointsByYear();
	const readDataYear = dateCols.read.getGraphPointsByYear();


	Highcharts.chart(jQuery("#book-stats-graph-year").get(0), {
	    chart: { type: 'spline', backgroundColor: "#000000" },
	    title: { text: '' },
	    xAxis: {
	        type: 'datetime',
	        dateTimeLabelFormats: {
	            month: '%b %y',
	            year: '%Y'
	        },
	        // title: { text: 'Date' },
	    },
	    yAxis: {
	        title: { text: 'Volumes' },
	        min: 0,
	        allowDecimals: false
	    },
	    tooltip: {
	        headerFormat: "",
	        // pointFormat: '{point.items}'
	    },
	    plotOptions: {
	        spline: {
	            marker: {
	                enabled: true
	            }
	        }
	    },
	    series: [{
	        name: "Bought",
	        color: "#FF0021",
	        data: boughtDataYear,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }, {
	        name: "Read",
	        color: "#178246",
	        data: readDataYear,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }]
	});



	const cutoff = moment().subtract(18, 'month').unix() * 1000;

	const boughtDataMonth = dateCols.bought.getGraphPointsByMonth().filter(p => p.x > cutoff);
	const readDataMonth = dateCols.read.getGraphPointsByMonth().filter(p => p.x > cutoff);

	Highcharts.chart(jQuery("#book-stats-graph-month").get(0), {
	    chart: { type: 'spline', backgroundColor: "#000000" },
	    title: { text: '' },
	    xAxis: {
	        type: 'datetime',
	        dateTimeLabelFormats: {
	            month: '%b %y',
	            year: '%Y'
	        },
	        // title: { text: 'Date' },
	    },
	    yAxis: {
	        title: { text: 'Volumes' },
	        min: 0,
	        allowDecimals: false
	    },
	    tooltip: {
	        headerFormat: "",
	        // pointFormat: '{point.items}'
	    },
	    plotOptions: {
	        spline: {
	            marker: {
	                enabled: true
	            }
	        }
	    },
	    series: [{
	        name: "Bought",
	        color: "#FF0021",
	        data: boughtDataMonth,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }, {
	        name: "Read",
	        color: "#178246",
	        data: readDataMonth,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }]
	});


	const jncBoughtDataMonth = dateCols.preorder.filter("jnc").getGraphPointsByMonth();
	const jncBoughtDataYear = dateCols.preorder.filter("jnc").getGraphPointsByYear();

	Highcharts.chart(jQuery("#book-stats-graph-jnc-month").get(0), {
	    chart: { type: 'spline', backgroundColor: "#000000" },
	    title: { text: '' },
	    xAxis: {
	        type: 'datetime',
	        dateTimeLabelFormats: {
	            month: '%b %y',
	            year: '%Y'
	        },
	        // title: { text: 'Date' },
	    },
	    yAxis: {
	        title: { text: 'Volumes' },
	        min: 0,
	        allowDecimals: false
	    },
	    tooltip: {
	        headerFormat: "",
	        // pointFormat: '{point.items}'
	    },
	    plotOptions: {
	        spline: {
	            marker: {
	                enabled: true
	            }
	        }
	    },
	    series: [{
	        name: "Preordered or bought",
	        color: "#004A9E",
	        data: jncBoughtDataMonth,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }]
	});
	Highcharts.chart(jQuery("#book-stats-graph-jnc-year").get(0), {
	    chart: { type: 'spline', backgroundColor: "#000000" },
	    title: { text: '' },
	    xAxis: {
	        type: 'datetime',
	        dateTimeLabelFormats: {
	            month: '%b %y',
	            year: '%Y'
	        },
	        // title: { text: 'Date' },
	    },
	    yAxis: {
	        title: { text: 'Volumes' },
	        min: 0,
	        allowDecimals: false
	    },
	    tooltip: {
	        headerFormat: "",
	        // pointFormat: '{point.items}'
	    },
	    plotOptions: {
	        spline: {
	            marker: {
	                enabled: true
	            }
	        }
	    },
	    series: [{
	        name: "Preordered or bought",
	        color: "#004A9E",
	        data: jncBoughtDataYear,
	        dataLabels: {
	        	enabled: true,
	        	format: "{point.y}",
	        	style: { fontSize: "10px", fontWeight: "normal" }
	        }
	    }]
	});
}



function onlyUnique(value, index, self) {
  return self.indexOf(value) === index;
}

function combineObjectValues(a, b, aKeyName, bKeyName){
	aKeyName = aKeyName ?? 'a';
	bKeyName = bKeyName ?? 'b';

	aKeys = Object.keys(a);
	bKeys = Object.keys(b);
	const keys = [...aKeys, ...bKeys].filter(onlyUnique);
	return Object.fromEntries(keys.map(k => [k, {
		[aKeyName]: a[k],
		[bKeyName]: b[k],
	}]));
} 


class VolumeCollectionIndex {
	constructor(){
		this.index = {};
		this.keyDates = {};
	}
	addKeyDate(key, date) {
		this.keyDates[key] = date;
	}
	hasKey(key) {
		return !!this.index[key];
	}
	add(item, key) {
		if (!this.index[key]) {
			this.index[key] = [];
		}
		if (item) {
			this.index[key].push(item);
		}
	}
	getKeys() {
		const keys = Object.keys(this.index);
		keys.sort();
		return keys;
	}
	getCountAtKey(key) {
		try {
			return this.index[key].length;
		} catch(e) {
			return 0;
		}
	}
	getCounts() {
		return Object.fromEntries(this.getKeys().map(k => [k, this.getCountAtKey(k)]));
	}
	getLabelAtKey(key) {
		try {
			return this.getLabelsAtKey(key).join("\n");
		} catch(e) {
			return null;
		}
	}
	getLabelsAtKey(key) {
		try {
			return this.index[key].map(x => x.getFullName() );
		} catch(e) {
			return null;
		}
	}
	getDateAtKey(key) {
		try {
			return this.keyDates[key];
		} catch(e) {
			return null;
		}
	}
	getGraphPointAtKey(key) {
		const date = this.getDateAtKey(key);
		const count = this.getCountAtKey(key);
		const items = this.getLabelAtKey(key);
		return {
			x: (date?.unix() ?? 0) * 1000 + 60*60*12*1000,
			y: count,
			z: key,
			items: items,
		}
	}
	getGraphPoints() {
		return this.getKeys().map(k => this.getGraphPointAtKey(k));
	}
	
	
	fillZeroesInIndex(format, unit, _maxiter){ // like ("YYYY-MM", "month")
		const max_iterations = _maxiter ? _maxiter : 1000;
		const keys = this.getKeys(); // Returns sorted string array in the format YYYY-MM
		const start = keys[0];
		const end = keys[keys.length - 1];
		let pointer = moment(start, format); // Parse key into date object
		let pointerKey = start;
		let iterationCount = 0;
		while (pointerKey !== end && iterationCount < max_iterations){ // While exit condition depends on date library, ugh
			if (!this.hasKey(pointerKey)) {
				this.add(null, pointerKey);
				this.addKeyDate(pointerKey, pointer);
			}
			pointer = moment(moment(pointer).add(1, unit)); // In-place modification
			pointerKey = pointer.format(format); // To string
			iterationCount += 1;
		}
	}
}

class VolumeCollectionByDate {
	constructor(type) {
		this._type = type;
		this.volumes = [];
		this.moments = new Map();
		this.monthIndex = new VolumeCollectionIndex();
		this.yearIndex = new VolumeCollectionIndex();
		this.filters = {};
	}
	
	add(volumeDO, _moment) {
		if (!_moment) { return; }
		const month = _moment.format('YYYY-MM');
		const year = _moment.format('YYYY');

		this.volumes.push(volumeDO);
		this.moments.set(volumeDO.getUniqueId(), _moment);
		
		this.monthIndex.add(volumeDO, month);
		this.monthIndex.addKeyDate(month, moment(_moment).startOf('month'));

		this.yearIndex.add(volumeDO, year);
		this.yearIndex.addKeyDate(year, moment(_moment).startOf('year'));
	}
	
	fillZeroes() {
		this.monthIndex.fillZeroesInIndex("YYYY-MM", "months", 500);
		this.yearIndex.fillZeroesInIndex("YYYY", "years", 100);
	}

	getMonthCounts() {
		return this.monthIndex.getCounts();
	}
	getYearCounts() {
		return this.yearIndex.getCounts();
	}
	getCountAtMonth(key) {
		return this.monthIndex.getCountAtKey(key);
	}
	getCountAtYear(key) {
		return this.yearIndex.getCountAtKey(key);
	}
	getLabelsAtMonth(key) {
		return this.monthIndex.getLabelsAtKey(key);
	}
	getLabelsAtYear(key) {
		return this.yearIndex.getLabelsAtKey(key);
	}
	getLabelAtMonth(key) {
		return this.monthIndex.getLabelAtKey(key);
	}
	getLabelAtYear(key) {
		return this.yearIndex.getLabelAtKey(key);
	}
	getGraphPointsByMonth() {
		return this.monthIndex.getGraphPoints();
	}
	getGraphPointsByYear() {
		return this.yearIndex.getGraphPoints();
	}

	filter(name, filterFunction) {
		if (this.filters[name]) {
			return this.filters[name];
		}
		if (!filterFunction) { return null; }
		const filtered = new VolumeCollectionByDate(this._type);
		for (const volumeDO of this.volumes) {
			if (!filterFunction(volumeDO)) { continue; }
			const _moment = this.moments.get(volumeDO.getUniqueId());
			filtered.add(volumeDO, _moment);
		}
		this.filters[name] = filtered;
		return filtered;
	}
}


window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_dataset: window._dataset,
	_ajaxendpoint: "../../ajax.php",


	JsonAjaxInterface_afterDomReady: function(){},
	JsonAjaxInterface_afterDataReady: async function(){

		const dateCols = {
			read: new VolumeCollectionByDate('read'),
			bought: new VolumeCollectionByDate('bought'),
			preorder: new VolumeCollectionByDate('preorder'),
		};
		try {
			window.dateCols = dateCols;
		} catch(e) {}
		
		this._COL.forEach(bookSeriesDO => {
			
			if (bookSeriesDO.isExcludeFromStats()) {
				return;
			}
			
			const volumes = bookSeriesDO.getVolumes();
			// bookSeriesDO._volumes = volumes;

			volumes.forEach(volumeDO => {
				if (volumeDO.isExcludeFromStats()) {
					return;
				}
				dateCols.read.add(volumeDO, volumeDO.getReadDateMoment());
				dateCols.read.add(volumeDO, volumeDO.getReadDateSourceMoment());
				dateCols.bought.add(volumeDO, volumeDO.getPurchasedDateMoment());
				dateCols.bought.add(volumeDO, volumeDO.getPurchasedDateSourceMoment());
				dateCols.preorder.add(volumeDO, volumeDO.getPreorderOrPurchaseDateMoment());
				dateCols.preorder.add(volumeDO, volumeDO.getPreorderOrPurchaseDateSourceMoment());
			});
		});

		dateCols.preorder.filter("jnc", x => (x.parent?.getStore() === BookSeriesDO.Enum.Store.JNC));

		const thisYear = moment().format('YYYY');
		const lastYear = moment().subtract(1, 'year').format('YYYY');

		const thisMonth = moment().format('YYYY-MM');
		const lastMonth = moment().subtract(1, 'month').format('YYYY-MM');


		{
			const $parent = jQuery("#book-stats-summary-app");

			const readLastYear = dateCols.read.getCountAtYear(lastYear);
			const readThisYear = dateCols.read.getCountAtYear(thisYear);
			const readDiff = readThisYear - readLastYear;

			const boughtLastYear = dateCols.bought.getCountAtYear(lastYear);
			const boughtThisYear = dateCols.bought.getCountAtYear(thisYear);
			const boughtDiff = boughtThisYear - boughtLastYear;

			const boughtReadThisYearDiff = boughtThisYear - readThisYear;
			const boughtReadThisYearPercentage = Math.round(100 * readThisYear / boughtThisYear);
			

			const boughtReadLastYearDiff = boughtLastYear - readLastYear;
			const boughtReadLastYearPercentage = Math.round(100 * readLastYear / boughtLastYear);

			$parent.appendR('<p>')
				.html(
					`You bought <strong>${boughtThisYear}</strong> books in ${thisYear}, which is <strong>${Math.abs(boughtDiff)} ${boughtDiff > 0 ? 'more' : 'fewer'}</strong> than last year.`
				)
				;
			$parent.appendR('<p>')
				.html(
					`You read <strong>${readThisYear}</strong> books in ${thisYear}, which is <strong>${Math.abs(readDiff)} ${readDiff > 0 ? 'more' : 'fewer'}</strong> than last year.`
				)
				;

			let percComparisonText = '';
			if (boughtThisYear) {
				percComparisonText += `You read <strong>${boughtReadThisYearPercentage}%</strong> as many books as you bought this year. `;
			}
			if (!boughtLastYear) {
				if (!boughtThisYear) {
					percComparisonText += `You haven't bought any books this year, same as last year.`;
				} else {
					percComparisonText += `Last year you didn't buy any.`;
				}
			} else {
				if (!boughtThisYear) {
					percComparisonText += `You haven't bought any books this year, but last year you read ${boughtReadLastYearPercentage}% as many books as you bought.`;
				} else {
					percComparisonText += `Last year it was ${boughtReadLastYearPercentage}%.`;
				}
			}
			$parent.appendR('<p>').html(percComparisonText);

		}

		{
			instanceGraph(dateCols);
		}

		{
			const $parent = jQuery("#book-stats-year-app");

			const years = combineObjectValues(
				dateCols.read.getYearCounts(),
				dateCols.bought.getYearCounts(),
				'read',
				'bought'
			);
			const keys = Object.keys(years);
			keys.sort();
			keys.reverse();
			
			const $table = $parent.appendR('<table>').addClass('table');
			const $thead = $table.appendR('<thead>').appendR('<tr>')
				.appendR('<th>').text('Year').parent()
				.appendR('<th>').text('Bought').parent()
				.appendR('<th>').text('Read').parent()
				;
			const $tbody = $table.appendR('<tbody>');

			for(const key of keys) {
				const year = years[key];
				$tbody.appendR('<tr>')
					.appendR('<td>').text(key).parent()
					.appendR('<td>').text(year.bought ?? 0).parent()
					.appendR('<td>').text(year.read ?? 0).parent()
					;
			}

		}

		{
			const $parent = jQuery("#book-stats-month-app");

			const months = combineObjectValues(
				dateCols.read.getMonthCounts(),
				dateCols.bought.getMonthCounts(),
				'read',
				'bought'
			);
			const keys = Object.keys(months);
			keys.sort();
			keys.reverse();
			
			const $table = $parent.appendR('<table>').addClass('table');
			const $thead = $table.appendR('<thead>').appendR('<tr>')
				.appendR('<th>').text('Month').parent()
				.appendR('<th>').text('Bought').parent()
				.appendR('<th>').text('Read').parent()
				.appendR('<th>').text('Details').parent()
				;
			const $tbody = $table.appendR('<tbody>');

			for(const monthKey of keys) {
				const month = months[monthKey];
				$tbody.appendR('<tr>')
					.appendR('<td>').text(monthKey).parent()
					.appendR('<td>').text(month.bought ?? 0).parent()
					.appendR('<td>').text(month.read ?? 0).parent()
					.appendR('<td>')
						.appendR('<button>')
							.text("Details")
							.click(event => {
								event.preventDefault();
								event.stopPropagation();
								alertStatDetailsForMonth(dateCols, monthKey);
							})
						.parent().parent()
					;
			}


		}
		{
			const $parent = jQuery("#book-stats-jnc-app");

			const jncDateCols = dateCols.preorder.filter("jnc");

			const months = jncDateCols.getMonthCounts();
			const keys = Object.keys(months);
			keys.sort();
			keys.reverse();
			
			const $table = $parent.appendR('<table>').addClass('table');
			const $thead = $table.appendR('<thead>').appendR('<tr>')
				.appendR('<th>').text('Month').parent()
				.appendR('<th>').text('Bought').parent()
				;
			const $tbody = $table.appendR('<tbody>');

			for(const monthKey of keys) {
				const month = months[monthKey];
				$tbody.appendR('<tr>')
					.appendR('<td>').text(monthKey).parent()
					.appendR('<td>').text(month ?? 0).parent()
					;
			}


		}


	},
},{
	name: "JsonAjaxInterfaceForBookSeries",
	instance: true,
	parent: JsonAjaxInterface
});

function alertStatDetailsForMonth(dateCols, monthKey) {
	const details = getStatDetailsForMonth(dateCols, monthKey);

	const added_to_backlog = details.added_to_backlog.length 
		? details.added_to_backlog.join("\n") : "n/a";
	const read_from_backlog = details.read_from_backlog.length
		? details.read_from_backlog.join("\n")
		: "n/a";
	const bought_and_read = details.bought_and_read.length
		? details.bought_and_read.join("\n")
		: "n/a";

	alert(
		"Read from previous backlog:"
		+"\n"+read_from_backlog
		+"\n\n"+"Added to backlog:"
		+"\n"+added_to_backlog
		+"\n\n"+"Bought and read:"
		+"\n"+bought_and_read
	);
}


function getStatDetailsForMonth(dateCols, monthKey) {
	const read = dateCols.read.getLabelsAtMonth(monthKey);
	const bought = dateCols.bought.getLabelsAtMonth(monthKey);

	const added_to_backlog = [];
	const read_from_backlog = [];
	const bought_and_read = [];

	read?.forEach(r => {
		if (bought?.includes(r)) {
			bought_and_read.push(r);
		} else {
			read_from_backlog.push(r);
		}
	});
	bought?.forEach(b => {
		if (!bought_and_read.includes(b)) {
			added_to_backlog.push(b);
		}
	});

	return {
		monthKey: monthKey,
		dateCols: dateCols,

		read: read,
		bought: bought,

		added_to_backlog: added_to_backlog,
		read_from_backlog: read_from_backlog,
		bought_and_read: bought_and_read,
	}
}


