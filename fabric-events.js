var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {
        colorToIndex: {},

      _fabricEvents: function() {

        var that = this;
        // When we ckick and drag
        this.mainFabricCanvas.on("object:selected", function(selectedObjects) {
          // Once we used this handler when we clicked and dragged , not anymore.
          // Now only purpose is when we click on clear fields.
          //Deselect already selected tiles
          //console.log("ddoooooooooooo", that);
          that._deselectSelected();
          // Adding newly selected group -: here it is tiles whose values are cleared..!
          if(selectedObjects.target) {
            that.allSelectedObjects = selectedObjects.target._objects || [selectedObjects.target];
          } else {
            that.allSelectedObjects = selectedObjects;
          }
          // Select tile/s
          that._selectTiles();
          that._addPreset();
          that._applyValuesToTabs();
          that.mainFabricCanvas.renderAll();
        });

        //
        $(that.target).on("getPlates", function(evt, data) {
          // This method should be compatable to redo/undo.
          //alert("alright")
          that.getPlates(data);
        });
        /*
          correct dynamic rectangles placing
          correct drag in the opposite direction
          pass those tiles to all those functions already written
          consider undo redo .. It should be easy now as I have only one place to control everything
        */
        var xDiff = 25;
        var yDiff = 74;
        var limitX = 624 + xDiff;
        var limitY = 474 + xDiff;

        //$(window).scroll(function(evt){
          // Look for a solution to this problem ... !!!
          // May be implement a way to handle offset, Look for calcOffset Source code.
          //that.mainFabricCanvas.calcOffset();
        //});

        that.mainFabricCanvas.on("mouse:down", function(evt) {

          that.mouseDown = true;
          that._deselectSelected(); // Deselecting already selected tiles.
          that.mainFabricCanvas.remove(that.dynamicRect);
          that.mainFabricCanvas.remove(that.dynamicSingleRect);
          that.dynamicRect = false;
          that.startX = evt.e.clientX - xDiff;
          that.startY = evt.e.clientY - yDiff;
        });

        that.mainFabricCanvas.on("mouse:move", function(evt) {

          var x = evt.e.x || evt.e.clientX;
          var y = evt.e.y || evt.e.clientY;

          if((!that.dynamicRect) && (that.mouseDown)) {
            // Create rectangle .. !
            that.mouseMove = true;
            that._createDynamicRect(evt);
          }

          if(that.dynamicRect && that.mouseDown && x > that.spacing && y > that.spacing) {
            // Need a change in logic according to u drag left of right / top bottom
            that.dynamicRect.setWidth(x - that.startX - xDiff);
            that.dynamicRect.setHeight(y - that.startY - yDiff);
            that.mainFabricCanvas.renderAll();
          }

        });

        that.mainFabricCanvas.on("mouse:up", function(evt) {

          that.mouseDown = false;

          if(! that.mouseMove) {
            // if its just a click
            that._createDynamicSingleRect(evt);
            that._decideSelectedFields(that.dynamicSingleRect, true);
            that._alignRectangle(that.dynamicSingleRect);
          } else {
            that._decideSelectedFields(that.dynamicRect);
            that._alignRectangle(that.dynamicRect);
          }

          that.mouseMove = false;
          that.mainFabricCanvas.renderAll();
        });
      },


      _alignRectangle: function(rect) {

          var firstRect = this.allSelectedObjects[0];
          var lastRect = this.allSelectedObjects[this.allSelectedObjects.length - 1];

          if(firstRect) {

            rect.left = firstRect.left - 25;
            rect.top = firstRect.top - 25;

            if(this.allSelectedObjects.length === 1) {
              //Incase its a click on a tile ...!
              rect.setWidth(this.spacing);
              rect.setHeight(this.spacing);
            } else {
              // If its a multiselect ...!
              rect.setWidth((lastRect.left - rect.left) + this.spacing / 2);
              rect.setHeight((lastRect.top - rect.top) + this.spacing / 2);
            }

            rect.rx = 5;
            rect.ry = 5;

          } else {
            rect.setVisible(false);
          }
      },

      _decideSelectedFields: function(rect, click) {

          if(rect.width < 0) {
            // If we scroll from right to left.
            rect.left = rect.left + rect.width;
            rect.width = rect.width * -1;
          }

          if(rect.height < 0) {
            // If we scroll from bottom to top
            rect.top = rect.top + rect.height;
            rect.height = rect.height * -1;
          }

          var tileWidth = this.spacing;
          var halfTileWidth = tileWidth / 2;
          var top = rect.top;
          var left = rect.left;
          var width = rect.width;
          var height = rect.height;
          var right = left + width;
          var bottom = top + height;
          // When we multiselect from top and left,
          // We may need to start from the first tile we encounter.
          if(rect.left < 25) {
              left = 25;
              right = right - (25 - rect.left);
          }

          if(rect.top < 25) {
            top = 25;
            bottom = bottom - (25 - rect.top);
          }

          if(right >= 580) {
            right = 580;
          }

          if(bottom >= 400) {
            bottom = 400;
          }

          if(! click) {
              // if its not a click, We expect the drag to cover 50% of the tile to be selected,
              // otherwise ignore for the particula tile.
              if( Math.floor(left / halfTileWidth) % 2 === 0) {
                  left = left + halfTileWidth;
              }

              if( Math.floor(top / halfTileWidth) % 2 === 0) {
                  top = top + halfTileWidth;
              }

              if( Math.floor(right / halfTileWidth) % 2 != 0) {
                  right = right - halfTileWidth;
              }

              if( Math.floor(bottom / halfTileWidth) % 2 != 0) {
                  bottom = bottom - halfTileWidth;
              }
          }

          var startingTileIndex = (Math.round(left / tileWidth) - 1) + (12 * (Math.round(top / tileWidth) - 1) );
          var endingTileIndex = (Math.round(right / tileWidth) ) + (12 * (Math.round(bottom / tileWidth) ) );

          this.rowCount = Math.round(bottom / tileWidth) - Math.round(top / tileWidth);
          this.columnCount = Math.round(right / tileWidth) - Math.round(left / tileWidth);

          if(startingTileIndex >= 0 && startingTileIndex <= 95) {
            this.startingTileIndex = startingTileIndex;
            this.CLICK = click;
            this.allSelectedObjects = this._selectTilesFromRectangle(startingTileIndex, this.rowCount, this.columnCount, click);
            this._selectTiles();
            this._addPreset();
            this._applyValuesToTabs();
            this.mainFabricCanvas.bringToFront(this.overLay);
          }
      },

      _selectTilesFromRectangle: function(start, row, column, click) {

        var tileObjects = [];
        if(click) {
          // If its a single click event.
          tileObjects.push(this.allTiles[start]);
          return tileObjects;
        }

        var i = 0;
        for(var i = 0; i <= row; i ++) {

          for(var j = 0; j <= column; j++) {
            tileObjects.push(this.allTiles[start + j]);
          }
          start = start + 12;
        }

        return tileObjects;
      },

      _createDynamicRect: function(evt) {

          this.dynamicRect = new fabric.Rect({
            width: 1,
            height: 2,
            left: this.startX,
            top: this.startY,
            originX:'left',
            originY: 'top',
            fill: null,
            strokeWidth: 1.5,
            stroke: "#00506e"
          });
          this.mainFabricCanvas.add(this.dynamicRect);
      },

      _createDynamicSingleRect: function(evt) {

        this.dynamicSingleRect = new fabric.Rect({
          width: this.spacing,
          height: this.spacing,
          left: this.startX,
          top: this.startY,
          originX:'left',
          originY: 'top',
          fill: null,
          strokeWidth: 1.5,
          stroke: "#00506e"
        });
        this.mainFabricCanvas.add(this.dynamicSingleRect);
      },

      _addPreset: function() {

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

      _deselectSelected: function() {
        // Putting back fill of previously selected group
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {
            var currentObj = this.allSelectedObjects[objectIndex];
              currentObj.backgroundImg.setVisible(false);
          }
        }
      },

      _selectTiles: function() {
        // Here we select tile/s from the selection or click
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          var currentObj = this.allSelectedObjects[objectIndex];
            currentObj.backgroundImg.setVisible(true);
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
