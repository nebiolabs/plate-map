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
        }

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

      sanitizeWell: function (well) {
        var newWell = {
          wellData: {}
        };
        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          newWell.wellData[field.id] = field.parseValue(well.wellData[field.id]);
        }
        return newWell; 
      }, 

      setData: function(data) {
        this.engine.derivative = $.extend(true, {}, data.derivative);
        this.engine.selectedDerivative = JSON.parse(JSON.stringify(this.engine.derivative));
        this.setCheckboxes(data.checkboxes); 
        this.setSelection(data.selectedAreas, data.focalWell);
        this._colorMixer();
        this.decideSelectedFields();
        this.mainFabricCanvas.renderAll();
      },

    }
  }
})(jQuery, fabric);