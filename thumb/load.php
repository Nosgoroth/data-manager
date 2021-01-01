<?php

if (!function_exists('readfile_chunked')) {
    function readfile_chunked ($filename) {
      $chunksize = 1024; // how many bytes per chunk
	  $handle = fopen($filename, 'rb');
	  if ($handle === false) {
		return false;
	  }
	  while (!feof($handle)) {
		print fread($handle, $chunksize);
	  }
	  return fclose($handle);
	}
}


function download_file($url, $file, $context = null) {
	$bin = file_get_contents($url, false, $context);
	$fh = fopen($file, 'w');
	fwrite($fh, $bin);
	fclose($fh);
	return true;
}


require_once( dirname(__FILE__). "/ThumbManager.php");

$TM = new ThumbManager( '.' );