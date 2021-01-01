<?php

$content = @file_get_contents("http://aincrad.cc/data/bookpreordercalendar.php", false, stream_context_create(array(
	'timeout' => 5
)));

$cachepath = __DIR__."/../userjs_cache/_bookpreordercal.ical";

if ($content) {
	file_put_contents($cachepath, $content);
	header('Content-type: text/calendar; charset=utf-8');
	header('Content-Disposition: inline; filename=bookseriespreorder.ics');
	echo $content;
} else {
	if (file_exists($cachepath)) {
		$content = @file_get_contents($cachepath);
		if ($content) {
			header('Content-type: text/calendar; charset=utf-8');
			header('Content-Disposition: inline; filename=bookseriespreorder.ics');
			echo $content;
		} else {
			header("HTTP/1.1 404 Not Found");
		}
	} else {
		header("HTTP/1.1 404 Not Found");
	}
}
die();