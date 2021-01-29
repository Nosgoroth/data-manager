<?php


if (file_exists('login.php')) {
	require_once("login.php");
}


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
	<script async src="https://code.highcharts.com/highcharts.src.js"></script>
	<script async src="https://code.highcharts.com/themes/high-contrast-dark.js"></script>
	<script async src="https://cdnjs.cloudflare.com/ajax/libs/async/2.6.1/async.min.js"></script>
	<script type='text/javascript' src='https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.18.0/js/md5.min.js'></script>
	<script src="//cdn.jsdelivr.net/npm/less@3.13" ></script>

	<script type='text/javascript' src='res/doop/oop.js'></script>
	<script type='text/javascript' src='res/doop/do.js'></script>
	<script type='text/javascript' src='res/doop/col.js'></script>
	<script type='text/javascript' src='res/doop/jquery.creation_extensions.js'></script>
	<script type='text/javascript' src='res/doop/do.extension.DataObjectFormRenderer.js'></script>
	<script type='text/javascript' src='res/doop/do.extension.DataObjectRenderer.js'></script>
	<script type='text/javascript' src='res/doop/logger.js'></script>
	<script type='text/javascript' src='res/doop/ReadyObject.js'></script>
	<script type='text/javascript' src='res/doop/JsonAjaxInterface.js'></script>
	<script type='text/javascript' src='res/doop/DataObjectCollectionEditor.js'></script>

	<!-- App source -->
	<script type='text/javascript' src='cdoe.js'></script>
	<?php
		foreach(glob("do/*DO.js") as $DOfile) {
			$fmt = @filemtime($DOfile);
			$fmt = $fmt ? $fmt : 0;
			?><script type='text/javascript' src='<?= $DOfile ?>?t=<?= $fmt ?>'></script><?php
		}
	?>

	<?php if (isset($_REQUEST["type"])) { ?>
	<script type="text/javascript">
		customMultiDataObjectEditor.setDefaultType(<?= json_encode($_REQUEST["type"]) ?>);
	</script>
	<?php } ?>
	

</div>
</body></html>