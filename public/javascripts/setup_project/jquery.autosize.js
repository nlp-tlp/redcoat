/*!
 * jQuery autosize v1.1.1
 * (c) 2015 Ken Snyder
 * MIT License
 * 
 * Based on the following code and documentation:
 * https://github.com/jackmoore/autosize
 * https://github.com/javierjulio/textarea-autosize
 * https://github.com/AndrewDryga/jQuery.Textarea.Autoresize
 * https://developer.mozilla.org/en-US/docs/Web/API/Element.scrollHeight
 */
(function($, window) {
	
	// we need window later to prevent page jumping
	var $window = $(window);
	
	$.AutosizedTextarea = function() {
		this.initialize.apply(this, [].slice.call(arguments));
	};
	
	$.AutosizedTextarea.prototype = {
		initialize: function(textarea, options) {
			this.$textarea = $(textarea);
			this.textarea = this.$textarea.get(0);
			this.options = options || {};
			this.setup();
			this.observe();
			this.adjust();
		},
		setup: function() {
			// just in case we are splitting pixels, 
			// we would rather see descending letters get cut off
			// than have the scrollbar display and mess up our calculations
			this.$textarea.css({
				overflow: 'hidden',
				resize: 'none'
			});
			// note that $css values can be fractional
			var lineHeight = this.$textarea.css('line-height');
			if (lineHeight == 'normal') {
				lineHeight = (parseFloat(this.$textarea.css('font-size')) || 16) * 1.14;
			}
			else {
				lineHeight = parseFloat(lineHeight);
			}
			this.lineHeight = lineHeight;
			this.calculatedPadding = 
				parseInt(this.$textarea.css('padding-top') || 0, 10) 
				+ parseInt(this.$textarea.css('padding-bottom') || 0, 10)
			;
			this.isBorderBox = (
				this.$textarea.css('box-sizing') == 'border-box' ||
				this.$textarea.css('-webkit-box-sizing') == 'border-box' ||
				this.$textarea.css('-moz-box-sizing') == 'border-box'
			);
			this.verticalPadding = (this.isBorderBox ? 0 : Math.ceil(this.calculatedPadding));
			if (this.options.minHeight > 0) {
				this.minHeight = this.options.minHeight;
			}
			else if (this.options.minRows > 0) {
				this.minHeight = this.options.minRows * this.lineHeight + (this.isBorderBox ? this.calculatedPadding : 0);
			}
			else {
				this.minHeight = this.verticalPadding + this.lineHeight;
			}
			// round up any fractional parts
			this.minHeight = Math.ceil(this.minHeight);
		},
		observe: function() {
			var events = 'input.autosize';
			if ('onpropertychange' in this.textarea) {
				// Detects IE9. IE9 does not fire oninput for deletions,
				// so binding to onkeyup to catch most of those occasions.
				events += ' keyup.autosize';
			}
			this.$textarea
				// stop observing if .autosize() has been called before
				.off(events)
				// observe with this.adjust() (bind is supported by IE9+)
				.on(events, this.adjust.bind(this))
			;
		},
		adjust: function() {
			if (this.options.onresize) {
				var heightBefore = this.textarea.style.height;
			}
			var currentWindowScroll = $window.scrollTop();
			// ensure that content can't fit so scrollHeight will be correct
			this.textarea.style.height = '0';
			// set height that is just tall enough
			// noe that scrollHeight is always an integer
			var newHeight = Math.max(this.minHeight, this.textarea.scrollHeight - this.verticalPadding);
			this.textarea.style.height = newHeight + 'px';
			// put the window scroll position back
			// since setting height to 0 may cause window scroll to change
			$window.scrollTop(currentWindowScroll);
			// trigger resize callback if height has changed
			if (this.options.onresize && heightBefore != newHeight) {
				this.options.onresize.call( this, parseFloat(heightBefore), newHeight );
			}
		}
	};
	
    $.fn.autosize = function(options) {
        return this.each(function() {
            new $.AutosizedTextarea(this, options);
        });
    };

})(jQuery, window);
