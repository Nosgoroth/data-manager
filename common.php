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