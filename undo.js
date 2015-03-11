var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undo = function(THIS) {

    return {

      undoRedoArray: [],

      undo: function(derivative) {

        console.log("undo");
        this.getPlates(this.undoRedoArray[this.undoRedoArray.length - 2]);
      },

    }
  };

})(jQuery, fabric);
