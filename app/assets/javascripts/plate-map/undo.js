var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undo = function(THIS) {

    return {

      undoRedoArray: [],

      undo: function(pointer) {

        console.log("undo");
        this.getPlates(this.undoRedoArray[pointer]);
        this.undoRedoActive = false;
      },

    }
  };

})(jQuery, fabric);