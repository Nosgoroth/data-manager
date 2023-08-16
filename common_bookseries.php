<?php


if (!function_exists("gzdecode")) {
	function gzdecode($data) { 
		return gzinflate(substr($data,10,-8)); 
	}
}


function transformIntoHeaderMap(array $headers) {
    $headersWithValues = array_filter($headers, function ($header) { return strpos($header, ':') !== false; });

    $headerMap = array();
    foreach ($headersWithValues as $header) {
            list($key, $value) = explode(':', $header);
            $headerMap[$key] = trim($value);
    }

    return $headerMap;
}
function isGzipHeaderSet(array $headerMap) {
    return isset($headerMap['Content-Encoding']) && 
        $headerMap['Content-Encoding'] == 'gzip';
}




abstract class BaseScraper {

	protected $raw;
	protected $id;
	protected $debug_namespace = "";
	protected $debug_directory = "scraper_debug";
	protected $debug_output_ttl = 60*30; //seconds

	function __construct($id) {
		$this->id = $id;
	}

	abstract public function read($debug = false);

	// Debug output functionality

	protected function getRawOutputFilename(){
		return "bookseries_scrape_".$this->debug_namespace."_".$this->id.".html";
	}
	public function deleteOldRawOutput() {
		$this->checkRawOutputDirectory();
		$now = time();
		foreach(glob($this->debug_directory."/*.html") as $file) {
			if (@filemtime($file)+$this->debug_output_ttl < $now) {
				@unlink($file);
			}
		}
	}
	protected function checkRawOutputDirectory() {
		if (!is_dir($this->debug_directory)) {
			mkdir($this->debug_directory);
		}
	}
	protected function writeRawToFile() {
		$this->checkRawOutputDirectory();
		$this->deleteOldRawOutput();
		file_put_contents($this->debug_directory."/".$this->getRawOutputFilename(), $this->raw);
	}
}

abstract class BaseAmazonScraper extends BaseScraper {
	abstract public function extractPubDate();
}


class AmazonJpAsinScraper extends BaseAmazonScraper {

	protected $debug_namespace = "amazonjp";

	function read($debug = false) {
		//return;
		$this->raw = file_get_contents("https://www.amazon.co.jp/gp/product/".$this->id.'?language=ja_JP');
		if (isGzipHeaderSet(transformIntoHeaderMap($http_response_header))) {
			$this->raw = gzdecode($this->raw);
		}
		$this->raw = str_replace(array("&rlm;", "&lrm;"), "", $this->raw);
		$this->writeRawToFile();

		if ($debug) {
			print $this->raw;
			die();
		}
	}


	function extractKindleAsin() {
		$pos = strpos($this->raw, "tmm-grid-swatch-KINDLE");
		if ($pos === false) { return null; }
		$substr = substr($this->raw, $pos);
		$matches = null;
		preg_match("/href=\"\/[^\/]+\/dp\/(B[\d\w]+)\//", $substr, $matches);
		if (!$matches || count($matches) < 2) { return null; }
		return $matches[1];
	}

	function extractPubDate(){
		mb_internal_encoding('UTF-8');
		preg_match("/出版社[\s]*\:[\s]*\<\/span\>[\s]*\<span\>.*[\s]\(([\d\/]+)\)\</s", $this->raw, $matches);
		if (count($matches) > 1) {
			return $matches[1];
		} else {
			return null;
		}
	}

	function extractMoreEditions() {
		return null;
	}

}




class AmazonComAsinScraper extends BaseAmazonScraper {

	protected $debug_namespace = "amazoncom";

	function read($debug = false) {
		$this->raw = file_get_contents("https://smile.amazon.com/dp/".$this->id, false, stream_context_create(array(
			"http" => array(
				"method" => "GET",
		        "header" => implode("\r\n", array(
		        	"user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
					"referer: https://www.amazon.com/",
					"Accept-Language: es,en-GB;q=0.9,en;q=0.8,ca;q=0.7,ja;q=0.6",
					"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		        	"Accept-Encoding: none",
		        ))
			)
		)));
		if (isGzipHeaderSet(transformIntoHeaderMap($http_response_header))) {
			$this->raw = gzdecode($this->raw);
		}
		$this->raw = str_replace(array("&rlm;", "&lrm;"), "", $this->raw);
		$this->writeRawToFile();
		if ($debug) {
			print $this->raw;
			die();
		}
	}

	function extractKindleAsin() {
		$pos = strpos($this->raw, "tmm-grid-swatch-KINDLE");
		if ($pos === false) { return null; }
		$substr = substr($this->raw, $pos);
		$matches = null;
		preg_match("/href=\"\/[^\/]+\/dp\/(B[\d\w]+)\//", $substr, $matches);
		if (!$matches || count($matches) < 2) { return null; }
		return $matches[1];
	}

	function extractPubDate(){

		$matchers = array(
			array( "rx" => "/Publication Date[\s]*\:[\s]*\<\/span\>[\s]*\<span\>([\d\w\s]+, [\d]+)\</s", "cgindex" => 1 ),
			array( "rx" => "/Publisher[\s]*\:[\s]*\<\/span\>[\s]*\<span\>.* \(([\d\w\s]+, [\d]+)\)\</s", "cgindex" => 1 ),
		);

		foreach ($matchers as $matcher) {
			$matches = null;
			preg_match($matcher["rx"], $this->raw, $matches);
			if (count($matches) > 1 && isset($matches[$matcher["cgindex"]])) {
				return $matches[$matcher["cgindex"]];
			}
		}

		//header('Content-type: text/plain'); die($this->raw);
		return null;
	}

	function extractPubDateDDMMYY() {
		$date = $this->extractPubDate();
		if (!$date) { return null; }
		try {
			$dp = date_parse_from_format("M d, Y", $date);
			if (!$dp["day"] || !$dp["month"] || !$dp["year"]) {
				throw new Exception("Invalid date: $date", 1);
			}
			return $dp["day"]."/".$dp["month"]."/".$dp["year"];
		} catch (Exception $e) {
			return null;
		}
	}

}




class KoboScraper extends BaseScraper {

	protected $debug_namespace = "kobo";

	function read($debug = false) {
		$this->raw = file_get_contents("https://www.kobo.com/es/en/ebook/".$this->id, false, stream_context_create(array(
			"http" => array(
				"timeout" => 10,
				"method" => "GET",
		        "header" => implode("\r\n", array(
		        	"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15",
					"Accept-Language: en-GB",
					"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
		        	//"Accept-Encoding: gzip, deflate, br",
		        	"Host: www.kobo.com",
		        	"Connection: keep-alive",
		        ))
			)
		)));
		if (isGzipHeaderSet(transformIntoHeaderMap($http_response_header))) {
			$this->raw = gzdecode($this->raw);
		}
		$this->writeRawToFile();
		if ($debug) {
			print $this->raw;
			die();
		}
	}


	function extractAllData(){

		$matchers = array(
			array(
				"rx" => "/Release Date\:[\s]*\<span[^\>]*\>([\d\w\s]+, [\d]+)[\s]*\</",
				"cgindex" => 1,
				"key" => "date",
			),
			array(
				"rx" => "/ISBN\:[\s]*\<span[^\>]*\>([\d]+)[\s]*\</",
				"cgindex" => 1,
				"key" => "isbn",
			),
			array(
				"rx" => "/\<img class=\"cover-image[^\>]* ?src=\"([^\"]+)\"/",
				"cgindex" => 1,
				"key" => "cover",
			),
			
		);

		$data = array();

		foreach ($matchers as $matcher) {
			$matches = null;
			preg_match($matcher["rx"], $this->raw, $matches);
			if (count($matches) > 1 && isset($matches[$matcher["cgindex"]])) {
				$data[$matcher["key"]] = $matches[$matcher["cgindex"]];
			}
		}

		return $data;
	}

	function extractPubDateDDMMYY() {
		$data = $this->extractAllData();
		if (!$data) { return null; }
		$date = isset($data["date"]) ? $data["date"] : null;
		if (!$date) { return null; }
		try {
			$dp = date_parse_from_format("M d, Y", $date);
			if (!$dp["day"] || !$dp["month"] || !$dp["year"]) {
				throw new Exception("Invalid date: $date", 1);
			}
			return $dp["day"]."/".$dp["month"]."/".$dp["year"];
		} catch (Exception $e) {
			return null;
		}
	}
}


function bookVolumeCheckDelay($volume, $options) {

	$res = [
		"ok" => false,
		"error" => null,
		"isNewDate" => false,
		"isDelay" => false,
		"updatedDate" => null,
	];
	
	$options = array_merge([
		"ALLOW_AMAZON_DELAY_CHECKS" => false,
		"AMAZON_DEBUG" => false
	], (is_array($options) ? $options : []));

	try {
		$date = isset($volume["releaseDate"]) ? $volume["releaseDate"] : null;
		$date = bookVolumeNormalizeDDMMYY($date);
		$dp = date_parse_from_format("d/m/Y", $date);
		$unix = mktime(0,0,0,$dp["month"],$dp["day"],$dp["year"]);

		
		$updatedDate = null;
		if (isset($volume["koboId"]) && $volume["koboId"]) {
			$scraper = new KoboScraper($volume["koboId"]);
			$scraper->read();
			$updatedDate = $scraper->extractPubDateDDMMYY();
		} else if ($volume["asin"] && $options["ALLOW_AMAZON_DELAY_CHECKS"]) {
			$scraper = new AmazonComAsinScraper($volume["asin"]);
			$scraper->read($options["AMAZON_DEBUG"]);
			$updatedDate = $scraper->extractPubDateDDMMYY();
		} else {
			$res["error"] = "No valid store";
			return $res;
		}
		if (!$updatedDate) {
			$res["error"] = "Couldn't retrieve date";
			return $res;
		}

		$res["ok"] = true;
		if (!$date) {
			$res["isNewDate"] = true;
			$res["updatedDate"] = $updatedDate;
		} else if ($updatedDate !== $date) {
			$res["updatedDate"] = $updatedDate;
			$dp = date_parse_from_format("d/m/Y", $updatedDate);
			$updatedUnix = mktime(0,0,0,$dp["month"],$dp["day"],$dp["year"]);
			$res["isDelay"] = !($unix > $updatedUnix);
		}

		return $res;
	} catch (Exception $th) {
		$res["error"] = $th;
		return $res;
	}
}


function bookVolumeNormalizeDDMMYY($date) {
	if (!$date) { return null; }
	$dp = date_parse_from_format("d/m/Y", $date);
	return $dp["day"]."/".$dp["month"]."/".$dp["year"];
}





$zdateRelativePeriods = [
	[60, 1, '%s seconds ago', 'a second ago', 'in %s seconds', 'in a second'],
	[60*100, 60, '%s minutes ago', 'one minute ago', 'in %s minutes', 'in a minute'],
	[3600*70, 3600, '%s hours ago', 'an hour ago', 'in %s hours', 'in an hour'],
	[3600*24*10, 3600*24, '%s days ago', 'yesterday', 'in %s days', 'tomorrow'],
	[3600*24*30, 3600*24*7, '%s weeks ago', 'one week ago', 'in %s weeks', 'in a week'],
	[3600*24*30*30, 3600*24*30, '%s months ago', 'last month', 'in %s months', 'in a month'],
	[INF, 3600*24*265, '%s years ago', 'last year', 'in %s years', 'in a year'],
];
function zdateRelative($date, $now = null) {
	global $zdateRelativePeriods;
	$now = $now ? $now : time();
	$diff = $now - $date;
	if ($diff > 0) {
		foreach ($zdateRelativePeriods as $period) {
			if ($diff > $period[0]) continue;
			$diff = round($diff / $period[1]);
			return sprintf($diff > 1 ? $period[2] : $period[3], $diff);
		}
	} elseif ($diff < 0) {
		$diff = $diff * -1;
		foreach ($zdateRelativePeriods as $period) {
			if ($diff > $period[0]) continue;
			$diff = round($diff / $period[1]);
			return sprintf($diff > 1 ? $period[4] : $period[5], $diff);
		}
	} else {
		return 'now';
	}
}

function zdateRelativeWrapper($date, $now = null) {
	$ret = zdateRelative($date, $now);
	if ($ret === "in 48 hours") {
		return "in 2 days";
	}
	if ($ret === "in 24 hours") {
		return "tomorrow";
	}
	if ($ret === "now") {
		return "today";
	}
	return $ret;
}
