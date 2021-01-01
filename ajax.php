<?php




if (file_exists('login.php')) {
	require_once("login.php");
}

require_once('class.JsonRequest.php');

if (!is_dir("_data")) {
	mkdir("_data");
}

if (isset($_REQUEST["action"])) {
	error_reporting(0);
	$domain = isset($_REQUEST["domain"]) ? $_REQUEST["domain"] : null;
	if (!$domain) {
		die();
	}
	$domain = preg_replace("/[^\d\w]*/", "", strtolower($domain));
	$jsonRequest = new JsonRequestDomain($domain);

	switch ($_REQUEST["action"]) {

		case 'ajaxload':
			header("Content-Type: application/json");
			print $jsonRequest->readRaw();
			die();
			break;

		case 'select':
			try {
				$options = isset($_REQUEST["options"]) ? json_decode($_REQUEST["options"]) : null;
			} catch (Exception $e) {
				//pass
			}

			if (!is_array($options)) {
				$options = array();
			}

			header("Content-Type: application/json");
			print $jsonRequest->selectRaw($options);
			die();
			break;

		case 'update':
			try {
				if (!isset($_REQUEST["options"])) { throw new Exception("Options array is required"); }
				$options = json_decode($_REQUEST["options"]);
				if (!is_array($options)) { throw new Exception("Options needs to be an array", 1); }
				if (!isset($_REQUEST["data"])) { throw new Exception("Data object is required"); }
				$data = json_decode($_REQUEST["data"]);

				$jsonRequest->update($data, $options);
				
			} catch (Exception $e) {
				header("HTTP/1.1 400 Bad Request");
				die($e->getMessage());
			}
			
			die();
			break;

		case 'delete':
			try {
				if (!isset($_REQUEST["options"])) { throw new Exception("Options array is required"); }
				$options = json_decode($_REQUEST["options"]);
				if (!is_array($options)) { throw new Exception("Options needs to be an array", 1); }

				$jsonRequest->delete($options);
				
			} catch (Exception $e) {
				header("HTTP/1.1 400 Bad Request");
				die($e->getMessage());
			}
			
			die();
			break;

		case 'ajaxsave':
			if (isset($_REQUEST["data"])) {
				$jsonRequest->writeRaw($_REQUEST["data"]);
				header("HTTP/1.1 200 OK");
			} else {
				header("HTTP/1.1 400 Bad Request");
			}
			die();
			break;
		
		default:
			die();
			break;
	}
}