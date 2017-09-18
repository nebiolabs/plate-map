var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy Criteria' button etc ...
    return {

      copyCriteria: {},

      _createOverLay: function() {

        var that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        this.overLayTextContainer.html("Completion Percentage:");
        this.overLayContainer.append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        this.overLayContainer.append(this.overLayButtonContainer);

        this.clearCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.clearCriteriaButton.text("Clear");
        this.overLayButtonContainer.append(this.clearCriteriaButton);

        this.copyCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.copyCriteriaButton.text("Copy");
        this.overLayButtonContainer.append(this.copyCriteriaButton);

        this.pasteCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.pasteCriteriaButton.text("Paste");
        this.overLayButtonContainer.append(this.pasteCriteriaButton);

        this.clearCriteriaButton.click(function(evt) {
          that.clearCriteria();
        });

        this.copyCriteriaButton.click(function(evt) {
          that.copyCriteria();
        });

        this.pasteCriteriaButton.click(function(evt) {
          that.pasteCriteria();
        });

      },

      clearCriteria: function() {

        if (this.allSelectedObjects) {

          var noOfSelectedObjects = this.allSelectedObjects.length;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {

            var tile = this.allSelectedObjects[objectIndex];
            // Restore the original data.
            tile["wellData"] = $.extend(true, {}, this.allWellData);
            tile["unitData"] = $.extend(true, {}, this.allUnitData);
            tile["selectedWellAttributes"] = {};

            if (tile.circle) {
              // that works like a charm, we remove circle from canvas and delete the reference from
              // tile/well object.
              this.mainFabricCanvas.remove(tile.circle);
              this.mainFabricCanvas.remove(tile.circleCenter);
              this.mainFabricCanvas.remove(tile.circleText);

              delete this.engine.derivative[tile.index];
              delete tile.circle;
              delete tile.circleCenter;
              delete tile.circleText;
            }
          }

          this._colorMixer(true);
          this.decideSelectedFields();
        } else {
          alert("Please select any well");
        }

      },

      clearCriteriaForAll: function(selectedObjects) {

        //this._deselectSelected();

        for (var objectIndex in this.engine.derivative) {

          var tile = this.allTiles[objectIndex];
          tile["wellData"] = $.extend(true, {}, this.allWellData);
          tile["unitData"] = $.extend(true, {}, this.allUnitData);
          tile["selectedWellAttributes"] = {};

          if (tile.circle) {
            this.mainFabricCanvas.remove(tile.circle);
            this.mainFabricCanvas.remove(tile.circleCenter);
            this.mainFabricCanvas.remove(tile.circleText);

            delete tile.circle;
            //delete tile.circleCenter;
            //delete tile.circleText;
          }

        }

        this.mainFabricCanvas.remove(this.dynamicRect);
        this.mainFabricCanvas.remove(this.dynamicSingleRect);

        this.engine.derivative = {};

      },

      clearSingleCriteria: function(tile) {

        // Restore the original data.
        tile["wellData"] = $.extend(true, {}, this.allWellData);
        tile["unitData"] = $.extend(true, {}, this.allUnitData);
        tile["selectedWellAttributes"] = {};

        if (tile.circle) {

          // that works like a charm, we remove circle from canvas and delete the reference from
          // tile/well object.
          this.mainFabricCanvas.remove(tile.circle);
          this.mainFabricCanvas.remove(tile.circleCenter);
          this.mainFabricCanvas.remove(tile.circleText);

          delete this.engine.derivative[tile.index];
          delete tile.circle;
          //delete tile.circleCenter;
          //delete tile.circleText;
        }

      },

      copyCriteria: function() {

        if (this.allSelectedObjects) {
          this.commonWell = this.engine.findCommonValues("wellData");
          this.commonUnit = this.engine.findCommonValues("unitData");
        } else {
          alert("Please select any well.");
        }
      },

      pasteCriteria: function() {

        if (this.commonWell) {
          this.allSelectedObjects.filter(function(element, index) {

            this.allTiles[element.index].wellData = $.extend(true, {}, this.commonWell);
            this.allTiles[element.index].unitData = $.extend(true, {}, this.commonUnit);
            this.engine.createDerivative(this.allTiles[element.index]);

          }, this);
          this._colorMixer(true);
          this.decideSelectedFields();
          this.mainFabricCanvas.renderAll();
        }
      }
    };
  }
})(jQuery, fabric);