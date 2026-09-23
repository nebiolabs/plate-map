var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * The overlay bar above the canvas: the "Completion Percentage" text
   * (updated by engine.js's applyColors) and the Clear/Copy/Paste/Undo/
   * Redo buttons. Also owns the copy/paste-criteria clipboard-like
   * feature (this.commonData) that lets a user copy the selection's
   * common values and paste them onto a different selection.
   */
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

      // The "Clear" button/Delete-key action: empties every currently-
      // selected well's data. Respects this.disableAddDeleteWell the
      // same way _addAllData does (resets to emptyWellWithDefaultVal
      // instead of deleting the well outright when that restricted mode
      // is active).
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

      // The "Copy" button/Ctrl+C action: computes the current
      // selection's common data (svg-events.js's _getCommonData) and
      // stashes it on this.commonData -- an in-memory "clipboard" that
      // pasteCriteria below reads from later.
      copyCriteria: function() {
        if (this.selectedIndices && this.selectedIndices.length) {
          let wells = this._getSelectedWells();
          this.commonData = this._getCommonData(wells);
        } else {
          alert("Please select any well.");
        }
      },

      // The "Paste" button/Ctrl+V action: applies the last-copied
      // commonData onto the current selection via _addAllData
      // (add-data-on-change.js) -- a no-op if nothing has been copied
      // this session yet.
      pasteCriteria: function() {
        if (this.commonData) {
          this._addAllData(this.commonData);
          this.decideSelectedFields();
        }
      }
    };
  }
})(jQuery);