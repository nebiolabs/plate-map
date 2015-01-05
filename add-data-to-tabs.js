var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function() {
        // Configure how data is added to tab fields
        var values = this.allSelectedObjects[0]["wellData"];
        for(var id in values) {
          this._applyFieldData(id, values);
        }
        // Now changing the unit values
        var units = this.allSelectedObjects[0]["unitData"];
        for(var unitId in units) {
          this._applyUnitData(unitId, units);
        }
        // Now put back selected fields
        var selectedFields = this.allSelectedObjects[0]["selectedWellattributes"];

        for(var selectedFieldId in selectedFields) {
          var checkBoxImage = $("#" + selectedFieldId).data("checkBox");
          $(checkBoxImage).attr("src", this.imgSrc + "/do.png").data("clicked", true);
        }
      },

      _applyFieldData: function(id, values) {
        // This method directly add a value to corresponding field in the tab
        switch($("#" + id).data("type")) {

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
            var boolText = (values[id] == true || values[id] == "true") ? "true" : "false";
            $("#" + id).val(boolText).trigger("change", "Automatic");
          break;
        }
        // Clear previously selected checkboxes
        var checkBoxImage = $("#" + id).data("checkBox");
        $(checkBoxImage).attr("src", this.imgSrc + "/dont.png").data("clicked", false);
      },

      _applyUnitData: function(unitId, units) {
        // Method to add unit data to the tabs.
        $("#" + unitId).val(units[unitId]).trigger("change", "Automatic");
      },

      compareObjects:function(object, reference) {
        // Compare 2 objects
        for(var ref in reference) {
          if(reference[ref] !== object[ref] ) {
            return false;
          }
        }

        for(var ref in object) {
          if(object[ref] !== reference[ref]) {
            return false;
          }
        }

        return true;
      },

      _clearAllFields: function(allFields) {
        // Clear all the fields
        var fakeAllFields = $.extend({}, allFields);
        for(var field in fakeAllFields) {
          if($("#" + field).data("type") == "boolean") {
            fakeAllFields[field] = true;
          } else {
            fakeAllFields[field] = "";
          }

          this._applyFieldData(field, fakeAllFields);
        }
      },

    }
  }
})(jQuery, fabric)
