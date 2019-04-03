var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function(data) {

        if (this.actionPointer != null) {
          var i = this.actionPointer + 1;
          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }
        this.actionPointer = null;
        this.undoRedoArray.push($.extend(true, {}, data));
      },

      _configureUndoRedoArray: function() {

        var data = {
          checkboxes: [],
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

        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },

      undo: function() {
        console.log("undo");
        return this.shiftUndoRedo(-1);
      },

      redo: function() {
        console.log("redo");
        return this.shiftUndoRedo(1);
      },

      shiftUndoRedo: function(pointerDiff) {
        var pointer = this.actionPointer;
        if (pointer == null) {
          pointer = this.undoRedoArray.length - 1;
        }
        pointer += pointerDiff;
        return this.setUndoRedo(pointer);
      },

      setUndoRedo: function(pointer) {
        if (pointer < 0) {
          return false;
        }
        if (pointer >= this.undoRedoArray.length) {
          return false;
        }
        this.undoRedoActive = true;
        this.setData(this.undoRedoArray[pointer]);
        this.actionPointer = pointer;
        this.undoRedoActive = false;
        this.derivativeChange();
        return true;
      }
    }
  };

})(jQuery, fabric);