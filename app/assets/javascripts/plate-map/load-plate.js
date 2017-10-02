var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function (data) {
        //sanitize input
        var derivative = {}; 
        for (var index in data.derivative) {
          var well = data.derivative[index]; 
          derivative[index] = this.sanitizeWell(well); 
        }; 

        var checkboxes = data.checkboxes || []; 
        var selection = this.sanitizeAreas(data.selectedAreas, data.focalWell); 

        var sanitized = {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selection.selectedAreas,
          "focalWell": selection.focalWell
        }; 

        this.setData(sanitized); 
      }, 

      sanitizeAreas: function (selectedAreas, focalWell) {
        var that = this; 
        var rows = this.dimensions.rows;
        var cols = this.dimensions.cols;

        if (!selectedAreas) {
          selectedAreas = [];
        }
        if (selectedAreas.length) {
          selectedAreas = selectedAreas.map(function (area) {
            return {
              minCol: that._coordIndex(Math.min(area.minCol, area.maxCol), cols), 
              minRow: that._coordIndex(Math.min(area.minRow, area.maxRow), rows), 
              maxCol: that._coordIndex(Math.max(area.minCol, area.maxCol), cols), 
              maxRow: that._coordIndex(Math.max(area.minRow, area.maxRow), rows)
            }; 
          }); 
          var area = selectedAreas[selectedAreas.length - 1];
          if (focalWell && !this._wellInArea(focalWell, area)) {
            focalWell = null;
          }
          if (!focalWell) {
            focalWell = {
              row: area.minRow,
              col: area.minCol
            };
          }
        } else {
          if (!focalWell) {
            focalWell = {
              row: 0,
              col: 0
            };
          }
          selectedAreas = [this._wellToArea(focalWell)];
        }
        return {
          selectedAreas: selectedAreas, 
          focalWell: focalWell
        };
      }, 

      sanitizeValue: function (id, value) {
        var v = value; 
        if (v === "") {
          v = null; 
        }
        if (v != null) {
          var input = $("#" + id);
          switch (input.data("type")) {
            case "select":
              var optMap = input.data("optionMap");
              if (v in optMap) {
                v = optMap[v].id; 
              } else {
                throw "Invalid value " + value + " for select field " + id; 
              }
              break; 
            case "multiselect":
              if (v && v.length) {
                var optMap = input.data("optionMap");
                v = v.map(function (opt_id) {
                  if (opt_id in opt_map) {
                    return opt_map[opt_id].id;
                  } else {
                    throw "Invalid value " + opt_id + " for multiselect field " + id; 
                  }
                }); 
              } else {
                v = null; 
              }
              break;
            case "numeric":
              v = Number(v); 
              if (isNaN(v)) {
                throw "Invalid value " + value + " for numeric field " + id; 
              }
              break; 
            case "text":
              v = String(v);
              break;
            case "boolean":
              v = String(v).toLowerCase();
              if (v == "true" || v == "1") {
                v = true; 
              } else if (v == "false" || v == "0") {
                v = false; 
              } else if (v == "" || v == "null") {
                v = null; 
              } else {
                throw "Invalic value " + value + " for boolean field " + id; 
              }
              break; 
          }
        }
        if (v == null) {
          return this.defaultWell.wellData[id]; 
        } else {
          return v; 
        }
      }, 

      sanitizeUnit: function (id, value) {
        var v = value; 
        if (v === "") {
          v = null; 
        }
        if (v != null) {
          var input = $("#" + id);
          var units = input.data("units"); 
          if (units && units.length) {
            for (var i = 0; i < units.length; i++) {
              if (v == units[i]) {
                return units[i]; 
              }
            }
            throw "Invalid unit " + value + " for field " + id; 
          } else {
            throw "No units specified for field " + id; 
          }
        }
        if (v == null) {
          return this.defaultWell.wellData[id]; 
        } else {
          return v; 
        }
      }, 

      sanitizeWell: function (well) {
        var newWell = {
          wellData: {}, 
          unitData: {}
        }
        for (var prop in this.defaultWell.wellData) {
          newWell.wellData[prop] = this.sanitizeValue(prop, well.wellData[prop]); 
        }
        for (var prop in this.defaultWell.unitData) {
          newWell.unitData[prop] = this.sanitizeUnit(prop, well.unitData[prop]); 
        }
        return newWell; 
      }, 

      setData: function(data) {

        this.engine.derivative = $.extend(true, {}, data.derivative);
        this.setCheckboxes(data.checkboxes); 
        this.setSelection(data.selectedAreas, data.focalWell);

        this._colorMixer();
        this.decideSelectedFields();
        this.mainFabricCanvas.renderAll();
      },

    }
  }
})(jQuery, fabric);