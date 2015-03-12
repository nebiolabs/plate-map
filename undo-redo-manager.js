var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function(derivative) {


        console.log("voohoo", this.undoRedoActive);
        if(! this.undoRedoActive) {

          if(this.actionPointer != null && this.actionPointer < (this.undoRedoArray.length - 1)) {
            this.undoRedoArray.splice(this.actionPointer + 1, this.undoRedoArray.length);
            this.actionPointer = null;
            console.log("I am in this");
          }

          this.undoRedoArray.push($.extend(true, {}, derivative));
          console.log(this.undoRedoArray);
        }

      },

      _configureUndoRedoArray: function() {

        var data  = {
          checkboxes: {},
          derivative: {},
          selectedObjects: {
            startingTileIndex :0, rowCount: 1, columnCount: 1,click: true,
              selectionRectangle: {
                type: "dynamicSingleRect", width: 48, height: 48, left: 45, top: 36, mouseMove: false
              }
          }
        };

        this.undoRedoArray.push($.extend(true, {}, data));
      },

      _handleShortcuts: function(e) {

        if (e.keyCode == 90 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          console.log("Pling");
          this.undoRedoActive = true;

          if(this.actionPointer == null) {
            this.actionPointer = this.undoRedoArray.length - 2;
            this.undo(this.actionPointer);
          } else {
            this.actionPointer = (this.actionPointer) ? this.actionPointer - 1 : 0;
            this.undo(this.actionPointer);
          }
        }

        if(e.keyCode == 89 && e.ctrlKey) {
          // it says that we have undo/redo action is going on.
          this.undoRedoActive = true;
          console.log("Janko", this.actionPointer);
          if(this.actionPointer != null && this.actionPointer < this.undoRedoArray.length - 1) {
            this.actionPointer = this.actionPointer + 1;
            this.redo(this.actionPointer);
          }
        }
      },

    }
  };

})(jQuery, fabric);
