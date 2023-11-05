

jQuery(document).ready(() => {
	setDarkModeClasses(DarkModeController.isDarkMode());
	DarkModeController.listen(setDarkModeClasses);
});

