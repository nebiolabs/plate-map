var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      addToUndoRedo: function(derivative) {

        if(! this.undoRedoActive) {
          this.undoRedoArray.push($.extend(true, {}, derivative));
          console.log(this.undoRedoArray);
        }

        this.undoRedoActive = false;
      },

      _handleShortcuts: function(e) {

        if (e.keyCode == 90 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.undoRedoActive = true;
          this.undo();
        }
        if(e.keyCode == 89 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.undoRedoActive = true;
          this.redo();
        }
      },

    }
  };

})(jQuery, fabric);
