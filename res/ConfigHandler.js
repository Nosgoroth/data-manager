
class ConfigHandler {
	//_do_configs._global

	constructor(domain) {
		this._domain = domain;
		this.readLocalStorage();
	}

	getLocalStorageKeyName() {
		return "_data_config_"+this._domain;
	}
	readLocalStorage(){
		const cfgstr = localStorage.getItem(this.getLocalStorageKeyName());
		this._lsconfig = JSON.parse(cfgstr ? cfgstr : "{}");
	}
	writeToLocalStorage(){
		localStorage.setItem(this.getLocalStorageKeyName(), JSON.stringify(this._lsconfig));
	}

	get(propertyName, defaultValue) {
		let val;
		if (propertyName in this._lsconfig) {
			val = this._lsconfig[propertyName];
		} else {
			val = window._do_configs?.[this._domain]?.[propertyName];
		}
		return val ? val : defaultValue;
	}
	set(propertyName, value) {
		this._lsconfig[propertyName] = value;
		this.writeToLocalStorage();
	}
	unset(propertyName) {
		delete this._lsconfig[propertyName];
		this.writeToLocalStorage();
	}
}

window._globalConfig = new ConfigHandler("_global");