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

        wellEmpty: function (well) {
          for (var prop in well.wellData) {
            if (well.wellData[prop] != null) {
              return false;  
            }
          }
          return true; 
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
                if (data.unitData[attr] != null) {
                  unitData[attr] = data.unitData[attr];
                }
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
        },

        applyColors: function() {

          this.wholeNoTiles = 0;
          this.currentPercentage = 0;
          this.wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for (var i = 0; i < THIS.allTiles.length; i++) {
            var tile = THIS.allTiles[i];
            THIS.setTileVisible(tile, false);
          }

          for (var color = 1; color < this.stackPointer; color++) {
            var arr = this.stackUpWithColor[color];
            if (arr) {
              THIS.addBottomTableRow(color, arr);

              for (var tileIndex in arr) {
                this.wholeNoTiles++;
                var index = this.stackUpWithColor[color][tileIndex]; 
                var tile = THIS.allTiles[index];
                var well = this.derivative[index]; 
                THIS.setTileColor(tile, color, this.stackPointer); 
                // Checks if all the required fields are filled
                this.wholePercentage = this.wholePercentage + this.checkCompletion(well.wellData, tile);
              }
            }
          }

          this.wholePercentage = Math.floor(this.wholePercentage / this.wholeNoTiles);

          if (!isNaN(this.wholePercentage)) {
            $(THIS.overLayTextContainer).text("Completion Percentage: " + this.wholePercentage + "%");
          } else {
            $(THIS.overLayTextContainer).text("Completion Percentage: 0%");
          }
        },

        checkCompletion: function(wellData, tile) {
          var length = THIS.requiredFields.length;
          var fill = length;
          THIS.setTileComplete(tile, true); 
          for (var i = 0; i < length; i++) {
            if (wellData[THIS.requiredFields[i]] == null) {
              THIS.setTileComplete(tile, false); 
              fill--;
              continue;
            }
          }
          if (fill != length) return ((fill) / length) * 100;

          return 100;
        }
      }
    }
  }
})(jQuery, fabric);