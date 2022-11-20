<?php


class JsonRequestOptions {
	public $orderBy = null; // "id" or "id:int" or array("categoryId:int", "name:str:reverse")
	public $offset = 0;
	public $limit = null;
	public $conditions = array(); //["propName", "condition", "value"] (condition in "eq", "neq")
	public $flags = array();

	public function __construct($props = null){
		if (!is_array($props)) { return; }

		foreach ($props as $propName => $propval) {
			if (property_exists($this, $propName)) {
				$this->$propName = $propval;
			}
		}

	}
}



class JsonRequestDomain extends JsonRequest {

	public function __construct($domain, $suffix=null) {
		$this->setDomain($domain, $suffix);
	}

	protected function setDomain($domain, $suffix=null) {
		$domain = preg_replace("/[^\d\w\-_]*/", "", strtolower($domain));
		if ($suffix) {
			$suffix = preg_replace("/[^\d\w\-_]*/", "", strtolower($suffix));
		}
		$this->setFilename("_data/data_".$domain.($suffix?"_$suffix":"").".json");
		$this->setBackupFilename("_data/data_".$domain.($suffix?"_$suffix":"")."_backup.json");
	}
}




class JsonRequest {

	protected $filename = "none.json";
	protected $backup_filename = null;
	protected $backup_recency = 60*60*24*7; // 7 days

	public function __construct($filename) {
		$this->setFilename($filename);
	}

	protected function setFilename($filename) {
		$this->filename = $filename;
	}
	protected function setBackupFilename($filename) {
		$this->backup_filename = $filename;
	}
	protected function setBackupRecency($seconds) {
		$this->backup_recency = $seconds;
	}

	public function getLastModified() {
		return @filemtime($this->filename);
	}

	public function writeRaw($rawdata) {
		file_put_contents($this->filename, $rawdata);
		if ($this->backup_filename && (!file_exists($this->backup_filename) || filemtime($this->backup_filename) + $this->backup_recency < time())) {
			file_put_contents($this->backup_filename, $rawdata);
		}
	}

	public function write($jsondata) {
		$this->writeRaw( json_encode($jsondata) );
	}

	public function readRaw() {
		$fn = $this->filename;
		if (file_exists($fn)) {
			return file_get_contents($fn);
		} else {
			return "[]";
		}
	}

	public function read() {
		try {
			return json_decode($this->readRaw());
		} catch (Exception $e) {
			return array();
		}
	}

	public function selectRaw($options = null) {
		return json_encode($this->select($options));
	}

	public function select($options = null) {
		if (is_array($options)) { $options = new JsonRequestOptions($options); }
		if (!($options instanceof JsonRequestOptions)) { $options = new JsonRequestOptions(); }

		$data = $this->read();

		$data = self::applyConditionsToArray($data, $options->conditions);

		if ($options->orderBy) {
			$data = self::sortArrayByProperty($data, $options->orderBy);
		}
		if ($options->offset || $options->limit) {
			$data = array_slice($data, $options->offset, $options->limit);
		}

		return $data;
	}


	public function update($data, $options = null) {
		if (is_array($options)) { $options = new JsonRequestOptions($options); }
		if (!($options instanceof JsonRequestOptions)) { $options = new JsonRequestOptions(); }

		throw new Exception("Method not implemented");
	}


	public function delete($options = null) {
		if (is_array($options)) { $options = new JsonRequestOptions($options); }
		if (!($options instanceof JsonRequestOptions)) { $options = new JsonRequestOptions(); }

		throw new Exception("Method not implemented");
	}











	protected static $validReverseValues = array("reverse", "desc");

	protected static function parseSortDirectiveArray($propNameArr) {
		if (!is_array($propNameArr)) {
			$propNameArr = array($propNameArr);
		}

		$parsed = array();
		foreach (($propNameArr) as $key => $propName) {
			if (is_array($propName) && count($propName) >= 2) {
				$parsed[] = $propName;
				continue;
			}
			try {
				$x = explode(":", $propName);
				if (!isset($x[1])) {
					$x[1] = "str";
				}
				$x[2] = !!(isset($x[2]) && in_array(strtolower($x[2]),self::$validReverseValues));
				$parsed[] = $x;
			} catch (Exception $e) {
				//pass
			}
		}

		return $parsed;
	}

	protected static function sortArrayByProperty($data, $propNameArr) {

		$propNameArr = self::parseSortDirectiveArray($propNameArr);

		usort($data, function($a, $b) use ($propNameArr){
			foreach ($propNameArr as $key => $propNameDef) {
				$propName = $propNameDef[0];
				$sortType = $propNameDef[1];
				$isReverse = (isset($propNameDef[2]) ? !!$propNameDef[2] : false);
                $k = ((!$isReverse) ? 1 : -1);
				
				$av = $a->$propName;
				$bv = $b->$propName;

				$ri = 0;

                switch($sortType) {
					default:
					case "str":
			    		$ri = strcmp($av, $bv);
			    		break;
			    	case "int":
			    	case "float":
			    		$ri = (($av < $bv) ? -1 : (($av > $bv) ? 1 : 0));
			    		break;
				}

                if ($ri !== 0) {

                    return $ri * $k;
                }

        	}
        	return 0;
		});

		return $data;
	}

	protected static function applyConditionsToArray($data, $conditions) {
		foreach ($conditions as $key => $condition) {
			if (!is_array($condition)) { continue; }
			$propName = isset($condition[0]) ? $condition[0] : null;
			$condType = isset($condition[1]) ? $condition[1] : null;
			$condValue = isset($condition[2]) ? $condition[2] : null;
			if (!$propName || !$condition) {
				continue;
			}
			$data = self::applyConditionToArray($data, $propName, $condType, $condValue);
		}
		return $data;
	}

	protected static function applyConditionToArray($data, $propName, $condType = "exist", $condValue = null) {
		$newData = array();
		foreach ($data as $key => $item) {
			$ret = self::doesItemFulfillCondition($item, $propName, $condType, $condValue);
			if ($ret) {
				$newData[] = $item;
			}
		}
		return $newData;
	}

	protected static function doesItemFulfillCondition($item, $propName, $condType = "exist", $condValue = null) {
		switch ($condType) {
			default:
				return true;
				break;
			case "exist":
				if (property_exists($item, $propName)) {
					return !!$item->$propName;
				} else {
					return false;
				}
				break;
			case "nexist":
				if (property_exists($item, $propName)) {
					return !$item->$propName;
				} else {
					return true;
				}
				break;
			case "in_str":
				if (!is_array($condValue)) { $condValue = array(); }
				foreach ($condValue as $key => $value) {
					$condValue[$key] = "$value";
				}
				if (property_exists($item, $propName)) {
					return in_array($item->$propName, $condValue);
				} else {
					return false;
				}
				break;
			case "in_int":
				if (!is_array($condValue)) { $condValue = array(); }
				foreach ($condValue as $key => $value) {
					$condValue[$key] = intval($value);
				}
				if (property_exists($item, $propName)) {
					return in_array($item->$propName, $condValue);
				} else {
					return false;
				}
				break;
			case "in_float":
				if (!is_array($condValue)) { $condValue = array(); }
				foreach ($condValue as $key => $value) {
					$condValue[$key] = floatval($value);
				}
				if (property_exists($item, $propName)) {
					return in_array($item->$propName, $condValue);
				} else {
					return false;
				}
				break;
			case "in":
				if (!is_array($condValue)) { $condValue = array(); }
				if (property_exists($item, $propName)) {
					return in_array($item->$propName, $condValue);
				} else {
					return false;
				}
				break;
			case "eq":
				if (property_exists($item, $propName)) {
					return ($item->$propName == $condValue);
				} else {
					return false;
				}
				break;
			case "neq":
				if (property_exists($item, $propName)) {
					return ($item->$propName != $condValue);
				} else {
					return true;
				}
				break;
			case "eqq":
				if (property_exists($item, $propName)) {
					return ($item->$propName === $condValue);
				} else {
					return false;
				}
				break;
			case "neqq":
				if (property_exists($item, $propName)) {
					return ($item->$propName !== $condValue);
				} else {
					return true;
				}
				break;
			case "lt":
				if (property_exists($item, $propName)) {
					return ($item->$propName < $condValue);
				} else {
					return false;
				}
				break;
			case "le":
			case "leq":
				if (property_exists($item, $propName)) {
					return ($item->$propName <= $condValue);
				} else {
					return false;
				}
				break;
			case "gt":
				if (property_exists($item, $propName)) {
					return ($item->$propName > $condValue);
				} else {
					return false;
				}
				break;
			case "ge":
			case "geq":
				if (property_exists($item, $propName)) {
					return ($item->$propName >= $condValue);
				} else {
					return false;
				}
				break;
		}
	}

}


