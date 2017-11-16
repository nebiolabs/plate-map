var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(id, v) {
        var data = {
          wellData: {}
        };
        data.wellData[id] = v;
        this._addAllData(data); 
      },

      _addAllData: function(data) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex]; 
            if (tile.index in this.engine.derivative) {
              well = this.engine.derivative[tile.index];
            } else {
              well = $.extend(true, {}, this.defaultWell); 
              this.engine.derivative[tile.index] = well; 
            }
            for (var id in data.wellData) {
              var v = JSON.parse(JSON.stringify(data.wellData[id]));
              well.wellData[id] = v;
            }
            var empty = this.engine.wellEmpty(well); 
            if (empty) {
              delete this.engine.derivative[tile.index];
            }
          }
          this._colorMixer();
        }
      },

      _colorMixer: function() {
        if (!this.undoRedoActive) {
          var data = this.createObject();
          this.addToUndoRedo(data);
          this._trigger("updateWells", null, data);
        }

        this.engine.searchAndStack(); 
        this.engine.applyColors();
        this.mainFabricCanvas.renderAll();
      },

      createObject: function() {
        var derivative = $.extend(true, {}, this.engine.derivative); 
        var checkboxes = this.globalSelectedAttributes.slice(); 
        var selectedAreas = this.selectedAreas.slice(); 
        var focalWell = this.focalWell;
        var colorLocMap = {};
        var colorLocIdxMap = this.engine.stackUpWithColor;
        var dim = $("#my-plate-layout").plateLayOut("getDimensions");
        for (var colorIdx in colorLocIdxMap) {
          colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(function (locIdx) {
            return $("#my-plate-layout").plateLayOut("indexToAddress", locIdx, dim);
          })
        }

        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selectedAreas,
          "focalWell": focalWell,
          "colorToLoc": colorLocMap
        };
      }

    };
  }
})(jQuery, fabric)