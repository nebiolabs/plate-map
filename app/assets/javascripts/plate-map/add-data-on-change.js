var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addAllData: function(data) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          var wells = [];
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex];
            var well;
            if (tile.index in this.engine.derivative) {
              well = this.engine.derivative[tile.index];
            } else {
              well = $.extend(true, {}, this.defaultWell); 
              this.engine.derivative[tile.index] = well; 
            }
            var processedData = this.processWellData(data, well, noOfSelectedObjects, wells);
            wells = processedData.wells;
            well = processedData.well;
            var empty = this.engine.wellEmpty(well);
            if (empty) {
              if (this.emptyWellWithDefaultVal && this.disableAddDeleteWell) {
                var wellCopy = JSON.parse(JSON.stringify(well));
                var defaultValue = this.emptyWellWithDefaultVal;
                for (var key in defaultValue){
                  if (key in wellCopy){
                    wellCopy[key] = defaultValue[key];
                    this._applyFieldData(key, defaultValue[key]);
                  }
                }
                this.engine.derivative[tile.index] = wellCopy;
              } else {
                delete this.engine.derivative[tile.index];
              }
            }
          }
        }
        // update multiplex remove all field
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode
        this._colorMixer();
      },

      processWellData: function(newData, curWell, noOfSelectedObjects, wellList) {

        if (!wellList){
          wellList = [];
        }
        for (var id in newData) {
          var v;
          if (newData[id] !== undefined && newData[id] !== null ) {
            if (newData[id].multi){
              var curData = newData[id];
              var preData = curWell[id];
              var newDt = this._getMultiData(preData, curData, id, noOfSelectedObjects);
              // need to replace newData
              v = JSON.parse(JSON.stringify(newDt));
            } else {
              v = JSON.parse(JSON.stringify(newData[id]));
            }
          } else {
            v = JSON.parse(JSON.stringify(newData[id]));
          }
          curWell[id] = v;
          wellList.push(curWell);
        }

        return {
          well: curWell,
          wells: wellList
        }
      },

      _getMultiData: function(preData, curData, fieldId, noOfSelectedObjects) {
        var addNew = curData.added;
        var removed = curData.removed;
        if (addNew) {
          if (preData){
            if (addNew.value) {
              var add = true;
              for (var listIdx in preData) {
                var multiplexData = preData[listIdx];
                // for cases when the add new data exist in well
                if (multiplexData[fieldId].toString() === addNew.id.toString()) {
                  add = false;
                  // update subfield value
                  preData = preData.map(function(val) {
                    if (val[fieldId].toString() === addNew.id.toString()) {
                      for (var subFieldId in val) {
                        // over write previous data if only one well is selected
                        if (subFieldId in addNew.value && subFieldId !== fieldId){
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
            } else if (addNew){
              preData.push(addNew);
            }
          }
        }

        var removeListIndex = function(preData, removeIndex) {
          var newPreData = [];
          for (var idx in preData) {
            if (parseInt(idx) !== parseInt(removeIndex)){
              newPreData.push(preData[idx]);
            }
          }
          return newPreData;
        };

        if (removed) {
          var removeIndex;
          // for multiplex field
          if (removed.value) {
            for (var listIdx in preData) {
              var multiplexData = preData[listIdx];
              if (multiplexData[fieldId].toString() === removed.id.toString()) {
                removeIndex = listIdx;
              }
            }
            // remove nested element
            preData = removeListIndex(preData, removeIndex);
          } else {
            if (preData){
              removeIndex = preData.indexOf(removed);
              if (removeIndex >= 0) {
                preData = removeListIndex(preData, removeIndex);
              }
            }
          }
        }
        if (preData && (preData.length == 0)) {
          preData = null; 
        }
        return preData
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
        var selectedWells;

        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selectedAreas,
          "focalWell": focalWell
        };
      },

      getCurrentPlate: function(){
        var derivative = $.extend(true, {}, this.engine.derivative);
        var colorLocMap = {};
        var colorLocIdxMap = this.engine.stackUpWithColor;
        var dim = this.getDimensions();
        var that = this;
        for (var colorIdx in colorLocIdxMap) {
          colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(function (locIdx) {
            return that.indexToAddress(locIdx, dim);
          })
        }
        var requiredField = this.requiredField;
        var selectedWells;

        return {
          "derivative": derivative,
          "colorToLoc": colorLocMap,
          "requiredField": requiredField
        };
      }

    };
  }
})(jQuery, fabric);