<?php

if (!function_exists('json_clean_decode')) {
	function json_clean_decode($json, $assoc = false, $depth = 512, $options = 0) {
		// search and remove comments like /* */ and //
		$json = preg_replace("#(/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/)|([\s\t]//.*)|(^//.*)#", '', $json);
		$json = preg_replace("#,([\s\n]*(}|]))#s", '$1', $json);

	   
		if(version_compare(phpversion(), '5.4.0', '>=')) {
			$json = json_decode($json, $assoc, $depth, $options);
		}
		elseif(version_compare(phpversion(), '5.3.0', '>=')) {
			$json = json_decode($json, $assoc, $depth);
		}
		else {
			$json = json_decode($json, $assoc);
		}

		return $json;
	}
}

class ConfigHandler {

	protected $name = null;
	protected $configRaw = null;

	function __construct($configName) {
		$this->configName = $configName;
		$this->readConfigFile();
	}
	protected function readConfigFile() {
		$path = dirname(__FILE__)."/config/".$this->configName.".json";
		$rawjson = @file_get_contents($path);
		if (!$rawjson) {
			return;
		}
		$this->configRaw = @json_clean_decode($rawjson, true);
	}
	public function isReady() {
		return !!$this->configRaw;
	}
	public function get($configVarName, $defaultValue=null) {
		if ($this->configRaw && isset($this->configRaw[$configVarName])) {
			return $this->configRaw[$configVarName];
		} else {
			return $defaultValue;
		}
	}

}

