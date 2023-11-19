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
	<?php
	if (file_exists("../../style_custom.less")) {
		$fmt = @filemtime('../../style_custom.less');
		$fmt = $fmt ? $fmt : 0;
		?><link rel="stylesheet/less" type="text/css" href="../../style_custom.less?t=<?= $fmt ?>" /><?php
	}
	?>
	
	<meta name="robots" content="noindex" />
</head>
<body class="bookstats">
<div class="container">

	<h2>Book stats</h2>

	<p><small>Unless otherwise specified, bought books are assumed to be bought upon release, and read books read upon purchase.</small></p>

	<hr/>

	<div id="book-stats-summary-app"></div>

	<h3>By month</h3>

	<p><small>Graph shows last 18 months</small></p>

	<div id="book-stats-graph-month"></div>

	<br/>

	<button type="button" class="btn btn-inverse btn-small" data-toggle="collapse" data-target="#book-stats-month-app">Toggle data table</button>
	<div id="book-stats-month-app" class="collapse"></div>

	<h3>By year</h3>

	<div id="book-stats-graph-year"></div>

	<br/>

	<button type="button" class="btn btn-inverse btn-small" data-toggle="collapse" data-target="#book-stats-year-app">Toggle data table</button>
	<div id="book-stats-year-app" class="collapse"></div>

	<h3>JNC credit usage by month</h3>
	<p><small>Preorder dates, or purchase dates if not available. Older figures may be unreliable.</small></p>

	<div class="btn-group">
		<button type="button" class="btn btn-inverse btn-small" data-toggle="collapse" data-target="#book-stats-graph-jnc-year">Toggle yearly graph</button>
		<button type="button" class="btn btn-inverse btn-small" data-toggle="collapse" data-target="#book-stats-graph-jnc-month">Toggle monthly graph</button>
		<button type="button" class="btn btn-inverse btn-small" data-toggle="collapse" data-target="#book-stats-jnc-app">Toggle monthly data table</button>
	</div>
	
	<div id="book-stats-graph-jnc-year"></div>
	<div id="book-stats-graph-jnc-month" class="collapse"></div>
	<div id="book-stats-jnc-app" class="collapse"></div>

</div>

<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery.waitforimages/2.4.0/jquery.waitforimages.min.js"></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js'></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js'></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js"></script>
<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js'></script>
<script src="//cdn.jsdelivr.net/npm/less@3.13" ></script>
<script src="https://code.highcharts.com/highcharts.src.js"></script>
<script src="https://code.highcharts.com/themes/high-contrast-dark.js"></script>

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

<script type='text/javascript' src='../../res/ConfigHandler.js'></script>
<script type='text/javascript' src='../../res/DarkModeController.js'></script>
<script type='text/javascript' src='../../main.js'></script>

<!-- App source -->
<?php
$fmt = @filemtime("../../do/BookSeriesDO.js");
$fmt = $fmt ? $fmt : 0;
?>
<script type='text/javascript' src='../../do/BookSeriesDO.js?t=<?= $fmt ?>'></script>

<script type="text/javascript">
	window._dataset = <?= json_encode(isset($_REQUEST["dataset"]) ? $_REQUEST["dataset"] : null) ?>;
</script>
<!-- Checker source -->
<?php
$fmt = @filemtime("main.js");
$fmt = $fmt ? $fmt : 0;
?>
<script type='text/javascript' src='main.js?t=<?= $fmt ?>'></script>
	
</body></html>