if(automaticTagging === "true" && Object.keys(automaticTaggingDictionaryMetadata).length > 0) renderSuccessBox(automaticTaggingDictionaryMetadata, $("#form-upload-dictionary"), $("#form-upload-dictionary").find('.box__success_details'), $("#li-upload-dictionary"), $("#saved-notification-upload-dictionary"));

console.log(automaticTaggingDictionaryMetadata);


(function loadExistingDetails() {
	console.log("automatic tagging: ", automaticTagging);
	if(automaticTagging === "true") {		
		$("#use-dictionary-button").click();
	} else if(automaticTagging === "false") {
		$("#dont-use-dictionary-button").click();
	}	
})();


// Upload emails when clicking the "I'll annotate the data myself" button.
// This also posts to "upload-emails", but with "distribute_self" set to true.
function toggleDontUseDictionary() {
	$("#li-dictionary").removeClass("completed");
	$.ajax(
	{
		url: 			'upload-automatic-tagging',
		type:			'POST',
		data: 			{use_automatic_tagging: false},
		dataType: 		"json",
		headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
		success: function( data )
		{					
			$("#saved-notification-upload-dictionary").addClass("show");
			$("#li-upload-dictionary").addClass("completed");
			checkFormCompletion();			
			$("#error-banner").removeClass("show");
			console.log(data)
			automaticTagging = false;
		},
		error: function()
		{								
			displayServerErrorBanner();
		}
	});
}	

function clearDictionaryUploadForm() {
	$("#form-upload-dictionary").removeClass("is-error")
	$("#form-upload-dictionary").removeClass("is-success")
	console.log('why')
}

$("#dont-use-dictionary-button").click(function() {
	clearDictionaryUploadForm();
	toggleDontUseDictionary();
})

$("#use-dictionary-button").click(function() {
	if(!automaticTagging) {
		$("#li-upload-dictionary").removeClass("completed");
		$("#saved-notification-upload-dictionary").removeClass("show");
	}
	automaticTagging = true;
})