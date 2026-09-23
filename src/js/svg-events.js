var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Two distinct responsibilities bundled in one file:
   * (1) Mouse-drag well selection (_svgEvents, wired up at the end of
   *     svg-create.js's _createSvg) -- converts pixel mouse positions to
   *     well locations/indices and updates this.selectedIndices.
   * (2) "Common data" computation across a set of selected wells
   *     (_getCommonData/_buildCommonData/_getCommonWell) -- used both to
   *     populate the tab fields with the selection's shared values
   *     (decideSelectedFields) and to power copy/paste-criteria
   *     (overlay.js). _buildCommonData's rule: a field survives in the
   *     common result only if every well being compared agrees on it
   *     (recursively, for multiplex entries matched by option id);
   *     otherwise it's deleted from the result outright -- see
   *     test/unit/common-data.test.js for the full, sometimes-surprising
   *     characterized behavior (e.g. array fields use set intersection,
   *     not "all-or-nothing" deletion).
   */
  plateMapWidget.svgEvents = function() {
    // This object contains Menu items and how it works;
    return {
      selectedIndices: [],

      // Sets up mouse-drag well selection on the SVG canvas: click-drag
      // draws a selection rectangle (rendered live during drag), and
      // shift-drag extends/toggles the existing selection depending on
      // whether the drag's starting well was already selected. Also
      // wires the "loadPlate" custom DOM event (used by undo/redo replay)
      // to this.loadPlate.
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

          // Explicit numeric comparator: default Array#sort() stringifies
          // elements, which sorts index 10 before index 2.
          that.setSelectedIndices(indices.sort((a, b) => a - b));
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

      // Sets this.selectedIndices directly (assumed already sanitized --
      // called from setSelectedIndices in plate-map.js) and refreshes
      // the tile "selected" visuals; blurs any focused element so
      // keyboard shortcuts (interface.js's _handleShortcuts) keep
      // working right after a selection change.
      setSelection: function(selectedIndices) {
        this.selectedIndices = selectedIndices;
        this._setSelectedTiles();
        document.activeElement.blur();
      },

      // Adds/removes the "selected" CSS class on every tile to match
      // this.selectedIndices -- display only, does not change selection
      // state itself.
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

      // Returns the actual well data objects for the current selection,
      // in selection order. A selected well with no data yet
      // (this.engine.derivative has no entry for its index) is
      // represented by this.defaultWell (tabs.js) rather than null/
      // undefined, so downstream common-data logic can treat every
      // selected well uniformly.
      _getSelectedWells: function() {
        return this.selectedIndices.map(function(index) {
          let well = this.engine.derivative[index];
          if (!well) {
            well = this.defaultWell;
          }
          return well;
        }, this);
      },

      // Reconciles one field's value between the accumulated commonData
      // (starts as a deep copy of the first well) and a new well being
      // folded in, mutating commonData in place. Scalar/units fields:
      // deletes the field entirely on any disagreement (SUBTLE: for
      // {value, unit} fields, differing on EITHER sub-part deletes the
      // whole entry, not just the differing sub-part). Array fields
      // (multiselect/multiplex): computes a SET INTERSECTION instead of
      // an all-or-nothing deletion -- multiplex array entries are
      // matched by option id (field[field] == v2[field]) and then
      // recursed into per-subfield, so a differing subfield can survive
      // as an absent key on an otherwise-matching entry, while the whole
      // entry is still kept (unlike the scalar-field behavior). See
      // test/unit/common-data.test.js for the exhaustive characterized
      // cases -- this is genuinely subtle and easy to get wrong when
      // touching it.
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
          if (!objVal) {
            commonData[field] = commonArr;
            return;
          }
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

      // Folds a set of wells down to their common data via repeated
      // _buildCommonData calls, starting from a deep copy of the first
      // well. Falls back to this.defaultWell if given no non-null wells
      // at all (an all-empty selection).
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

      // _getCommonData followed by sanitizeWell (load-plate.js), so the
      // result has every field's value run through the field's own
      // parseValue -- used wherever the common value needs to be a
      // "real", field-contract-conformant well rather than raw diffed
      // data (e.g. populating the tab fields via _addDataToTabFields).
      _getCommonWell: function (wells) {
        let commonData = this._getCommonData(wells);
        return this.sanitizeWell(commonData);
      },

      // Computes, per multiplex field, the tally of how many selected
      // wells have each option selected (allSelectedMultipleVal) and the
      // common subfield data across matching entries
      // (allSelectedMultipleData, via _buildCommonData) -- powers the
      // multiplex field's "[N well X]" combined option in its
      // "Select to edit" single-select (see create-field-multiplex.js's
      // setSingleSelectOptions).
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

      // Top-level "refresh the tab fields for the current selection"
      // entry point: recomputes multiplex tallies, applies required-
      // field warnings, computes the selection's common well, and
      // pushes those values into the visible field inputs. Called
      // whenever the selection or the underlying data changes (see
      // plate-map.js's setSelectedIndices and add-data-on-change.js's
      // _addAllData).
      decideSelectedFields: function() {
        let wells = this._getSelectedWells();
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        let well = this._getCommonWell(wells);
        this._addDataToTabFields(well);
      },

      // Configure how data is added to tab fields. Formerly its own file,
      // add-data-to-tabs.js -- folded in here since this is its sole
      // caller (REFACTOR_NOTES.md §10.14/§10.15, Stage 2 sub-step (5)).
      _addDataToTabFields: function(well) {
        for (let i = 0; i < this.fieldList.length; i++) {
          let field = this.fieldList[i];
          let v = well[field.id];
          if (v === undefined) {
            v = null;
          }
          field.setValue(v);
        }
      },

      // get all wells that have data
      getWellSetAddressWithData: function() {
        // Explicit numeric comparator on .sort(), and an arrow wrapper
        // (not a bare `this.indexToAddress` reference) on .map() -- see
        // the identical fixes/comments in load-plate.js's
        // sanitizeAddresses and bottom-table.js's addBottomTableRow.
        let indices = Object.keys(this.engine.derivative).map(Number).sort((a, b) => a - b);
        return indices.map(index => this.indexToAddress(index));
      }

    };
  }
})(jQuery);