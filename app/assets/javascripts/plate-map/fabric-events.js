var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      startCoords: {
        x: 0,
        y: 0
      },
      focalWell: {
        row: 0,
        col: 0
      },
      selectedAreas: [],

      _clickCoords: function(evt) {
        //Get XY Coords for a given event. 
        var rect = evt.e.target.getBoundingClientRect();
        return {
          x: evt.e.clientX - rect.left,
          y: evt.e.clientY - rect.top
        };
      },

      _fabricEvents: function() {
        // Set up event handling. 
        var that = this;

        $(that.target).on("getPlates", function(evt, data) {
          // This method should be compatable to redo/undo.
          that.getPlates(JSON.parse(data));
        });

        that.mainFabricCanvas.on("mouse:down", function(evt) {
          // Start selecting new area
          that.selecting = true;
          var coords = that._clickCoords(evt);

          var areas = that.selectedAreas.slice();
          var focalWell = that.focalWell;
          var startCoords = that._wellToCoords(focalWell, true);
          var rect = that._coordsToRect(startCoords, coords);

          if (evt.e.ctrlKey) {
            //adding new area
            startCoords = coords;
            rect = that._coordsToRect(startCoords, coords);
            focalWell = that._coordsToWell(startCoords);
            if (evt.e.shiftKey) {
              //replacing existing areas
              areas = [that._rectToArea(rect)];
            } else {
              areas.push(that._rectToArea(rect));
            }
          } else {
            if (evt.e.shiftKey) {
              //Altering last area
              areas[areas.length - 1] = that._rectToArea(rect);
            } else {
              //Creating new area
              startCoords = coords;
              rect = that._coordsToRect(startCoords, coords);
              focalWell = that._coordsToWell(startCoords);
              areas = [that._rectToArea(rect)];
            }
          }

          that.startCoords = startCoords;
          that.setSelection(areas, focalWell);
          that.mainFabricCanvas.renderAll();
        });

        that.mainFabricCanvas.on("mouse:move", function(evt) {
          if (that.selecting) {
            // continue selecting new area
            var areas = that.selectedAreas.slice();
            var endCoords = that._clickCoords(evt);
            var rect = that._coordsToRect(that.startCoords, endCoords);
            var area = that._rectToArea(rect);
            if (area) {
              areas[areas.length - 1] = area;
            }

            that.setSelection(areas, that.focalWell);
            that.mainFabricCanvas.renderAll();
          }

        });

        that.mainFabricCanvas.on("mouse:up", function(evt) {
          // finish selecting new area
          that.selecting = false;
          var areas = that.selectedAreas.slice();
          var endCoords = that._clickCoords(evt);
          var rect = that._coordsToRect(that.startCoords, endCoords);
          var area = that._rectToArea(rect);
          if (area) {
            areas[areas.length - 1] = area;
          }

          that.setSelection(areas, that.focalWell);
          that.decideSelectedFields();
          that.mainFabricCanvas.renderAll();
        });
      },

      setSelection: function(areas, focalWell) {
        this.selectedAreas = areas;
        this.focalWell = focalWell;
        this.allSelectedObjects = this._areasToTiles(areas);
        this._setSelectedTiles();
        this._setFocalWellRect(this.focalWell)
        document.activeElement.blur();
      },

      _setFocalWellRect: function(well) {
        if (well) {
          var rect = this._areaToRect(this._wellToArea(well));
          var strokeWidth = 2;
          if (this.focalWellRect) {
            //update focalWellRect
            this.focalWellRect.setTop(rect.top);
            this.focalWellRect.setLeft(rect.left);
            this.focalWellRect.setWidth(rect.width - strokeWidth);
            this.focalWellRect.setHeight(rect.height - strokeWidth);
          } else {
            //create focalWellRect
            this.focalWellRect = new fabric.Rect({
              width: rect.width - strokeWidth,
              height: rect.height - strokeWidth,
              left: rect.left,
              top: rect.top,
              fill: null,
              strokeWidth: strokeWidth,
              stroke: "black",
              selectable: false
            });
            this.mainFabricCanvas.add(this.focalWellRect);
          }
        } else {
          //clear focalWellRect
          this.mainFabricCanvas.remove(this.focalWellRect);
          this.focalWellRect = null;
        }
      },

      _setSelectedTiles: function() {
        // Update selected tile display only
        var selectedTiles = this.allSelectedObjects;
        this.allTiles.forEach(function(tile) {
          var selected = selectedTiles.indexOf(tile) >= 0;
          tile.highlight.setVisible(selected);
        })
      },

      _getSelectedWells: function () {
        var that = this; 
        return this.allSelectedObjects.map(function (tile) {
          var well = that.engine.derivative[tile.index];
          if (!well) {
            well = that.defaultWell; 
          }
          return well; 
        }); 
      },

      _getCommonFields: function (wells) {
        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell.wellData);
          for (var i = 1; i < wells.length; i++) {
            var well = wells[i];
            var fields = well.wellData;
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field]; 
                var agrArr = []; 
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  if (v && typeof(v) === "object") {
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr; 
              } else {
                if (referenceFields[field] != fields[field]) {
                  delete referenceFields[field];
                }
              }
            }
          }
          return referenceFields

        } else {
          return {};
        }
      },

      containsObject: function(obj, list) {
        var equality = [];
        if (list) {
          list.forEach(function(val) {
            //evaluate val and obj
            var evaluate = [];
            Object.keys(val).forEach(function(listKey){
              if (Object.keys(obj).indexOf(listKey) >= 0){
                var curVal = val[listKey];
                if (typeof(curVal) === 'object' && curVal) {
                  if (obj[listKey]){
                    evaluate.push((curVal.unit === obj[listKey].unit) && (curVal.value === obj[listKey].value));
                  } else {
                    // when obj[listKey] is null but curVal is not
                    evaluate.push(false);
                  }

                } else {
                  evaluate.push(curVal === obj[listKey]);
                }

              }
            });
            equality.push(evaluate.indexOf(false) < 0);
          });
          return equality.indexOf(true) >= 0;
        } else {
          return false;
        }
      },

      _getCommonWell: function (wells) {
        // for multiplex field, the obj has to be exactly the same as list (unit has to be the same too)


        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell.wellData);
          for (var i = 1; i < wells.length; i++) {
            var well = wells[i];
            var fields = well.wellData;
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field]; 
                var agrArr = []; 
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  // for multiplex field
                  if (typeof(refArr[j]) ==="object"){
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr; 
              } else {
                if (referenceFields[field] != fields[field]) {
                  referenceFields[field] = null;
                }
              }
            }
          }
          return {
            wellData: referenceFields
          }
        } else {
          return this.defaultWell; 
        }
      }, 

      _setSelectedWellMultiplexVal: function (wells) {
        var multiplexFieldList = this.multiplexFieldList;

        if (wells.length) {
          multiplexFieldList.forEach(function(multiplexField) {
            var curMultiplexVal = [];
            wells.forEach(function (well) {
              var wellData = well.wellData;
              var id = multiplexField.id;
              if (wellData[id]){
                if (wellData[id].length > 0) {
                  wellData[id].forEach(function (multiplexVal) {
                    if (curMultiplexVal.indexOf(multiplexVal[id]) < 0) {
                      curMultiplexVal.push(multiplexVal[id]);
                    }
                  })
                }
              }
            });
            multiplexField.removeAllField.setOpts(curMultiplexVal);
          })
        }
      },


      decideSelectedFields: function() {
        var wells = this._getSelectedWells();
        this._setSelectedWellMultiplexVal(wells);
        var well = this._getCommonWell(wells); 
        this._addDataToTabFields(well.wellData);
      }

    };
  }
})(jQuery, fabric);