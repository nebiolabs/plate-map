var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Handles field edits flowing back into the data model: _addAllData is
   * the central write path every field's onChange (add-tab-data.js) and
   * paste-criteria (overlay.js) funnel through. Also owns getPlate/
   * createState (the two "export the whole widget's data" methods used
   * by the public getPlate() API and by undo-redo-manager.js's history
   * snapshots, respectively) and derivativeChange (the "updateWells"
   * external callback trigger).
   */
  plateMapWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      // Applies a partial field-value update (data: {fieldId: newValue})
      // to every currently-selected well. For array/multiplex fields,
      // `newVal.multi` shaped updates are threaded through
      // _getMultiData first to add/remove individual entries rather than
      // replacing the whole array. A well that becomes fully empty
      // afterward (engine.wellEmpty) is deleted from this.engine.derivative
      // entirely -- UNLESS this.disableAddDeleteWell is set, in which
      // case it's reset to this.emptyWellWithDefaultVal instead (see
      // plate-map.js's isDisableAddDeleteWell). Always refreshes the tab
      // fields, re-runs color grouping, fires the "updateWells" callback,
      // and records undo/redo history.
      _addAllData: function(data) {
        if (this.selectedIndices) {
          let noOfSelectedObjects = this.selectedIndices.length;
          this.selectedIndices.forEach(function (index) {
            let well;
            if (index in this.engine.derivative) {
              well = this.engine.derivative[index];
            } else {
              well = $.extend(true, {}, this.defaultWell);
              this.engine.derivative[index] = well;
            }
            well = this.processWellData(data, well, noOfSelectedObjects);
            let empty = this.engine.wellEmpty(well);
            if (empty) {
              if (this.disableAddDeleteWell) {
                if (this.engine.derivative.hasOwnProperty(index)) {
                  well = $.extend(true, {}, this.emptyWellWithDefaultVal);
                  this.engine.derivative[index] = well;
                }
              } else {
                delete this.engine.derivative[index];
              }
            }
          }, this);
        }
        // update multiplex
        this.decideSelectedFields();
        // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode
        this._colorMixer();
        this.derivativeChange();
        this.addToUndoRedo();
      },

      // Merges a partial field-value update (newData) into a single
      // well object, returning the updated well. Deep-clones every new
      // value via JSON round-trip (so no shared references leak back
      // into the caller's data). See _getMultiData for the `multi`
      // (array add/remove) update shape.
      processWellData: function(newData, curWell, noOfSelectedObjects) {
        for (let id in newData) {
          if (!newData.hasOwnProperty(id)) {
            continue;
          }
          let newVal = newData[id];
          if (newVal !== undefined && newVal !== null) {
            if (newVal.multi) {
              let preData = curWell[id];
              newVal = this._getMultiData(preData, newVal, id, noOfSelectedObjects);
            }
            newVal = JSON.parse(JSON.stringify(newVal));
          } else {
            newVal = null;
          }
          curWell[id] = newVal;
        }

        return curWell
      },

      // Applies an add/remove pair to an array-valued (multiselect or
      // multiplex) field's previous value list. `curData.added`/
      // `curData.removed` may each be either a plain option id (plain
      // multiselect) or a {id, value} pair (multiplex, where `value` is
      // the full entry object) -- see create-field-multiselect.js's
      // multiOnChange and create-field-multiplex.js's own multiOnChange
      // for the two shapes this is called with. `[ALL]` as an id is a
      // special sentinel meaning "apply to every currently-matching
      // entry" (the multiplex "combined" option, see
      // create-field-multiplex.js's setSingleSelectOptions).
      _getMultiData: function(preData, curData, fieldId, noOfSelectedObjects) {
        let addNew = curData.added;
        let removed = curData.removed;
        preData = preData || [];
        if (addNew) {
          if (addNew.value) {
            const multiplexId = addNew.id.toString();
            const doAll = multiplexId === '[ALL]';
            let add = !doAll;
            preData = preData.map(function(val) {
              if (doAll || val[fieldId].toString() === multiplexId) {
                add = false;
                for (let subFieldId in addNew.value) {
                  if (subFieldId !== fieldId) {
                    val[subFieldId] = addNew.value[subFieldId];
                  }
                }
                return val;
              }
              return val;
            });
            if (add) {
              preData.push(addNew.value);
            }
          } else if (preData.indexOf(addNew) < 0) {
            preData.push(addNew);
          }
        }

        let removeListIndex = function(preData, removeIndex) {
          let newPreData = [];
          for (let idx in preData) {
            if (!preData.hasOwnProperty(idx)) {
              continue;
            }
            if (parseInt(idx) !== parseInt(removeIndex)) {
              newPreData.push(preData[idx]);
            }
          }
          return newPreData;
        };

        if (removed) {
          let removeIndex;
          // for multiplex field
          if (removed.value) {
            for (let listIdx in preData) {
              let multiplexData = preData[listIdx];
              if (multiplexData[fieldId].toString() === removed.id.toString()) {
                removeIndex = listIdx;
              }
            }
            // remove nested element
            preData = removeListIndex(preData, removeIndex);
          } else {
            if (preData) {
              removeIndex = preData.indexOf(removed);
              if (removeIndex >= 0) {
                preData = removeListIndex(preData, removeIndex);
              }
            }
          }
        }
        if (preData && (preData.length === 0)) {
          preData = null;
        }
        return preData
      },

      // Re-runs color grouping (engine.js's searchAndStack + applyColors)
      // -- call after any change to which wells have what data, or to
      // which fields are checked.
      _colorMixer: function() {
        this.engine.searchAndStack();
        this.engine.applyColors();
      },

      // Fires the public "updateWells" callback (options.updateWells).
      derivativeChange: function() {
        this._trigger("updateWells", null, this);
      },

      // Snapshots enough state to fully restore the widget later:
      // internal (index-keyed) derivative, checked fields, selection,
      // and required-field config. Used both by undo-redo-manager.js
      // (each entry in this.undoRedoArray is one of these) and
      // indirectly by getPlate below (via the address-keyed public
      // shape).
      createState: function() {
        let derivative = $.extend(true, {}, this.engine.derivative);
        let checkboxes = this.getCheckboxes();
        let selectedIndices = this.selectedIndices.slice();

        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedIndices": selectedIndices,
          "requiredField": this.requiredField
        };
      },

      // Public API: exports the whole plate's data in the documented
      // consumer-facing shape -- wells keyed by ADDRESS string (not
      // internal numeric index, unlike this.engine.derivative itself),
      // plus checked fields and selected addresses. See load-plate.js's
      // loadPlate for the inverse operation.
      getPlate: function() {
        let wells = {};
        let derivative = this.engine.derivative;
        for (let index in derivative) {
          if (!derivative.hasOwnProperty(index)) {
            continue;
          }

          let address = this.indexToAddress(index);
          let well = derivative[index];
          wells[address] = $.extend(true, {}, well);
        }
        let checkboxes = this.getCheckboxes();
        let selectedAddresses = this.getSelectedAddresses();

        return {
          "wells": wells,
          "checkboxes": checkboxes,
          "selectedAddresses": selectedAddresses,
          "requiredField": this.requiredField
        };
      }
    };
  }
})(jQuery);