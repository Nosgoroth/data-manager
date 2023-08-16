<!DOCTYPE html>
<html>
<head>
	<title>Test</title>
</head>
<body>

	<form action="./ajax_bookseries.php">
		<input type="hidden" name="action" value="getkindleasin" />
		<select name="lang">
			<option value="en">Amazon US</option>
			<option value="jp">Amazon JP</option>
		</select>
		ASIN: <input type="text" name="asin" value="" />
		<button type="submit">Submit</button>
	</form>

</body>
</html>
