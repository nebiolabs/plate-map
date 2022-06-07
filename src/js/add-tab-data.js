var plateMapWidget = plateMapWidget || {};

(function ($) {

  plateMapWidget.addTabData = function () {

    return {

      fieldList: [],
      fieldMap: {},
      autoId: 1,

      _addTabData: function () {
        // Here we may need more changes because attributes format likely to change
        let tabData = this.options.attributes.tabs;
        let that = this;
        this.requiredField = [];
        let multiplexFieldArray = [];
        tabData.forEach(function (tab, tabPointer) {
          if (tab["fields"]) {
            let tabFields = tab["fields"];
            let fieldArray = [];
            // Now we look for fields in the json
            for (var i = 0; i < tabFields.length; i++) {
              let data = tabFields[i];

              if (!data.id) {
                data.id = "Auto" + that.autoId++;
                console.log("Field autoassigned id " + data.id);
              }
              if (!data.type) {
                data.type = "text";
                console.log("Field " + data.id + " autoassigned type " + data.type);
              }

              let field;
              if (data.type === "multiplex") {
                field = that._makeMultiplexField(data, tabPointer, fieldArray);
                that.defaultWell[field.id] = [];
                multiplexFieldArray.push(field);
              } else {
                field = that._makeRegularField(data, tabPointer, fieldArray, true);
                if (data.type === "multiselect") {
                  that.defaultWell[field.id] = [];
                  multiplexFieldArray.push(field);
                } else {
                  that.defaultWell[field.id] = null;
                }
              }
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
        that.multipleFieldList = multiplexFieldArray;
      },

      _makeSubField: function (mainField, data, tabPointer, fieldArray) {

        // HB product additions
        if (data.id === 'template_ngul') {
          console.log('making template_ngul subfield with data: ');
          console.log(mainField.id)
          console.log(data)
          console.log(tabPointer)
          console.log(fieldArray)
        } else if (data.id === 'product_lot') {
          console.log('making product_lot subfield with data: ');
          console.log(mainField.id)
          console.log(data)
          console.log(tabPointer)
          console.log(fieldArray)
        }

        // HB product additions


        let that = this;
        if (!data.id) {
          data.id = "Auto" + that.autoId++;
          console.log("Field autoassigned id " + data.id);
        }
        if (!data.type) {
          data.type = "text";
          console.log("Field " + data.id + " autoassigned type " + data.type);
        }
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");
        
        if (data.id === 'product_lot') {
          console.log('made containers')
          console.log(data.name)
        }
        $(wrapperDivRightSide).append(nameContainer);
        $(wrapperDivRightSide).append(fieldContainer);
        $(wrapperDiv).append(wrapperDivLeftSide);
        $(wrapperDiv).append(wrapperDivRightSide);
        $(that.allDataTabs[tabPointer]).append(wrapperDiv);

        let field = {
          id: data.id,
          full_id: mainField.id + "_" + data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required || false
        };

        fieldArray.push(field);
        that.fieldMap[field.full_id] = field;

        return field;
      },

      _makeRegularField: function (data, tabPointer, fieldArray, checkbox) {

        let that = this;
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        let field = {
          id: data.id,
          full_id: data.id,
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
        that.fieldMap[field.full_id] = field;

        // Adding checkbox
        if (checkbox) {
          that._addCheckBox(field);
        }
        that._createField(field);

        field.onChange = function () {

          let v = field.getValue();
          let data = {};
          data[field.id] = v;
          that._addAllData(data);

          // make a subfield with lots if its the product being selected
          if (field.id === 'product_id') {
            // console.log('field changed to' + v)
            // console.log(field)
            // console.log(field.data.subOptionFields)
            field.data.subOptionFields[0].id = 'product_lot';
            field.data.subOptionFields[0].name = 'Lot No.';

            // make a subfield showing the available lots for the product selected
            that._makeSubField(field, field.data.subOptionFields[0], tabPointer, fieldArray);
          }



          
        };
        return field;
      },

      _makeMultiplexField: function (data, tabPointer, fieldArray) {
        let that = this;
        let wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        let wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        let wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        let nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        let fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        let field = {
          id: data.id,
          full_id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[field.full_id] = field;

        let subFieldList = [];
        //create subfields
        let requiredSubField = [];
        for (let i = 0; i < data.multiplexFields.length; i++) {
          let subFieldData = data.multiplexFields[i];

          // HB
          // console.log('multiplex field making subfield with:')
          // console.log('field:')
          // console.log(field)
          // console.log('subFieldData:')
          // console.log(subFieldData)
          // console.log('tabPointer:')
          // console.log(tabPointer)
          // console.log('fieldArray:')
          // console.log(fieldArray)
          // HB

          let subField = that._makeSubField(field, subFieldData, tabPointer, fieldArray);

          subFieldList.push(subField);

          // stores required  subField
          if (subFieldData.required) {
            requiredSubField.push(subField.id);
          }
        }

        //store required field
        if (field.required || requiredSubField.length) {
          this.requiredField.push({
            multiplexId: field.id,
            subFields: requiredSubField
          });
        }

        field.subFieldList = subFieldList;
        that._createField(field);
        that._addCheckBox(field);

        subFieldList.forEach(function (subfield) {
          subfield.mainMultiplexField = field;
          that._createField(subfield);
          that._addCheckBox(subfield);
          // overwrite subField setvalue
          subfield.onChange = function () {
            let v = subfield.getValue();
            let mainRefField = subfield.mainMultiplexField;
            let curId = mainRefField.singleSelectValue();
            //let curDataLs = mainRefField.detailData;
            let curVal = {};
            curVal[mainRefField.id] = curId;
            //append subfields
            curVal[subfield.id] = v;
            let returnVal = {
              id: curId,
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);
            let curDataLs = mainRefField.detailData;
            if (curDataLs !== null) {
              curId = mainRefField.singleSelectValue();
              curDataLs = curDataLs.map(function (curData) {
                if (curData[mainRefField.id] === curId) {
                  curData[subfield.id] = v;
                }
                return curData;
              });
            }
            mainRefField.detailData = curDataLs;
          };

        });

        return field;
      }
    }
  }

})(jQuery);
