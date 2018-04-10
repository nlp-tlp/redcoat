
// Scroll to headings when clicking on nav
$($("#nav-setup-stages").children()).on("click", function() {
	$('html, body').animate({scrollTop: $($(".article-heading")[$(this).index()]).offset().top - 100}, 500);
});

$(document).on('scroll', function() {

	$(".article-heading.scrolled-to").each(function() {

	    if($(document).scrollTop()<$(this).position().top - 250){
	    	
	    	$(this).addClass("not-scrolled-to")
	    	$(this).removeClass("scrolled-to")

	    	$($("#nav-setup-stages").children()[$(this).index() - 1]).removeClass("scrolled-past")
	    	$($("#nav-setup-stages").children()[$(this).index()]).addClass("not-yet-started")
	       
	    }			

	})

	$(".article-heading.not-scrolled-to").each(function() {
	    if($(document).scrollTop()>=$(this).position().top - 250){
	    	
	    	$(this).removeClass("not-scrolled-to")
	    	$(this).addClass("scrolled-to")

	    	$($("#nav-setup-stages").children()[$(this).index() - 1]).addClass("scrolled-past")
	    	$($("#nav-setup-stages").children()[$(this).index()]).removeClass("not-yet-started")
	       
	    }


	})


});

$("#entity-categories-list-button").on("click", function() {
	$("#entity-categories-list").slideDown(500)
	$("#entity-categories-ner").slideUp(500)
	$("#ec-1").focus();

	$("#entity-categories-ner-button").addClass("fade-out");			
	$("#entity-categories-list-button").removeClass("fade-out");
});


$("#entity-categories-ner-button").on("click", function() {
	$("#entity-categories-ner").slideDown(500)
	$("#entity-categories-list").slideUp(500)

	$("#entity-categories-list-button").addClass("fade-out");			
	$("#entity-categories-ner-button").removeClass("fade-out");
});


$("#already-tokenized-data-button").on("click", function() {
	$("#already-tokenized-data").slideDown(500)
	$("#untokenized-data").slideUp(500)

	$("#untokenized-data-button").addClass("fade-out");			
	$("#already-tokenized-data-button").removeClass("fade-out");
});

$("#untokenized-data-button").on("click", function() {
	$("#untokenized-data").slideDown(500)
	$("#already-tokenized-data").slideUp(500)

	$("#already-tokenized-data-button").addClass("fade-out");
	$("#untokenized-data-button").removeClass("fade-out");
});

/*$("#actually-already-tokenized-data-button").on("click", function() {
	$("#untokenized-data").addClass("subsection-hidden");
	$("#already-tokenized-data-button").removeClass("fade-out");
	$("#already-tokenized-data-button").click()			
});

$("#actually-untokenized-data-button").on("click", function() {
	$("#already-tokenized-data").addClass("subsection-hidden");
	$("#untokenized-data-button").removeClass("fade-out");
	$("#untokenized-data-button").click()			
});*/
