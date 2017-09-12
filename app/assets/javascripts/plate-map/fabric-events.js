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
        if (!areas) {
          areas = []
        }
        if (areas.length) {
          var area = areas[areas.length - 1];
          if (focalWell && !this._wellInArea(focalWell, area)) {
            focalWell = null;
          }
          if (!focalWell) {
            focalWell = {
              row: area.minRow,
              col: area.minCol
            };
          }
        } else {
          if (!focalWell) {
            focalWell = {
              row: 0,
              col: 0
            };
          }
          areas = [this._wellToArea(focalWell)];
        }
        this.focalWell = focalWell;
        this.selectedAreas = areas;
        this.allSelectedObjects = this._areasToTiles(areas);
        this._setSelectedTiles();
        this._setFocalWellRect(this.focalWell)
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

      decideSelectedFields: function() {
        // Update presets for selection
        this._addPreset();
        this._applyValuesToTabs();
        //this.mainFabricCanvas.bringToFront(this.overLay);
      },

      _addPreset: function() {
        //Update preset values with selected objects
        if (this.allSelectedObjects && this.previousPreset) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {

            var currentObj = this.allSelectedObjects[objectIndex];
            if ($.isEmptyObject(currentObj["selectedWellAttributes"])) {
              // It says we haven't added any manual selection yet
              var currentSelected = this.allSelectedObjects[objectIndex]["selectedWellAttributes"];
              var presetCount = this.presetSettings[this.previousPreset].length;
              for (var i = 0; i < presetCount; i++) {
                currentSelected[this.presetSettings[this.previousPreset][i]] = true;
              }
            }
          }
        }
      },

      _applyValuesToTabs: function() {
        // re write this method so that everytime it doesn't have to run full
        // Here we look for the values on the well and apply it to tabs.
        if (this.allSelectedObjects.length === 1) {
          // Incase there is only one well selected.
          var referenceTile = this.allSelectedObjects[0];
          var referenceFields = referenceTile["wellData"];
          var referenceUnits = referenceTile["unitData"];
          this._addDataToTabFields(referenceFields, referenceUnits);
        } else if (this.allSelectedObjects.length > 1) {
          // Here we determine the shared values among all selected objects

          var referenceTile = this.allSelectedObjects[0];
          var referenceFields = $.extend(true, {}, referenceTile["wellData"]);
          var referenceUnits = $.extend(true, {}, referenceTile["unitData"]);

          for (var i = 0; i < this.allSelectedObjects.length; i++) {
            var tile = this.allSelectedObjects[i]
            var fields = tile["wellData"]; 
            var units = tile["unitData"]; 
            for (var field in referenceFields) {
              var unitField = field + "unit"; 
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field]; 
                var agrArr = []; 
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j]; 
                  if ($.inArray(v, fields[field]) >= 0) {
                    agrArr.push(v); 
                  }
                }
                referenceFields[field] = agrArr; 
              } else {
                if (referenceFields[field] != fields[field] || referenceUnits[unitField] != units[unitField]) {
                  referenceFields[field] = null; 
                  if (unitField in referenceUnits) {
                    referenceUnits[unitField] = null; 
                  }
                }
              }
            }
          }

          this._addDataToTabFields(referenceFields, referenceUnits);
        }
      },

    };
  }
})(jQuery, fabric);