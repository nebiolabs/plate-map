var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy Criteria' button etc ...
    return {

      _createOverLay: function() {

        var that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        this.overLayTextContainer.text("Completion Percentage:");
        this.overLayContainer.append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        this.overLayContainer.append(this.overLayButtonContainer);

        this.clearCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.clearCriteriaButton.text("Clear");
        this.overLayButtonContainer.append(this.clearCriteriaButton);

        this.clearCriteriaButton.click(function(evt) {
          that.clearCriteria();
        });

        this.copyCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.copyCriteriaButton.text("Copy");
        this.overLayButtonContainer.append(this.copyCriteriaButton);

        this.copyCriteriaButton.click(function(evt) {
          that.copyCriteria();
        });

        this.pasteCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.pasteCriteriaButton.text("Paste");
        this.overLayButtonContainer.append(this.pasteCriteriaButton);

        this.pasteCriteriaButton.click(function(evt) {
          that.pasteCriteria();
        });

        this.undoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.undoButton.text("Undo");
        this.overLayButtonContainer.append(this.undoButton);

        this.undoButton.click(function(evt) {
          that.undo();
        });

        this.redoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.redoButton.text("Redo");
        this.overLayButtonContainer.append(this.redoButton);

        this.redoButton.click(function(evt) {
          that.redo();
        });

      },

      clearCriteria: function() {
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          var hasWellUpdate = false;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex];
            if (tile.index in this.engine.derivative) {
              // handling for clearing well when not allowed to add or delete wells
              if (this.emptyWellWithDefaultVal && this.disableAddDeleteWell) {
                var well = JSON.parse(JSON.stringify(this.defaultWell));
                var defaultValue = this.emptyWellWithDefaultVal;
                for (var key in defaultValue){
                  if (key in well) {
                    well[key] = defaultValue[key];
                    this._applyFieldData(key, defaultValue[key]);
                  } else {
                    console.log("Well does not contain key: " + key + ", please contact support");
                  }
                }
                this.engine.derivative[tile.index] = well;
              } else {
                delete this.engine.derivative[tile.index];
              }
              hasWellUpdate = true;
            }
          }
          if (hasWellUpdate){
            this.derivativeChange();
          }

          this._colorMixer();
          this.decideSelectedFields();
        } else {
          alert("Please select any well");
        }
      },

      copyCriteria: function() {
        if (this.allSelectedObjects) {
          var wells = this._getSelectedWells(); 
          this.commonWell = this._getCommonFields(wells); 
        } else {
          alert("Please select any well.");
        }
      },

      pasteCriteria: function() {
        if (this.commonWell) {
          this._addAllData(this.commonWell);
          this.decideSelectedFields();
          this.mainFabricCanvas.renderAll();
        }
      }
    };
  }
})(jQuery, fabric);