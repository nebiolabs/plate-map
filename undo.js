var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undo = function(THIS) {

    return {

      undoRedoArray: [],

      undo: function(derivative) {

        console.log("undo");
      },

    }
  };

})(jQuery, fabric);
