var errorBannerTimeout;
function displayServerErrorBanner() {
	$("#error-banner").addClass("show");
	//errorBannerTimeout = window.setTimeout(function() {				
	//}, 5000);
}
$("#close-error-banner").on('click', function(e) {
	e.preventDefault();
	$("#error-banner").removeClass("show");
})