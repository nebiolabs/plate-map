var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addAllData: function(data) {
        let wells = [];
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
        // update multiplex remove all field
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode
        this._colorMixer();
        this.derivativeChange();
        this.addToUndoRedo();
      },

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

      _getMultiData: function(preData, curData, fieldId, noOfSelectedObjects) {
        let addNew = curData.added;
        let removed = curData.removed;
        if (addNew) {
          if (preData) {
            if (addNew.value) {
              let add = true;
              for (let listIdx in preData) {
                if (!preData.hasOwnProperty(listIdx)) {
                  continue;
                }
                let multiplexData = preData[listIdx];
                // for cases when the add new data exist in well
                if (multiplexData[fieldId].toString() === addNew.id.toString()) {
                  add = false;
                  // update subfield value
                  preData = preData.map(function(val) {
                    if (val[fieldId].toString() === addNew.id.toString()) {
                      for (let subFieldId in val) {
                        if (!val.hasOwnProperty(subFieldId)) {
                          continue;
                        }
                        // over write previous data if only one well is selected
                        if (subFieldId in addNew.value && subFieldId !== fieldId) {
                          if (noOfSelectedObjects === 1) {
                            val[subFieldId] = addNew.value[subFieldId];
                          } else if (addNew.value[subFieldId]) {
                            val[subFieldId] = addNew.value[subFieldId];
                          }
                        }
                      }
                    }
                    return val;
                  })
                }
              }
              if (add) {
                preData.push(addNew.value);
              }
            } else if (preData.indexOf(addNew) < 0) {
              preData.push(addNew);
            }
          } else {
            preData = [];
            if (addNew.value) {
              preData.push(addNew.value);
            } else if (addNew) {
              preData.push(addNew);
            }
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

      _colorMixer: function() {
        this.engine.searchAndStack();
        this.engine.applyColors();
      },

      derivativeChange: function() {
        this._trigger("updateWells", null, this);
      },

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