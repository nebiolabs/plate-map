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
          var isEmptyList = true;
          for (var prop in well.wellData) {
            var curVal = well.wellData[prop];
            if (curVal) {
              if (Array.isArray(curVal)) {
                if (curVal.length > 0) {
                  isEmptyList = false;
                }
              } else {
                isEmptyList = false;
              }
            }
          }
          return isEmptyList;
        },

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 1;
          var derivativeJson = {}
          //for (var idx in this.derivative) {
          for (var idx in this.derivative) {
            var data = this.derivative[idx];
            var wellData = {};
            for (var i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              var attr = THIS.globalSelectedAttributes[i]; 

              if (attr in THIS.globalSelectedMultiplexSubfield){
                var selectedSubFields = THIS.globalSelectedMultiplexSubfield[attr];
                var newMultiplexVal = [];
                for (var multiplexIdx in data.wellData[attr]){
                  var curMultiplexVals = data.wellData[attr][multiplexIdx];
                  var newVal = {};
                  newVal[attr] = curMultiplexVals[attr];
                  selectedSubFields.forEach(function (subFieldId) {
                    newVal[subFieldId] = curMultiplexVals[subFieldId];
                    /*
                    if (curMultiplexVals[subFieldId]){
                      newVal[subFieldId] = curMultiplexVals[subFieldId];
                    }
                    */
                  });
                  newMultiplexVal.push(newVal);
                }
                wellData[attr] = newMultiplexVal;
              } else {
                if (data.wellData[attr] != null) {
                  wellData[attr] = data.wellData[attr];
                }
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
                wholeNoTiles++;
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
            THIS.overLayTextContainer.text("Completion Percentage: " + wholePercentage + "%");
          }
        },

        checkCompletion: function(wellData, tile) {
          var req = 0; 
          var fill = 0; 
          for (var i = 0; i < THIS.fieldList.length; i++) {
            var field = THIS.fieldList[i];

            if (field.checkMultiplexCompletion){
              // also apply color
              var multiplexStatus = field.checkMultiplexCompletion(wellData[field.id]);
              if (multiplexStatus.include) {
                fill = fill + multiplexStatus.fill/multiplexStatus.req;
                req++;
              }
            } else {
              if (field.required) {
                req++;
                if (wellData[field.id] !== null) {
                  fill++;
                }
              }
            }

          }
          if (req === fill) {
            return 1; 
          }
          return fill / req;
        },

        applyFieldColor: function(wells) {
          var req = 0;
          var fill = 0;

          var fieldData = {};
          THIS.fieldList.forEach(function(field){
            fieldData[field.id] = [];
          });

          wells.forEach(function(well){
            for (fieldId in fieldData) {
              if (fieldId in well.wellData) {
                fieldData[fieldId].push(well.wellData[fieldId]);
              } else {
                fieldData[fieldId].push(null);
              }
            }
          });

          for (var i = 0; i < THIS.fieldList.length; i++) {
            var field = THIS.fieldList[i];
            if (field.applyMultiplexSubFieldColor){
              field.applyMultiplexSubFieldColor(fieldData[field.id]);
            } else {
              if (field.required) {
                var color = "white";
                fieldData[field.id].forEach(function(val){
                  // for multiselect
                  if (val instanceof Array) {
                    if (val.length === 0) {
                      color = "red";
                    }
                  } else {
                    if (val === null) {
                      color = "red";
                    }
                  }

                })
                field.root.find(".plate-setup-tab-name").css("background", color);
              }
            }
          }
        }
      }
    }
  }
})(jQuery, fabric);