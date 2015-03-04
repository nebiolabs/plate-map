var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {

        var derivativeData = JSON.parse(data);

        this.clearCheckBoxes();

        this.clearCrieteriaForAll(derivativeData.selectedObjects);

        this.loadDataToCircles(derivativeData.derivative);

        this.engine.derivative = $.extend(true, {}, derivativeData.derivative);

        if($.isEmptyObject(derivativeData.checkboxes)) {
          this._colorMixer(true);
        } else {
          this.loadCheckboxes(derivativeData.checkboxes);
        }

        this.mainFabricCanvas.trigger("object:selected", this.allSelectedObjects);

        /*if(derivativeData.selectedObjects.selectionRectangle) {
          this._decideSelectedFields(derivativeData.selectedObjects.selectionRectangle);
          this._alignRectangle(derivativeData.selectedObjects.selectionRectangle);
        }*/
        //this.allSelectedObjects = {}
      },

      loadDataToCircles: function(circleData) {

        for(var index in circleData) {
          this.allTiles[index].wellData = $.extend(true, {}, circleData[index].wellData);
        }
      },

      loadCheckboxes: function(checkboxes) {

        var checkBoxImage;

        for(var checkbox in checkboxes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", false).trigger("click", true);
        }
      },

      clearCheckBoxes: function() {

        var checkBoxImage;

        for(var checkbox in this.globalSelectedAttributes) {
          checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).data("clicked", true).trigger("click", true);
        }
      }
    }
  }
})(jQuery, fabric);
