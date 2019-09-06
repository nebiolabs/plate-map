var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {

        derivative: {},
        colorMap: new Map(),
        stackUpWithColor: {},
        stackPointer: 2,

        wellEmpty: function(well) {
          for (let prop in well) {
            if (!well.hasOwnProperty(prop)) {
              continue;
            }
            let curVal = well[prop];
            if (curVal !== null && curVal !== undefined) {
              if (Array.isArray(curVal)) {
                if (curVal.length > 0) {
                  return false;
                }
              } else {
                return false;
              }
            }
          }
          return true;
        },

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 1;
          let derivativeJson = {};
          for (let idx in this.derivative) {
            if (!this.derivative.hasOwnProperty(idx)) {
              continue;
            }
            let data = this.derivative[idx];
            let wellData = {};
            for (let i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              let attr = THIS.globalSelectedAttributes[i];

              if (attr in THIS.globalSelectedMultiplexSubfield) {
                let selectedSubFields = THIS.globalSelectedMultiplexSubfield[attr];
                let newMultiplexVal = [];
                for (let multiplexIdx in data[attr]) {
                  if (!data[attr].hasOwnProperty(multiplexIdx)) {
                    continue;
                  }
                  let curMultiplexVals = data[attr][multiplexIdx];
                  let newVal = {};
                  newVal[attr] = curMultiplexVals[attr];
                  selectedSubFields.forEach(function(subFieldId) {
                    newVal[subFieldId] = curMultiplexVals[subFieldId];
                  });
                  newMultiplexVal.push(newVal);
                }
                wellData[attr] = newMultiplexVal;
              } else {
                if (data[attr] != null) {
                  wellData[attr] = data[attr];
                }
              }
            }
            if ($.isEmptyObject(wellData)) {
              derivativeJson[idx] = null;
            } else {
              derivativeJson[idx] = JSON.stringify(wellData);
            }
          }

          while (!$.isEmptyObject(derivativeJson)) {
            let keys = Object.keys(derivativeJson).map(parseFloat);
            keys.sort(function(a, b) {
              return a - b;
            });

            let refDerivativeIndex = keys[0];
            let referenceDerivative = derivativeJson[refDerivativeIndex];
            let arr = [];

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
              for (let i = 0; i < keys.length; i++) {
                let idx = keys[i];
                if (referenceDerivative === derivativeJson[idx]) {
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

          let wholeNoTiles = 0;
          let wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for (let i = 0; i < THIS.allTiles.length; i++) {
            let tile = THIS.allTiles[i];
            THIS.setTileVisible(tile, false);
          }

          for (let color = 0; color < this.stackPointer; color++) {
            let arr = this.stackUpWithColor[color];
            if (arr) {
              THIS.addBottomTableRow(color, arr);

              for (let i = 0; i < arr.length; i++) {
                wholeNoTiles++;
                let index = this.stackUpWithColor[color][i];
                let tile = THIS.allTiles[index];
                let well = this.derivative[index];
                this.colorMap.set(index, color);
                THIS.setTileColor(tile, color);
                // Checks if all the required fields are filled
                let completion = this.checkCompletion(well, tile);
                THIS.setTileComplete(tile, completion === 1);
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
          THIS.selectObjectInBottomTab();
        },

        checkCompletion: function(wellData) {
          let req = 0;
          let fill = 0;
          for (let i = 0; i < THIS.fieldList.length; i++) {
            let field = THIS.fieldList[i];
            if (field.checkMultiplexCompletion) {
              // also apply color
              let multiplexStatus = field.checkMultiplexCompletion(wellData[field.id]);
              if (multiplexStatus.include) {
                fill += multiplexStatus.completionPct;
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
      }
    }
  }
})(jQuery);