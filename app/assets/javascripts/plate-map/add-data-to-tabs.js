var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function(values, units) {
        // Configure how data is added to tab fields
        for (var id in values) {
          this._applyFieldData(id, values);
        }
        // Now changing the unit values
        for (var unitId in units) {
          this._applyUnitData(unitId, units);
        }
      },

      _applyFieldData: function(id, values) {
        // This method directly add a value to corresponding field in the tab
        var field = $("#" + id); 
        var v = values[id]; 
        switch (field.data("type")) {
          case "boolean":
            if (v == true || v == "true") {
              v = "true";
            } else if (v == false || v == "false") {
              v = "false";
            } else {
              v = null; 
            }
          case "select":
          case "multiselect":
            field.val(v).trigger("change", "Automatic");
            // Automatic means its system generated.
            break;

          case "text":
          case "numeric":
            field.val(v);
            break;
        }
      },

      _applyUnitData: function(unitId, units) {
        // Method to add unit data to the tabs.
        $("#" + unitId).val(units[unitId]).trigger("change", "Automatic");
      }

    }
  }
})(jQuery, fabric)