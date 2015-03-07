var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      addToUndoRedo: function(derivative) {

        this.undoRedoArray.push($.extend(true, {}, derivative));
        console.log(this.undoRedoArray);
      },

      _handleShortcuts: function(e) {
        
        if (e.keyCode == 90 && e.ctrlKey) {
          this.undo();
        }
        if(e.keyCode == 89 && e.ctrlKey) {
          this.redo();
        }
      },

    }
  };

})(jQuery, fabric);
