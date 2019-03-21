var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function(values) {
        // Configure how data is added to tab fields
        for (var id in values) {
          this._applyFieldData(id, values[id]);
        }
      },

      _applyFieldData: function(id, v) {
        this.fieldMap[id].setValue(v);
      }
    }
  }
})(jQuery, fabric)