var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {

        derivative: {},
        stackUpWithColor: {},
        stackPointer: 2,
        currentPercentage: 0,
        wholePercentage: 0,
        wholeNoTiles: 0,

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
          var derivativeCopy = JSON.parse(JSON.stringify(this.derivative));//$.extend(true, {}, this.derivative);

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

          this.wholeNoTiles = 0;
          this.currentPercentage = 0;
          this.wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for(color in this.stackUpWithColor) {

            THIS.addBottomTableRow(color, this.stackUpWithColor[color]);

            for(tileIndex in this.stackUpWithColor[color]) {

              this.wholeNoTiles ++;
              tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
              if(!tile.circle) {
                THIS.addCircle(tile, color, this.stackPointer);
              } else {
                THIS.setGradient(tile.circle, color, this.stackPointer);
              }
              // Checks if all the required fields are filled
              this.wholePercentage = this.wholePercentage + this.checkCompletion(tile.wellData, tile);
              this.checkForValidData(tile);
            }
          }

          this.wholePercentage = Math.floor(this.wholePercentage / (this.wholeNoTiles * 100) * 100);

          if(! isNaN(this.wholePercentage)) {
            $(THIS.overLayTextContainer).html("Completion Percentage: " + this.wholePercentage + "%");
          } else {
            $(THIS.overLayTextContainer).html("Completion Percentage: 0%");
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
          THIS.clearSingleCriteria(tile);
          return false;
        },

        checkCompletion: function(wellData, tile) {

          var length = THIS.requiredFields.length;
          var fill = length;
          for(var i = 0; i < length; i++) {
            if(wellData[THIS.requiredFields[i]] == "" || wellData[THIS.requiredFields[i]] == "NULL") {
              tile.circleCenter.radius = 14;
              fill --;
            }
          }
          if(fill != length) return ((fill) / length) * 100;

          tile.circleCenter.radius = 8;
          return 100;
        },

        findCommonValues: function(option) {
          // Find common values in number of Objects.
          // When we copy different wells together we only take common values.
          var reference = JSON.parse(JSON.stringify(THIS.allSelectedObjects[0][option]));//$.extend(true, {}, THIS.allSelectedObjects[0][option]);

          THIS.allSelectedObjects.filter(function(element, index) {
            for(var key in reference) {
              if(reference[key] != element[option][key]) {
                reference[key] = "";
              }
            }
          });
          return reference;
        },
      }
    }
  }
})(jQuery, fabric);
