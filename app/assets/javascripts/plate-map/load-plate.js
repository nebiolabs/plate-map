var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        var derivativeData = data;

        this.clearCriteriaForAll(derivativeData.selectedObjects);

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if (derivativeData.checkboxes && derivativeData.checkboxes.length) {
          this.setCheckboxes(derivativeData.checkboxes);
        } else {
          this.setCheckboxes([]); 
        }

        this.setSelection(derivativeData.selectedAreas, derivativeData.focalWell);
        this.decideSelectedFields();
        this.mainFabricCanvas.renderAll();
      },

      loadDataToCircles: function(circleData) {

        for (var index in circleData) {
          var tile = this.allTiles[index]; 
          var data = circleData[index]; 
          tile.wellData = $.extend(true, {}, tile.wellData, data.wellData);
          tile.unitData = $.extend(true, {}, tile.unitData, data.unitData);
        }
      }

    }
  }
})(jQuery, fabric);