var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      startCoords: {x:0, y:0}, 
      focalWell: {row:0, col:0},
      selectedAreas: [], 

      _clickCoords: function (evt) {
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
              areas[areas.length-1] = that._rectToArea(rect); 
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
              areas[areas.length-1] = area; 
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
            areas[areas.length-1] = area; 
          } 

          that.setSelection(areas, that.focalWell); 
          that.decideSelectedFields(); 
          that.mainFabricCanvas.renderAll();
        });
      },

      setSelection: function (areas, focalWell) {
        if (!areas) {
          areas = []
        }
        if (areas.length) {
          var area = areas[areas.length-1]; 
          if (focalWell && !this._wellInArea(focalWell, area)) {
            focalWell = null; 
          }
          if (!focalWell) {
            focalWell = {row:area.minRow, col:area.minCol}; 
          }
        } else {
          if (!focalWell) {
            focalWell = {row:0, col:0}; 
          }
          areas = [this._wellToArea(focalWell)]; 
        }
        this.focalWell = focalWell; 
        this.selectedAreas = areas; 
        this.allSelectedObjects = this._areasToTiles(areas); 
        this._setSelectedTiles();
        this._setFocalWellRect(this.focalWell)
        if (this.selectedAreas.length > 1) {
          this._setSelectionRect(null); 
        } else {
          this._setSelectionRect(this._areaToRect(this.selectedAreas[0]))
        }
      }, 

      _setFocalWellRect: function (well) {
        if (well) {
          var rect = this._areaToRect(this._wellToArea(well)); 
          if (this.focalWellRect) {
            //update focalWellRect
            this.focalWellRect.setTop(rect.top+1); 
            this.focalWellRect.setLeft(rect.left+1); 
            this.focalWellRect.setWidth(rect.width-2); 
            this.focalWellRect.setHeight(rect.height-2); 
          } else {
            //create focalWellRect
            this.focalWellRect = new fabric.Rect({
              width: rect.width-2,
              height: rect.height-2,
              left: rect.left+1,
              top: rect.top+1,
              originX:'left',
              originY: 'top',
              fill: null,
              strokeWidth: 1,
              stroke: "#00506e",
              rx: 5, 
              ry: 5
            });
            this.mainFabricCanvas.add(this.focalWellRect); 
          }
        } else {
          //clear focalWellRect
          this.mainFabricCanvas.remove(this.focalWellRect); 
          this.focalWellRect = null; 
        }
      }, 

      _setSelectionRect: function (rect) {
        //set the selection rect
        if (rect) {
          if (this.selectionRect) {
            //update selectionRect
            this.selectionRect.setTop(rect.top); 
            this.selectionRect.setLeft(rect.left); 
            this.selectionRect.setWidth(rect.width); 
            this.selectionRect.setHeight(rect.height); 
          } else {
            //create selectionRect
            this.selectionRect = new fabric.Rect({
              width: rect.width,
              height: rect.height,
              left: rect.left,
              top: rect.top,
              originX:'left',
              originY: 'top',
              fill: null,
              strokeWidth: 1.5,
              stroke: "#00506e", 
              rx: 5, 
              ry: 5
            });
            this.mainFabricCanvas.add(this.selectionRect); 
          }
        } else {
          //clear selectionRect
          this.mainFabricCanvas.remove(this.selectionRect); 
          this.selectionRect = null; 
        }
      }, 

      _setSelectedTiles: function() {
        // Update selected tile display only
        var selectedTiles = this.allSelectedObjects; 
        this.allTiles.forEach(function (tile) {
          if (tile.backgroundImg) {
            var selected = selectedTiles.indexOf(tile) >= 0; 
            tile.backgroundImg.setVisible(selected); 
          }
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
        if(this.allSelectedObjects && this.previousPreset) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {

            var currentObj = this.allSelectedObjects[objectIndex];
            if($.isEmptyObject(currentObj["selectedWellAttributes"])) {
              // It says we haven't added any manual selection yet
              var currentSelected = this.allSelectedObjects[objectIndex]["selectedWellAttributes"];
              var presetCount = this.presetSettings[this.previousPreset].length;
              for(var i = 0; i < presetCount; i++) {
                currentSelected[this.presetSettings[this.previousPreset][i]] = true;
              }
            }
          }
        }
      },

      _applyValuesToTabs: function() {
        // re write this method so that everytime it doesn't have to run full
        // Here we look for the values on the well and apply it to tabs.
        if(this.allSelectedObjects.length === 1) {
          // Incase there is only one well selected.
          this._addDataToTabFields();
        } else if(this.allSelectedObjects.length > 1) {
          // Here we check if all the values are same
          // if yes apply those values to tabs
          // else show empty value in tabs
          // we take first tile as reference object
          var referenceTile =  this.allSelectedObjects[0];
          var referenceFields = referenceTile["wellData"];
          var referenceUnits = referenceTile["unitData"];
          var wellD = this.engine.getSelectedValues(referenceTile) || $.extend({}, true, referenceTile["wellData"]);
          var equalWellData = true;
          var equalUnitData = true;
          //var equalSelectData = true;
          // Looking for same well data
          // Correct this
          for(var i = 0; i < this.allSelectedObjects.length; i++) {
              equalWellData = this.compareObjects(this.allSelectedObjects[i]["wellData"], referenceFields);
              equalUnitData = this.compareObjects(this.allSelectedObjects[i]["unitData"], referenceUnits);

              if(!equalWellData || !equalUnitData) {

                this._clearAllFields(referenceFields);
                return true;
              }
          }

          this._addDataToTabFields();
        }
      },

    };
  }
})(jQuery, fabric);
