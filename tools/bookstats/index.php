<?php


if (file_exists('../../login.php')) {
	require_once("../../login.php");
}


?><!DOCTYPE html><html><head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, user-scalable=no" />

	<title>Book Stats</title>
	
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap.min.css" integrity="sha512-dhpxh4AzF050JM736FF+lLVybu28koEYRrSJtTKfA4Z7jKXJNQ5LcxKmHEwruFN2DuOAi9xeKROJ4Z+sttMjqw==" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap-responsive.min.css" integrity="sha512-S6hLYzz2hVBjcFOZkAOO+qEkytvbg2k9yZ1oO+zwXNYnQU71syCWhWtIk3UYDvUW2FCIwkzsTcwkEE58EZPnIQ==" crossorigin="anonymous" />
	<?php
	$fmt = @filemtime('../../style.less');
	$fmt = $fmt ? $fmt : 0;
	?>
	<link rel="stylesheet/less" type="text/css" href="../../style.less?t=<?= $fmt ?>" />
	<?php
	$fmt = @filemtime('style.less');
	$fmt = $fmt ? $fmt : 0;
	?>
	<link rel="stylesheet/less" type="text/css" href="style.less?t=<?= $fmt ?>" />
	
	<meta name="robots" content="noindex" />
</head>
<body class="">
<div class="container">

	<h2>Book stats</h2>

	<p><small>Before 2021, bought books are assumed to be bought upon release, and read books read upon purchase.</small></p>

	<hr/>

	<div id="book-stats-summary-app"></div>

	<h3>By year</h3>

	<div id="book-stats-year-app"></div>

	<h3>By month</h3>

	<div id="book-stats-month-app"></div>

</div>

<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery.waitforimages/2.4.0/jquery.waitforimages.min.js"></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js'></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js'></script>
<script async src="https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js"></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js'></script>
<script src="//cdn.jsdelivr.net/npm/less@3.13" ></script>

<!-- DOOP -->
<script type='text/javascript' src='../../res/doop/oop.js'></script>
<script type='text/javascript' src='../../res/doop/do.js?t=20200711'></script>
<script type='text/javascript' src='../../res/doop/col.js'></script>
<script type='text/javascript' src='../../res/doop/jquery.creation_extensions.js'></script>
<script type='text/javascript' src='../../res/doop/do.extension.DataObjectFormRenderer.js'></script>
<script type='text/javascript' src='../../res/doop/do.extension.DataObjectRenderer.js'></script>
<script type='text/javascript' src='../../res/doop/logger.js'></script>
<script type='text/javascript' src='../../res/doop/ReadyObject.js'></script>
<script type='text/javascript' src='../../res/doop/JsonAjaxInterface.js'></script>

<!-- App source -->
<?php
$fmt = @filemtime("../../do/BookSeriesDO.js");
$fmt = $fmt ? $fmt : 0;
?>
<script type='text/javascript' src='../../do/BookSeriesDO.js?t=<?= $fmt ?>'></script>

<!-- Checker source -->
<?php
$fmt = @filemtime("main.js");
$fmt = $fmt ? $fmt : 0;
?>
<script type='text/javascript' src='main.js?t=<?= $fmt ?>'></script>
	
</body></html>