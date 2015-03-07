var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.redo = function(THIS) {

    return {

      undoRedoArray: [],

      redo: function() {
        
        console.log("redo");
      },

    }
  };

})(jQuery, fabric);
