<?php

if (file_exists('../../login.php')) {
	require_once("../../login.php");
}
require_once("../../common.php");

?><!DOCTYPE html><html><head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, user-scalable=no" />

	<title>BookCheck</title>
	
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

	<h2>BookCheck</h2>

	<hr/>

	<div id="physdigital-app" class="physdigital-app"></div>

	<div id="physdigitalsrc-app" class="physdigital-app"></div>

	<hr/>

	<h3>Series with issues</h3>

	<p>Issue types sorted by proximity to release. Local overdue has a 30 days lead-in time.</p>

	<div id="issues-app"></div>

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
<?php if (file_exists("issuesOptions.js")) { ?>
	<?php
	$fmt = @filemtime("issuesOptions.js");
	$fmt = $fmt ? $fmt : 0;
	?>
	<script type='text/javascript' src='issuesOptions.js?t=<?= $fmt ?>'></script>
<?php } ?>
<script>
	window._do_configs = {};
	<?php
		foreach(glob("../../config/*.json") as $configFile) {
			try {
				$fn = strtolower(basename($configFile, ".json"));
				if (strpos($fn, '_example') !== false) {
					continue;
				}
				$c = @file_get_contents($configFile);
				$d = @json_clean_decode($c);
				if (!$d) {
					throw new Exception("Invalid JSON in config file $configFile");
				}
				?>
				window._do_configs[<?= json_encode($fn) ?>] = <?= $c ?>;
				<?php
			} catch(Exception $e) {
				// pass
				?>
				console.warn(<?= json_encode($e->getMessage()) ?>);
				<?php
			}
		}
	?>
</script>
	
</body></html>