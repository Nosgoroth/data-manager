/*
Copy this file as `issuesOptions.js` and change the options to your liking. You can remove or comment out as many as you want. Changes to this `_example.js` file won't do anything.
*/

bookSeriesAjaxInterface.setIssuesOptions({
    
	// If a series has the "backlog" status, ignore its issues (all issues, local issues or source issues)
    ignoreAllIssuesOnBacklog: true,
    ignoreLocalIssuesOnBacklog: true,
    ignoreSourceIssuesOnBacklog: true,

    // If no volume of a series has a local ASIN, ignore its local issues
    ignoreLocalIssuesForSeriesWithoutAnyLocalAsin: true,

    // If a series has the "announced" status, ignore the PreorderAvailable issue
    ignorePreorderAvailableForAnnounced: true,

    // To be frank, I don't remember what this does
    showSourceWaitingWhenNotAllVolumesOwned: false,
    
    // Offset in which to show LocalOverdue and SourceOverdue issues
    localOverdueOffset: 60*60*24*30,
    sourceOverdueOffset: 60*60*24*30,
});