var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.unitDataField = function() {

    return {

      _addUnitFieldEventHandlers: function(field, data) {

        var that = this;
        var unitDropDown = this._addUnitDropDown(data);
        field.find(".plate-setup-tab-field-container").append(unitDropDown);
        unitDropDown.select2();

        $("#" + data.id + "unit").select2();
        // Now add data to allUnitData
        this.allUnitData[data.id + "unit"] = $("#" + data.id + "unit").val();
        // Now handler for change in the unit.
        $("#" + data.id + "unit").on("change", function(evt, generated) {
          if (generated != "Automatic") {
            that._addUnitData(evt);
          }
        });

        return unitDropDown;
      },

      _addUnitDropDown(field, data) {
        var unitDropDown = this._createUnitDropDown(data);
        unitDropDown.data("linkedFieldId", data.id);
        field.find(".plate-setup-tab-field-container").append(unitDropDown);
        unitDropDown.select2({}); 

        this._applyUnitDropDownHandler(unitDropDown); 
        field.unit = unitDropDown;
        return unitDropDown;
      }, 

      _applyUnitDropDownHandler(unitDropDown) {
        var that = this; 
        unitDropDown.on("change", function(evt, generated) {
          if (generated != "Automatic") {
            that._addUnitData(evt);
          }
        });
      },

      _createUnitDropDown: function(unitData) {
        var unitSelect = this._createElement("<select></select>").attr("id", unitData.id + "unit")
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

    };
  }
})(jQuery, fabric);