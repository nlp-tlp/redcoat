var $finalSubmissionBox = $("#final-submission-box");
function checkFormCompletion() {
	console.log("checking");
	var notComplete = $(".saved-notification:not(.show)").length;
	if(notComplete == 0) {
		$finalSubmissionBox.removeClass("disabled");
	} else {
		$finalSubmissionBox.addClass("disabled");
	}
}