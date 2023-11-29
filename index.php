<?php


if (file_exists('login.php')) {
	require_once("login.php");
}
require_once("common.php");


?><!DOCTYPE html><html><head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
	<meta name="viewport" content="width=device-width, user-scalable=no" />

	<title>Data manager</title>
	
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap.min.css" integrity="sha512-dhpxh4AzF050JM736FF+lLVybu28koEYRrSJtTKfA4Z7jKXJNQ5LcxKmHEwruFN2DuOAi9xeKROJ4Z+sttMjqw==" crossorigin="anonymous" />
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/css/bootstrap-responsive.min.css" integrity="sha512-S6hLYzz2hVBjcFOZkAOO+qEkytvbg2k9yZ1oO+zwXNYnQU71syCWhWtIk3UYDvUW2FCIwkzsTcwkEE58EZPnIQ==" crossorigin="anonymous" />
	
	<?php
	$fmt = @filemtime('style.less');
	$fmt = $fmt ? $fmt : 0;
	?>
	<link rel="stylesheet/less" type="text/css" href="style.less?t=<?= $fmt ?>" />

	<?php
	if (file_exists("style_custom.less")) {
		$fmt = @filemtime('style_custom.less');
		$fmt = $fmt ? $fmt : 0;
		?><link rel="stylesheet/less" type="text/css" href="style_custom.less?t=<?= $fmt ?>" /><?php
	}
	?>
	
	<?php
		foreach(glob("styles/*DO.less") as $DOstyle) {
			$fmt = @filemtime($DOstyle);
			$fmt = $fmt ? $fmt : 0;
			?><link rel="stylesheet/less" type="text/css" href="<?= $DOstyle ?>?t=<?= $fmt ?>" /><?php
		}
	?>

	
	
	<meta name="robots" content="noindex" />
</head>
<body class="">

<div class="container">

	<div id="app">
		<header>
			<select class="typeselector">
				<option value="-">- Choose a type -</option>
			</select>
			<h3>Data manager</h3>
		</header>
		<div class="adoe_container"></div>
	</div>


	<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
	<script type='text/javascript' src="https://cdnjs.cloudflare.com/ajax/libs/jquery.waitforimages/2.4.0/jquery.waitforimages.min.js"></script>
	<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/2.3.2/js/bootstrap.min.js'></script>
	<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js'></script>
	<script src="https://code.highcharts.com/highcharts.src.js"></script>
	<script src="https://code.highcharts.com/themes/high-contrast-dark.js"></script>
	<script async src="https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js"></script>
	<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js'></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/less.js/3.13.1/less.js" ></script>
	
	<!-- App source -->
	
	<?php

		ScriptTag::generate("res/doop/oop.js");
		ScriptTag::generate("res/doop/do.js");
		ScriptTag::generate("res/doop/col.js");
		ScriptTag::generate("res/doop/jquery.creation_extensions.js");
		ScriptTag::generate("res/doop/do.extension.DataObjectFormRenderer.js");
		ScriptTag::generate("res/doop/do.extension.DataObjectRenderer.js");
		ScriptTag::generate("res/doop/logger.js");
		ScriptTag::generate("res/doop/ReadyObject.js");
		ScriptTag::generate("res/doop/JsonAjaxInterface.js");
		ScriptTag::generate("res/doop/DataObjectCollectionEditor.js");

		ScriptTag::generate("res/ConfigHandler.js");
		ScriptTag::generate("res/DarkModeController.js");
		
		ScriptTag::generate("cdoe.js");

		foreach(glob("do/*DO.js") as $DOfile) {
			ScriptTag::generate($DOfile);
		}

	?>
	<script>
		window._do_configs = {};
		<?php
			foreach(glob("config/*.json") as $configFile) {
				try {
					$fn = strtolower(basename($configFile, ".json"));
					if (strpos($fn, '_example') !== false) {
						continue;
					}
					$c = @file_get_contents($configFile);
					//$c = preg_replace('/\n\s*\n/', "\n", $c);  //Remove empty-lines
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

	<?php if (isset($_REQUEST["type"])) { ?>
	<script type="text/javascript">
		<?php
			$dataset = isset($_REQUEST["dataset"]) ? $_REQUEST["dataset"] : null;
		?>
		customMultiDataObjectEditor.setDefaultType(<?= json_encode($_REQUEST["type"]) ?>, <?= json_encode($dataset) ?>);
	</script>
	<?php } ?>

	<script type="text/javascript">
		window._customAjaxAvailable = <?= json_encode(glob("customajax_*.php")) ?>;
	</script>

	
	<?php
		ScriptTag::generate("main.js");
	?>
	

</div>
</body></html>