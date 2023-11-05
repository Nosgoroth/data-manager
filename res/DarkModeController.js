

class DarkModeController {
	static isDarkMode() {
		return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
	}
	static listen(callback) { // callback(isDarkMode)
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
			callback(event.matches);
		});
	}
}

function userAgentMatchesRegex(regexString) {
	return !!window.navigator.userAgent.match(new RegExp(regexString, "i"));
}
function userAgentMatchesAnyRegex(regexStringArray){
	for (var i = 0; i < regexStringArray.length; i++) {
		if (userAgentMatchesRegex(regexStringArray[i])) {
			return true;
		}
	}
	return false;
}

function setDarkModeClasses(isDarkMode) {
	let selectedModeIsDark;
	const cfg = window._globalConfig;
	switch (cfg.get("dark_mode", "follow-system")) {
		case "light": selectedModeIsDark = false; break;
		case "dark": selectedModeIsDark = true; break;
		case "follow-system":
		default:
			selectedModeIsDark = isDarkMode;
			break;
	}
	if (userAgentMatchesAnyRegex(cfg.get("force_light_mode_for_user_agent", []))) {
		selectedModeIsDark = false;
	} else if (userAgentMatchesAnyRegex(cfg.get("force_dark_mode_for_user_agent", []))) {
		selectedModeIsDark = true;
	}
	jQuery("body").toggleClass("dark-mode", selectedModeIsDark);
}