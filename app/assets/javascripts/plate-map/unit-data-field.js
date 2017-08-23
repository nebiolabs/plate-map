var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.unitDataField = function() {

    return {

      _addUnitDataField: function(fieldArray, fieldArrayIndex, data) {

        var that = this;
        var unitDropDown = this._addUnitDropDown(data);
        $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").append(unitDropDown);

        $("#" + data.id + "unit").select2({

        });
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

      /*
        Dynamically making the dropdown and returning it.
        select2 can be applyed only after dropdown has been added to DOM.
      */
      _addUnitDropDown: function(unitData) {

        if (unitData.units) {

          var unitSelect = this._createElement("<select></select>").attr("id", unitData.id + "unit")
            .addClass("plate-setup-tab-label-select-field");
          for (unit in unitData.units) {

            var unitOption = this._createElement("<option></option>").attr("value", unitData.units[unit]).html(unitData.units[unit]);
            $(unitSelect).append(unitOption);
          }

          return unitSelect;
        }
      },

    };
  }
})(jQuery, fabric);