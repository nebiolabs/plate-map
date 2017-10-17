var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(id, v, u) {
        var data = {
          wellData: {}, 
          unitData: {}
        }
        data.wellData[id] = v; 
        data.unitData[id] = u; 
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
              if (id in well.unitData) {
                var u = data.unitData[id];
                well.unitData[id] = u || this.defaultWell.unitData[id]; 
              }
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

        var data = {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selectedAreas,
          "focalWell": focalWell
        };

        return data;
      }

    };
  }
})(jQuery, fabric)