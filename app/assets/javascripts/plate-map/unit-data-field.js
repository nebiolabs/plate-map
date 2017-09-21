var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.unitDataField = function() {

    return {

      _addFixedUnit: function(field, unit) {
        var unitText = $("<div></div>").addClass("plate-setup-tab-unit");
        unitText.text(unit);
        field.find(".plate-setup-tab-field-container").append(unitText);
        return unitText; 
      },

      _addUnitDropDown: function(field, data) {
        var unitDropDown = this._createUnitDropDown(data);
        unitDropDown.data("linkedFieldId", data.id);
        field.find(".plate-setup-tab-field-container").append(unitDropDown);
        unitDropDown.select2({}); 

        this._applyUnitDropDownHandler(unitDropDown); 
        field.unit = unitDropDown;
        return unitDropDown;
      }, 

      _applyUnitDropDownHandler: function(unitDropDown) {
        var that = this; 
        unitDropDown.on("change", function(evt, generated) {
          if (generated != "Automatic") {
            that._addUnitData(evt);
          }
        });
      },

      _createUnitDropDown: function(unitData) {
        var unitId = this.unitFieldId(unitData.id);
        var unitSelect = this._createElement("<select></select>").attr("id", unitId)
          .addClass("plate-setup-tab-label-select-field");
        for (var i = 0; i < unitData.units.length; i++) {
          var unit = unitData.units[i];
          var unitOption = this._createElement("<option></option>").attr("value", unit).text(unit);
          if (unit == unitData.defaultUnit) {
            unitOption.prop("selected", true);
          }
          unitSelect.append(unitOption);
        }
        return unitSelect;
      },

      unitFieldId(fieldId) {
        return fieldId + "_unit";
      }
    };
  }
})(jQuery, fabric);