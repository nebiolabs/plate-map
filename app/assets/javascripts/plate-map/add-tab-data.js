var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addTabData = function() {

    return {

      fieldList: [], 
      fieldMap: {},
      autoId: 1,

      _addTabData: function() {
          // Here we may need more changes because attributes format likely to change
          var tabData = this.options.attributes.tabs;
          var that = this;
          this.requiredField = [];
          var multiplexFieldArray = [];
          tabData.forEach(function (tab, tabPointer) {
            if (tab["fields"]) {
              var tabFields = tab["fields"];
              var fieldArray = [];
              var fieldArrayIndex = 0;
              // Now we look for fields in the json
              for (var field in tabFields) {
                var data = tabFields[field];

                if (!data.id) {
                  data.id = "Auto" + that.autoId++;
                  console.log("Field autoassigned id " + data.id);
                }
                if (!data.type) {
                  data.type = "text";
                  console.log("Field " + data.id + " autoassigned type " + data.type);
                }

                var field_val;
                if (data.type === "multiplex") {
                  field_val = that._makeMultiplexField(data, tabPointer, fieldArray);
                  multiplexFieldArray.push(field_val);
                } else {
                  field_val = that._makeRegularField(data, tabPointer, fieldArray, true);
                  if (data.type === "multiselect") {
                    multiplexFieldArray.push(field_val);
                  }
                };
              }

              that.allDataTabs[tabPointer]["fields"] = fieldArray;
            } else {
              console.log("unknown format in field initialization");
            }
          });
          that.multipleFieldList = multiplexFieldArray;
      },

      _makeSubField: function (data, tabPointer, fieldArray) {
        var that = this;
        if (!data.id) {
          data.id = "Auto" + that.autoId++;
          console.log("Field autoassigned id " + data.id);
        }
        if (!data.type) {
          data.type = "text";
          console.log("Field " + data.id + " autoassigned type " + data.type);
        }
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);
        $(that.allDataTabs[tabPointer]).append(wrapperDiv);

        var field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required || false
        };

        fieldArray.push(field);
        that.fieldMap[data.id] = field;

        return field;
      },

      _makeRegularField: function (data, tabPointer, fieldArray, checkbox){
          var that = this;
          var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
          var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
          var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
          var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
          var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

          $(wrapperDivRightSide).append(nameContainer);
          $(wrapperDivRightSide).append(fieldContainer);
          $(wrapperDiv).append(wrapperDivLeftSide);
          $(wrapperDiv).append(wrapperDivRightSide);
          $(that.allDataTabs[tabPointer]).append(wrapperDiv);

          var field = {
            id: data.id,
            name: data.name,
            root: wrapperDiv,
            data: data,
            required: data.required
          };

          if (field.required) {
            that.requiredField.push(field.id);
          }

          fieldArray.push(field);
          that.fieldList.push(field);
          that.fieldMap[field.id] = field;

          // Adding checkbox
          if (checkbox) {
            that._addCheckBox(field);
          }
          that._createField(field);

          field.onChange = function () {
            var v = field.getValue();
            var data = {};
            data[field.id] = v;
            that._addAllData(data);
          };
          if (data.type === "multiselect"){
            that._createDeleteButton(field, tabPointer);
          }
          return field;
      },

      _makeMultiplexField: function (data, tabPointer, fieldArray) {
        var that = this;
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);



        var field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        // Add delete pop up for multiplex field
        that._createDeleteButton(field, tabPointer);

        function createSingleSelect () {
          // single select
          var nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
          var fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
          $(wrapperDivRightSide).append(nameContainer1);
          $(wrapperDivRightSide).append(fieldContainer1);
          $(wrapperDiv).append(wrapperDivLeftSide);
          $(wrapperDiv).append(wrapperDivRightSide);

          $(that.allDataTabs[tabPointer]).append(wrapperDiv);

          var singleSelectData = {
            id: data.id + "SingleSelect",
            type: 'select',
            multiplexId: data.id,
            options: data.options
          };

          var singleSelectField = {
            id: singleSelectData.id,
            root: wrapperDiv,
            data: singleSelectData,
            required: singleSelectData.required
          };

          field.singleSelectField = singleSelectField;
        }
        createSingleSelect();

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[data.id] = field;

        var subFieldList = [];
        //create subfields
        var requiredSubField = [];
        for (var subFieldKey in data.multiplexFields) {
          var subFieldData = data.multiplexFields[subFieldKey];
          var subField = that._makeSubField(subFieldData, tabPointer, fieldArray);
          subFieldList.push(subField);

          // stores required  subField
          if (subFieldData.required) {
            requiredSubField.push(subField.id);
          }
        }

        //store required field
        if (field.required) {
          this.requiredField.push ({
            multiplexId: field.id,
            subFields: requiredSubField
          });
        } else {
          if (requiredSubField.length > 0) {
            this.requiredField.push ({
              multiplexId: field.id,
              subFields: requiredSubField
            });
          }
        }

        field.subFieldList = subFieldList;
        that._createField(field);
        that._addCheckBox(field);

        subFieldList.forEach(function (subfield) {
          subfield.mainMultiplexField = field;
          fieldArray.push(subfield);
          that._createField(subfield);
          that._addCheckBox(subfield);
          delete that.defaultWell.wellData[subfield.id];
          // overwrite subField setvalue
          subfield.onChange = function () {
            var v = subfield.getValue();
            var mainRefField = subfield.mainMultiplexField;
            var singleSelect = mainRefField.singleSelectField;
            //var curDataLs = mainRefField.detailData;
            var curVal = {};
            curVal[mainRefField.id] = singleSelect.getValue();
            //append subfields
            curVal[subfield.id] = v;
            var returnVal = {
              id: singleSelect.getValue(),
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);
            var curDataLs = mainRefField.detailData;
            if (curDataLs !== null) {
              curDataLs = curDataLs.map(function(curData) {
                if (curData[mainRefField.id] === singleSelect.getValue()) {
                  curData[subfield.id] = v;
                }
                return curData;
              });
            }
            mainRefField.detailData = curDataLs;
          };

        });
        field.getValue = function(){
          var v = field.input.select2('data');
          if (v.length) {
            return v.map(function (i) {
              return i.id;
            });
          }
          return null;
        };

        return field;
      },

      _createDeleteButton: function(field, tabPointer){
        var that = this;
        var obj = $('#my-plate-layout');
        var deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + " ...");
        //var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        //var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");
        buttonContainer.append(deleteButton);
        $(wrapperDivRightSide).append(buttonContainer);
        //$(wrapperDiv).append(wrapperDivLeftSide);
        //$(wrapperDiv).append(wrapperDivRightSide);
        //$(that.allDataTabs[tabPointer]).append(wrapperDiv);
        field.root.find(".plate-setup-tab-field-right-side").append(wrapperDivRightSide);

        createPopUp(field, deleteButton);

        function createPopUp(field, button) {
          var obj = $('#my-plate-layout');
          button.click(function(evt) {
            if ($('#deleteDialog').length == 0) {
              $('body').append("<div id='deleteDialog'><div/>");
            }
            var dialogDiv = $('#deleteDialog').addClass("modal");
            var dialogContent = $("<div/>").addClass("modal-content");
            dialogDiv.append(dialogContent);

            var popUpContent = createPopUpContent(field);
            dialogContent.append(popUpContent.tabelDiv);

            var buttonRow = $("<div/>").addClass("dialog-buttons").css("justify-content", "flex-end");
            dialogContent.append(buttonRow);

            var valIdList = Object.keys(popUpContent.optionMap);
            if (valIdList.length > 0){
              // apply CSS property for table
              $('#deleteDialog').find('table').addClass("plate-popout-table");
              $('#deleteDialog').find('td').addClass("plate-popout-td");
              $('#deleteDialog').find('th').addClass("plate-popout-th");
              $('#deleteDialog').find('tr').addClass("plate-popout-tr");

              var deleteCheckedButton = $("<button>Delete Checked Items</button>");
              buttonRow.append(deleteCheckedButton);

              deleteCheckedButton.click(function() {
                var optMap = popUpContent.optionMap;
                var idToRemove = [];
                for (var idx in Object.keys(optMap)) {
                  var optId = Object.keys(optMap)[idx];
                  var divId = "#"+ "checkBoxId" + idx;
                  if ($(divId)[0].checked){
                    field.data.options.forEach(function(opt) {
                      if (opt.text === optId){
                        idToRemove.push(opt.id)
                      }
                    })
                  }
                }

                if (idToRemove.length > 0){
                  for (var idx in idToRemove) {
                    var val = idToRemove[idx];
                    field.multiOnChange(null, {id: val})
                  }
                }

                // refresh selected fields after updating the multiplex field value
                that.decideSelectedFields();
                dialogDiv.hide();
                $('#deleteDialog').remove();
              });
            }

            var cancelButton = $("<button>Cancel</button>");
            buttonRow.append(cancelButton);
            cancelButton.click(function () {
              dialogDiv.hide();
              $('#deleteDialog').remove();
            });
            dialogDiv.show();

            window.onclick = function(event) {
              if (event.target == dialogDiv[0]) {
                dialogDiv.hide();
                $('#deleteDialog').remove();
              }
            }
          });
        }

        function createPopUpContent(field) {
          var valMap = field.allSelectedMultipleVal;
          var valToRemove = Object.keys(valMap);
          var optionMap = {};

          valToRemove.forEach(function(valId){
            var val = valMap[valId];
            field.data.options.forEach(function(opt){
              if (opt.id.toString() === valId.toString()) {
                optionMap[opt.text] = val;
              }
            })
          });

          var tableArea;
          var table;
          var thead;
          var tr;
          var th;

          var colName = [field.name, "Counts", "Delete"]; //Added because it was missing... no idea what the original should have been
          tableArea = that._createElement("<div></div>");
          table = document.createElement('table');
          table.id = "popOutTable";
          thead = document.createElement('thead');
          tr = document.createElement('tr');

          var optKeys = Object.keys(optionMap);
          if (optKeys.length > 0){
            tableArea.append($("<p/>").text(field.name + " in selected wells: choose items to delete and click the delete button below"));

            for (var i = 0; i < colName.length; i++) {
              var headerTxt = document.createTextNode(colName[i]);
              th = document.createElement('th');
              th.appendChild(headerTxt);
              tr.appendChild(th);
              thead.appendChild(tr);
            }

            table.appendChild(thead);
            for (var idx in optKeys) {
              var optId = optKeys[idx];
              tr = document.createElement('tr');
              tr.appendChild(document.createElement('td'));
              tr.appendChild(document.createElement('td'));
              tr.appendChild(document.createElement('td'));

              var checkbox = document.createElement("INPUT"); //Added for checkbox
              checkbox.type = "checkbox"; //Added for checkbox
              checkbox.id = "checkBoxId" + idx;

              tr.cells[0].appendChild(document.createTextNode(optId));
              tr.cells[1].appendChild(document.createTextNode(optionMap[optId]));
              tr.cells[2].appendChild(checkbox); //Added for checkbox

              table.appendChild(tr);
            }
          } else {
            table = $("<p/>").text("No " + field.name + " in the selected wells");
          }
          tableArea.append(table);

          return {
            tabelDiv: tableArea,
            optionMap: optionMap
          };

        }
      }

    }
  }

})(jQuery, fabric);
