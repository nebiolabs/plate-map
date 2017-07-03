var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function(derivative) {

        if(this.actionPointer != null && this.actionPointer < (this.undoRedoArray.length - 1)) {
          this.undoRedoArray.splice(this.actionPointer + 1, this.undoRedoArray.length);
        }
        this.actionPointer = null;
        this.undoRedoArray.push($.extend(true, {}, derivative));

      },

      _configureUndoRedoArray: function() {

        var data  = {
          checkboxes: {},
          derivative: {},
          selectedAreas: [{
            minRow: 0, 
            minCol: 0, 
            maxRow: 0, 
            maxCol: 0
          }], 
          focalWell: {
            row: 0, 
            col: 0
          }
        };

        this.undoRedoArray.push($.extend({}, data));
      },

      _handleShortcuts: function(e) {

        if (e.keyCode == 90 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.callUndo();
        }

        if(e.keyCode == 89 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.callRedo();
        }
      },

      callUndo: function() {

        this.undoRedoActive = true;
        if(this.actionPointer == null) {
          this.actionPointer = this.undoRedoArray.length - 2;
          this.undo(this.actionPointer);
        } else {
          this.actionPointer = (this.actionPointer) ? this.actionPointer - 1 : 0;
          this.undo(this.actionPointer);
        }
      },

      callRedo: function() {

        this.undoRedoActive = true;
        if(this.actionPointer != null && this.actionPointer < this.undoRedoArray.length - 1) {
          this.actionPointer = this.actionPointer + 1;
          this.redo(this.actionPointer);
        } else if(this.actionPointer == this.undoRedoArray.length - 1) {
          this.undoRedoActive = false;
        }
      }
    }
  };

})(jQuery, fabric);
