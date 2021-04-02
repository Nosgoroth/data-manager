/*
Copy this file as `issuesOptions.js` and change the options to your liking
*/

bookSeriesAjaxInterface.setIssuesOptions({
    // ignoreAllIssuesOnBacklog: true,
    ignoreLocalIssuesOnBacklog: true,
    // ignoreSourceIssuesOnBacklog: true,
    ignorePreorderAvailableForAnnounced: true,
    showSourceWaitingWhenNotAllVolumesOwned: false,
    localOverdueOffset: 60*60*24*30,
    sourceOverdueOffset: 60*60*24*30,
});