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
        var input = $("#" + id); 
        var v = values[id]; 
        switch (input.data("type")) {
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
            input.val(v).trigger("change", "Automatic");
            // Automatic means its system generated.
            break;

          case "text":
          case "numeric":
            input.val(v);
            break;
        }
      },

      _applyUnitData: function(fieldId, units) {
        // Method to add unit data to the tabs.
        var unitId = this.unitFieldId(fieldId); 
        $("#" + unitId).val(units[fieldId]).trigger("change", "Automatic");
      }

    }
  }
})(jQuery, fabric)