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
          this.stackPointer = 1;
          var derivativeJson = {}
          for (var idx in this.derivative) {
            var data = this.derivative[idx]; 
            var wellData = {};
            for (var i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              var attr = THIS.globalSelectedAttributes[i]; 
              if (data.wellData[attr] != null) {
                wellData[attr] = data.wellData[attr];
              }
            }
            if ($.isEmptyObject(wellData)) {
              derivativeJson[idx] = null; 
            } else {
              derivativeJson[idx] = JSON.stringify({"wellData": wellData});
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
              if (this.stackUpWithColor[0]) {
                this.stackUpWithColor[0].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[0] = [refDerivativeIndex];
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

          var wholeNoTiles = 0;
          var wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for (var i = 0; i < THIS.allTiles.length; i++) {
            var tile = THIS.allTiles[i];
            THIS.setTileVisible(tile, false);
          }

          for (var color = 0; color < this.stackPointer; color++) {
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
                var completion = this.checkCompletion(well.wellData, tile);
                THIS.setTileComplete(tile, completion == 1); 
                wholePercentage = wholePercentage + completion;
              }
            }
          }

          wholePercentage = Math.floor(100 * wholePercentage / wholeNoTiles);

          if (isNaN(wholePercentage)) {
            THIS.overLayTextContainer.text("Completion Percentage: 0%");
          } else {
            THIS.overLayTextContainer.text("Completion Percentage: " + this.wholePercentage + "%");
          }
        },

        checkCompletion: function(wellData, tile) {
          var req = 0; 
          var fill = 0; 
          for (var i = 0; i < THIS.fieldList.length; i++) {
            var field = THIS.fieldList[i]; 
            if (field.required) {
              req++; 
              if (wellData[field.id] != null) {
                fill++; 
              }
            }
          }
          if (req == fill) {
            return 1; 
          }
          return fill / req;
        }
      }
    }
  }
})(jQuery, fabric);