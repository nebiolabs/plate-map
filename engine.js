var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(newThis) {
    // Methods which look after data changes and stack up accordingly
    return {
      engine: {

        engineBoom: "Wow",

        cool: function() {
          console.log(newThis.allSelectedObjects);
        }
      }
    }
  }
})(jQuery, fabric);
