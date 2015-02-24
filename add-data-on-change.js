var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addData: function(e, boolean) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if(this.allSelectedObjects) {
          selectedIndexes = [];
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            var wellData = this.allSelectedObjects[objectIndex]["wellData"];
            wellData[e.target.id] = e.target.value;
            selectedIndexes.push(this.allSelectedObjects[objectIndex].index);
            this.newDude = e.target.id;
            // new dude keeps the data , which field is edited lates or which field is checked lates
            //this._addColorCircle(this.allSelectedObjects[objectIndex]);
          }
          //console.log(selectedIndexes)
          this._colorMixer(selectedIndexes);
          //this._selectTilesFromRectangle(this.startingTileIndex, this.rowCount, this.columnCount, this.CLICK);
          this._addRemoveToBottamTable();
          console.log("_______________________________________________");
          this.mainFabricCanvas.renderAll();
          // here we triggergetPlates , so that when ever something change with any of the well, it is fired
          //this._trigger("getPlates", null, data);
        }
      },

      _colorMixer: function(selectedIndexes) {

        this.colorToIndex = {};
        for(var i = 0; i < 11; i++) {
          //console.log(selectedIndexes.indexOf(this.allTiles[i].index))
          //if(this.allTiles[i].circle || selectedIndexes.indexOf(this.allTiles[i].index) != -1) {
            //if(this.allTiles[i].wellData)
            this.engine.createDerivative(this.allTiles[i]);

            //this._addColorCircle(this.allTiles[i]);
            //this.colorToIndex[this.allTiles[i].circle.colorStops[0]] = this.allTiles[i].index;
          //}
        }
        //console.log(this.engine.derivative);
        var derivativeCopy = $.extend(true, {}, this.engine.derivative);
        //for(var i = 0; i < 11 ; i++) {
          //if(! $.isEmptyObject(this.engine.derivative[this.allTiles[i].index].selectedValues)) {
            this.engine.searchAndStack(derivativeCopy);
            this.engine.applyColors();
          //}

        //}

        //this.newDude = null;
        this.allSelectedObjects = this._selectTilesFromRectangle(this.startingTileIndex, this.rowCount, this.columnCount, this.CLICK);
      },
      _addUnitData: function(e) {
        // This method add/change data when unit of some numeric field is changed
        if(this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          for(var objectIndex = 0;  objectIndex < noOfSelectedObjects; objectIndex++) {
            var unitData = this.allSelectedObjects[objectIndex]["unitData"];
            unitData[e.target.id] = e.target.value;
            this._addColorCircle(this.allSelectedObjects[objectIndex]);
          }
          this._colorMixer(selectedIndexes);
          //this._selectTilesFromRectangle(this.startingTileIndex, this.rowCount, this.columnCount, this.CLICK);
          this._addRemoveToBottamTable();
          this.mainFabricCanvas.renderAll();
        }
      },

    };
  }
})(jQuery, fabric)
