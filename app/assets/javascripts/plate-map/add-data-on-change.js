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
            }
            var empty = this.engine.wellEmpty(well); 
            if (empty) {
              delete this.engine.derivative[tile.index];
            }
          }
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
        /*
        var preDt= preData.map(function(subFieldData) {
          return {
            id: subFieldData[fieldId],
            data: subFieldData
          }
        });
        */
        if (addNew) {
          if (preData){
            if (preData.indexOf(addNew.id) < 0) {
              preData.push(addNew.id);
            }
          } else {
            preData = [];
            preData.push(addNew.id);
          }

        }

        if (removed) {
          var index = preData.indexOf(removed.id)
          if (index >= 0) {
            preData.splice(index, -1);
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