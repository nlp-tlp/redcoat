(function loadExistingDetails() {
	var existingProjName = project_name;
	var existingProjDesc = project_desc;
	if(existingProjName.length > 0) {
		$("#saved-notification-project-details").addClass("show");
		$("#li-project-details").addClass("completed");				
		$("#project-name-form input").val(existingProjName);
		$("#project-description-form").addClass("show");
		$("#project-description-form input").attr("tabindex", "0");
		checkFormCompletion();
	}
	if(existingProjDesc.length > 0) {
		$("#project-description-form input").val(existingProjDesc);
	}
})();


(function() {

	function uploadNameDesc() {

		var pn = $("#project-name-form input").val();
		var pd = $("#project-description-form input").val();
		var o = {
			"name": pn,
			"desc": pd
		}
		console.log(pn, pd, o)

		console.log("Saved");
		$.ajax(
		{
			url: 			'upload-namedesc',
			type:			'POST',
			data: 			o,
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
			complete: function()
			{
				//$form.removeClass( 'is-uploading' );
			},
			success: function( data )
			{
				if(!data.success) {
					$("#error-banner").addClass("show");
					return;
				}
				$("#error-banner").removeClass("show");
				console.log("done");
				if($("#project-name-form input").val().length > 0 && $("#project-name-form input")[0].checkValidity()) {
					$("#saved-notification-project-details").addClass("show");
					$("#li-project-details").addClass("completed");
					checkFormCompletion();
				}
			},
			error: function()
			{								
				displayServerErrorBanner();
			}
		});
	}

	// Project Name/Description
	var projnameTimeout;

	$("#input-project-name").on('input', function() {	// Show the description box after the user types something in the Project Name box.
		
		$("#saved-notification-project-details").removeClass("show");
		$("#li-project-details").removeClass("completed");
		checkFormCompletion();

		if($(this).val().length > 0 && $(this)[0].checkValidity()) {
			$("#project-description-form").addClass("show");
			$("#project-description-form input").attr("tabindex", "0");
		} else {
			$("#project-description-form").removeClass("show");
			$("#project-description-form input").attr("tabindex", "-1");
		}
		window.clearTimeout(projnameTimeout);
		projnameTimeout = window.setTimeout(uploadNameDesc, 1000);
	});

	$("#input-project-description").on('input', function() {
		$("#saved-notification-project-details").removeClass("show");
		$("#li-project-details").removeClass("completed");
		checkFormCompletion();
		window.clearTimeout(projnameTimeout);
		projnameTimeout = window.setTimeout(uploadNameDesc, 1000);
	});


})();