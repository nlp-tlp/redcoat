(function() {



	var categoryHierarchy = new CategoryHierarchy();

	function uploadCategoryHierarchy(data) {
		$("#saved-notification-entity-categories").removeClass("show");
		$("#li-entity-categories").removeClass("completed");
		$("#entity-categories-summary").addClass("uploading");
		$.ajax(
		{
			url: 			'upload-hierarchy',
			type:			'POST',
			data: 			{data: data},
			dataType: 		"json",
			headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
			complete: function()
			{
				//$form.removeClass( 'is-uploading' );
			},
			success: function( data )
			{
				console.log(data.metadata);
				console.log('yay labels!');
				if(data.success) {
					renderSuccessBox(data.metadata, $("#entity-categories-summary"), $("#entity-categories-summary-box"), $("#li-entity-categories"), $("#saved-notification-entity-categories"));
				} else {

					$("#entity-categories-summary").addClass("is-error")
				}
				
				$("#entity-categories-summary").removeClass("uploading");
			},
			error: function()
			{								
				displayServerErrorBanner();
			}
		});		

	}

	function showEntityCategoriesWindow() {
		$("#entity-categories-window").addClass("show");
		$('#main > *:not(#entity-categories-window').addClass("blur");
		$('#sidenav').addClass("blur");
		$('#navbar').addClass("blur");
		$('#entity-categories-summary').removeClass("is-success");
		$('#entity-categories-summary').removeClass("is-error");
	}
	function hideEntityCategoriesWindow() {
		$("#entity-categories-window").removeClass("show");
		$('#main > *:not(#entity-categories-window').removeClass("blur");
		$('#navbar').removeClass("blur");
		$('#sidenav').removeClass("blur");

		// Need to save the entities 
		//var entitySlashData = txt2slash($("#entity-categories-textarea").val().replace(/\t/g, " "));
		var entitySlashData = txt2slash($("#entity-categories-textarea").val());
		uploadCategoryHierarchy(entitySlashData);
		//console.log(entitySlashData);
	}



	$("#entity-categories-window .close").click(hideEntityCategoriesWindow);
	$("#button-create-entity-categories").click(showEntityCategoriesWindow);
		
	$("#er-body > *").hide();
	$("#er-body > *:nth-child(1)").show();
	$("#er-tabs a").on('click', function() {
		var i = $(this).closest('li').index();
		console.log(i);
		$("#er-tabs li").removeClass("active");
		$("#er-tabs li:nth-child(" + (i + 1) + ")").addClass("active");
		$("#er-body > *").hide();
		$("#er-body > *:nth-child(" + (i + 1) + ")").show();
	});

	function validateHierarchyInput(slash, done) {

		//var slash = txt2slash(txt);
		var ecv = $("#entity-categories-validation");

	    hierarchyValidator.validateCategoryHierarchy(slash, function(valid, em) {
			var eml = -1;
			if(!valid) {
				console.log("invalid tree");
				console.log(em);					
				eml = parseInt(em.slice(em.indexOf("<%") + 2, em.indexOf("%>")));    
			}
			if(em)
				em = em.replace(/<%\d+%>/g, (eml+1));

			$($("#entity-categories-text-form .lineno")[eml]).addClass("lineselect");
			done(valid, slash, em);
		});

	}

	$("#entity-categories-preset").change(function() {
		$("#entity-categories-text-form .lineno").removeClass("lineselect");
		var val = $(this).val();
		var preset = hierarchyPresets.presets[val]; 
		//var preset = slash2txt(hierarchyPresets.presets[val]); // the presets are stored in slash format, so we need to convert to txt first.
		//console.log(hierarchyPresets.presets[val], preset);
		$("#entity-categories-textarea").val(slash2txt(preset))
		//$("#entity-categories-textarea").val(preset.replace(/ /g, "\t"));
		validateHierarchyInput(preset, function(valid, slashData, errmsg) {
			if(valid) categoryHierarchy.buildTree(slashData);
			else categoryHierarchy.clearTree(errmsg);
		});			
	});

	var generatingTree = false;
	var treeGeneratingTimeout;

	var ect = $("#entity-categories-textarea");
	var ecv = $("#entity-categories-validation");

	ect.linedtextarea();

	function generateTree() {
		validateHierarchyInput(txt2slash(ect.val()), function(valid, slashData, errmsg) {
			if(valid) categoryHierarchy.buildTree(slashData)
			else categoryHierarchy.clearTree(errmsg);
		});		
		
	}

	ect.on('input', function(e) {

		$("#entity-categories-text-form .lineno").removeClass("lineselect");


		$("#entity-categories-preset").val("no-preset")

		var ss = ect[0].selectionStart;
		var se = ect[0].selectionEnd;

		ect.val(ect.val().replace(/\b[^\S\n]/g, "_"));

		ect[0].selectionStart = ss;
		ect[0].selectionEnd = se;

		// Move the cursor back to the correct position 


		//$("#saved-notification-distribution").removeClass("show");
		//$("#li-distribution").removeClass("completed");	

		// Remove validation mark from line user edited
		//var ln = $(this).val().substr(0, $(this)[0].selectionStart).split("\n").length;
		//var c = dev.children("i")
		//if(c[ln-1])
		//	$(c[ln-1]).addClass("hide");
		//console.log(ln);
		window.clearTimeout(treeGeneratingTimeout);
		treeGeneratingTimeout = window.setTimeout(generateTree, 1000);
		generatingTree = true;
	})

	// If category hierarchy or metadata exist, load them into the form


	if(category_hierarchy && category_hierarchy.length > 0) {
		ect.val(slash2txt(category_hierarchy));
		generateTree();
	}
	if(category_metadata && category_metadata.length > 0) {
		var p = category_metadata[0].Preset;
		var o = $("#entity-categories-preset option[value=\"" + p + "\"]");
		if(o) o.attr("selected", "selected"); // Select the corresponding option in the presets dropdown
		renderSuccessBox(category_metadata, $("#entity-categories-summary"), $("#entity-categories-summary-box"), $("#li-entity-categories"), $("#saved-notification-entity-categories"));
	}
})();