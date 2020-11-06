var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.svgEvents = function() {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      selectedIndices: [],

      _svgEvents: function() {
        // Set up event handling.
        let that = this;

        function getMousePosition(evt) {
          let CTM = that.svg.node.getScreenCTM();
          return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
          };
        }

        function dimCoord(v, max) {
          max = max - 1;
          if (v < 0) {
            return 0;
          } else if (v >= max) {
            return max;
          } else {
            return Math.trunc(v);
          }
        }

        function posToLoc(pos) {
          let s = that.baseSizes.spacing;
          let c = dimCoord(pos.x / s, that.dimensions.cols);
          let r = dimCoord(pos.y / s, that.dimensions.rows);
          return {r: r, c: c}
        }

        function selectionBoxPosition(pos0, pos1) {
          let d0 = posToLoc(pos0);
          let d1 = posToLoc(pos1);
          let s = that.baseSizes.spacing;

          let x0 = Math.min(d0.c, d1.c) * s;
          let y0 = Math.min(d0.r, d1.r) * s;

          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }
          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }

          let x1 = (Math.max(d0.c, d1.c) + 1) * s;
          let y1 = (Math.max(d0.r, d1.r) + 1) * s;

          return {
            x: x0,
            y: y0,
            width: x1 - x0,
            height: y1 - y0,
          };
        }

        function selectTiles(pos0, pos1, secondary) {
          let d0 = posToLoc(pos0);
          let d1 = posToLoc(pos1);
          let extending = true;
          if (secondary) {
            // if d0 is already selected, we are deselecting
            let startIdx = that.locToIndex(d0);
            extending = that.selectedIndices.indexOf(startIdx) < 0;
          }
          let c0 = Math.min(d0.c, d1.c);
          let r0 = Math.min(d0.r, d1.r);

          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }
          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }

          let c1 = Math.max(d0.c, d1.c);
          let r1 = Math.max(d0.r, d1.r);

          let indices = [];

          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              let index = that.locToIndex({'r': r, 'c': c});
              indices.push(index)
            }
          }
          if (secondary) {
            if (extending) {
              that.selectedIndices.forEach(function (index) {
                if (indices.indexOf(index) < 0) {
                  indices.push(index);
                }
              });
            } else {
              indices = that.selectedIndices.filter(index => indices.indexOf(index) < 0);
            }
          }

          that.setSelectedIndices(indices.sort());
        }

        let selectionBox;

        function startDrag(evt) {
          if (selectionBox) {
            selectionBox.remove();
          }
          let pos = getMousePosition(evt);
          let attrs = selectionBoxPosition(pos, pos);
          selectionBox = that.svg.rect().attr(attrs).fill('rgba(0, 0, 1, 0.2)');
          selectionBox.data('origin', pos);
        }

        function drag(evt) {
          if (selectionBox) {
            let pos = getMousePosition(evt);
            let attrs = selectionBoxPosition(selectionBox.data('origin'), pos);
            selectionBox.attr(attrs);
          }
        }

        function endDrag(evt) {
          if (selectionBox) {
            let startPos = selectionBox.data('origin');
            let pos = getMousePosition(evt);
            selectTiles(startPos, pos, evt.shiftKey);
            selectionBox.remove();
            selectionBox = null;
          }
        }

        this.svg.node.addEventListener('mousedown', startDrag);
        this.svg.node.addEventListener('mousemove', drag);
        this.svg.node.addEventListener('mouseleave', endDrag);
        this.svg.node.addEventListener('mouseup', endDrag);

        $(that.target).on("loadPlate", function(evt, data) {
          // This method should be compatible to redo/undo.
          that.loadPlate(JSON.parse(data));
        });
      },

      setSelection: function(selectedIndices) {
        this.selectedIndices = selectedIndices;
        this._setSelectedTiles();
        document.activeElement.blur();
      },

      _setSelectedTiles: function() {
        // Update selected tile display only
        let selectedIndices = this.selectedIndices;
        this.allTiles.forEach(function(tile) {
          let selected = selectedIndices.indexOf(tile.index) >= 0;
          if (selected) {
            tile.tile.addClass('selected');
          } else {
            tile.tile.removeClass('selected');
          }
        })
      },

      _getSelectedWells: function() {
        return this.selectedIndices.map(function(index) {
          let well = this.engine.derivative[index];
          if (!well) {
            well = this.defaultWell;
          }
          return well;
        }, this);
      },

      containsObject: function(obj, list) {
        function deepEqual (x, y) {
          if (x === y) {
            return true;
          } else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
            if (Object.keys(x).length !== Object.keys(y).length) {
              return false;
            }
            for (let prop in x) {
              if (x.hasOwnProperty(prop)) {
                if (y.hasOwnProperty(prop)) {
                  if (!deepEqual(x[prop], y[prop])) {
                    return false;
                  }
                } else {
                  return false;
                }
              }
            }
            return true;
          } else {
            return false;
          }
        }

        if (list) {
          for (let i = 0; i < list.length; i++) {
            if (deepEqual(obj, list[i])) {
              return true;
            }
          }
        }
        return false;
      },

      _buildCommonData: function(commonData, obj, field) {
        let commonVal = commonData[field];
        if (commonVal === undefined) {
          commonVal = null;
        }
        let objVal = obj[field];
        if (objVal === undefined) {
          objVal = null;
        }

        if (Array.isArray(commonVal)) {
          let commonArr = [];
          for (let i = 0; i < commonVal.length; i++) {
            let v = commonVal[i];
            // for multiplex field
            if (v && typeof (v) === "object") {
              for (let j = 0; j < objVal.length; j++) {
                let v2 = objVal[j];
                if (v[field] == v2[field]) {
                  v = $.extend(true, {}, v);
                  for (let oField in v) {
                    this._buildCommonData(v, v2, oField);
                  }
                  commonArr.push(v)
                }
              }
              // if (this.containsObject(v, objVal)) {
              //   commonArr.push(v);
              // }
            } else {
              if ($.inArray(v, objVal) >= 0) {
                commonArr.push(v);
              }
            }
          }
          commonData[field] = commonArr;
        } else {
          if (objVal && typeof (objVal) === "object" && commonVal && typeof (commonVal) === "object") {
            if ((objVal.value !== commonVal.value) || (objVal.unit !== commonVal.unit)) {
              delete commonData[field];
            }
          } else if (commonVal !== objVal) {
            delete commonData[field];
          }
        }
      },

      _getCommonData: function(wells) {
        let commonData = null;
        for (let i = 0; i < wells.length; i++) {
          let well = wells[i];
          if (well == null) {
            continue;
          }
          if (commonData == null) {
            commonData = $.extend(true, {}, wells[0]);
            continue
          }
          for (let field in commonData) {
            if (!commonData.hasOwnProperty(field)) {
              continue;
            }
            this._buildCommonData(commonData, well, field);
          }
        }
        return commonData || this.defaultWell;
      },

      _getCommonWell: function (wells) {
        let commonData = this._getCommonData(wells);
        return this.sanitizeWell(commonData);
      },

      _getAllMultipleVal: function(wells) {
        let multipleFieldList = this.multipleFieldList;
        let that = this;

        multipleFieldList.forEach(function(multiplexField) {
          if (wells.length) {
            let curMultipleVal = {};
            let multiData = null;
            wells.forEach(function(well) {
              if (well == null) {
                return;
              }
              let id = multiplexField.id;
              let wellFieldVals = well[id];
              if (wellFieldVals && wellFieldVals.length) {
                wellFieldVals.forEach(function(multipleVal) {
                  if (typeof (multipleVal) === 'object') {
                    if (multiData == null) {
                      multiData = $.extend(true, {}, multipleVal);
                    } else {
                      for (let oField in multiData) {
                        that._buildCommonData(multiData, multipleVal, oField);
                      }
                    }
                    if (multipleVal[id] in curMultipleVal) {
                      curMultipleVal[multipleVal[id]]++;
                    } else {
                      curMultipleVal[multipleVal[id]] = 1;
                    }
                  } else {
                    if (multipleVal in curMultipleVal) {
                      curMultipleVal[multipleVal]++;
                    } else {
                      curMultipleVal[multipleVal] = 1;
                    }
                  }
                })
              }
            });
            multiplexField.allSelectedMultipleData = multiData || {};
            multiplexField.allSelectedMultipleVal = curMultipleVal;
          } else {
            multiplexField.allSelectedMultipleData = null;
            multiplexField.allSelectedMultipleVal = null
          }
        });
      },

      decideSelectedFields: function() {
        let wells = this._getSelectedWells();
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        let well = this._getCommonWell(wells);
        this._addDataToTabFields(well);
      },

      // get all wells that have data
      getWellSetAddressWithData: function() {
        let indices = Object.keys(this.engine.derivative).map(Number).sort();
        return indices.map(this.indexToAddress, this)
      }

    };
  }
})(jQuery);