var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.svgEvents = function() {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      selectedIndices: [],

      _svgEvents: function() {
        // Set up event handling.
        var that = this;

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
              indices = that.selectedIndices.filter(function (index) {
                return indices.indexOf(index) < 0;
              });
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
        var selectedIndices = this.selectedIndices;
        this.allTiles.forEach(function(tile) {
          var selected = selectedIndices.indexOf(tile.index) >= 0;
          if (selected) {
            tile.tile.addClass('selected');
          } else {
            tile.tile.removeClass('selected');
          }
        })
      },

      _getSelectedWells: function() {
        return this.selectedIndices.map(function(index) {
          var well = this.engine.derivative[index];
          if (!well) {
            well = this.defaultWell;
          }
          return well;
        }, this);
      },

      _getCommonFields: function(wells) {
        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell);
          for (var i = 1; i < wells.length; i++) {
            var fields = wells[i];
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field];
                var agrArr = [];
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  if (v && typeof (v) === "object") {
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr;
              } else {
                if (fields[field] && typeof (fields[field]) === "object" && referenceFields[field] && typeof (referenceFields[field]) === "object") {
                  if ((fields[field].value !== referenceFields[field].value) || (fields[field].unit !== referenceFields[field].unit)) {
                    delete referenceFields[field];
                  }
                } else if (referenceFields[field] != fields[field]) {
                  delete referenceFields[field];
                }
              }
            }
          }
          return referenceFields
        } else {
          return {};
        }
      },

      containsObject: function(obj, list) {
        var equality = [];
        if (list) {
          list.forEach(function(val) {
            //evaluate val and obj
            var evaluate = [];
            Object.keys(val).forEach(function(listKey) {
              if (Object.keys(obj).indexOf(listKey) >= 0) {
                var curVal = val[listKey];
                if (typeof (curVal) === 'object' && curVal) {
                  if (obj[listKey]) {
                    evaluate.push((curVal.unit === obj[listKey].unit) && (curVal.value === obj[listKey].value));
                  } else {
                    // when obj[listKey] is null but curVal is not
                    evaluate.push(false);
                  }
                } else {
                  evaluate.push(curVal === obj[listKey]);
                }
              }
            });
            equality.push(evaluate.indexOf(false) < 0);
          });
          return equality.indexOf(true) >= 0;
        } else {
          return false;
        }
      },

      _getCommonWell: function(wells) {
        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell);
          for (var i = 1; i < wells.length; i++) {
            var well = wells[i];
            var fields = well;
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field];
                var agrArr = [];
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  // for multiplex field
                  if (typeof (refArr[j]) === "object") {
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr;
              } else {
                if (fields[field] && typeof (fields[field]) === "object" && referenceFields[field] && typeof (referenceFields[field]) === "object") {
                  if ((fields[field].value !== referenceFields[field].value) || (fields[field].unit !== referenceFields[field].unit)) {
                    referenceFields[field] = null;
                  }
                } else if (referenceFields[field] != fields[field]) {
                  referenceFields[field] = null;
                }

              }
            }
          }
          return referenceFields;
        } else {
          return this.defaultWell;
        }
      },

      _getAllMultipleVal: function(wells) {
        var multipleFieldList = this.multipleFieldList;

        multipleFieldList.forEach(function(multiplexField) {
          if (wells.length) {
            var curMultipleVal = {};
            wells.forEach(function(wellData) {
              var id = multiplexField.id;
              if (wellData[id]) {
                if (wellData[id].length > 0) {
                  wellData[id].forEach(function(multipleVal) {
                    if (typeof (multipleVal) === 'object') {
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
              }
            });
            multiplexField.allSelectedMultipleVal = curMultipleVal;
          } else {
            multiplexField.allSelectedMultipleVal = null
          }
        });
      },

      decideSelectedFields: function() {
        var wells = this._getSelectedWells();
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        var well = this._getCommonWell(wells);
        this._addDataToTabFields(well);
      },

      // get all wells that have data
      getWellSetAddressWithData: function() {
        var indices = Object.keys(this.engine.derivative).map(Number).sort();
        return indices.map(this.indexToAddress, this)
      }

    };
  }
})(jQuery);