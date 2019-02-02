var dev = $("#distribute-emails-validation");
var det = $("#distribute-emails-textarea");

(function loadExistingDetails() {

	// Populate the textarea when emails already entered previously
	if(existingEmails && existingEmails.length > 0) {
		var existingEmailsStr = existingEmails.join("\n");
		det.val(existingEmailsStr);
		$("#saved-notification-distribution").addClass("show");
		$("#li-distribution").addClass("completed");
		checkFormCompletion();
		//det.trigger('input');		
		var devHtml = "";
		for(var i = 0; i < existingEmails.length; i++) {
			devHtml += "<i class=\"fa fa-check\" title=\"This is a valid email address.\"></i><br/>\n"	
		}
		$("#distribute-emails-count").html(existingEmails.length);
		dev.html(devHtml)

		$("#input-range-group").removeClass("disabled");
		$("#input-range-group havent-started").hide();
		$("#input-overlap").attr("max", existingEmails.length + 1);	
		$("#input-range-group .right").html(existingEmails.length + 1);	
		updateOverlapSummary();
		checkProjectOptionsCompletion();

	}
	if(distributeSelf == "true") {
		$("#distribute-self-button").click();
		$("#saved-notification-distribution").addClass("show");
		$("#li-distribution").addClass("completed");
		$("#input-range-group .inapplicable").show();		
		$("#input-range-group .havent-started").hide();	
		updateOverlapSummary();
		checkProjectOptionsCompletion();
	} else if(distributeSelf == "false") {
		$("#input-range-group havent-started").show();
		$("#distribute-to-emails-button").click();
	}
})();


(function() {

	// A simple email validation regex.
	var validateEmailRegex = function(val) {
	  return (/.+\@.+\..+/i.test(val) && val.length <= 254);
	}


	var emailsValidatingTimeout;
	var uploadingEmails = false;
	var safeToValidateEmails = true;
	det.autosize( {
		minRows: 10,
	});

	function uploadEmails() {
		var devHtml = "";

		console.log("Validating emails...");

		var emails = det.val().split("\n");
		var validEmails = new Set();
		
		for(var i = 0; i < emails.length; i++) {
			if(emails[i] == userEmail) {
				devHtml += "<i class=\"fa fa-close " + (emails[i].length == 0 ? "hide" : "") + "\" title=\"There is no need to add your own email address to the list.\"></i><br/>\n"
			} else {
				if(validateEmailRegex(emails[i])) {
					validEmails.add(emails[i]);
					if(validEmails.size > MAX_EMAILS) {
						devHtml += "<i class=\"fa fa-exclamation-triangle\" title=\"You may only enter up to " + MAX_EMAILS + " unique emails.\"></i><br/>\n"
					} else{
						devHtml += "<i class=\"fa fa-check\" title=\"This is a valid email address.\"></i><br/>\n"
					}	
				} else {
					devHtml += "<i class=\"fa fa-close " + (emails[i].length == 0 ? "hide" : "") + "\" title=\"This is not a valid email address.\"></i><br/>\n"
				}				
			}

		}
		dev.html(devHtml)
		$("#distribute-emails-count").html(validEmails.size);
		$("#distribute-emails-count").removeClass("too-many");
		$("#distribute-emails-warning").removeClass("show");
		if(validEmails.size > MAX_EMAILS) {
			$("#distribute-emails-count").addClass("too-many");
			$("#distribute-emails-warning").addClass("show");
		}
		console.log(emails)
		$.ajax(
		{
			url: 			'upload-emails',
			type:			'POST',
			data: 			{emails: emails, distribute_self: false},
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
			complete: function()
			{
				//$form.removeClass( 'is-uploading' );
			},
			success: function( data )
			{					
				//$("#input-range-group .havent-started").hide();
				$("#input-range-group .inapplicable").hide();
				$("#error-banner").removeClass("show");
				console.log("done")
				// Only display the 'saved' notification if there is at least one valid email.

				var nvalid = (dev).find("i.fa-check").length

				if( nvalid > 0) {
					$("#saved-notification-distribution").addClass("show");
					$("#li-distribution").addClass("completed");
					checkFormCompletion();

					$("#input-range-group").removeClass("disabled");
					// Modify the slider
					$("#input-overlap").attr("max", nvalid + 1);	
					$("#input-range-group .right").html(nvalid + 1);	

					updateOverlapSummary();
				} else {
					$("#input-range-group").addClass("disabled");
					$("#input-range-group inapplicable").show();
				}
				
			},
			error: function()
			{								
				displayServerErrorBanner();
			}
		});			
	}

	// Upload emails when clicking the "I'll annotate the data myself" button.
	// This also posts to "upload-emails", but with "distribute_self" set to true.
	function uploadEmailsSelf() {
		$("#input-range-group").addClass("disabled");
		$("#input-range-group .havent-started").show();
		$("#input-range-group .inapplicable").hide();
		var emails = [''];
		$.ajax(
		{
			url: 			'upload-emails',
			type:			'POST',
			data: 			{emails: emails, distribute_self: true},
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
			success: function( data )
			{					
				$("#input-overlap").attr("max", 1);
				$("#saved-notification-distribution").addClass("show");
				$("#li-distribution").addClass("completed");
				checkFormCompletion();
				$("#input-range-group .havent-started").hide();
				$("#error-banner").removeClass("show");
				$("#input-range-group").addClass("disabled");
				$("#input-range-group .inapplicable").show();
				$("#input-range-group .right").html(1);	
				updateOverlapSummary();
			},
			error: function()
			{								
				displayServerErrorBanner();
			}
		});
	}	


	det.on('input', function(e) {

		$("#input-range-group").addClass("disabled");
		$("#input-range-group inapplicable").show();


		$("#saved-notification-distribution").removeClass("show");
		$("#li-distribution").removeClass("completed");	
		checkFormCompletion();

		// Remove validation mark from line user edited
		var ln = $(this).val().substr(0, $(this)[0].selectionStart).split("\n").length;

		var c = dev.children("i")
		if(c[ln-1])
			$(c[ln-1]).addClass("hide");
		console.log(ln);
		window.clearTimeout(emailsValidatingTimeout);
		emailsValidatingTimeout = window.setTimeout(uploadEmails, 1000);
		uploadingEmails = true;
	})

	$("#distribute-self-button").on('click', function() {
		$("#saved-notification-distribution").removeClass("show");
		$("#li-distribution").removeClass("completed");	
		
		//$("#input-range-group .inapplicable").show();		
		//$("#input-range-group .havent-started").hide();	
		window.clearTimeout(emailsValidatingTimeout);
		emailsValidatingTimeout = window.setTimeout(uploadEmailsSelf, 1000);
		uploadingEmails = true;

		$("#li-project-options").removeClass("completed");
		$("#saved-notification-project-options").removeClass('show');
		$("#input-range-group").addClass("disabled");	
		$("#input-range-group .inapplicable").hide();		
		$("#input-range-group .havent-started").show();	
		//updateOverlapSummary();

		checkFormCompletion();

	});
	$("#distribute-to-emails-button").on('click', function() {
		$("#saved-notification-distribution").removeClass("show");
		$("#li-distribution").removeClass("completed");	
		checkFormCompletion();
		$("#input-range-group .inapplicable").hide();		
		$("#input-range-group .havent-started").show();		
		window.clearTimeout(emailsValidatingTimeout);
		emailsValidatingTimeout = window.setTimeout(uploadEmails, 1000);
		uploadingEmails = true;

		$("#li-project-options").removeClass("completed");	
		$("#saved-notification-project-options").removeClass('show');

	});




})();