var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addTabData = function() {

    return {

      _addTabData: function() {
        // Here we may need more changes becuse attributes format likely to change
        var tabData = this.options["attributes"];
        var tabPointer = 0;
        var that = this;
        for(currentTab in tabData) {
          if(tabData[currentTab]["fields"]) {
            var fieldArray = [];
            var fieldArrayIndex = 0;
            // Now we look for fields in the json
            for(field in tabData[currentTab]["fields"]) {
              var data = tabData[currentTab]["fields"][field];
              var input = this._createField(data);

              if(data.id && data.type) {
                this.allWellData[data.id] = (data.type == "boolean") ? true : "";
              } else {
                console.log("Plz check the format of attributes provided");
              }
              // we save type so that it can be used when we update data on selecting a tile
              $(input).data("type", data.type);
              // Adding data to the main array so that programatically we can access later
              fieldArray[fieldArrayIndex ++] = this._createDefaultFieldForTabs();
              $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-name").html(data.name);
              $(this.allDataTabs[tabPointer]).append(fieldArray[fieldArrayIndex - 1]);
              // now we are adding the field which was collected in the switch case.
              $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-container").html(input);
              // Adding checkbox
              var checkBoxImage = this._addCheckBox(fieldArray, fieldArrayIndex, data);
              // Here we add the checkImage reference to input so now Input knows which is its checkbox..!!
              $(input).data("checkBox", checkBoxImage);
              this._addTabFieldEventHandlers(fieldArray, fieldArrayIndex, data, input);
            }

            this.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
          tabPointer ++;
        }
      },

      _createField: function(data) {

        switch(data.type) {
          case "text":
            return this._createTextField(data);
            break;

          case "numeric":
            return this._createNumericField(data);
            break;

          case "multiselect":
            return this._createMultiSelectField(data);
            break;

          case "boolean":
            return this._createBooleanField(data);
            break;
        }
      },

      _addCheckBox: function(fieldArray, fieldArrayIndex, data) {

        var checkImage = $("<img>").attr("src", this.imgSrc + "/dont.png").addClass("plate-setup-tab-check-box")
        .data("clicked", false).data("linkedFieldId", data.id);
        $(fieldArray[fieldArrayIndex - 1]).find(".plate-setup-tab-field-left-side").html(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        fieldArray[fieldArrayIndex - 1].checkbox = checkImage;
        return checkImage;
      },

      _addTabFieldEventHandlers: function(fieldArray, fieldArrayIndex, data, input) {

        var that = this;
        switch(data.type) {
          case "multiselect":
            $("#" + data.id).select2({
              allowClear: true
            });

            $("#" + data.id).on("change", function(e, generated) {
              // we check if this event is user generated event or system generated , automatic is system generated
              if(generated != "Automatic") {
                that._addData(e);
              }
            });
            break

          case "numeric":
            // Adding prevention for non numeric keys, its basic. need to improve.
            // We use keyup and keydown combination to get only numbers saved in the object
            $(input).keydown(function(evt) {
              var charCode = (evt.which) ? evt.which : evt.keyCode
              if (charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57)) {
                return false;
              }
            });

            $(input).keyup(function(evt) {
              var charCode = (evt.which) ? evt.which : evt.keyCode
              if (!(charCode != 8 && charCode != 0 && (charCode < 48 || charCode > 57))) {
                that._addData(evt)
              }
            });
            // Now add the label which shows unit.
            var unitDropdownField = this._addUnitDataField(fieldArray, fieldArrayIndex, data);
            fieldArray[fieldArrayIndex - 1].unit = unitDropdownField;
            break;

          case "boolean":
            $("#" + data.id).select2({
            });

            $("#" + data.id).on("change", function(evt, generated) {
              if(generated != "Automatic") {
                that._addData(evt);
              }
            });
            break;

          case "text":
            // we use keyup instead of blur. Blur fires event but canvas fire event even faster
            // so most likely our targeted tile changed, and value added to wrong tile.
            $("#" + data.id).keyup(function(evt) {
              that._addData(evt);
            });
            break;
        }
      },

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
          if(generated != "Automatic") {
            that._addUnitData(evt);
          }
        });

        return unitDropDown;
      },

    };
  }
})(jQuery, fabric);
