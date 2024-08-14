(function() {

	var $invitationsMenu = $("#invitations-menu");
	var $invitationsButton = $("#invitations-button");
	var $invitesCount = $("#invites-count");
	var invitesCountNum = $invitesCount.html();

	$("#invitations-menu > *").click(function(e) {
		$invitationsButton.focus();
	});

	$("#invitations-menu button").click(function(e) {
		

		var t = $(this);
		var $form = t.parent("form");
		var formAction = t.attr("formaction");
		var url = $form.attr("action") + formAction;
		console.log(url);

		$form.addClass("hide");
		
		$loading = $form.parent("span.invite").find("span.invite-form-loading").first();
		$accepted = $form.parent("span.invite").find("span.invite-form-accepted").first();
		$declined = $form.parent("span.invite").find("span.invite-form-declined").first();

		$loading.addClass("show");
		$.ajax({
			url: 			url,
			type:			'POST',
			data: 			{ val: $form.value },
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken },
			success: function( data )
			{



				console.log("success");
				$loading.removeClass("show");

				if(formAction == "/accept") {
					$accepted.addClass("show");
				} else if(formAction == "/decline") {
					$declined.addClass("show");
				}

				invitesCountNum--;
				$invitesCount.html(invitesCountNum);
				if(invitesCountNum == 0) {
					$invitesCount.hide();
					$invitationsMenu.addClass("inactive");
				}
				
			},
			error: function(data) {
				console.log(data);
			}
			});	
		e.preventDefault();
	});

})();