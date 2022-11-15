<?php


if (file_exists('../login.php')) {
	require_once("../login.php");
}



//error_reporting(0);

require_once( __DIR__. "/load.php");

$action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : 'thumb';
$path = isset($_REQUEST["path"]) ? $_REQUEST["path"] : null;
$id = isset($_REQUEST["id"]) ? $_REQUEST["id"] : null;
$context = isset($_REQUEST["context"]) ? $_REQUEST["context"] : null;

$fromurl = isset($_REQUEST["url"]) ? $_REQUEST["url"] : null;
$refreshurl = isset($_REQUEST["refreshurl"]);
$maxAge = isset($_REQUEST["maxage"]) ? intval($_REQUEST["maxage"]) : null; //seconds

$width = isset($_REQUEST["w"]) ? intval($_REQUEST["w"]) : null;
if ($width) {
    $TM->size = $width;
}


if ($fromurl && $path) {
    if ($refreshurl && file_exists($path)) {
        unlink($path);
    }
    if ($maxAge && file_exists($path) && time()-filemtime($path) > $maxAge) {
        unlink($path);
    }
    if (!file_exists($path)) {
        download_file($fromurl, $path, stream_context_create([
            "http" => [
                "header" => implode([
                    "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15"
                ], "\r\n")
            ]
        ]));
    }
}


switch($action) {
    case 'echo':
        if ($path) {
            header('Content-Type: image/jpeg');
            readfile_chunked($path);
            exit();
        }
    case 'thumb':
        $thumb = false;
        if ($path) {
            $thumb = $TM->getThumbFile($path, null, $context);
        } else if ($id) {
            $thumb = $TM->getThumbFromID($id, $context);
        }
        if ($thumb) {
            header('Content-Type: image/jpeg');
            readfile_chunked($thumb);
            exit();
        }
        break;
    case 'generateid':
        if (!$path) { break; }
        $TM->getThumbFile($path, null, $context);
        $id = $TM->getInfileID($path, $context);
        header("Content-type: application/json");
        print json_encode( array( "ID" => $id ) );
        exit();
        break;
    default:
        die("Thumbs");
        break;
}
