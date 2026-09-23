var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * The color-grouping engine: groups wells by their checked-field
   * values (this.stackUpWithColor), assigns each group a color/tile
   * appearance, and computes overall completion percentage. `THIS`
   * (capitalized) is the enclosing plateMapWidget instance -- the
   * convention this file uses to distinguish it from `this`, which
   * inside engine's own methods refers to `this.engine` itself (see
   * plate-map.js's _create: `new plateMapWidget[component](this)`, so
   * `THIS` is bound once via closure, while `this.engine` is a plain
   * object literal whose methods get the usual dynamic `this`).
   */
  plateMapWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateMapWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {

        // Keyed by numeric well index (NOT address) -- see plate-map.js's
        // header comment for the index/address/loc coordinate systems.
        derivative: {},
        // index -> assigned color/group number (raw, unwrapped -- see
        // svg-create.js's setTileColor for the color-palette wraparound
        // applied only at render time).
        colorMap: new Map(),
        // color/group number -> array of well indices sharing that group.
        stackUpWithColor: {},
        stackPointer: 2,

        // A well is "empty" if every field is null/undefined, or (for
        // array-valued fields like multiselect/multiplex) an empty array.
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

        // Groups every well in this.derivative by the JSON-serialized
        // values of only the CHECKED fields (THIS.globalSelectedAttributes
        // -- see check-box.js), populating this.stackUpWithColor. Wells
        // with no value on any checked field (or with no field checked at
        // all) always land in group 0. See test/unit/engine-grouping.test.js
        // for characterized edge cases (multiplex subfield handling,
        // group-0 bucketing rules).
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

        // Rebuilds the bottom table and re-colors every tile from the
        // current this.stackUpWithColor groups (call searchAndStack
        // first if grouping itself may have changed). Also recomputes
        // and displays the overall completion percentage; falls back to
        // "0%" if wholeNoTiles is 0 (i.e. this.derivative is completely
        // empty when this runs -- 100 * 0 / 0 is NaN).
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

        // Returns a single well's completion fraction (0..1): the ratio
        // of required fields that are filled, over all required fields.
        // Multiplex fields delegate to their own checkMultiplexCompletion
        // (create-field-multiplex.js) since a single multiplex field can
        // itself have multiple required subfields across multiple
        // entries. SURPRISING (see test/unit/engine-grouping.test.js):
        // with zero required fields, req === fill === 0 trivially, so
        // completion is reported as 1 (100%) regardless of whether the
        // well has any data at all.
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