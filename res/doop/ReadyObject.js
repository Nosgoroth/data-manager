window.ReadyObject = Object.extends({
    __construct: function(){
        jQuery(document).ready( this.ready.bind(this) );
    },

    ready:function(){

    }

},{
    name: "ReadyObject"
})
