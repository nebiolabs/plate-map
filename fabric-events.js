var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {

      _fabricEvents: function() {

        var that = this;
        // When we ckick and drag
        /*this.mainFabricCanvas.on("object:selected", function(selectedObjects) {

          that.mainFabricCanvas.deactivateAllWithDispatch(); // We clear the default selection by canvas
          //Deselect already selected tiles
          that._deselectSelected();
          // Adding newly selected group
          if(selectedObjects.target) {
            that.allSelectedObjects = selectedObjects.target._objects || [selectedObjects.target];
          } else {
            that.allSelectedObjects = selectedObjects;
          }

          console.log(that.allSelectedObjects, that.previousPreset);
          // Select tile/s
          that._selectTiles();
          that._addPreset();
          that._applyValuesToTabs();
          that.mainFabricCanvas.bringToFront(that.overLay);
          that.mainFabricCanvas.renderAll();
        });
        */

        /*
          Limit scroll movement;
          correct dynamic rectangles placing
          find tiles beneth the dynamic rectangle
          pass those tiles to all those functions already written
          consider undo redo .. It should be easy now as I have only one place to control everything
        */
        var xDiff = 25;
        var yDiff = 74;
        var limitX = 632 + xDiff;
        var limitY = 482 + xDiff;

        that.mainFabricCanvas.on("mouse:down", function(evt) {

          that.mouseDown = true;
          that.mainFabricCanvas.remove(that.dynamicRect);
          that.mainFabricCanvas.remove(that.dynamicSingleRect);
          that.dynamicRect = false;
          that.startX = evt.e.clientX - xDiff;
          that.startY = evt.e.clientY - yDiff;
        });

        that.mainFabricCanvas.on("mouse:move", function(evt) {

          if(! that.dynamicRect && that.mouseDown) {
            that.mouseMove = true;
            that._createDynamicRect(evt);
          }

          var x = evt.e.x;
          var y = evt.e.y;

          if(that.mouseDown && x <= limitX && y <= limitY && x > xDiff && y > yDiff) {
            console.log(evt.e)
            // Need a change in logic according to u drag left of right / top bottom
            that.dynamicRect.setWidth(evt.e.clientX - that.startX - xDiff);
            that.dynamicRect.setHeight(evt.e.clientY - that.startY - yDiff);
            that.mainFabricCanvas.renderAll();
          }

        });

        that.mainFabricCanvas.on("mouse:up", function(evt) {

          that.mouseDown = false;

          if(! that.mouseMove) {
            // if its just a click
            that._createDynamicSingleRect(evt);
          }

          that.mouseMove = false;

        });
      },

      _createDynamicRect: function(evt) {

          this.dynamicRect = new fabric.Rect({
            width: 1,
            height: 2,
            left: this.startX,
            top: this.startY,
            originX:'left',
            originY: 'top',
            fill: "#cceffc",
            opacity: .5,
            strokeWidth: 2,
            stroke: "#00506e",
            //rx: 5,
            //ry: 5
          });
          this.mainFabricCanvas.add(this.dynamicRect);
      },

      _createDynamicSingleRect: function(evt) {

        this.dynamicSingleRect = new fabric.Rect({
          width: 50,
          height: 50,
          left: this.startX,
          top: this.startY,
          originX:'left',
          originY: 'top',
          fill: "#cceffc",
          opacity: .5,
          strokeWidth: 2,
          stroke: "#00506e",
          //rx: 5,
          //ry: 5
        });
        this.mainFabricCanvas.add(this.dynamicSingleRect);
      },

      _addPreset: function() {

        if(this.allSelectedObjects && this.previousPreset) {
          var noOfSelectedObjects = this.allSelectedObjects.length;

          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex ++) {
            var currentObj = this.allSelectedObjects[objectIndex];
            if(currentObj.type == "tile" && $.isEmptyObject(currentObj["selectedWellattributes"])) {
              // It says we haven't added any manual selection yet
              var currentSelected = this.allSelectedObjects[objectIndex]["selectedWellattributes"];
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

            if(currentObj.circle) {

              if(currentObj.type == "tile") {
                currentObj.setFill("#f5f5f5");
                currentObj.notSelected.setVisible(false);
              }
            } else {

              if(currentObj.type == "tile") {
                currentObj.setFill("#f5f5f5");
                currentObj.notSelected.setVisible(true);
              }
            }
          }
        }
      },

      _selectTiles: function() {
        // Here we select tile/s from the selection or click
        var noOfSelectedObjects = this.allSelectedObjects.length;
        for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
          var currentObj = this.allSelectedObjects[objectIndex];

          if(currentObj.type == "image"){
            currentObj.setVisible(false);
            currentObj.parent.setFill("#cceffc");
          } else if(currentObj.type == "tile") {
            currentObj.notSelected.setVisible(false);
            currentObj.setFill("#cceffc");
          }
        }
      },

      _applyValuesToTabs: function() {
        // Here we look for the values on the well and apply it to tabs.
        if(this.allSelectedObjects.length === 1) {
          // Incase there is only one well selected.
          this._addDataToTabFields();
        } else {
          // Here we check if all the values are same
          // if yes apply those values to tabs
          // else show empty value in tabs
          // we take first tile as reference object
          var referenceTile =  this.allSelectedObjects[0];
          var referenceFields = referenceTile["wellData"];
          var referenceUnits = referenceTile["unitData"];
          var referenceSelectedFields = referenceTile["selectedWellattributes"];
          var equalWellData = true;
          var equalUnitData = true;
          var equalSelectData = true;
          // Looking for same well data
          for(var i = 0; i < this.allSelectedObjects.length; i++) {

            if(this.allSelectedObjects[i]["type"] == "tile") {
              equalWellData = this.compareObjects(this.allSelectedObjects[i]["wellData"], referenceFields);
              equalUnitData = this.compareObjects(this.allSelectedObjects[i]["unitData"], referenceUnits);
              equalSelectData = this.compareObjects(this.allSelectedObjects[i]["selectedWellattributes"], referenceSelectedFields);

              if(!equalWellData || !equalUnitData || !equalSelectData) {

                this._clearAllFields(referenceFields);
                return true;
              }
            }
          }

          this._addDataToTabFields();
        }
      },

    };
  }
})(jQuery, fabric)
