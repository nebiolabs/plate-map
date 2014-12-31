var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy crieteria' button etc ...
    return {

      copyCrieteria: {},

      _createOverLay: function() {

        var that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        $(this.overLayTextContainer).html("Completion Percentage:");
        $(this.overLayContainer).append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        $(this.overLayContainer).append(this.overLayButtonContainer);

        this.clearCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.clearCrieteriaButton).text("Clear Criteria");
        $(this.overLayButtonContainer).append(this.clearCrieteriaButton);

        this.copyCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.copyCrieteriaButton).text("Copy Criteria");
        $(this.overLayButtonContainer).append(this.copyCrieteriaButton);

        this.pasteCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.pasteCrieteriaButton).text("Paste Criteria");
        $(this.overLayButtonContainer).append(this.pasteCrieteriaButton);

        $(this.clearCrieteriaButton).click(function(evt) {
          that.clearCrieteria();
        });

        $(this.copyCrieteriaButton).click(function(evt) {
          console.log(this);
        });

        $(this.pasteCrieteriaButton).click(function(evt) {
          console.log(this);
        });

      },

      clearCrieteria: function() {
        
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            if(this.allSelectedObjects[objectIndex].type == "tile") {
              this.allSelectedObjects[objectIndex]["wellData"] = $.extend({}, this.allWellData);
              this.allSelectedObjects[objectIndex]["unitData"] = $.extend({}, this.allUnitData);
              // that works like a charm, we remove circle from canvas and delete the reference from
              // tile/well object.
              this.mainFabricCanvas.remove(this.allSelectedObjects[objectIndex].circle);
              delete this.allSelectedObjects[objectIndex].circle
            }
          }
          this.mainFabricCanvas.trigger("object:selected", this.allSelectedObjects);
        } else {
          alert("Please select any well");
        }

      }
    };
  }
})(jQuery, fabric);
