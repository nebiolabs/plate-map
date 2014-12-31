var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {

      _fabricEvents: function() {

        var that = this;
        // When we ckick and drag
        this.mainFabricCanvas.on("object:selected", function(selectedObjects) {

          that.mainFabricCanvas.deactivateAllWithDispatch(); // We clear the default selection by canvas
          //Deselect already selected tiles
          that._deselectSelected();
          // Adding newly selected group
          if(selectedObjects.target) {
            that.allSelectedObjects = selectedObjects.target._objects || [selectedObjects.target];
          } else {
            that.allSelectedObjects = selectedObjects;
          }

          console.log(that.allSelectedObjects);
          // Select tile/s
          that._selectTiles();
          that._applyValuesToTabs();
          that.mainFabricCanvas.renderAll();
        });

      },

      _deselectSelected: function() {
        // Putting back fill of previously selected group
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {
            var currentObj = this.allSelectedObjects[objectIndex];
            if(currentObj.circle) {
              if(currentObj.type == "tile") {
                currentObj.setFill("#f5f5f5");
                currentObj.notSelected.setVisible(false);
              }
            } else {

              if(currentObj.type == "tile") {
                currentObj.setFill("#f5f5f5");
                currentObj.notSelected.setVisible(true);
              }
            }
          }
        }
      },

      _selectTiles: function() {
        // Here we select tile/s from the selection or click
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          var currentObj = this.allSelectedObjects[objectIndex];
          if(currentObj.type == "image"){
            currentObj.setVisible(false);
            currentObj.parent.setFill("#cceffc");
          } else if(currentObj.type == "tile") {
            currentObj.notSelected.setVisible(false);
            currentObj.setFill("#cceffc");
          }
        }
      },

      _applyValuesToTabs: function() {
        // Here we look for the values on the well and apply it to tabs.
        if(this.allSelectedObjects.length === 1) {
          // Incase there is only one well selected.
          this._addDataToTabFields();
        } else {
          // Here we check if all the values are same
          // if yes apply those values to tabs
          // else show empty value in tabs
          // we take first tile as reference object
          var referenceTile =  this.allSelectedObjects[0];
          var referenceFields = referenceTile["wellData"];
          var referenceUnits = referenceTile["unitData"];
          var referenceSelectedFields = referenceTile["selectedWellattributes"];
          var equalWellData = true;
          var equalUnitData = true;
          var equalSelectData = true;
          // Looking for same well data
          for(var i = 0; i < this.allSelectedObjects.length; i++) {
            if(this.allSelectedObjects[i]["type"] == "tile") {
              equalWellData = this.compareObjects(this.allSelectedObjects[i]["wellData"], referenceFields);
              equalUnitData = this.compareObjects(this.allSelectedObjects[i]["unitData"], referenceUnits);
              equalSelectData = this.compareObjects(this.allSelectedObjects[i]["selectedWellattributes"], referenceSelectedFields);

              if(!equalWellData || !equalUnitData || !equalSelectData) {

                this._clearAllFields(referenceFields);
                return true;
              }
            }
          }

          this._addDataToTabFields();
        }
      },

    };
  }
})(jQuery, fabric)
