var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function(values, units) {
        // Configure how data is added to tab fields
        for (var id in values) {
          this._applyFieldData(id, values[id]);
        }
        // Now changing the unit values
        for (var unitId in units) {
          this._applyUnitData(unitId, units[unitId]);
        }
      },

      _applyFieldData: function(id, v) {
        this.fieldMap[id].setValue(v); 
      },

      _applyUnitData: function(id, u) {
        this.fieldMap[id].setUnit(u);
      }

    }
  }
})(jQuery, fabric)