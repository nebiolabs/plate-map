var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {
      engine: {

        derivative: {},
        stackUpWithColor: {},
        stackPointer: 2,

        createDerivative: function(tile) {

          var selectedValues = this.getSelectedValues(tile);
          var attrs  = $.extend(true, {}, THIS.globalSelectedAttributes);
          var units = this.getUnits(tile);
          var data = $.extend(true, {}, tile.wellData);

          this.derivative[tile.index] = {
            "selectedValues": selectedValues,
            "attrs": attrs,
            "units": units,
            "wellData": data
          };

          //this.derivative.checkBoxes = attrs;
        },

        getSelectedValues: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile["wellData"][attr] && tile["wellData"][attr] != "NULL") {
              data[attr] = tile["wellData"][attr];
            }
          }

          return data;
        },

        getUnits: function(tile) {

          var data = {};
          for(var attr in THIS.globalSelectedAttributes) {
            if(tile.unitData[attr + "unit"]) {
              data[attr + "unit" ] = tile.unitData[attr + "unit"];
            }
          }

          return data;
        },

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 2;
          var derivativeCopy = $.extend(true, {}, this.derivative);

          while(! $.isEmptyObject(derivativeCopy)) {

            var refDerivativeIndex = Object.keys(derivativeCopy)[0];
            var referenceDerivative = derivativeCopy[refDerivativeIndex];
            var arr = [];

            if($.isEmptyObject(referenceDerivative.selectedValues)) {
              // if no checked box has value, push it to first spot
              if(this.stackUpWithColor[1]) {
                this.stackUpWithColor[1].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[1] = [refDerivativeIndex];
              }

              delete derivativeCopy[refDerivativeIndex];
            } else {
              // if cheked boxes have values
              for(data in derivativeCopy) {
                if(THIS.compareObjects(referenceDerivative.selectedValues, derivativeCopy[data].selectedValues)) {
                  if(THIS.compareObjects(referenceDerivative.units, derivativeCopy[data].units)) {
                    arr.push(data);
                    this.stackUpWithColor[this.stackPointer] = arr;
                    delete derivativeCopy[data];
                  }
                }
              }
              // here u cud add applyColors , its a different implementation, but might be a performer.
              if(data.length > 0)
                this.stackPointer ++;
            }
          }
          return this;
        },

        applyColors: function() {

          THIS.addBottomTableHeadings();
          for(color in this.stackUpWithColor) {
            THIS.addBottomTableRow(color, this.stackUpWithColor[color]);
            for(tileIndex in this.stackUpWithColor[color]) {

              tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
              if(!tile.circle) {
                THIS.addCircle(tile, color, this.stackPointer);
              } else {
                THIS.setGradient(tile.circle, color, this.stackPointer);
              }
            }
          }
        },

        checkForValidData: function(tile) {

          for(var wellIndex in tile.wellData) {
            if(tile.wellData[wellIndex] != "" && tile.wellData[wellIndex] != "NULL") {
              //If the well has some value just be there;
              return true;
            }
          }
          //No values at all, Clear it.
          THIS.clearCrieteria(true); // passing the value sayong dont call color mixer
          return false;
        }
      }
    }
  }
})(jQuery, fabric);
