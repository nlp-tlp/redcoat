// Render the success box ("this section has been saved") on a form section and add a tick to the corresponding element in the sidenav.
// Render details about the saved object into the appropriate div.
// Used for the Dataset and Distribution sections.
function renderSuccessBox(metadata, form_ele, success_details_ele, sidenav_li_ele, saved_notification_ele) {
	form_ele.addClass( 'is-success' );
	form_ele.removeClass( 'is-error' );
	var details = "<table><tbody>";
	for(var i = 0; i < metadata.length; i++) {
		var k = Object.keys(metadata[i])[0];
		var v = metadata[i][k];
		details += "<tr><td><b>" + k + ":</b></td><td>" + v + "</td><tr/>";
	}
	details += "</tbody></table>"
	success_details_ele.html(details); // remove final <br/> tag.
	saved_notification_ele.addClass('show');
	sidenav_li_ele.addClass('completed');
	checkFormCompletion();
}

