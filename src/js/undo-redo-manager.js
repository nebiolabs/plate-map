var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.undoRedoManager = function() {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function() {
        var state = this.createState();
        if (this.actionPointer != null) {
          var i = this.actionPointer + 1;
          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }
        this.actionPointer = null;
        this.undoRedoArray.push(state);
      },

      _configureUndoRedoArray: function() {

        var data = {
          checkboxes: [],
          derivative: {},
          selectedIndices: [0]
        };

        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },

      clearHistory: function () {
        this.undoRedoArray = this.undoRedoArray.slice(-1);
        this.actionPointer = null;
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
        this.actionPointer = pointer;
        this.setData(this.undoRedoArray[pointer], true);
        return true;
      }
    }
  };

})(jQuery);