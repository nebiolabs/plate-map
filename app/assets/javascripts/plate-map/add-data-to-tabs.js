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
        // Now put back selected fields
        for (var i = 0; i <  this.globalSelectedAttributes.length; i++) {
          var checkbox = this.globalSelectedAttributes[i]; 
          var checkBoxImage = $("#" + checkbox).data("checkBox");
          $(checkBoxImage).attr("src", this.imgSrc + "/do.png").data("clicked", true);
        }
      },

      _applyFieldData: function(id, values) {
        // This method directly add a value to corresponding field in the tab
        var input = $("#" + id)
        switch (input.data("type")) {

          case "select":
          case "multiselect":
            input.val(values[id]).trigger("change", "Automatic");
            // Automatic means its system generated.
            break;

          case "text":
            input.val(values[id]);
            break;

          case "numeric":
            input.val(values[id]);
            break;

          case "boolean":
            // select box provide bool value as text,
            // so we need a minor tweek to admit "true" and "false"
            var boolText = "";

            if (values[id] == true || values[id] == "true") {
              boolText = "true";
            } else if (values[id] == false || values[id] == "false") {
              boolText = "false";
            }

            input.val(boolText).trigger("change", "Automatic");
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