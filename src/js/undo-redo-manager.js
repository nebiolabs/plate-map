var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Linear undo/redo history: this.undoRedoArray is a plain array of
   * createState() snapshots (add-data-on-change.js), this.actionPointer
   * is the index of the currently-active snapshot (null means "at the
   * end / no undo has happened yet"). addToUndoRedo truncates any
   * "future" redo entries once a new action is taken after an undo --
   * standard linear (not branching) undo/redo history.
   */
  plateMapWidget.undoRedoManager = function() {

    return {

      undoRedoArray: [],

      actionPointer: null,

      // Pushes the current state as a new history entry, discarding any
      // entries "ahead" of the current pointer first (i.e. undoing then
      // taking a new action discards the old redo branch -- this is
      // linear history, not a tree).
      addToUndoRedo: function() {
        let state = this.createState();
        if (this.actionPointer != null) {
          let i = this.actionPointer + 1;
          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }
        this.actionPointer = null;
        this.undoRedoArray.push(state);
      },

      // Seeds the initial (pre-any-edit) history entry at widget
      // creation time -- called once from interface.js's
      // _createInterface.
      _configureUndoRedoArray: function() {

        let data = {
          checkboxes: [],
          derivative: {},
          selectedIndices: [0]
        };

        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },

      // Public API: discards all history except the current state
      // (used when a caller wants to "commit" the current state as the
      // new undo baseline -- e.g. plate-map.js's isDisableAddDeleteWell
      // resets history when entering restricted-editing mode).
      clearHistory: function () {
        this.undoRedoArray = this.undoRedoArray.slice(-1);
        this.actionPointer = null;
      },

      // Moves the history pointer one step back and restores that
      // snapshot. Returns false (no-op) if already at the oldest entry.
      undo: function() {
        console.log("undo");
        return this.shiftUndoRedo(-1);
      },

      // Moves the history pointer one step forward and restores that
      // snapshot. Returns false (no-op) if already at the newest entry.
      redo: function() {
        console.log("redo");
        return this.shiftUndoRedo(1);
      },

      // Shared by undo/redo: resolves "current pointer" (treating null
      // as "at the newest entry"), applies pointerDiff, and delegates to
      // setUndoRedo.
      shiftUndoRedo: function(pointerDiff) {
        let pointer = this.actionPointer;
        if (pointer == null) {
          pointer = this.undoRedoArray.length - 1;
        }
        pointer += pointerDiff;
        return this.setUndoRedo(pointer);
      },

      // Restores the history entry at `pointer` via setData
      // (load-plate.js), in "quiet" mode so restoring history doesn't
      // itself push a new history entry. Returns false without changing
      // anything if pointer is out of bounds.
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