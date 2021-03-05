function checkProjectOptionsCompletion() {
	//if($("#input-automatic-tagging").val() != null && $("#input-hierarchy-permissions").val() != null) {
	if($("#input-hierarchy-permissions").val() != null) {
		$("#saved-notification-project-options").addClass('show');
		$("#li-project-options").addClass('completed');
		$("#error-banner").removeClass("show");	
		console.log('checking222')
		checkFormCompletion();				
	}
}

(function loadExistingDetails() {
	(function loadPermissions() {		
		var o = $("#input-hierarchy-permissions option[value=\"" + permissions + "\"]");
		if(o) {
			//console.log(o, permissions)
			// TODO: check the overlap slider before marking complete				
			o.attr("selected", "selected");			
		}
	})();
	(function loadOverlap() {	
		var o = $("#input-overlap");
		console.log(o, overlap)
		if(overlap) {
			o.val(overlap);
			//checkProjectOptionsCompletion();
		}
	})();

	// (function loadAutomaticTagging() {			
		
	// 	var o = $("#input-automatic-tagging option[value=\"" + automaticTagging + "\"]");
	// 	if(o) {
	// 		o.attr("selected", "selected");
	// 	}
	// })();
	// checkProjectOptionsCompletion();
})();








// 1. Category hierarchy permissions

$("#input-hierarchy-permissions").on('change', function(e) {
	$("#saved-notification-project-options").removeClass('show');
	$("#li-project-options").removeClass('completed');
	console.log(this.value);
	$.ajax(
	{
		url: 			'upload-hierarchy-permissions',
		type:			'POST',
		data: 			{ val: this.value },
		dataType: 		"json",
		headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
		success: function( data )
		{
			checkProjectOptionsCompletion();
		},
		error: displayServerErrorBanner
	});						
});


// 2. Overlap summary

var ion = $("#input-overlap-summary .num");
var ioa = $("#input-overlap-summary .avg");
var iop = $("#input-overlap-summary .plural");		
var iov = $("#input-overlap");		

function updateOverlapSummary(upload=true) {
	var numAnnotators = parseInt($("#input-range-group .right").html());
	var v = iov.val();
	ion.html(v);
	ioa.html((1 / numAnnotators * v * 100).toFixed(2));
	if(v > 1) iop.html("s");
	else iop.html("");

	if(upload) {
		$.ajax(
		{
			url: 			'upload-overlap',
			type:			'POST',
			data: 			{ val: iov.val() },
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
			success: function( data )
			{
				checkProjectOptionsCompletion();
			},
			error: displayServerErrorBanner
		});			
	}
		
}

(function() {
	iov.on('input', function() {
		updateOverlapSummary();
	});

	updateOverlapSummary(false);
})();

// 3. Automatic Tagging

// var iat = $("#input-automatic-tagging");

// iat.on('change', function() {
// 	$("#saved-notification-project-options").removeClass('show');
// 	$("#li-project-options").removeClass('completed');
// 	console.log(this.value);
// 	$.ajax(
// 	{
// 		url: 			'upload-automatic-tagging',
// 		type:			'POST',
// 		data: 			{ val: this.value },
// 		dataType: 		"json",
// 		headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
// 		success: function( data )
// 		{
// 			checkProjectOptionsCompletion();				
// 		},
// 		error: displayServerErrorBanner
// 	});							
// })


