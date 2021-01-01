
jQuery.fn.appendR = function(creator) { return jQuery(creator).appendTo(this); };
jQuery.fn.prependR = function(creator) { return jQuery(creator).prependTo(this); };
jQuery.fn.beforeR = function(creator) { return jQuery(creator).insertBefore(this); };
jQuery.fn.afterR = function(creator) { return jQuery(creator).insertAfter(this); };

jQuery.fn.appendText = function(text) {
    return this.each(function() {
        var textNode = document.createTextNode(text);
        jQuery(this).append(textNode);
    });
};

jQuery.fn.back = jQuery.fn.parent;
