var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

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

          if(! this.actionPointer) {
            this.actionPointer = this.undoRedoArray.length - 1;
          } else {
            this.actionPointer = this.actionPointer - 1;
          }
          this.undo(this.actionPointer);
        }
        if(e.keyCode == 89 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.undoRedoActive = true;

          //if(this.actionPointer < this.undoRedoArray.length) {
            this.actionPointer = this.actionPointer + 1;
          //}
          this.redo(this.actionPointer);
        }
      },

    }
  };

})(jQuery, fabric);
