var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(id, v) {
        var data = {
          wellData: {}
        };
        data.wellData[id] = v;
        this._addAllData(data); 
      },


      _addAllData: function(data, multiple) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          var wells = [];
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex]; 
            if (tile.index in this.engine.derivative) {
              well = this.engine.derivative[tile.index];
            } else {
              well = $.extend(true, {}, this.defaultWell); 
              this.engine.derivative[tile.index] = well; 
            }
            for (var id in data.wellData) {
              var v;
              if (multiple) {
                var curData = data.wellData[id];
                var preData = well.wellData[id];
                var newDt = this._getMultiData(preData, curData, id);
                // need to replace newData
                v = JSON.parse(JSON.stringify(newDt));
              } else {
                v = JSON.parse(JSON.stringify(data.wellData[id]));
              }
              well.wellData[id] = v;
              wells.push(well);
            }
            var empty = this.engine.wellEmpty(well);
            if (empty) {
              delete this.engine.derivative[tile.index];
            }
          }

          //var well = this._getCommonWell(wells);
          //this._addDataToTabFields(well.wellData);
          // update multiplex remove all field
          this._setSelectedWellMultiplexVal(wells);
          this._colorMixer();
        }
      },


      _addMultiData: function(id, added, removed) {
        var data = {
          wellData: {}
        };
        data.wellData[id] = {
          added: added,
          removed: removed
        };
        this._addAllData(data, 1);
      },



      _getMultiData: function(preData, curData, fieldId) {
        var addNew = curData.added;
        var removed = curData.removed;
        if (addNew) {
          if (preData){
            if (addNew.value) {
              var add = true;
              for (var listIdx in preData) {
                var multiplexData = preData[listIdx];
                if (multiplexData[fieldId] === addNew.id) {
                  add = false;
                  preData = preData.map(function(val) {
                    if (val[fieldId] === addNew.id) {
                      for (var subFieldId in val) {
                        if (addNew.value[subFieldId]) {
                          val[subFieldId] = addNew.value[subFieldId];
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
            } else if (preData.indexOf(addNew.id) < 0) {
              preData.push(addNew.id);
            }
          } else {
            preData = [];
            if (addNew.value) {
              preData.push(addNew.value);
            } else if (addNew.id){
              preData.push(addNew.id);
            }
          }
        }

        if (removed) {
          var removeIndex;
          // for multiplex field
          if (removed.value) {
            for (var listIdx in preData) {
              var multiplexData = preData[listIdx];
              if (multiplexData[fieldId] === removed.id) {
                removeIndex = listIdx;
              }
            }
            // remove nested element
            var newPreData = [];
            for (var idx in preData) {
              if (idx != removeIndex){
                newPreData.push(preData[idx]);
              }
            }
            preData = newPreData;
          } else {
            removeIndex = preData.indexOf(removed.id);
            if (removeIndex >= 0) {
              //preData.splice(removeIndex, -1);
              var newPreData = [];
              for (var idx in preData) {
                if (idx != removeIndex){
                  newPreData.push(preData[idx]);
                }
              }
              preData = newPreData;
            }
          }
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
        var colorLocMap = {};
        var colorLocIdxMap = this.engine.stackUpWithColor;
        var dim = $("#my-plate-layout").plateLayOut("getDimensions");
        for (var colorIdx in colorLocIdxMap) {
          colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(function (locIdx) {
            return $("#my-plate-layout").plateLayOut("indexToAddress", locIdx, dim);
          })
        }

        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selectedAreas,
          "focalWell": focalWell,
          "colorToLoc": colorLocMap
        };
      }

    };
  }
})(jQuery, fabric)