var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy Criteria' button etc ...
    return {

      _createOverLay: function() {

        let that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        this.overLayTextContainer.text("Completion Percentage:");
        this.overLayContainer.append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        this.overLayContainer.append(this.overLayButtonContainer);

        this.clearCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.clearCriteriaButton.text("Clear");
        this.overLayButtonContainer.append(this.clearCriteriaButton);

        this.clearCriteriaButton.click(function() {
          that.clearCriteria();
        });

        this.copyCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.copyCriteriaButton.text("Copy");
        this.overLayButtonContainer.append(this.copyCriteriaButton);

        this.copyCriteriaButton.click(function() {
          that.copyCriteria();
        });

        this.pasteCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.pasteCriteriaButton.text("Paste");
        this.overLayButtonContainer.append(this.pasteCriteriaButton);

        this.pasteCriteriaButton.click(function() {
          that.pasteCriteria();
        });

        this.undoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.undoButton.text("Undo");
        this.overLayButtonContainer.append(this.undoButton);

        this.undoButton.click(function() {
          that.undo();
        });

        this.redoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.redoButton.text("Redo");
        this.overLayButtonContainer.append(this.redoButton);

        this.redoButton.click(function() {
          that.redo();
        });

      },

      clearCriteria: function() {
        if (this.selectedIndices && this.selectedIndices.length) {
          let hasWellUpdate = false;
          let selectedIndices = this.selectedIndices;
          let well;
          for (let i = 0; i < selectedIndices.length; i++) {
            let index = selectedIndices[i];
            if (index in this.engine.derivative) {
              // handling for clearing well when not allowed to add or delete wells
              if (this.disableAddDeleteWell) {
                if (this.engine.derivative.hasOwnProperty(index)) {
                  well = $.extend(true, {}, this.emptyWellWithDefaultVal);
                  this.engine.derivative[index] = well;
                }
              } else {
                delete this.engine.derivative[index];
              }
              hasWellUpdate = true;
            }
          }

          if (hasWellUpdate) {
            this._colorMixer();
            this.decideSelectedFields();
            this.derivativeChange();
            this.addToUndoRedo();
          }
        } else {
          alert("Please select any well");
        }
      },

      copyCriteria: function() {
        if (this.selectedIndices && this.selectedIndices.length) {
          let wells = this._getSelectedWells();
          this.commonWell = this._getCommonWell(wells);
        } else {
          alert("Please select any well.");
        }
      },

      pasteCriteria: function() {
        if (this.commonWell) {
          this._addAllData(this.commonWell);
          this.decideSelectedFields();
        }
      }
    };
  }
})(jQuery);