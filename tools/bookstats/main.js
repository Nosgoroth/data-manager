

function instanceGraph(dateCols) {


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
	add(item, key) {
		if (!this.index[key]) {
			this.index[key] = [];
		}
		this.index[key].push(item);
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
			return this.index[key].map(x => x.getFullName() ).join("\n");
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
}

class VolumeCollectionByDate {
	constructor(type) {
		this._type = type;
		this.volumes = [];
		this.monthIndex = new VolumeCollectionIndex();
		this.yearIndex = new VolumeCollectionIndex();
	}
	
	add(volumeDO, _moment) {
		if (!_moment) { return; }
		const month = _moment.format('YYYY-MM');
		const year = _moment.format('YYYY');

		this.volumes.push(volumeDO);
		
		this.monthIndex.add(volumeDO, month);
		this.monthIndex.addKeyDate(month, moment(_moment).startOf('month'));

		this.yearIndex.add(volumeDO, year);
		this.yearIndex.addKeyDate(year, moment(_moment).startOf('year'));
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
	getGraphPointsByMonth() {
		return this.monthIndex.getGraphPoints();
	}
	getGraphPointsByYear() {
		return this.yearIndex.getGraphPoints();
	}
}


window.bookSeriesAjaxInterface = Object.extends({
	_type: window.BookSeriesDO,
	_ajaxendpoint: "../../ajax.php",


	JsonAjaxInterface_afterDomReady: function(){},
	JsonAjaxInterface_afterDataReady: async function(){

		const dateCols = {
			read: new VolumeCollectionByDate('read'),
			bought: new VolumeCollectionByDate('bought'),
		};
		try {
			window.dateCols = dateCols;
		} catch(e) {}
		
		this._COL.forEach(bookSeriesDO => {
			const volumes = bookSeriesDO.getVolumes();
			// bookSeriesDO._volumes = volumes;

			volumes.forEach(volumeDO => {
				dateCols.read.add(volumeDO, volumeDO.getReadDateMoment());
				dateCols.bought.add(volumeDO, volumeDO.getPurchasedDateMoment());
			});
		});

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
			$parent.appendR('<p>')
				.html(
					`You read <strong>${boughtReadThisYearPercentage}%</strong> as many books as you bought this year. Last year it was ${boughtReadLastYearPercentage}%.`
				)
				;
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
				;
			const $tbody = $table.appendR('<tbody>');

			for(const monthKey of keys) {
				const month = months[monthKey];
				$tbody.appendR('<tr>')
					.appendR('<td>').text(monthKey).parent()
					.appendR('<td>').text(month.bought ?? 0).parent()
					.appendR('<td>').text(month.read ?? 0).parent()
					;
			}


		}


	},
},{
	name: "JsonAjaxInterfaceForBookSeries",
	instance: true,
	parent: JsonAjaxInterface
});
