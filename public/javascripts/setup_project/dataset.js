'use strict';

// Drag and drop code and css found here:
// https://css-tricks.com/examples/DragAndDropFileUploading/
;( function( $, window, document, undefined )
{

	if(file_metadata) renderSuccessBox(file_metadata, $("#form-upload-tokenized"), $("#form-upload-tokenized").find('.box__success_details'), $("#li-upload-tokenized"), $("#saved-notification-upload-tokenized"));

	// feature detection for drag&drop upload

	var isAdvancedUpload = function()
		{
			var div = document.createElement( 'div' );
			return ( ( 'draggable' in div ) || ( 'ondragstart' in div && 'ondrop' in div ) ) && 'FormData' in window && 'FileReader' in window;
		}();


	// applying the effect for every form

	$( '.box' ).each( function()
	{
		var $form		 = $( this ),
			$input		 = $form.find( 'input[type="file"]' ),
			$label		 = $form.find( 'label' ),
			$errorMsg	 = $form.find( '.box__error span' ),
			$restart	 = $form.find( '.box__restart' ),
			$successDets = $form.find( '.box__success_details' ),
			$uploading   = $form.find( '.box__uploading'),
			droppedFile  = null,
			$savedNotif  = $("#saved-notification-"  + $form.attr( 'action' )),
			$sidenavLi   = $("#li-"  + $form.attr( 'action' )),
			showFiles	 = function( file )
			{
				$label.text( file.name );
			};


		function validateFile(file) {
			var a = checkFilesize(file);
			var b = checkFiletype(file);
			$sidenavLi.removeClass("completed");
			$savedNotif.removeClass("show");

			if(!(a && b)) {
				$form.addClass( 'is-uploading' ).removeClass( 'is-error' );

				var errMsg;
				if(!a) { errMsg = "File must be less than #{max_filesize_mb}mb in size." }
				if(!b) { errMsg = "File must be a plain text file (.txt)." }

				// Send a message to the server to delete the documents of the project if client-side validation failed.

				$.ajax(
				{
					url: 			$form.attr( 'action' ) + '-reset',
					type:			$form.attr( 'method' ),
					data: 			{},
					dataType:		'json',
					cache:			false,
					contentType:	false,
					processData:	false,
					headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
					complete: function()
					{
						$form.removeClass( 'is-uploading' );
					},
					success: function( data )
					{
						$("#error-banner").removeClass("show");
						$form.addClass('is-error');
						$errorMsg.text(errMsg);		
					},
					error: function()
					{								
						displayServerErrorBanner();
					}
				});
			}

			return a && b;
		}

		function checkFilesize(file) {
			if(file.size > MAX_FILESIZE) {
				return false;
			} else {
				return true;
			}
		}

		function checkFiletype(file) {
			if(file.type != "text/plain") {
				return false;									
			} else {
				return true;
			}
		}


		// letting the server side to know we are going to make an Ajax request
		$form.append( '<input type="hidden" name="ajax" value="1" />' );

		$input.on('click', function() {

			$(this).val("");
		});

		// automatically submit the form on file select
		$input.on( 'change', function( e )
		{	
			$form.removeClass( 'is-error is-success' );
			droppedFile = null; // Get rid of the dropped file the user may have dropped previously.
			if(validateFile(e.target.files[0])) {
				showFiles( e.target.files );					
				$form.trigger( 'submit' );
			}					
		});


		// drag&drop files if the feature is available
		if( isAdvancedUpload )
		{
			$form
			.addClass( 'has-advanced-upload' ) // letting the CSS part to know drag&drop is supported by the browser
			.on( 'drag dragstart dragend dragover dragenter dragleave drop', function( e )
			{	

				// preventing the unwanted behaviours
				e.preventDefault();
				e.stopPropagation();
			})
			.on( 'dragover dragenter', function() //
			{
				// Disable drop if form already completed.
				if( $form.hasClass("is-success") || $form.hasClass("is-uploading") ) {
					return;
				}

				$form.addClass( 'is-dragover' );
			})
			.on( 'dragleave dragend drop', function()
			{
				$form.removeClass( 'is-dragover' );
			})
			.on( 'drop', function( e )
			{

				// Disable drop if form already completed.
				if( $form.hasClass("is-success") || $form.hasClass("is-uploading") ) {							
					return;
				}

				var droppedFiles = e.originalEvent.dataTransfer.files; // the files that were dropped

				if(droppedFiles.length > 1) {							
					$form.addClass('is-error');
					$errorMsg.text("You may only upload 1 file at a time.");
				} else {
					droppedFile = droppedFiles[0];

					if(validateFile(droppedFile)) {
						console.log('file is fine')
						showFiles( droppedFile );						
						$form.trigger( 'submit' ); // automatically submit the form on file drop
					}					
				}					

				
			});
		}




		// if the form was submitted

        var progressBar = $(this).find('.progress-bar-fill')
        var progressBarContainer = $(this).find('.progress-bar-container')
        var progressPercent = $(this).find('.progress-percent-complete')

		$form.on( 'submit', function( e )
		{				
			// preventing the duplicate submissions if the current one is in progress
			if( $form.hasClass( 'is-uploading' ) ) return false;
			progressBarContainer.removeClass("fade-out");
			

			$form.addClass( 'is-uploading' ).removeClass( 'is-error' );
			$uploading.html("<i class=\"fa fa-spinner fa-spin\"></i>&nbsp;Uploading…");

			if( isAdvancedUpload ) // ajax file upload for modern browsers
			{
				e.preventDefault();


				// gathering the form data
					
				console.log('g', $form.get(0))

				var ajaxData;
				if( droppedFile ) {
					ajaxData = new FormData();
					ajaxData.append( $input.attr("name"), droppedFile );	
				} else {
					ajaxData = new FormData( $form.get( 0 ) );						
				}

				console.log(ajaxData);
				
				

				var tokenizingTimeout;

				// ajax request
				$.ajax(
				{

					xhr: function() {
						var xhr = new window.XMLHttpRequest();

						xhr.upload.addEventListener("progress", function(evt) {
						  if (evt.lengthComputable) {
						    var percentComplete = evt.loaded / evt.total;
						    percentComplete = parseInt(percentComplete * 100);

						    progressBar.css("width", "" + percentComplete + "%")
						    progressPercent.html("" + percentComplete + "%")

						    if (percentComplete === 100) {
						    	$uploading.html("<i class=\"fa fa-spinner fa-spin\"></i>&nbsp;Tokenizing…");
						    	progressBarContainer.addClass("fade-out");
						    	window.setTimeout(function() {
						    		progressBar.css("width", "0%");
						    	}, 500);
						    	tokenizingTimeout = window.setTimeout(function() {
						    		console.log('heres johnny')
						    		$uploading.html("<i class=\"fa fa-spinner fa-spin\"></i>&nbsp;Tokenizing…<br/><span class=\"tokenization-time-info\">Tokenization is taking some time as your dataset is quite large.<br/>Please feel free to complete the rest of the form while tokenization is running.</span>");

						    	}, 2000);
						    }

						  }
						}, false);

						return xhr;
					},						
					url: 			$form.attr( 'action' ),
					type:			$form.attr( 'method' ),
					data: 			ajaxData,
					dataType:		'json',
					cache:			false,
					contentType:	false,
					processData:	false,
					headers: { 'csrf-token': csrfToken, 'wippid' : wippid },
					complete: function()
					{
						$form.removeClass( 'is-uploading' );
					},
					success: function( data )
					{
						$("#error-banner").removeClass("show");
						window.clearTimeout(tokenizingTimeout);
						console.log(data);
						
						if( !data.success ) {
							$form.addClass( 'is-error' );
							$errorMsg.text( data.error );
						} else {
							renderSuccessBox(data.details, $form, $successDets, $sidenavLi, $savedNotif);
						}
					},
					error: function()
					{								
						displayServerErrorBanner();
					}
				});
			}
			else // fallback Ajax solution upload for older browsers
			{
				var iframeName	= 'uploadiframe' + new Date().getTime(),
					$iframe		= $( '<iframe name="' + iframeName + '" style="display: none;"></iframe>' );

				$( 'body' ).append( $iframe );
				$form.attr( 'target', iframeName );

				$iframe.one( 'load', function()
				{
					var data = $.parseJSON( $iframe.contents().find( 'body' ).text() );
					$form.removeClass( 'is-uploading' ).addClass( data.success == true ? 'is-success' : 'is-error' ).removeAttr( 'target' );
					if( !data.success ) $errorMsg.text( data.error );
					$iframe.remove();
				});
			}
		});


		// restart the form if has a state of error/success

		$restart.on( 'click', function( e )
		{
			e.preventDefault();
			$input.trigger( 'click' );
		});

		// Firefox focus bug fix for file input
		$input
		.on( 'focus', function(){ $input.addClass( 'has-focus' ); })
		.on( 'blur', function(){ $input.removeClass( 'has-focus' ); });
	});

})( jQuery, window, document );
