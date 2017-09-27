var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.redo = function(THIS) {

    return {

      undoRedoArray: [],

      redo: function(pointer) {

        this.getPlates(this.undoRedoArray[pointer]);
        console.log("redo");
        this.undoRedoActive = false;
      },

    }
  };

})(jQuery, fabric);