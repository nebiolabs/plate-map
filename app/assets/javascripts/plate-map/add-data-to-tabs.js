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
        switch ($("#" + id).data("type")) {

          case "select":
          case "multiselect":
            $("#" + id).val(values[id]).trigger("change", "Automatic");
            // Automatic means its system generated.
            break;

          case "text":
            $("#" + id).val(values[id]);
            break;

          case "numeric":
            $("#" + id).val(values[id]);
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

            $("#" + id).val(boolText).trigger("change", "Automatic");
            break;
        }
        // Clear previously selected checkboxes
        /*var checkBoxImage = $("#" + id).data("checkBox");

        if($(checkBoxImage).data("clicked")) {
          $(checkBoxImage).attr("src", this.imgSrc + "/dont.png");
          $(checkBoxImage).data("clicked", false);
        }*/
      },

      _applyUnitData: function(unitId, units) {
        // Method to add unit data to the tabs.
        $("#" + unitId).val(units[unitId]).trigger("change", "Automatic");
      }

    }
  }
})(jQuery, fabric)