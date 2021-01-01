<?php



if (file_exists('login.php')) {
	require_once("login.php");
}

require_once('common_bookseries.php');

$debug = !!isset($_REQUEST["debug"]);

if (isset($_REQUEST["action"])) {
	error_reporting(E_ALL);

	switch ($_REQUEST["action"]) {
		case "getkoboinfo":
			$scraper = new KoboScraper($_REQUEST["id"]);
			$scraper->read($debug);
			$data = $scraper->extractAllData();
			header("Content-type: application/json");
			echo json_encode(array(
				"id" => $_REQUEST["id"],
				"data" => $data
			));
			die();
			break;
		case "getkindleasin":
			$lang = isset($_REQUEST["lang"]) ? $_REQUEST["lang"] : "jp";
			switch($lang) {
				default:
				case "jp":
					$scraper = new AmazonJpAsinScraper($_REQUEST["asin"]);
					break;
				case "en":
					$scraper = new AmazonComAsinScraper($_REQUEST["asin"]);
					break;
			}
			$scraper->read($debug);
			$kindleAsin = $scraper->extractKindleAsin();
			header("Content-type: application/json");
			echo json_encode(array(
				"asin" => $_REQUEST["asin"],
				"lang" => $lang,
				"kindleAsin" => $kindleAsin
			));
			die();
			break;

		case 'getpubdateasin':
			if (!isset($_REQUEST["asin"])) {
				header("HTTP/1.1 400 Bad Request");
				die();
			}
				
			sleep(1);

			$lang = isset($_REQUEST["lang"]) ? $_REQUEST["lang"] : "jp";
			switch($lang) {
				default:
				case "jp":
					$scraper = new AmazonJpAsinScraper($_REQUEST["asin"]);
					break;
				case "en":
					$scraper = new AmazonComAsinScraper($_REQUEST["asin"]);
					break;
			}
			
			$scraper->read($debug);
			$pubdate = $scraper->extractPubDate();
			header("Content-type: application/json");
			echo json_encode(array(
				"asin" => $_REQUEST["asin"],
				"lang" => $lang,
				"pubdate" => $pubdate
			));
			
			die();
			break;
		
		default:
			die();
			break;
	}
}