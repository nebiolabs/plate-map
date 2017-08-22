var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(e, boolean) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var wellData = this.allSelectedObjects[objectIndex]["wellData"];
            wellData[e.target.id] = e.target.value;
            this.engine.createDerivative(this.allSelectedObjects[objectIndex]);
            //this.engine.checkForValidData(this.allSelectedObjects[objectIndex]);
          }

          this._colorMixer(true);
        }
      },

      _colorMixer: function(valueChange) {
        // value change is true if data in the field is changed, false if its a change in checkbox
        if (!valueChange) {
          for (var index in this.engine.derivative) {
            this.engine.createDerivative(this.allTiles[index]);
          }
        }

        if (!this.undoRedoActive) {
          var data = this.createObject();
          this.addToUndoRedo(data);
          this._trigger("updateWells", null, data);
        }

        this.engine.searchAndStack().applyColors();
        this.mainFabricCanvas.renderAll();
      },

      _addUnitData: function(e) {
        // This method add/change data when unit of some numeric field is changed
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var unitData = this.allSelectedObjects[objectIndex]["unitData"];
            unitData[e.target.id] = e.target.value;
            this.engine.createDerivative(this.allSelectedObjects[objectIndex]);
          }
          this._colorMixer(true);
        }
      },

      createObject: function() {

        var data = {
          "derivative": this.engine.derivative,
          "checkboxes": this.globalSelectedAttributes,
          "selectedAreas": this.selectedAreas,
          "focalWell": this.focalWell
        };

        return data;
      }

    };
  }
})(jQuery, fabric)