var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addTabData = function() {

    return {

      requiredFields: [],

      _addTabData: function() {
        // Here we may need more changes because attributes format likely to change
        var tabData = this.options.attributes.tabs;
        var that = this;
        tabData.forEach(function (tab, tabPointer) {
          if (tab["fields"]) {
            var fieldArray = [];
            var fieldArrayIndex = 0;
            // Now we look for fields in the json
            for (var field in tab["fields"]) {
              if (tab["fields"][field].required) {
                console.log("its required", tab["fields"][field].id);
                that.requiredFields.push(tab["fields"][field].id);
              }
              var data = tab["fields"][field];

              var autoId = 1;
              if (!data.id) {
                data.id = "Auto" + autoId++; 
                console.log("Field autoassigned id " + data.id);
              }
              if (!data.type) {
                data.type = "text";
                console.log("Field " + data.id + " autoassigned type " + data.type);
              }

              that.defaultWell.wellData[data.id] = null;
              var input = that._createField(data);
              // we save type so that it can be used when we update data on selecting a tile
              input.data("type", data.type);
              // We save the caption so that we can use it for bottom table.
              input.data("caption", field);
              // Adding data to the main array so that programatically we can access later
              var field = that._createDefaultFieldForTabs();
              fieldArray.push(field); 

              field.find(".plate-setup-tab-name").html(data.name);
              $(that.allDataTabs[tabPointer]).append(field);
              // now we are adding the field which was collected in the switch case.
              field.find(".plate-setup-tab-field-container").html(input);

              // Adding unit
              if (data.type == "numeric") {
                if (data.units) {
                  if (data.units.length > 1) {
                    var unitInput = that._addUnitDropDown(field, data);
                    input.data("units", data.units);
                    that.defaultWell.unitData[data.id] = unitInput.val();
                  } else if (data.units.length == 1) {
                    that._addFixedUnit(field, data.units[0]);
                    input.data("units", data.units);
                    that.defaultWell.unitData[data.id] = data.units[0]; 
                  }
                } else if (data.defaultUnit) {
                  that._addFixedUnit(field, data.defaultUnit);
                  input.data("units", [data.defaultUnit]);
                  that.defaultWell.unitData[data.id] = data.defaultUnit; 
                }
              }

              // Adding checkbox
              var checkBoxImage = that._addCheckBox(field, data);
              input.data("checkBox", checkBoxImage);
              that._addTabFieldEventHandlers(data, input);
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
      },

      _createField: function(data) {

        switch (data.type) {
          case "text":
            return this._createTextField(data);
            break;

          case "numeric":
            return this._createNumericField(data);
            break;

          case "select":
            return this._createSelectField(data);
            break;

          case "multiselect":
            return this._createMultiSelectField(data);
            break;

          case "boolean":
            return this._createBooleanField(data);
            break;
        }
      },

      _addTabFieldEventHandlers: function(data, input) {

        var that = this;
        switch (data.type) {
          case "select":
            input.select2({
              allowClear: true
            });

            input.on("change", function(e, generated) {
              // we check if this event is user generated event or system generated , automatic is system generated
              if (generated != "Automatic") {
                var v = this.value || null; 
                if (v) {
                  var optMap = input.data("optionMap"); 
                  v = optMap[v].id; 
                }
                that._addData(e.target.id, v);
              }
            });
            break
          case "multiselect":
            input.select2({
              allowClear: true
            });

            input.on("change", function(e, generated) {
              // we check if this event is user generated event or system generated , automatic is system generated
              if (generated != "Automatic") {
                var v = this.value; 
                if (v.length) {
                  var optMap = input.data("optionMap"); 
                  v = v.map(function (v) {return optMap[v].id;})
                } else {
                  v = null; 
                }
                that._addData(e.target.id, v);
              }
            });
            break

          case "numeric":
            input.on("input", function(e, generated) {
              if (generated != "Automatic") {
                var v = this.value.trim();
                if (v == "") {
                  v = null; 
                } else {
                  v = Number(v); 
                }
                if (isNaN(v)) {
                  //flag field as invalid
                  $(this).addClass("invalid"); 
                } else {
                  $(this).removeClass("invalid"); 
                  var u_input = $("#" + that.unitFieldId(e.target.id));
                  var u = null; 
                  if (u_input.length == 1) {
                    u = u_input.val();
                  }
                  that._addData(e.target.id, v, u); 
                }
              }
            });
            break;

          case "boolean":
            input.select2({
              allowClear: true,
              minimumResultsForSearch: -1
            });

            input.on("change", function(e, generated) {
              if (generated != "Automatic") {
                var v = this.value; 
                if (v == "") {
                  v = null; 
                } else if (v == "true") {
                  v = true; 
                } else {
                  v = false; 
                }
                that._addData(e.target.id, v);
              }
            });
            break;

          case "text":
            // we use keyup instead of blur. Blur fires event but canvas fire event even faster
            // so most likely our targeted tile changed, and value added to wrong tile.

            $(input).on("input", function(e, generated) {
              if (generated != "Automatic") {
                var v = this.value.trim();
                if (v == "") {
                  v = null; 
                }
                that._addData(e.target.id, v); 
              }
            });

            break;
        }
      },

    };
  }
})(jQuery, fabric);