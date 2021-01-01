
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


class CollectionIndex {
	constructor(){
		this.index = {};
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
}

class VolumeCollectionByDate {
	constructor(type) {
		this._type = type;
		this.volumes = [];
		this.monthIndex = new CollectionIndex();
		this.yearIndex = new CollectionIndex();
	}
	
	add(volumeDO, _moment) {
		if (!_moment) { return; }
		const month = _moment.format('YYYY-MM');
		const year = _moment.format('YYYY');

		this.volumes.push(volumeDO);
		this.monthIndex.add(volumeDO, month);
		this.yearIndex.add(volumeDO, year);
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
