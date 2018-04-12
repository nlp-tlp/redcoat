
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

$("#distribute-self-button").on("click", function() {
	$("#distribute-self").slideDown(500)
	$("#distribute-to-emails").slideUp(500)

	$("#distribute-to-emails-button").addClass("fade-out");			
	$("#distribute-self-button").removeClass("fade-out");
});

$("#distribute-to-emails-button").on("click", function() {
	$("#distribute-to-emails").slideDown(500)
	$("#distribute-self").slideUp(500)

	$("#distribute-self-button").addClass("fade-out");			
	$("#distribute-to-emails-button").removeClass("fade-out");
});