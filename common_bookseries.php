<?php



class AmazonJpAsinScraper {

	private $ASIN;
	private $raw;

	function __construct($ASIN) {
		$this->ASIN = $ASIN;
	}

	function read($debug = false) {
		$this->raw = file_get_contents("https://www.amazon.co.jp/gp/product/".$this->ASIN.'?language=ja_JP');
		if (isGzipHeaderSet(transformIntoHeaderMap($http_response_header))) {
			$this->raw = gzdecode($this->raw);
		}
	}

	function extractPubDate(){
		mb_internal_encoding('UTF-8');
		// $this->raw = '<span class="a-list-item"> <span class="a-text-bold">出版社 : </span> <span>双葉社 (2015/4/16)</span> </span>';
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





class AmazonComAsinScraper {

	private $ASIN;
	private $raw;

	function __construct($ASIN) {
		$this->ASIN = $ASIN;
	}

	function read($debug = false) {
		$this->raw = file_get_contents("https://smile.amazon.com/dp/".$this->ASIN, false, stream_context_create(array(
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
		if ($debug) {
			print $this->raw;
			die();
		}
	}

	function extractKindleAsin() {
		$matches = null;
		preg_match("/data-tmm-see-more-editions-click=\"(\{.*\})\"/", $this->raw, $matches);
		if (!$matches || count($matches) < 2) { return null;  }
		$editions = json_decode(html_entity_decode($matches[1]), true);
		if (!isset($editions["metabindingUrl"])) { return null; }
		preg_match("/dp\/(B[\d\w]*)\//", $editions["metabindingUrl"], $matches);
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

}




class KoboScraper {
	private $id;
	private $raw;

	function __construct($id) {
		$this->id = $id;
	}

	function read($debug = false) {
		$this->raw = file_get_contents("https://www.kobo.com/es/en/ebook/".$this->id, false, stream_context_create(array(
			"http" => array(
				"method" => "GET",
		        "header" => implode("\r\n", array(
		        	"user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36",
					"referer: https://www.kobo.com/",
					"Accept-Language: es,en-GB;q=0.9,en;q=0.8,ca;q=0.7,ja;q=0.6",
					"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
		        	"Accept-Encoding: none",
		        ))
			)
		)));
		if (isGzipHeaderSet(transformIntoHeaderMap($http_response_header))) {
			$this->raw = gzdecode($this->raw);
		}
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
}

