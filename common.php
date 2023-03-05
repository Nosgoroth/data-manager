<?php

class ScriptTag {
	public static function generate($item) {
		if (is_array($item)) { return self::echoMultiple($item); }
		if (!$item) { return null; }
		if (!self::isExternalUrl($item)) {
			$item = self::addFmtToUrl($item);
		}
		?><script type='text/javascript' src='<?= $item ?>'></script><?php
	}
	
	protected static function addFmtToUrl($item) {
		$fmt = @filemtime($item);
		$fmt = $fmt ? $fmt : 0;
		$sep = "?";
		if (strpos($item,$sep) !== false) {
			$sep = "&";
		}
		return $item.$sep."_t=".$fmt;
	}
	
	protected static function isExternalUrl($item) {
		if (!$item) { return null; }
		if (substr($item, 0, 4) === "http") { return true; }
		if (substr($item, 0, 2) === "//") { return true; }
		return false;
	}
	protected static function echoMultiple($items) {
		foreach ($items as $item) {
			self::generate($item);
		}
	}
}



if (!function_exists('json_clean_decode')) {
	function json_clean_decode($json, $assoc = false, $depth = 512, $options = 0) {
		// search and remove comments like /* */ and //
		$json = preg_replace("#(/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+/)|([\s\t]//.*)|(^//.*)#", '', $json);
		//Trailing commas too
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

