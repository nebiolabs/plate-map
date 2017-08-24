var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createField = function() {
    // It create those fields in the tab , there is 4 types of them.
    return {

      _createTextField: function(textData) {

        return this._createElement("<input>").addClass("plate-setup-tab-input").attr("id", textData.id);
      },

      _createSelectField: function(selectData) {
        var that = this; 
        // we create select field and add options to it later
        var selectField = this._createElement("<select></select>").attr("id", selectData.id)
          .addClass("plate-setup-tab-select-field");
        // Adding an empty option at the first
        var emptySelection = this._createElement("<option></option>").attr("value", "")
          .html("");
        $(selectField).append(emptySelection);
        // Look for all options in the json
        selectData.options.forEach(function (optionData) {
          var optionField = that._createElement("<option></option>").attr("value", optionData.id)
            .html(optionData.name);
          // Adding options here.
          $(selectField).append(optionField);
        }); 

        return selectField;
      },

      _createMultiSelectField: function(selectData) {
        var that = this; 
        // we create select field and add options to it later
        var selectField = this._createElement("<select></select>").attr("id", selectData.id)
          .addClass("plate-setup-tab-multiselect-field");
        selectField.attr("multiple", "multiple"); 
        // Look for all options in the json
        selectData.options.forEach(function (optionData) {
          var optionField = that._createElement("<option></option>").attr("value", optionData.id)
            .html(optionData.name);
          // Adding options here.
          $(selectField).append(optionField);
        }); 
        return selectField;
      },

      _createNumericField: function(numericFieldData) {

        var numericField = this._createElement("<input>").addClass("plate-setup-tab-input")
          .attr("placeholder", numericFieldData.placeholder || "").attr("id", numericFieldData.id);

        return numericField;
      },

      _createBooleanField: function(boolData) {

        var boolField = this._createElement("<select></select>").attr("id", boolData.id)
          .addClass("plate-setup-tab-select-field");

        var nullBool = this._createElement("<option></option>").attr("value", null).html("");
        var trueBool = this._createElement("<option></option>").attr("value", true).html("true");
        var falseBool = this._createElement("<option></option>").attr("value", false).html("false");

        $(boolField).append(nullBool).append(trueBool).append(falseBool);

        return boolField;
      },

    };
  }
})(jQuery, fabric);