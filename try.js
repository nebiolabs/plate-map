var widget = widget || {};

(function($, fabric) {

  widget.helper = function() {
    return {
      jo: {
        good: "really"
      },

      jossie: function() {
        console.log("Eureka its in ", this.allSelectedObjects);
      }
    }

  }

})(jQuery, fabric);
