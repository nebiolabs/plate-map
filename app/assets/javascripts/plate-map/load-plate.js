var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        var derivativeData = data;

        this.clearCheckBoxes();

        this.clearCriteriaForAll(derivativeData.selectedObjects);

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if (!derivativeData.checkboxes.length) {
          this._colorMixer(true);
        } else {
          this.loadCheckboxes(derivativeData.checkboxes);
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
      },

      loadCheckboxes: function(checkboxes) {
        for (var i = 0; i < checkboxes.length; i++) {
          var checkbox = checkboxes[i]; 
          var checkBoxImage = $("#" + checkboxes[i]).data("checkBox");
          checkBoxImage.data("clicked", false).trigger("click", true);
        }
      },

      clearCheckBoxes: function() {
       for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var checkbox = this.globalSelectedAttributes[i]; 
          var checkBoxImage = $("#" + checkbox).data("checkBox");
          checkBoxImage.data("clicked", true).trigger("click", true);
        }
      }

    }
  }
})(jQuery, fabric);