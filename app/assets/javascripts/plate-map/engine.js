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

          var wellData = $.extend(true, {}, tile.wellData);
          var unitData = $.extend(true, {}, tile.unitData); 

          this.derivative[tile.index] = {
            "wellData": wellData, 
            "unitData": unitData
          };
        },

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 2;
          var derivativeJson = {}
          for (var idx in this.derivative) {
            var data = this.derivative[idx]; 
            var wellData = {}; 
            var unitData = {}; 
            for (var i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              var attr = THIS.globalSelectedAttributes[i]; 
              if (data.wellData[attr] != null) {
                wellData[attr] = data.wellData[attr];
              }
              if (data.unitData[attr] != null) {
                unitData[attr] = data.unitData[attr];
              }
            }
            if ($.isEmptyObject(wellData)) {
              derivativeJson[idx] = null; 
            } else {
              derivativeJson[idx] = JSON.stringify({"wellData": wellData, "unitData": unitData}); 
            }
          }

          while (!$.isEmptyObject(derivativeJson)) {
            var keys = Object.keys(derivativeJson).map(function (k) {return parseFloat(k, 10);});
            keys.sort(function (a, b) {return a-b;}); 

            var refDerivativeIndex = keys[0];
            var referenceDerivative = derivativeJson[refDerivativeIndex];
            var arr = [];

            if (!referenceDerivative) {
              // if no checked box has value, push it to first spot
              if (this.stackUpWithColor[1]) {
                this.stackUpWithColor[1].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[1] = [refDerivativeIndex];
              }

              delete derivativeJson[refDerivativeIndex];
            } else {
              // if checked boxes have values
              for (var i = 0; i < keys.length; i++) {
                var idx = keys[i]; 
                if (referenceDerivative == derivativeJson[idx]) {
                  arr.push(idx);
                  this.stackUpWithColor[this.stackPointer] = arr;
                  delete derivativeJson[idx];
                }
              }
              if (arr.length > 0)
                this.stackPointer++;
            }
          }
          return this;
        },

        applyColors: function() {

          this.wholeNoTiles = 0;
          this.currentPercentage = 0;
          this.wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for (var color = 1; color < this.stackPointer; color++) {
            var arr = this.stackUpWithColor[color];
            if (arr) {
              THIS.addBottomTableRow(color, arr);

              for (var tileIndex in arr) {

                this.wholeNoTiles++;
                tile = THIS.allTiles[this.stackUpWithColor[color][tileIndex]];
                if (!tile.circle) {
                  THIS.addCircle(tile, color, this.stackPointer);
                } else {
                  THIS.setGradient(tile.circle, color, this.stackPointer);
                }
                // Checks if all the required fields are filled
                this.wholePercentage = this.wholePercentage + this.checkCompletion(tile.wellData, tile);
                this.checkForValidData(tile);
              }
            }
          }

          this.wholePercentage = Math.floor(this.wholePercentage / (this.wholeNoTiles * 100) * 100);

          if (!isNaN(this.wholePercentage)) {
            $(THIS.overLayTextContainer).html("Completion Percentage: " + this.wholePercentage + "%");
          } else {
            $(THIS.overLayTextContainer).html("Completion Percentage: 0%");
          }
        },

        checkForValidData: function(tile) {

          for (var wellIndex in tile.wellData) {
            if (tile.wellData[wellIndex] != null) {
              //If the well has some value just be there;
              return true;
            }
          }
          //No values at all, Clear it.
          THIS.clearSingleCriteria(tile);
          return false;
        },

        checkCompletion: function(wellData, tile) {
          var scale = THIS.scaleFactor;
          var length = THIS.requiredFields.length;
          var fill = length;
          tile.circleCenter.radius = 10 * scale;
          for (var i = 0; i < length; i++) {
            if (wellData[THIS.requiredFields[i]] == null) {
              tile.circleCenter.radius = 14 * scale;
              fill--;
              continue;
            }
          }
          if (fill != length) return ((fill) / length) * 100;

          return 100;
        },

        findCommonValues: function(option) {
          // Find common values in number of Objects.
          // When we copy different wells together we only take common values.
          var reference = $.extend(true, {}, THIS.allSelectedObjects[0][option]);

          THIS.allSelectedObjects.filter(function(element, index) {
            for (var key in reference) {
              if (reference[key] != element[option][key]) {
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