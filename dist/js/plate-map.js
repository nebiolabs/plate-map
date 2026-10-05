var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.addDataOnChange = function () {
    // This object is invoked when something in the tab fields change
    return {
      _addAllData: function (data) {
        if (this.selectedIndices) {
          let noOfSelectedObjects = this.selectedIndices.length;
          this.selectedIndices.forEach(function (index) {
            let well;
            if (index in this.engine.derivative) {
              well = this.engine.derivative[index];
            } else {
              well = $.extend(true, {}, this.defaultWell);
              this.engine.derivative[index] = well;
            }
            well = this.processWellData(data, well, noOfSelectedObjects);
            let empty = this.engine.wellEmpty(well);
            if (empty) {
              if (this.disableAddDeleteWell) {
                if (this.engine.derivative.hasOwnProperty(index)) {
                  well = $.extend(true, {}, this.emptyWellWithDefaultVal);
                  this.engine.derivative[index] = well;
                }
              } else {
                delete this.engine.derivative[index];
              }
            }
          }, this);
        }
        // update multiplex
        this.decideSelectedFields();
        // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode
        this._colorMixer();
        this.derivativeChange();
        this.addToUndoRedo();
      },
      processWellData: function (newData, curWell, noOfSelectedObjects) {
        for (let id in newData) {
          if (!newData.hasOwnProperty(id)) {
            continue;
          }
          let newVal = newData[id];
          if (newVal !== undefined && newVal !== null) {
            if (newVal.multi) {
              let preData = curWell[id];
              newVal = this._getMultiData(preData, newVal, id, noOfSelectedObjects);
            }
            newVal = JSON.parse(JSON.stringify(newVal));
          } else {
            newVal = null;
          }
          curWell[id] = newVal;
        }
        return curWell;
      },
      _getMultiData: function (preData, curData, fieldId, noOfSelectedObjects) {
        let addNew = curData.added;
        let removed = curData.removed;
        preData = preData || [];
        if (addNew) {
          if (addNew.value) {
            const multiplexId = addNew.id.toString();
            const doAll = multiplexId === '[ALL]';
            let add = !doAll;
            preData = preData.map(function (val) {
              if (doAll || val[fieldId].toString() === multiplexId) {
                add = false;
                for (let subFieldId in addNew.value) {
                  if (subFieldId !== fieldId) {
                    val[subFieldId] = addNew.value[subFieldId];
                  }
                }
                return val;
              }
              return val;
            });
            if (add) {
              preData.push(addNew.value);
            }
          } else if (preData.indexOf(addNew) < 0) {
            preData.push(addNew);
          }
        }
        let removeListIndex = function (preData, removeIndex) {
          let newPreData = [];
          for (let idx in preData) {
            if (!preData.hasOwnProperty(idx)) {
              continue;
            }
            if (parseInt(idx) !== parseInt(removeIndex)) {
              newPreData.push(preData[idx]);
            }
          }
          return newPreData;
        };
        if (removed) {
          let removeIndex;
          // for multiplex field
          if (removed.value) {
            for (let listIdx in preData) {
              let multiplexData = preData[listIdx];
              if (multiplexData[fieldId].toString() === removed.id.toString()) {
                removeIndex = listIdx;
              }
            }
            // remove nested element
            preData = removeListIndex(preData, removeIndex);
          } else {
            if (preData) {
              removeIndex = preData.indexOf(removed);
              if (removeIndex >= 0) {
                preData = removeListIndex(preData, removeIndex);
              }
            }
          }
        }
        if (preData && preData.length === 0) {
          preData = null;
        }
        return preData;
      },
      _colorMixer: function () {
        this.engine.searchAndStack();
        this.engine.applyColors();
      },
      derivativeChange: function () {
        this._trigger("updateWells", null, this);
      },
      createState: function () {
        let derivative = $.extend(true, {}, this.engine.derivative);
        let checkboxes = this.getCheckboxes();
        let selectedIndices = this.selectedIndices.slice();
        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedIndices": selectedIndices,
          "requiredField": this.requiredField
        };
      },
      getPlate: function () {
        let wells = {};
        let derivative = this.engine.derivative;
        for (let index in derivative) {
          if (!derivative.hasOwnProperty(index)) {
            continue;
          }
          let address = this.indexToAddress(index);
          let well = derivative[index];
          wells[address] = $.extend(true, {}, well);
        }
        let checkboxes = this.getCheckboxes();
        let selectedAddresses = this.getSelectedAddresses();
        return {
          "wells": wells,
          "checkboxes": checkboxes,
          "selectedAddresses": selectedAddresses,
          "requiredField": this.requiredField
        };
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
plateMapWidget.addDataToFields = function () {
  return {
    _addDataToTabFields: function (well) {
      // Configure how data is added to tab fields
      for (let i = 0; i < this.fieldList.length; i++) {
        let field = this.fieldList[i];
        let v = well[field.id];
        if (v === undefined) {
          v = null;
        }
        field.setValue(v);
      }
    }
  };
};
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
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.addWarningMsg = function () {
    // For those check boxes associated with every field in the tab
    return {
      fieldWarningMsg: function (field, text, include) {
        let that = this;
        let imgId = "fieldWarning" + field.full_id;
        let img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        if (include) {
          if (field.root.find("#" + imgId).length <= 0) {
            field.root.find(".plate-setup-tab-name").text(" " + field.name);
            field.root.find(".plate-setup-tab-name").prepend(img);
            let popText = $("<div/>").addClass("pop-out-text");
            popText.text(text);
            field.root.find(".plate-setup-tab-name").append(popText);
            $("#" + imgId).hover(function () {
              popText[0].style.display = 'flex';
            }, function () {
              popText.hide();
            });
          }
        } else {
          if (field.root.find("#" + imgId).length > 0) {
            field.root.find(".plate-setup-tab-name").text(field.name);
            $("#" + imgId).remove();
          }
        }
      },
      removeWarningMsg: function (field, text, include) {
        let that = this;
        let imgId = "fieldWarning" + field.full_id;
        if (include) {
          let img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
          field.root.find(".plate-setup-tab-name").append(img);
          let popText = $("<div/>").addClass("pop-out-text");
          popText.text(text);
          field.root.find(".plate-setup-tab-name").append(popText);
          img.hover(function () {
            popText[0].style.display = 'inline-block';
          }, function () {
            popText.hide();
          });
        } else {
          $("#" + imgId).remove();
        }
      },
      applyFieldWarning: function (wells) {
        let that = this;
        let fieldData = {};
        that.fieldList.forEach(function (field) {
          fieldData[field.id] = [];
        });
        wells.forEach(function (well) {
          if (!that.engine.wellEmpty(well)) {
            for (let fieldId in fieldData) {
              if (fieldData.hasOwnProperty(fieldId)) {
                if (fieldId in well) {
                  fieldData[fieldId].push(well[fieldId]);
                } else {
                  fieldData[fieldId].push(null);
                }
              }
            }
          }
        });
        for (let i = 0; i < that.fieldList.length; i++) {
          let field = that.fieldList[i];
          if (field.applyMultiplexSubFieldColor) {
            field.applyMultiplexSubFieldColor(fieldData[field.id]);
          } else {
            if (field.required) {
              let include = false;
              fieldData[field.id].forEach(function (val) {
                // for multiselect
                if (val instanceof Array) {
                  if (val.length === 0) {
                    include = true;
                  }
                } else {
                  if (val === null) {
                    include = true;
                  }
                }
              });
              //field.root.find(".plate-setup-tab-name").css("background", color);
              that.fieldWarningMsg(field, "required field", include);
            }
          }
        }
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.bottomTable = function () {
    // for bottom table
    return {
      _bottomScreen: function () {
        this.bottomContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-container");
        this.bottomTableContainer = this._createElement("<div></div>").addClass("plate-setup-bottom-table-container");
        this.bottomTable = this._createElement("<table></table>").addClass("plate-setup-bottom-table");
        this.bottomTableHead = this._createElement("<thead></thead>");
        this.bottomTableBody = this._createElement("<tbody></tbody>");
        this.bottomTable.append(this.bottomTableHead);
        this.bottomTable.append(this.bottomTableBody);
        this.bottomTableContainer.append(this.bottomTable);
        this.bottomContainer.append(this.bottomTableContainer);
        this.container.append(this.bottomContainer);
      },
      addBottomTableHeadings: function () {
        let row = this._createElement("<tr></tr>");
        let singleField = this._createElement("<th></th>").text("Group");
        row.html(singleField);
        this.rowCounter = 1;
        for (let i = 0; i < this.globalSelectedAttributes.length; i++) {
          let attr = this.globalSelectedAttributes[i];
          let field = this.fieldMap[attr];
          let singleField = this._createElement("<th></th>").text(field.name);
          row.append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        // Now we append all the captions at the place.
        this.bottomTableBody.empty();
        this.bottomTableHead.empty();
        this.bottomTableHead.append(row);
        this.adjustFieldWidth(row);
      },
      tileAttrText: function (tile, attr) {
        let well = this.engine.derivative[tile.index];
        let field = this.fieldMap[attr];
        return field.getText(well[attr]);
      },
      addBottomTableRow: function (color, singleStack) {
        let that = this;
        let modelTile = this.allTiles[singleStack[0]];
        let row = this._createElement("<tr></tr>");
        let plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");
        let numberText = this._createElement("<button/>");
        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);
        numberText.click(function (evt) {
          // Arrow, not a bare method reference: .map() would pass the array
          // position as indexToAddress's `dimensions` argument
          let addressToSelect = singleStack.map(index => that.indexToAddress(index));
          if (evt.ctrlKey) {
            that.getSelectedAddresses().forEach(function (val) {
              if (addressToSelect.indexOf(val) < 0) {
                addressToSelect.push(val);
              }
            });
          }
          that.setSelectedAddresses(addressToSelect);
        });
        if (color > 0) {
          color = (color - 1) % (this.colorPairs.length - 1) + 1;
        }
        let colorStops = this.colorPairs[color];
        plateIdDiv.css("background", "linear-gradient(to right, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        for (let i = 0; i < this.globalSelectedAttributes.length; i++) {
          let attr = this.globalSelectedAttributes[i];
          let text = this.tileAttrText(modelTile, attr);
          let dataDiv = this._createElement("<td></td>").text(text);
          row.append(dataDiv);
        }
        this.bottomTableBody.append(row);
        this.adjustFieldWidth(row);
      },
      bottomForFirstTime: function () {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        let row = this._createElement("<tr></tr>");
        let colorStops = this.colorPairs[0];
        let plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTableBody.append(row);
        this.createExportButton();
      },
      adjustFieldWidth: function (row) {
        let length = this.rowCounter;
        if (length * 150 > 1024) {
          row.css("width", length * 152 + "px");
        }
      },
      downloadCSV: function (csv, filename) {
        let csvFile;
        let downloadLink;

        // CSV file
        csvFile = new Blob([csv], {
          type: "text/csv"
        });

        // Download link
        downloadLink = document.createElement("a");

        // File name
        downloadLink.download = filename;

        // Create a link to the file
        downloadLink.href = window.URL.createObjectURL(csvFile);

        // Hide download link
        downloadLink.style.display = "none";

        // Add the link to DOM
        document.body.appendChild(downloadLink);

        // Click download link
        downloadLink.click();
      },
      exportData: function (format) {
        let data = [];
        let rows = document.querySelectorAll("table tr");
        let colorLocMap = {};
        let colorLocIdxMap = this.engine.stackUpWithColor;
        for (let colorIdx in colorLocIdxMap) {
          if (colorLocIdxMap.hasOwnProperty(colorIdx)) {
            // Arrow, not a bare method reference (see addBottomTableRow)
            colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(index => this.indexToAddress(index));
          }
        }
        for (let i = 0; i < rows.length; i++) {
          let row = [],
            cols = rows[i].querySelectorAll("td, th");
          for (let j = 0; j < cols.length; j++) {
            let v = "";
            if (cols[j].innerText) {
              if (format === "csv") {
                v = '"' + cols[j].innerText.replace(/"/g, '""') + '"';
              } else {
                v = cols[j].innerText;
              }
            }
            row.push(v);

            // add location column
            if (i === 0 && j === 0) {
              if (format === "csv") {
                row.push('"Location"');
              } else if (format === "clipboard") {
                row.push("Location");
              }
            }
            if (i !== 0 && j === 0) {
              let loc = "";
              if (colorLocMap[parseInt(cols[j].innerText)]) {
                if (format === "csv") {
                  loc = '"' + colorLocMap[parseInt(cols[j].innerText)].join(",") + '"';
                } else if (format === "clipboard") {
                  loc = colorLocMap[parseInt(cols[j].innerText)].join(",");
                }
              }
              row.push(loc);
            }
          }
          if (format === "csv") {
            data.push(row.join(","));
          } else if (format === "clipboard") {
            data.push(row.join("\t"));
            //data.push(row);   // for text type
          }
        }
        if (format === "csv") {
          // Download CSV file
          this.downloadCSV(data.join("\n"), "table.csv");
        } else if (format === "clipboard") {
          //return formatTableToString(data);   // for text type
          return data.join("\n");
        }
      },
      createExportButton: function () {
        let that = this;
        let overlayContainer = $("<div>").addClass("plate-setup-bottom-control-container");
        let descriptionDiv = $("<div>").addClass("plate-setup-overlay-text-container");
        descriptionDiv.text("Color groups");
        overlayContainer.append(descriptionDiv);
        let buttonContainer = $("<div>").addClass("plate-setup-overlay-bottom-button-container");

        // create export csv option
        let exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);
        exportButton.click(function () {
          that.exportData("csv");
          exportButton.text("Exported");
          exportButton[0].classList.remove("plate-setup-button");
          exportButton.addClass("plate-setup-clicked-button");
          setTimeout(resetExportText, 3000);
        });
        function resetExportText() {
          exportButton.text("Export CSV");
          exportButton[0].classList.remove("plate-setup-clicked-button");
          exportButton.addClass("plate-setup-button");
        }

        // creat clipboard option, CLipboard is an external js file located in vendor/asset/javascripts
        let clipboardButton = $("<button/>").addClass("plate-setup-button");
        clipboardButton.text("Copy To Clipboard");
        buttonContainer.append(clipboardButton);
        let clipboard = new ClipboardJS(clipboardButton.get(0), {
          text: function () {
            return that.exportData("clipboard");
          }
        });
        clipboard.on("success", function () {
          clipboardButton.text("Copied as tab-delimited format");
          clipboardButton[0].classList.remove("plate-setup-button");
          clipboardButton.addClass("plate-setup-clicked-button");
          setTimeout(resetClipboardText, 3000);
        });
        function resetClipboardText() {
          clipboardButton.text("Copy To Clipboard");
          clipboardButton[0].classList.remove("plate-setup-clicked-button");
          clipboardButton.addClass("plate-setup-button");
        }
        clipboard.on("error", function () {
          clipboardButton.text("Failed to copy table to clipboard: browser may be incompatible");
          setTimeout(resetClipboardText, 3000);
        });
        overlayContainer.append(buttonContainer);
        this.bottomContainer.prepend(overlayContainer);
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.checkBox = function () {
    // For those check boxes associated with every field in the tab
    return {
      globalSelectedAttributes: [],
      globalSelectedMultiplexSubfield: [],
      allCheckboxes: [],
      _addCheckBox: function (field) {
        let checkImage = $("<span>").html(this._assets.dontImg).addClass("plate-setup-tab-check-box bg-light").data("clicked", false);
        let linkedFieldId = field.full_id;
        checkImage.data("linkedFieldId", linkedFieldId);
        field.root.find(".plate-setup-tab-field-left-side").empty().append(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        field.checkbox = checkImage;
        this.allCheckboxes.push(linkedFieldId);
      },
      _applyCheckboxHandler: function (checkBoxImage) {
        let that = this;
        checkBoxImage.click(function () {
          let checkBox = $(this);
          let changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");
          that.changeCheckboxes(changes);
        });
      },
      getCheckboxes: function () {
        return this.allCheckboxes.filter(function (fieldId) {
          let field = this.fieldMap[fieldId];
          if (field.mainMultiplexField) {
            let subfields = this.globalSelectedMultiplexSubfield[field.mainMultiplexField.id] || [];
            return subfields.indexOf(field.id);
          } else {
            return this.globalSelectedAttributes.indexOf(field.id) >= 0;
          }
        }, this);
      },
      changeSubFieldsCheckboxes: function (field, changes) {
        let that = this;
        let subFieldToInclude = [];
        field.subFieldList.forEach(function (subField) {
          let checkImage = subField.checkbox;
          let fieldId = checkImage.data("linkedFieldId");
          let clicked = checkImage.data("clicked");
          if (fieldId in changes) {
            clicked = Boolean(changes[fieldId]);
          }
          checkImage.data("clicked", clicked);
          if (clicked) {
            checkImage.html(that._assets.doImg);
            subFieldToInclude.push(subField.id);
          } else {
            checkImage.html(that._assets.dontImg);
          }
        });
        return subFieldToInclude;
      },
      changeCheckboxes: function (changes, noUndoRedo) {
        let gsa = [];
        let multiplexCheckedSubField = {};
        for (let i = 0; i < this.fieldList.length; i++) {
          let field = this.fieldList[i];
          if (field.checkbox) {
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.changeSubFieldsCheckboxes(field, changes);
            }
            let checkImage = field.checkbox;
            let fieldId = checkImage.data("linkedFieldId");
            let clicked = checkImage.data("clicked");
            if (fieldId in changes) {
              clicked = Boolean(changes[fieldId]);
            }
            checkImage.data("clicked", clicked);
            if (clicked) {
              gsa.push(fieldId);
              checkImage.html(this._assets.doImg);
            } else {
              checkImage.html(this._assets.dontImg);
            }
          }
        }
        this.globalSelectedMultiplexSubfield = multiplexCheckedSubField;
        this.globalSelectedAttributes = gsa;
        this._clearPresetSelection();
        this._colorMixer();
        if (!noUndoRedo) {
          this.addToUndoRedo();
        }
      },
      setSubFieldCheckboxes: function (field, fieldIds) {
        let that = this;
        let subFieldToInclude = [];
        field.subFieldList.forEach(function (subField) {
          let checkImage = subField.checkbox;
          let fieldId = checkImage.data("linkedFieldId");
          let clicked = fieldIds.indexOf(fieldId) >= 0;
          checkImage.data("clicked", clicked);
          if (clicked) {
            checkImage.html(that._assets.doImg);
            subFieldToInclude.push(subField.id);
          } else {
            checkImage.html(that._assets.dontImg);
          }
        });
        return subFieldToInclude;
      },
      setCheckboxes: function (fieldIds, noUndoRedo) {
        fieldIds = fieldIds || [];
        let gsa = [];
        let multiplexCheckedSubField = {};
        for (let i = 0; i < this.fieldList.length; i++) {
          let field = this.fieldList[i];
          if (field.checkbox) {
            // special handling for multiplex field
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.setSubFieldCheckboxes(field, fieldIds);
            }
            let checkImage = field.checkbox;
            let fieldId = checkImage.data("linkedFieldId");
            let clicked = fieldIds.indexOf(fieldId) >= 0;
            checkImage.data("clicked", clicked);
            if (clicked) {
              gsa.push(fieldId);
              checkImage.html(this._assets.doImg);
            } else {
              checkImage.html(this._assets.dontImg);
            }
          }
        }
        this.globalSelectedMultiplexSubfield = multiplexCheckedSubField;
        this.globalSelectedAttributes = gsa;
        this._clearPresetSelection();
        this._colorMixer();
        if (!noUndoRedo) {
          this.addToUndoRedo();
        }
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
plateMapWidget.colorManager = function () {
  return {
    // See these are color pairs for the gradient.
    colorPairs: [["#e6e6e6", "#808080"], ["#66e8ff", "#0082c8"], ["#ff7fb1", "#e6194b"], ["#a2ffb1", "#3cb44b"], ["#f784ff", "#911eb4"], ["#ffe897", "#f58231"], ["#6666ff", "#0000FF"], ["#ffff7f", "#ffe119"], ["#acffff", "#46f0f0"], ["#ff98ff", "#f032e6"], ["#ffffa2", "#d2f53c"], ["#ffffff", "#fabebe"], ["#66e6e6", "#008080"], ["#ffffff", "#e6beff"], ["#ffd48e", "#aa6e28"], ["#e66666", "#800000"], ["#ffffff", "#aaffc3"], ["#e6e666", "#808000"], ["#ffffff", "#ffd8b1"], ["#66a9ef", "#004389"], ["#ff6672", "#a7000c"], ["#66db72", "#00750c"], ["#b866db", "#520075"], ["#ffa966", "#b64300"], ["#ffff66", "#c0a200"], ["#6dffff", "#07b1b1"], ["#ff66ff", "#b100a7"], ["#f9ff66", "#93b600"], ["#ffe5e5", "#bb7f7f"], ["#66a7a7", "#004141"], ["#ffe5ff", "#a77fc0"], ["#d19566", "#6b2f00"], ["#ffffef", "#c0bb89"], ["#d1ffea", "#6bc084"], ["#a7a766", "#414100"], ["#ffffd8", "#c09972"], ["#a5ffff", "#3fc1ff"], ["#ffbef0", "#ff588a"], ["#e1fff0", "#7bf38a"], ["#ffc3ff", "#d05df3"], ["#ffffd6", "#ffc170"], ["#a5a5ff", "#3f3fff"], ["#ffffbe", "#ffff58"], ["#ebffff", "#85ffff"], ["#ffd7ff", "#ff71ff"], ["#a5ffff", "#3fbfbf"], ["#ffffcd", "#e9ad67"], ["#ffa5a5", "#bf3f3f"], ["#ffffa5", "#bfbf3f"]]
  };
};
var plateMapWidget = plateMapWidget || {};
(function ($) {
  function select2close(ev) {
    if (ev.params.args.originalEvent) {
      // When unselecting (in multiple mode)
      ev.params.args.originalEvent.stopPropagation();
    } else {
      // When clearing (in single mode)
      $(this).one('select2:opening', function (ev) {
        ev.preventDefault();
      });
    }
  }
  function select2fix(input) {
    // prevents select2 open on clear as of v4.0.8
    input.on('select2:unselecting', select2close);
  }
  function select2setData(input, data, selected) {
    input.empty();
    let dataAdapter = input.data('select2').dataAdapter;
    dataAdapter.addOptions(dataAdapter.convertToOptions(data));
    input.val(selected);
  }
  plateMapWidget.createField = function () {
    // It creates those fields in the tab , there is 4 types of them.
    return {
      _createField: function (field) {
        switch (field.data.type) {
          case "text":
            this._createTextField(field);
            this._handleFieldUnits(field);
            break;
          case "numeric":
            this._createNumericField(field);
            this._handleFieldUnits(field);
            break;
          case "select":
            this._createSelectField(field);
            this._handleFieldUnits(field);
            break;
          case "multiselect":
            this._createMultiSelectField(field);
            break;
          case "boolean":
            this._createBooleanField(field);
            break;
          case "multiplex":
            this._createMultiplexField(field);
            break;
        }
      },
      _handleFieldUnits: function (field) {
        let data = field.data;

        // Adding unit
        let units = data.units || [];
        let defaultUnit = data.defaultUnit || null;
        let unitInput = null;
        if (defaultUnit) {
          if (units.length) {
            if (units.indexOf(defaultUnit) < 0) {
              defaultUnit = units[0];
            }
          } else {
            units = [defaultUnit];
          }
        } else {
          if (units.length) {
            defaultUnit = units[0];
          }
        }
        if (units.length) {
          field.units = units;
          field.hasUnits = true;
          field.defaultUnit = defaultUnit;
          this._makeFieldUnits(field);
        }
      },
      _makeFieldUnits: function (field) {
        let full_id = field.full_id;
        let units = field.units;
        let defaultUnit = field.defaultUnit;
        let unitInput = null;
        field.disabledRegular = field.disabled;
        field.parseRegularValue = field.parseValue;
        field.setRegularValue = field.setValue;
        field.getRegularValue = field.getValue;
        field.getRegularText = field.getText;
        if (units.length) {
          if (units.length === 1) {
            let unitText = $("<div></div>").addClass("plate-setup-tab-unit");
            unitText.text(defaultUnit);
            field.root.find(".plate-setup-tab-field-container").append(unitText);
          } else {
            unitInput = this._createElement("<select/>").attr("id", full_id + "Units").addClass("plate-setup-tab-unit-select-field");
            field.root.find(".plate-setup-tab-field-container").append(unitInput);
            let selected = null;
            let unitData = units.map(function (unit) {
              let o = {
                id: unit,
                text: unit
              };
              if (unit === defaultUnit) {
                selected = unit;
              }
              return o;
            });
            let opts = {
              data: unitData,
              allowClear: false,
              minimumResultsForSearch: 10
            };
            unitInput.select2(opts);
            unitInput.val(selected);
          }
        }
        field.disabled = function (bool) {
          bool = field.disabledRegular(bool);
          if (unitInput) {
            unitInput.prop("disabled", bool);
          }
          return bool;
        };
        field.parseValue = function (value) {
          let v;
          if ($.isPlainObject(value)) {
            v = field.parseRegularValue(value.value);
            if (v === null) {
              return null;
            }
            return {
              value: v,
              unit: field.parseUnit(value.unit)
            };
          } else {
            v = field.parseRegularValue(value);
            if (v === null) {
              return null;
            }
            return {
              value: v,
              unit: field.defaultUnit
            };
          }
        };
        field.getValue = function () {
          let v = field.getRegularValue();
          if (v === null) {
            return null;
          } else {
            let returnVal = {
              value: v,
              unit: field.getUnit()
            };
            if (field.data.hasMultiplexUnit) {
              // include unitTypeId and UnitId to returnVal
              let unitMap = field.data.unitMap;
              for (let unitTypeKey in unitMap) {
                if (!unitMap.hasOwnProperty(unitTypeKey)) {
                  continue;
                }
                let unitTypeUnits = unitMap[unitTypeKey];
                unitTypeUnits.forEach(function (unit) {
                  if (unit.text === returnVal.unit) {
                    returnVal['unitTypeId'] = unitTypeKey;
                    returnVal['unitId'] = unit.id;
                  }
                });
              }
            }
            return returnVal;
          }
        };
        field.setValue = function (value) {
          if ($.isPlainObject(value)) {
            field.setUnit(value.unit || field.defaultUnit);
            field.setRegularValue(value.value);
          } else {
            field.setRegularValue(value);
            field.setUnit(field.defaultUnit);
          }
        };
        field.setUnitOpts = function (opts) {
          field.units = opts || null;
          field.defaultUnit = null;
          let newUnits = [];
          let selected = null;
          if (field.units && field.units.length) {
            field.defaultUnit = field.units[0];
            newUnits = field.units.map(function (curUnit) {
              let cleanUnit = {
                id: curUnit,
                text: curUnit
              };
              if (curUnit === field.defaultUnit) {
                selected = curUnit;
              }
              return cleanUnit;
            });
          }
          select2setData(unitInput, newUnits, selected);
        };
        field.parseUnit = function (unit) {
          if (unit == null || unit === "") {
            return field.defaultUnit;
          }
          for (let i = 0; i < units.length; i++) {
            if (unit.toLowerCase() === units[i].toLowerCase()) {
              return units[i];
            }
          }
          throw "Invalid unit " + unit + " for field " + full_id;
        };
        field.getUnit = function () {
          if (unitInput) {
            return unitInput.val();
          } else {
            return field.defaultUnit;
          }
        };
        field.setUnit = function (unit) {
          if (unitInput) {
            unit = unit || field.defaultUnit;
            unitInput.val(unit);
            unitInput.trigger("change.select2");
          }
        };

        // val now contains unit
        field.getText = function (val) {
          if (typeof val === 'object' && val) {
            let v = val.value;
            let u = val.unit;
            if (v == null) {
              return "";
            }
            v = v.toString();
            if (!u) {
              u = defaultUnit;
            }
            if (u) {
              v = v + " " + u;
            }
            return v;
          } else {
            return field.getRegularText(val);
          }
        };
        field.parseText = function (v) {
          let value = field.parseValue(v);
          if (value && typeof value === "object") {
            return field.getRegularText(value.value) + value.unit;
          } else if (value != null) {
            return field.getRegularText(value);
          } else {
            return null;
          }
        };
        if (unitInput) {
          unitInput.on("change", function () {
            field.onChange();
          });
        }
        field.unitInput = unitInput;
      },
      _createTextField: function (field) {
        let input = this._createElement("<input>").attr("id", field.full_id).addClass("plate-setup-tab-input");
        field.root.find(".plate-setup-tab-field-container").append(input);
        field.parseValue = function (v) {
          if (v) {
            v = String(v);
          } else {
            v = null;
          }
          return v;
        };
        field.getValue = function () {
          return input.val().trim() || null;
        };
        field.setValue = function (v) {
          // Leave the box alone while the user is typing in it; otherwise
          // the refresh after each keystroke replaces their text
          if (document.activeElement === input[0]) {
            return;
          }
          input.val(v);
        };
        field.getText = function (v) {
          if (v == null) {
            return "";
          }
          return v;
        };
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };
        field.parseText = field.parseValue;
        input.on("input", function () {
          field.onChange();
        });
        field.input = input;
      },
      _createOpts: function (config) {
        let opts = {
          allowClear: true,
          placeholder: "select"
        };
        let data_specified = false;
        if (config.options) {
          opts.data = config.options;
          data_specified = true;
        }
        if (config.ajax) {
          opts.ajax = ajax;
          data_specified = true;
        }
        if (!data_specified) {
          throw "Must specify data or ajax";
        }
        return opts;
      },
      _createSelectField: function (field) {
        let full_id = field.full_id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-select-field").addClass("plate-setup-tab-input");
        field.root.find(".plate-setup-tab-field-container").append(input);
        let opts = that._createOpts(field.data);
        let optMap = {};
        opts.data.forEach(function (opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);
        select2fix(input);
        let parseValue = function (value) {
          let v = value;
          if (v === "") {
            v = null;
          }
          if (v == null) {
            return null;
          }
          v = String(v);
          if (v in optMap) {
            return optMap[v].id;
          } else {
            throw "Invalid value " + value + " for select field " + full_id;
          }
        };
        field.parseValue = parseValue;
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };
        field.getValue = function () {
          return parseValue(input.val());
        };
        field.setValue = function (v) {
          input.val(v);
          input.trigger("change.select2");
        };
        field.getText = function (v) {
          if (v == null) {
            return "";
          }
          return optMap[String(v)].text;
        };
        field.parseText = function (value) {
          let v = value;
          if (v === "") {
            v = null;
          }
          if (v == null) {
            return null;
          }
          v = String(v);
          if (v in optMap) {
            return optMap[v].text;
          } else {
            throw "Invalid text value " + value + " for select field " + full_id;
          }
        };
        input.on("change", function () {
          field.onChange();
        });
        field.input = input;
      },
      _createMultiSelectField: function (field) {
        let full_id = field.full_id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple");
        field.root.find(".plate-setup-tab-field-container").append(input);
        let opts = that._createOpts(field.data);
        opts.multiple = true;
        let optMap = {};
        opts.data.forEach(function (opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);
        select2fix(input);
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          input.prop("disabled", bool);
          return bool;
        };
        field._parseOne = function (val) {
          val = String(val);
          if (val in optMap) {
            return optMap[val].id;
          } else {
            throw "Invalid value " + val + " for multiselect field " + full_id;
          }
        };
        field._parseMany = function (vals) {
          if (vals && vals.length) {
            vals = vals.map(field._parseOne, this);
          } else {
            vals = null;
          }
          return vals;
        };
        field.parseValue = function (value) {
          return field._parseMany(value);
        };
        field.getValue = function () {
          return field._parseMany(input.val());
        };
        field.setValue = function (v) {
          v = v || [];
          input.val(v);
          input.trigger("change.select2");
        };
        field.getText = function (v) {
          if (v == null) {
            return "";
          }
          if (v.length > 0) {
            return v.map(v => optMap[String(v)].text).join("; ");
          }
          return "";
        };
        field.multiOnChange = function (added, removed) {
          if (added) {
            added = added.id;
          }
          if (removed) {
            removed = removed.id;
          }
          let data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };
        field.parseText = function (value) {
          let v = value;
          if (v && v.length) {
            v = v.map(function (opt) {
              opt = String(opt);
              if (opt in optMap) {
                return optMap[opt].text;
              } else {
                throw "Invalid text value " + opt + " for multiselect field " + full_id;
              }
            });
          } else {
            v = null;
          }
          return v;
        };
        input.on("select2:select", function (e) {
          let v = field._parseOne(e.params.data.id);
          v = {
            id: v
          };
          field.multiOnChange(v, null);
        });
        input.on("select2:unselect", function (e) {
          let v = field._parseOne(e.params.data.id);
          v = {
            id: v
          };
          field.multiOnChange(null, v);
        });
        field.input = input;
        that._createDeleteButton(field);
      },
      _createNumericField: function (field) {
        let full_id = field.full_id;
        let data = field.data;
        let input = this._createElement("<input>").addClass("plate-setup-tab-input").attr("placeholder", data.placeholder || "").attr("id", full_id).attr("inputmode", "decimal");
        // Last text in the box that matched allowedText; restored when an
        // edit would make it invalid
        let lastValidText = "";
        let allowedText = /^-?\d*\.?\d*$/;
        field.root.find(".plate-setup-tab-field-container").append(input);
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };
        let parseValue = function (value) {
          if (value == null) {
            return null;
          }
          let v = String(value).trim();
          if (v === "") {
            return null;
          }
          v = Number(v);
          if (isNaN(v)) {
            throw "Invalid value " + value + " for numeric field " + full_id;
          }
          return v;
        };
        field.parseValue = parseValue;
        field.getValue = function () {
          let v = input.val().trim();
          if (v === "") {
            return null;
          }
          v = Number(v);
          if (isNaN(v)) {
            return null;
          }
          return v;
        };
        field.setValue = function (value) {
          // See _createTextField's setValue
          if (document.activeElement === input[0]) {
            return;
          }
          input.val(value);
          lastValidText = input.val();
        };
        let getText = function (v) {
          if (v == null) {
            return "";
          }
          v = v.toString();
          return v;
        };
        field.getText = getText;
        field.parseText = function (v) {
          return getText(parseValue(v));
        };

        // Only allow an optional leading "-", digits and one "."; any other
        // keystroke or paste is undone. Surrounding whitespace (common when
        // pasting from a spreadsheet) is allowed; getValue trims it. A
        // typographic minus ("−", common when copying from Word or a
        // PDF) is replaced with "-"
        input.on("input", function () {
          let text = input.val();
          if (text.indexOf("−") >= 0) {
            text = text.replace(/−/g, "-");
            input.val(text);
          }
          if (!allowedText.test(text.trim())) {
            input.val(lastValidText);
            return;
          }
          lastValidText = text;
          field.onChange();
        });
        field.input = input;
      },
      _createBooleanField: function (field) {
        let full_id = field.full_id;
        let input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-select-field");
        field.root.find(".plate-setup-tab-field-container").append(input);
        let tval = {
          id: "true",
          text: "true"
        };
        let fval = {
          id: "false",
          text: "false"
        };
        let opts = {
          data: [tval, fval],
          placeholder: "select",
          allowClear: true,
          minimumResultsForSearch: -1
        };
        input.select2(opts);
        select2fix(input);
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };
        field.parseValue = function (value) {
          if (value == null) {
            return null;
          }
          let v = String(value).trim().toLowerCase();
          if (v === "true") {
            v = true;
          } else if (v === "false") {
            v = false;
          } else if (v === "") {
            v = null;
          } else {
            throw "Invalid value " + value + " for boolean field " + full_id;
          }
          return v;
        };
        field.getValue = function () {
          let v = input.val();
          switch (v) {
            case "true":
              return true;
            case "false":
              return false;
            default:
              return null;
          }
        };
        field.setValue = function (v) {
          if (v === 1 || v === true || v === "true") {
            v = "true";
          } else if (v === 0 || v === false || v === "false") {
            v = "false";
          } else {
            v = null;
          }
          input.val(v);
          input.trigger("change.select2");
        };
        field.getText = function (v) {
          if (v == null) {
            return "";
          }
          return v.toString();
        };
        field.parseText = field.parseValue;
        input.on("change", function () {
          field.onChange();
        });
        field.input = input;
      },
      _createMultiplexField: function (field) {
        let that = this;
        // make correct multiplex data
        this._createMultiSelectField(field);

        // single select
        let nameContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
        let fieldContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
        field.root.find(".plate-setup-tab-field-right-side").append(nameContainer1, fieldContainer1);
        field.singleSelect = this._createElement("<select/>").attr("id", field.full_id + "SingleSelect").addClass("plate-setup-tab-multiplex-single-select-field");
        field.singleSelect.appendTo(fieldContainer1);
        let opts = {
          allowClear: false,
          placeholder: "select",
          minimumResultsForSearch: 10,
          data: []
        };
        field.singleSelect.select2(opts);
        select2fix(field.singleSelect);
        let multiselectSetValue = field.setValue;
        field.singleSelectValue = function () {
          let v = field.singleSelect.val();
          if (v === "") {
            return null;
          }
          if (v == null) {
            return null;
          }
          if (v == '[ALL]') {
            return v;
          }
          return field._parseOne(v);
        };
        let setSingleSelectOptions = function (data, selected) {
          data = data || [];
          if (field.allSelectedMultipleVal) {
            const count = Object.values(field.allSelectedMultipleVal).reduce(function (a, b) {
              return a + b;
            }, 0);
            if (count) {
              const all_option = {
                id: '[ALL]',
                text: `[${count} well ${field.data.name}]`,
                forAll: true
              };
              data = [all_option].concat(data);
            }
          }
          if (!selected) {
            if (data.length) {
              selected = data[0].id;
            } else {
              selected = null;
            }
          }
          select2setData(field.singleSelect, data, selected);
          field.singleSelect.prop("disabled", data.length === 0);
          field.singleSelect.trigger("change.select2");
        };
        let singleSelectChange = function () {
          let v = field.singleSelectValue();
          field.updateSubFieldUnitOpts(v);
          let curSubField = null;
          if (v === '[ALL]') {
            curSubField = field.allSelectedMultipleData;
          } else {
            let curData = field.detailData || [];
            curData.forEach(function (val) {
              if (val[field.id] === v) {
                curSubField = val;
              }
            });
          }
          if (curSubField) {
            // setvalue for subfield
            field.subFieldList.forEach(function (subField) {
              subField.isDisabled = false;
              subField.setValue(curSubField[subField.id]);
            });
          } else {
            field.subFieldList.forEach(function (subField) {
              subField.isDisabled = true;
              subField.setValue(null);
            });
          }
          that.readOnlyHandler();
        };
        setSingleSelectOptions([]);
        field.singleSelect.on("change.select2", singleSelectChange);
        field._changeMultiFieldValue = function (added, removed) {
          let newSubFieldValue = {};
          for (let i = 0; i < field.subFieldList.length; i++) {
            let subFieldId = field.subFieldList[i].id;
            newSubFieldValue[subFieldId] = null;
          }
          let val;
          if (added) {
            if (added.value) {
              val = added.value;
            } else {
              newSubFieldValue[field.id] = added.id;
              val = newSubFieldValue;
            }
            added = {
              id: added.id,
              value: val
            };
          }
          if (removed) {
            if (removed.value) {
              val = removed.value;
            } else {
              newSubFieldValue[field.id] = removed.id;
              val = newSubFieldValue;
            }
            removed = {
              id: removed.id,
              value: val
            };
          }
          let data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };
        field.setValue = function (v) {
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          let multiselectValues = null;
          if (v && v.length) {
            multiselectValues = v.map(val => val[field.id]);
          }
          multiselectSetValue(multiselectValues);
          let newOptions = field.input.select2('data') || [];
          setSingleSelectOptions(newOptions, field.singleSelectValue());
          singleSelectChange();
        };
        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          field.subFieldList.forEach(function (subField) {
            subField.disabled(bool);
          });
          if (bool) {
            nameContainer1.text("Select to inspect");
          } else {
            nameContainer1.text("Select to edit");
          }
          return bool;
        };
        field.parseValue = function (value) {
          let v = value;
          if (v && v.length) {
            v = v.map(function (opt) {
              let valMap = {};
              valMap[field.id] = opt[field.id];
              for (let subFieldId in opt) {
                if (opt.hasOwnProperty(subFieldId)) {
                  field.subFieldList.forEach(function (subField) {
                    if (subField.id === subFieldId) {
                      valMap[subField.id] = subField.parseValue(opt[subFieldId]);
                    }
                  });
                }
              }
              return valMap;
            });
          } else {
            v = null;
          }
          return v;
        };
        field.updateSubFieldUnitOpts = function (val) {
          let curOpts;
          field.data.options.forEach(function (opt) {
            if (opt.id === val) {
              curOpts = opt;
            }
          });
          field.subFieldList.forEach(function (subField) {
            if (subField.data.hasMultiplexUnit) {
              if (curOpts && curOpts.hasOwnProperty("unitOptions")) {
                subField.setUnitOpts(curOpts.unitOptions[subField.id]);
              } else {
                subField.setUnitOpts(null);
              }
            }
          });
        };
        field.multiOnChange = function (added, removed) {
          field._changeMultiFieldValue(added, removed);
          let v = field.getValue();
          let curData = field.detailData;
          let curIds = [];
          let curOpt = null;
          //reshape data for saveback
          if (curData) {
            curIds = curData.map(val => val[field.id]);
          }
          let newMultiplexVal = [];
          let selectList = [];
          if (v) {
            v.forEach(function (selectedVal) {
              if (curData) {
                curData.forEach(function (val) {
                  if (val[field.id] === selectedVal) {
                    newMultiplexVal.push(val);
                  }
                });
              }
              // cases when adding new data
              if (curIds.indexOf(selectedVal) < 0) {
                let newVal = {};
                newVal[field.id] = selectedVal;
                field.updateSubFieldUnitOpts(selectedVal);
                field.subFieldList.forEach(function (subfield) {
                  // special handling for subfield which has multiplexUnit
                  if (subfield.hasUnits) {
                    if (subfield.data.hasMultiplexUnit) {
                      subfield.disabled(false);
                      field.data.options.forEach(function (opt) {
                        if (opt.id === selectedVal) {
                          let val = {
                            value: null,
                            unit: subfield.units[0]
                          };
                          newVal[subfield.id] = subfield.parseValue(val);
                        }
                      });
                    } else {
                      if (subfield.data.units) {
                        if (subfield.data.units.length > 1) {
                          subfield.disabled(false);
                        }
                      }
                      let val = {
                        value: null,
                        unit: subfield.defaultUnit
                      };
                      newVal[subfield.id] = subfield.parseValue(val);
                    }
                  } else {
                    newVal[subfield.id] = subfield.parseValue(null);
                  }
                });
                newMultiplexVal.push(newVal);
              }
            });

            // make data for single select options
            v.forEach(function (selectVal) {
              field.data.options.forEach(function (opt) {
                if (opt.id === selectVal) {
                  selectList.push(opt);
                }
              });
            });
            let selected = field.singleSelectValue();
            for (let i = 0; i < v.length; i++) {
              if (added && added.id === v[i]) {
                curOpt = v[i];
                break;
              } else if (i === 0) {
                curOpt = v[i];
              } else if (v[i] === selected) {
                curOpt = v[i];
              }
            }
          }
          field.detailData = newMultiplexVal;
          setSingleSelectOptions(selectList, curOpt);
          singleSelectChange();
        };
        field.getText = function (v) {
          if (v === null) {
            return "";
          }
          // get subfields that is selected from the checkbox
          if (field.id in that.globalSelectedMultiplexSubfield) {
            let checkedSubfields = that.globalSelectedMultiplexSubfield[field.id];
            let returnVal = [];
            for (let valIdx in v) {
              if (!v.hasOwnProperty(valIdx)) {
                continue;
              }
              let subV = v[valIdx];
              let subText = [];
              for (let optId in field.data.options) {
                if (field.data.options.hasOwnProperty(optId)) {
                  let opt = field.data.options[optId];
                  if (opt.id === subV[field.id]) {
                    subText.push(opt.text);
                  }
                }
              }
              field.subFieldList.forEach(function (subField) {
                if (checkedSubfields.indexOf(subField.id) >= 0) {
                  let x = subField.getText(subV[subField.id]);
                  subText.push(subField.name + ": " + x);
                }
              });
              returnVal.push("{" + subText.join(", ") + "}");
            }
            return returnVal.join(";");
          }
        };
        field.parseText = function (v) {
          if (v === null) {
            return "";
          } else {
            let returnVal = [];
            for (let valIdx in v) {
              if (!v.hasOwnProperty(valIdx)) {
                continue;
              }
              let subV = v[valIdx];
              let subText = [];
              for (let optId in field.data.options) {
                if (field.data.options.hasOwnProperty(optId)) {
                  let opt = field.data.options[optId];
                  if (opt.id === subV[field.id]) {
                    subText.push(opt.text);
                  }
                }
              }
              field.subFieldList.forEach(function (subField) {
                let x = subField.getText(subV[subField.id]);
                if (x) {
                  subText.push(x);
                }
              });
              returnVal.push(subText);
            }
            return returnVal;
          }
        };
        field.checkMultiplexCompletion = function (valList) {
          let valCount = 0;
          let completionPct = 0;
          let include = false;
          function getSubfieldStatus(vals) {
            let req = 0;
            let fill = 0;
            for (let subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }
              let subField = field.subFieldList[subFieldId];
              let curVal = vals[subField.id];
              if (subField.required) {
                include = true;
                req++;
                if (typeof curVal === 'object' && curVal) {
                  if (curVal.value) {
                    fill++;
                  }
                } else if (curVal) {
                  fill++;
                }
              }
            }
            return fill / req;
          }

          // for cases has value in multiplex field
          if (valList) {
            if (valList.length > 0) {
              for (let idx in valList) {
                if (valList.hasOwnProperty(idx)) {
                  valCount++;
                  let vals = valList[idx];
                  completionPct += getSubfieldStatus(vals);
                }
              }
            } else if (field.required) {
              include = true;
              valCount = 1;
            }
          } else if (field.required) {
            include = true;
            valCount = 1;
          }
          return {
            include: include,
            completionPct: completionPct / valCount
          };
        };

        // valList contains all of the vals for selected val
        field.applyMultiplexSubFieldColor = function (valList) {
          function updateSubFieldWarningMap(vals) {
            for (let subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }
              let subField = field.subFieldList[subFieldId];
              // loop through each well's multiplexval list
              if (vals === null) {
                if (field.required && subField.required) {
                  subFieldWarningMap[subField.id].warningStatus.push(true);
                }
              } else if (typeof vals === "object") {
                if (vals.length === 0) {
                  if (field.required && subField.required) {
                    subFieldWarningMap[subField.id].warningStatus.push(true);
                  }
                } else {
                  for (let multiplexIdx in vals) {
                    if (!vals.hasOwnProperty(multiplexIdx)) {
                      continue;
                    }
                    let curVal = vals[multiplexIdx][subField.id];
                    if (subField.required) {
                      if (typeof curVal === 'object' && curVal) {
                        if (!curVal.value) {
                          subFieldWarningMap[subField.id].warningStatus.push(true);
                        } else {
                          subFieldWarningMap[subField.id].warningStatus.push(false);
                        }
                      } else if (!curVal) {
                        subFieldWarningMap[subField.id].warningStatus.push(true);
                      } else {
                        subFieldWarningMap[subField.id].warningStatus.push(false);
                      }
                    }
                  }
                }
              }
            }
          }
          let subFieldWarningMap = {};
          field.subFieldList.forEach(function (subField) {
            if (subField.required) {
              subFieldWarningMap[subField.id] = {
                field: subField,
                warningStatus: []
              };
            }
          });
          valList.forEach(function (multiplexVals) {
            updateSubFieldWarningMap(multiplexVals);
          });
          // turn off main field when all subfield are filled

          let mainFieldStatus = [];
          for (let subFieldId in subFieldWarningMap) {
            if (!subFieldWarningMap.hasOwnProperty(subFieldId)) {
              continue;
            }
            let subField = subFieldWarningMap[subFieldId].field;
            if (subFieldWarningMap[subFieldId].warningStatus.indexOf(true) >= 0) {
              let text = subField.name + " is a required subfield for " + field.name + ", please make sure all " + field.name + " have " + subField.name;
              if (field.required) {
                that.fieldWarningMsg(subField, text, true);
                mainFieldStatus.push(true);
              } else {
                that.fieldWarningMsg(subField, text, true);
                mainFieldStatus.push(true);
              }
            } else {
              that.fieldWarningMsg(subField, "none", false);
              mainFieldStatus.push(false);
            }
          }
          let mainFieldWarning = mainFieldStatus.indexOf(true) >= 0;
          let warningText;
          if (field.required) {
            warningText = field.name + " is a required field, please also fix missing required subfield(s) below";
          } else {
            warningText = field.name + " is not a required field, please fix missing required subfield(s) below or remove selected " + field.name;
          }
          that.fieldWarningMsg(field, warningText, mainFieldWarning);
        };
        field.parseMainFieldVal = function (val) {
          let optMap = field.data.options;
          for (let idx = 0; idx < optMap.length; idx++) {
            let curOpt = optMap[idx];
            if (curOpt.id === val) {
              return curOpt.text;
            }
          }
        };
      },
      _deleteDialog: function (field) {
        let that = this;
        let valMap = field.allSelectedMultipleVal;
        let valToRemove;
        if (valMap) {
          valToRemove = Object.keys(valMap);
        } else {
          valToRemove = [];
        }
        let dialogDiv = $("<div/>").addClass("plate-modal");
        this.container.append(dialogDiv);
        function killDialog() {
          dialogDiv.hide();
          dialogDiv.remove();
        }
        let dialogContent = $("<div/>").addClass("plate-modal-content").css('width', '550px').appendTo(dialogDiv);
        let tableArea = $("<div/>").appendTo(dialogContent);
        let buttonRow = $("<div/>").addClass("dialog-buttons").css("justify-content", "flex-end").appendTo(dialogContent);
        if (valToRemove.length > 0) {
          // apply CSS property for table
          $("<p/>").text(field.name + " in selected wells: choose items to delete and click the delete button below").appendTo(tableArea);
          let table = that._deleteDialogTable(field, valMap);
          table.appendTo(tableArea);
          table.addClass("plate-popout-table");
          table.find('td').addClass("plate-popout-td");
          table.find('th').addClass("plate-popout-th");
          table.find('tr').addClass("plate-popout-tr");
          if (!that.readOnly) {
            let deleteCheckedButton = $("<button class='multiple-field-manage-delete-button'>Delete Checked Items</button>");
            buttonRow.append(deleteCheckedButton);
            deleteCheckedButton.click(function () {
              table.find("input:checked").each(function () {
                let val = this.value;
                field.multiOnChange(null, {
                  id: val
                });
              });
              // refresh selected fields after updating the multiplex field value
              that.decideSelectedFields();
              killDialog();
            });
          }
        } else {
          $("<p/>").text("No " + field.name + " in the selected wells").appendTo(tableArea);
        }
        let cancelButton = $("<button>Cancel</button>");
        buttonRow.append(cancelButton);
        cancelButton.click(killDialog);
        dialogDiv.show();
        window.onclick = function (event) {
          if (event.target === dialogDiv[0]) {
            killDialog();
          }
        };
      },
      _deleteDialogTable: function (field, valMap) {
        let that = this;
        let colName = [field.name, "Counts"]; //Added because it was missing... no idea what the original should have been
        if (!that.readOnly) {
          colName.push("Delete");
        }
        let table = $('<table/>');
        let thead = $('<thead/>').appendTo(table);
        let tr = $('<tr/>').appendTo(thead);
        tr.append(colName.map(function (text) {
          return $('<th/>').text(text);
        }));
        let tbody = $("<tbody/>").appendTo(table);
        field.data.options.forEach(function (opt) {
          if (opt.id in valMap) {
            let tr = $('<tr/>').appendTo(tbody);
            let checkbox = $("<input type='checkbox'>").prop("value", opt.id);
            $("<td/>").text(opt.text).appendTo(tr);
            $("<td/>").text(valMap[opt.id]).appendTo(tr);
            if (!that.readOnly) {
              $("<td/>").append(checkbox).appendTo(tr);
            }
          }
        });
        return table;
      },
      _createDeleteButton: function (field) {
        let that = this;
        let deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + "...");
        let buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");
        buttonContainer.append(deleteButton);
        field.deleteButton = deleteButton;
        field.root.find(".plate-setup-tab-field-right-side").append(buttonContainer);
        deleteButton.click(function () {
          that._deleteDialog(field);
        });
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.engine = function (THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateMapWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {
        derivative: {},
        colorMap: new Map(),
        stackUpWithColor: {},
        stackPointer: 2,
        wellEmpty: function (well) {
          for (let prop in well) {
            if (!well.hasOwnProperty(prop)) {
              continue;
            }
            let curVal = well[prop];
            if (curVal !== null && curVal !== undefined) {
              if (Array.isArray(curVal)) {
                if (curVal.length > 0) {
                  return false;
                }
              } else {
                return false;
              }
            }
          }
          return true;
        },
        searchAndStack: function () {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 1;
          let derivativeJson = {};
          for (let idx in this.derivative) {
            if (!this.derivative.hasOwnProperty(idx)) {
              continue;
            }
            let data = this.derivative[idx];
            let wellData = {};
            for (let i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              let attr = THIS.globalSelectedAttributes[i];
              if (attr in THIS.globalSelectedMultiplexSubfield) {
                let selectedSubFields = THIS.globalSelectedMultiplexSubfield[attr];
                let newMultiplexVal = [];
                for (let multiplexIdx in data[attr]) {
                  if (!data[attr].hasOwnProperty(multiplexIdx)) {
                    continue;
                  }
                  let curMultiplexVals = data[attr][multiplexIdx];
                  let newVal = {};
                  newVal[attr] = curMultiplexVals[attr];
                  selectedSubFields.forEach(function (subFieldId) {
                    newVal[subFieldId] = curMultiplexVals[subFieldId];
                  });
                  newMultiplexVal.push(newVal);
                }
                wellData[attr] = newMultiplexVal;
              } else {
                if (data[attr] != null) {
                  wellData[attr] = data[attr];
                }
              }
            }
            if ($.isEmptyObject(wellData)) {
              derivativeJson[idx] = null;
            } else {
              derivativeJson[idx] = JSON.stringify(wellData);
            }
          }
          while (!$.isEmptyObject(derivativeJson)) {
            let keys = Object.keys(derivativeJson).map(parseFloat);
            keys.sort(function (a, b) {
              return a - b;
            });
            let refDerivativeIndex = keys[0];
            let referenceDerivative = derivativeJson[refDerivativeIndex];
            let arr = [];
            if (!referenceDerivative) {
              // if no checked box has value, push it to first spot
              if (this.stackUpWithColor[0]) {
                this.stackUpWithColor[0].push(refDerivativeIndex);
              } else {
                this.stackUpWithColor[0] = [refDerivativeIndex];
              }
              delete derivativeJson[refDerivativeIndex];
            } else {
              // if checked boxes have values
              for (let i = 0; i < keys.length; i++) {
                let idx = keys[i];
                if (referenceDerivative === derivativeJson[idx]) {
                  arr.push(idx);
                  this.stackUpWithColor[this.stackPointer] = arr;
                  delete derivativeJson[idx];
                }
              }
              if (arr.length > 0) this.stackPointer++;
            }
          }
        },
        applyColors: function () {
          let wholeNoTiles = 0;
          let wholePercentage = 0;
          THIS.addBottomTableHeadings();
          for (let i = 0; i < THIS.allTiles.length; i++) {
            let tile = THIS.allTiles[i];
            THIS.setTileVisible(tile, false);
          }
          for (let color = 0; color < this.stackPointer; color++) {
            let arr = this.stackUpWithColor[color];
            if (arr) {
              THIS.addBottomTableRow(color, arr);
              for (let i = 0; i < arr.length; i++) {
                wholeNoTiles++;
                let index = this.stackUpWithColor[color][i];
                let tile = THIS.allTiles[index];
                let well = this.derivative[index];
                this.colorMap.set(index, color);
                THIS.setTileColor(tile, color);
                // Checks if all the required fields are filled
                let completion = this.checkCompletion(well, tile);
                THIS.setTileComplete(tile, completion === 1);
                wholePercentage = wholePercentage + completion;
              }
            }
          }
          wholePercentage = Math.floor(100 * wholePercentage / wholeNoTiles);
          if (isNaN(wholePercentage)) {
            THIS.overLayTextContainer.text("Completion Percentage: 0%");
          } else {
            THIS.overLayTextContainer.text("Completion Percentage: " + wholePercentage + "%");
          }
          THIS.selectObjectInBottomTab();
        },
        checkCompletion: function (wellData) {
          let req = 0;
          let fill = 0;
          for (let i = 0; i < THIS.fieldList.length; i++) {
            let field = THIS.fieldList[i];
            if (field.checkMultiplexCompletion) {
              // also apply color
              let multiplexStatus = field.checkMultiplexCompletion(wellData[field.id]);
              if (multiplexStatus.include) {
                fill += multiplexStatus.completionPct;
                req++;
              }
            } else {
              if (field.required) {
                req++;
                if (wellData[field.id] !== null) {
                  fill++;
                }
              }
            }
          }
          if (req === fill) {
            return 1;
          }
          return fill / req;
        }
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
plateMapWidget.assets = function () {
  return {
    _assets: {
      doImg: '&#10003;',
      dontImg: '',
      warningImg: '&#9888;'
    }
  };
};
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.interface = function () {
    // interface holds all the methods to put the interface in place
    return {
      _createInterface: function () {
        let divIdentifier = '<div></div>';
        this.container = this._createElement(divIdentifier).addClass("plate-setup-wrapper");
        this.topSection = this._createElement(divIdentifier).addClass("plate-setup-top-section");
        this.topLeft = this._createElement(divIdentifier).addClass("plate-setup-top-left");
        this.topRight = this._createElement(divIdentifier).addClass("plate-setup-top-right");
        this.overLayContainer = this._createElement(divIdentifier).addClass("plate-setup-overlay-container");
        this.canvasContainer = this._createElement(divIdentifier).addClass("plate-setup-canvas-container");
        this._createOverLay();
        $(this.topLeft).append(this.overLayContainer);
        $(this.topLeft).append(this.canvasContainer);
        $(this.topSection).append(this.topLeft);
        $(this.topSection).append(this.topRight);
        $(this.container).append(this.topSection);
        $(this.element).append(this.container);
        this._createSvg();
        this._createTabAtRight();
        this._createTabs();
        this._placePresetTabs();
        // Bottom of the screen
        this._bottomScreen();
        this.bottomForFirstTime();
        let that = this;
        this._setShortcuts();
        $(document.body).keyup(function (e) {
          that._handleShortcuts(e);
        });
        this._configureUndoRedoArray();
      },
      _createElement: function (element) {
        return $(element);
      },
      _setShortcuts: function () {
        let that = this;
        window.addEventListener("cut", function (e) {
          if (document.activeElement === document.body) {
            that.copyCriteria();
            that.clearCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("copy", function (e) {
          if (document.activeElement === document.body) {
            that.copyCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("paste", function (e) {
          if (document.activeElement === document.body) {
            that.pasteCriteria();
            e.preventDefault();
          }
        });
      },
      _handleShortcuts: function (e) {
        if (document.activeElement === document.body) {
          if (e.keyCode === 46) {
            this.clearCriteria();
            e.preventDefault();
          } else if (e.ctrlKey || e.metaKey) {
            if (e.keyCode === 90) {
              if (e.shiftKey) {
                this.redo();
              } else {
                this.undo();
              }
              e.preventDefault();
            } else if (e.keyCode === 89) {
              this.redo();
              e.preventDefault();
            }
          }
        }
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
plateMapWidget.loadPlate = function () {
  // Methods which look after data changes and stack up accordingly
  // Remember THIS points to plateMapWidget and 'this' points to engine
  return {
    loadPlate: function (data) {
      //sanitize input
      let derivative;
      if (data.hasOwnProperty('wells')) {
        derivative = {};
        for (let address in data.wells) {
          let well = data.wells[address];
          let index = this.addressToIndex(address);
          derivative[index] = this.sanitizeWell(well);
        }
      } else {
        derivative = this.engine.derivative;
      }
      let checkboxes;
      if (data.hasOwnProperty('checkboxes')) {
        checkboxes = this.sanitizeCheckboxes(data.checkboxes);
      } else {
        checkboxes = this.getCheckboxes();
      }
      let sanitized = {
        "derivative": derivative,
        "checkboxes": checkboxes
      };
      this.setData(sanitized);
    },
    sanitizeCheckboxes: function (checkboxes) {
      checkboxes = checkboxes || [];
      return this.allCheckboxes.filter(fieldId => checkboxes.indexOf(fieldId) >= 0);
    },
    sanitizeAddresses: function (selectedAddresses) {
      selectedAddresses = selectedAddresses || [];
      // Arrow, not a bare method reference: .map() would pass the array
      // position as addressToIndex's `dimensions` argument
      let indices = selectedAddresses.map(address => this.addressToIndex(address));
      // Numeric comparator: the default sort compares as strings (10 < 2)
      indices.sort((a, b) => a - b);
      indices = indices.filter((index, i) => indices.indexOf(index) === i);
      return indices;
    },
    sanitizeWell: function (well) {
      let newWell = {};
      this.fieldList.forEach(function (field) {
        newWell[field.id] = field.parseValue(well[field.id]);
      });
      return newWell;
    },
    setData: function (data, quiet) {
      this.engine.derivative = data.derivative;
      this.setCheckboxes(data.checkboxes, true);
      this.setSelectedIndices(data.selectedIndices, true);
      this.derivativeChange();
      if (!quiet) {
        this.addToUndoRedo();
      }
    }
  };
};
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.overlay = function () {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy Criteria' button etc ...
    return {
      _createOverLay: function () {
        let that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        this.overLayTextContainer.text("Completion Percentage:");
        this.overLayContainer.append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        this.overLayContainer.append(this.overLayButtonContainer);
        this.clearCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.clearCriteriaButton.text("Clear");
        this.overLayButtonContainer.append(this.clearCriteriaButton);
        this.clearCriteriaButton.click(function () {
          that.clearCriteria();
        });
        this.copyCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.copyCriteriaButton.text("Copy");
        this.overLayButtonContainer.append(this.copyCriteriaButton);
        this.copyCriteriaButton.click(function () {
          that.copyCriteria();
        });
        this.pasteCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.pasteCriteriaButton.text("Paste");
        this.overLayButtonContainer.append(this.pasteCriteriaButton);
        this.pasteCriteriaButton.click(function () {
          that.pasteCriteria();
        });
        this.undoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.undoButton.text("Undo");
        this.overLayButtonContainer.append(this.undoButton);
        this.undoButton.click(function () {
          that.undo();
        });
        this.redoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.redoButton.text("Redo");
        this.overLayButtonContainer.append(this.redoButton);
        this.redoButton.click(function () {
          that.redo();
        });
      },
      clearCriteria: function () {
        if (this.selectedIndices && this.selectedIndices.length) {
          let hasWellUpdate = false;
          let selectedIndices = this.selectedIndices;
          let well;
          for (let i = 0; i < selectedIndices.length; i++) {
            let index = selectedIndices[i];
            if (index in this.engine.derivative) {
              // handling for clearing well when not allowed to add or delete wells
              if (this.disableAddDeleteWell) {
                if (this.engine.derivative.hasOwnProperty(index)) {
                  well = $.extend(true, {}, this.emptyWellWithDefaultVal);
                  this.engine.derivative[index] = well;
                }
              } else {
                delete this.engine.derivative[index];
              }
              hasWellUpdate = true;
            }
          }
          if (hasWellUpdate) {
            this._colorMixer();
            this.decideSelectedFields();
            this.derivativeChange();
            this.addToUndoRedo();
          }
        } else {
          alert("Please select any well");
        }
      },
      copyCriteria: function () {
        if (this.selectedIndices && this.selectedIndices.length) {
          let wells = this._getSelectedWells();
          this.commonData = this._getCommonData(wells);
        } else {
          alert("Please select any well.");
        }
      },
      pasteCriteria: function () {
        if (this.commonData) {
          this._addAllData(this.commonData);
          this.decideSelectedFields();
        }
      }
    };
  };
})(jQuery);
$.widget("DNA.plateMap", {
  plateMapWidget: {},
  options: {
    value: 0
  },
  addressToLoc: function (address) {
    let m = /^([A-Z]+)(\d+)$/.exec(address.trim().toUpperCase());
    if (m) {
      let row_v = m[1];
      let col = parseInt(m[2]) - 1;
      let row = 0;
      for (let i = 0; i < row_v.length; i++) {
        let c = row_v.charCodeAt(i) - 65;
        if (i) {
          row += 1;
          row *= 26;
          row += c;
        } else {
          row = c;
        }
      }
      return {
        r: row,
        c: col
      };
    } else {
      throw address + " not a proper plate address";
    }
  },
  locToIndex: function (loc, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }
    if (!(loc.r >= 0 && loc.r < dimensions.rows)) {
      throw "Row index " + (loc.r + 1) + " invalid";
    }
    if (!(loc.c >= 0 && loc.c < dimensions.cols)) {
      throw "Column index " + (loc.c + 1) + " invalid";
    }
    return loc.r * dimensions.cols + loc.c;
  },
  addressToIndex: function (address, dimensions) {
    let loc = this.addressToLoc(address);
    return this.locToIndex(loc, dimensions);
  },
  _rowKey: function (i) {
    let c1 = i % 26;
    let c2 = (i - c1) / 26;
    let code = String.fromCharCode(65 + c1);
    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }
    return code;
  },
  _colKey: function (i) {
    return (i + 1).toString(10);
  },
  indexToLoc: function (index, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }
    if (index >= dimensions.rows * dimensions.cols) {
      throw "Index too high: " + index.toString(10);
    }
    let loc = {};
    loc.c = index % dimensions.cols;
    loc.r = (index - loc.c) / dimensions.cols;
    return loc;
  },
  locToAddress: function (loc) {
    return this._rowKey(loc.r) + this._colKey(loc.c);
  },
  indexToAddress: function (index, dimensions) {
    let loc = this.indexToLoc(index, dimensions);
    return this.locToAddress(loc);
  },
  getDimensions: function () {
    return $.extend(true, {}, this.dimensions);
  },
  _create: function () {
    let rows = parseInt(this.options.numRows || 8);
    let cols = parseInt(this.options.numCols || 12);
    this.dimensions = {
      rows: rows,
      cols: cols
    };
    this.rowIndex = [];
    for (let i = 0; i < rows; i++) {
      this.rowIndex.push(this._rowKey(i));
    }
    this.target = this.element[0].id ? "#" + this.element[0].id : "." + this.element[0].className;

    // Import classes from other files.. Here we import it using extend and add it to this
    // object. internally we add to widget.DNA.getPlates.prototype.
    // Helpers are methods which return other methods and objects.
    // add Objects to plateMapWidget and it will be added to this object.
    // set read only well
    if (this.options.readOnly) {
      this.isReadOnly(true);
    }
    for (let component in plateMapWidget) {
      if (plateMapWidget.hasOwnProperty(component)) {
        // Incase some properties has to initialize with data from options hash,
        // we provide it sending this object.
        $.extend(this, new plateMapWidget[component](this));
      }
    }
    this._createInterface();
    this._trigger("created", null, this);
    return this;
  },
  _init: function () {
    // This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },
  // wellsData follows syntax: {A1:{field1: val1, field2: val2}, A2:{field1: val1, field2: val2}}
  getTextDerivative: function (wellsData) {
    let textDerivative = {};
    let fieldMap = this.fieldMap;
    for (let address in wellsData) {
      if (!wellsData.hasOwnProperty(address)) {
        continue;
      }
      let textValWell = {};
      let textFieldIdWell = {};
      let curWellData = wellsData[address];
      for (let fieldId in curWellData) {
        if (!curWellData.hasOwnProperty(fieldId)) {
          continue;
        }
        if (fieldId in fieldMap) {
          let field = fieldMap[fieldId];
          let textVal = field.parseText(curWellData[fieldId]);
          textFieldIdWell[field.name] = textVal;
          textValWell[fieldId] = textVal;
        } else {
          // do not convert if not a field
          textFieldIdWell[fieldId] = curWellData[fieldId];
          textValWell[fieldId] = curWellData[fieldId];
        }
      }
      textDerivative[address] = {
        textVal: textValWell,
        textFieldVal: textFieldIdWell
      };
    }
    return textDerivative;
  },
  // wellsData follows syntax: {A1:{field1: val1, field2: val2}, A1:{field1: val1, field2: val2}}
  getWellsDifferences: function (wellsHash) {
    let wells = [];
    for (let wellId in wellsHash) {
      if (wellsHash.hasOwnProperty(wellId)) {
        wells.push(wellsHash[wellId]);
      }
    }
    let differentWellsVals = {};
    if (wells.length > 1) {
      let commonWell = this._getCommonWell(wells);
      let allFieldVal = {};
      for (let fieldIdx in wells[0]) {
        if (wells[0].hasOwnProperty(fieldIdx)) {
          allFieldVal[fieldIdx] = [];
        }
      }
      for (let address in wellsHash) {
        if (!wellsHash.hasOwnProperty(address)) {
          continue;
        }
        let diffWellVal = {};
        let curWellData = wellsHash[address];
        for (let fieldId in curWellData) {
          if (!curWellData.hasOwnProperty(fieldId)) {
            continue;
          }
          let commonVal = commonWell[fieldId];
          let curVal = curWellData[fieldId];
          if (commonVal === undefined) {
            commonVal = null;
          }
          if (curVal === undefined) {
            curVal = null;
          }
          let newVal = null;
          if (Array.isArray(curVal)) {
            commonVal = commonVal || [];
            // get uncommonVal
            newVal = [];
            for (let idx = 0; idx < curVal.length; idx++) {
              let curMultiVal = curVal[idx];
              // multiplex field
              if (curMultiVal && typeof curMultiVal === "object") {
                if (!this.containsObject(curMultiVal, commonVal)) {
                  newVal.push(curMultiVal);
                  if (!this.containsObject(curMultiVal, allFieldVal[fieldId])) {
                    allFieldVal[fieldId].push(curMultiVal);
                  }
                }
              } else {
                if (commonVal.indexOf(curMultiVal) < 0) {
                  newVal.push(curMultiVal);
                  if (!allFieldVal[fieldId].indexOf(curMultiVal) >= 0) {
                    allFieldVal[fieldId].push(curMultiVal);
                  }
                }
              }
            }
          } else if (curVal && typeof curVal === "object") {
            if (commonVal && typeof commonVal === "object") {
              if (!(curVal.value === commonVal.value || curVal.unit === commonVal.unit)) {
                newVal = curVal;
                if (!this.containsObject(curVal, allFieldVal[fieldId])) {
                  allFieldVal[fieldId].push(curVal);
                }
              }
            } else {
              newVal = curVal;
              if (!this.containsObject(curVal, allFieldVal[fieldId])) {
                allFieldVal[fieldId].push(curVal);
              }
            }
          } else if (curVal !== commonVal) {
            newVal = curVal;
            if (!allFieldVal[fieldId].indexOf(curVal) >= 0) {
              allFieldVal[fieldId].push(curVal);
            }
          }
          diffWellVal[fieldId] = newVal;
        }
        differentWellsVals[address] = diffWellVal;
      }

      // clean up step for fields that are empty
      for (let fieldId in allFieldVal) {
        if (!allFieldVal.hasOwnProperty(fieldId)) {
          continue;
        }
        if (allFieldVal[fieldId].length === 0) {
          for (let address in differentWellsVals) {
            if (!differentWellsVals.hasOwnProperty(address)) {
              continue;
            }
            delete differentWellsVals[address][fieldId];
          }
        }
      }
      return differentWellsVals;
    } else if (wells.length > 0) {
      let differentWellsVals = {};
      for (let address in wellsHash) {
        if (!wellsHash.hasOwnProperty(address)) {
          continue;
        }
        let diffWellVal = {};
        let curWellData = wellsHash[address];
        for (let fieldId in curWellData) {
          if (!curWellData.hasOwnProperty(fieldId)) {
            continue;
          }
          let curVal = curWellData[fieldId];
          if (Array.isArray(curVal)) {
            if (curVal.length > 0) {
              diffWellVal[fieldId] = curVal;
            }
          } else if (curVal) {
            diffWellVal[fieldId] = curVal;
          }
        }
        differentWellsVals[address] = diffWellVal;
      }
      return differentWellsVals;
    }
  },
  setFieldsDisabled: function (flag) {
    this.fieldList.forEach(function (field) {
      field.disabled(flag);
    });
  },
  isReadOnly: function (flag) {
    this.readOnly = !!flag;
    this.readOnlyHandler();
  },
  readOnlyHandler: function () {
    if (this.readOnly) {
      this.overLayButtonContainer.css("display", "none");
      $('.multiple-field-manage-delete-button').css("display", "none");
      this.setFieldsDisabled(true);
    } else {
      this.overLayButtonContainer.css("display", "flex");
      $('.multiple-field-manage-delete-button').css("display", "none");
      if (!this.disableAddDeleteWell) {
        this.setFieldsDisabled(false);
      }
    }
  },
  disableAddDeleteWell: null,
  // column_with_default_val will be used to determine empty wells, format: {field_name: default_val}
  isDisableAddDeleteWell: function (flag, emptyDefaultWell) {
    if (flag) {
      let emptyWellWithDefaultVal = $.extend(true, {}, this.defaultWell);
      if (emptyDefaultWell) {
        for (let field in emptyDefaultWell) {
          if (emptyDefaultWell.hasOwnProperty(field)) {
            if (field in emptyWellWithDefaultVal) {
              emptyWellWithDefaultVal[field] = emptyDefaultWell[field];
            } else {
              console.log("No field for key: " + key + ", please contact support");
            }
          }
        }
      }
      this.disableAddDeleteWell = true;
      this.addressAllowToEdit = this.getWellSetAddressWithData();
      // configure undo redo action
      this.actionPointer = 0;
      this.undoRedoArray = [this.createState()];
      this.emptyWellWithDefaultVal = emptyWellWithDefaultVal;
    } else {
      this.disableAddDeleteWell = false;
      this.emptyWellWithDefaultVal = null;
    }
    this.readOnlyHandler();
  },
  selectObjectInBottomTab: function () {
    let colors = [];
    let selectedIndices = this.selectedIndices;
    for (let i = 0; i < selectedIndices.length; i++) {
      let index = selectedIndices[i];
      let well = this.engine.derivative[index];
      if (well) {
        let color = this.engine.colorMap.get(index);
        if (colors.indexOf(color) < 0) {
          colors.push(color);
        }
      }
    }
    let trs = document.querySelectorAll('table.plate-setup-bottom-table tr');
    for (let i = 1; i < trs.length; i++) {
      // start at 1 to skip the table headers
      let tr = trs[i];
      let td = tr.children[0];
      let isSelected = colors.indexOf(Number(td.querySelector('button').innerHTML)) >= 0;
      tr.classList.toggle("selected", isSelected);
    }
  },
  getSelectedIndices: function () {
    return this.selectedIndices.slice();
  },
  getSelectedAddresses: function () {
    return this.selectedIndices.map(function (index) {
      return this.allTiles[index].address;
    }, this);
  },
  setSelectedAddresses: function (addresses, noUndoRedo) {
    let indices = this.sanitizeAddresses(addresses);
    this.setSelectedIndices(indices, noUndoRedo);
  },
  setSelectedIndices: function (indices, noUndoRedo) {
    if (!indices || indices.length === 0) {
      indices = [0];
    }
    // Indices should be sanitized
    this.setSelection(indices);
    //this._colorMixer();
    this.decideSelectedFields();
    this._trigger("selectedWells", null, {
      selectedAddress: this.getSelectedAddresses()
    });
    this.selectObjectInBottomTab();
    if (!noUndoRedo) {
      this.addToUndoRedo();
    }
  }
});
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.preset = function () {
    // All the preset action goes here
    return {
      presets: [],
      _placePresetTabs: function () {
        let presets = this.options.attributes.presets;
        if (presets && presets.length) {
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container").text("Checkbox presets");
          this.tabContainer.append(this.wellAttrContainer);
          this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
          this.tabContainer.append(this.presetTabContainer);
          for (let i = 0; i < presets.length; i++) {
            let preset = presets[i];
            let divText = this._createElement("<div></div>").addClass("plate-setup-preset-tab-div").text(preset.title);
            let presetButton = this._createElement("<div></div>").addClass("plate-setup-preset-tab").data("preset", preset.fields).append(divText);
            this.presetTabContainer.append(presetButton);
            let that = this;
            presetButton.click(function () {
              let preset = $(this);
              that._selectPreset(preset);
            });
            this.presets.push(presetButton);
          }
        }
      },
      _clearPresetSelection: function () {
        for (let j = 0; j < this.presets.length; j++) {
          let p = this.presets[j];
          p.removeClass("plate-setup-preset-tab-selected").addClass("plate-setup-preset-tab");
        }
      },
      _selectPreset: function (preset) {
        this.setCheckboxes(preset.data("preset"));
        preset.removeClass("plate-setup-preset-tab").addClass("plate-setup-preset-tab-selected");
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function (SVG) {
  plateMapWidget.svgCreate = function () {
    //
    return {
      baseSizes: {
        spacing: 48,
        tile_radius: 22,
        center_radius_complete: 10,
        center_radius_incomplete: 14,
        label_size: 14,
        label_spacing: 24,
        text_size: 13,
        stroke: 0.5,
        gap: 2
      },
      allTiles: [],
      _createSvg: function () {
        this.svg = new SVG(this.canvasContainer[0]);
        this.svg.attr('preserveAspectRatio', 'xMidYMin meet');
        let ls = this.baseSizes.label_spacing;
        this.svg.viewbox(-ls, -ls, ls + this.dimensions.cols * this.baseSizes.spacing, ls + this.dimensions.rows * this.baseSizes.spacing);
        this.wellShadow = this.svg.gradient('radial', function (stop) {
          stop.at(0.8, 'rgba(0,0,0,0.1)');
          stop.at(1, 'rgba(0,0,0,0.2)');
        }).from("50%", "50%").to("50%", "55%").radius("50%").attr('id', 'wellShadow');
        this.wellColors = this.colorPairs.map(function (pair, i) {
          return this.svg.gradient('linear', function (stop) {
            stop.at(0, pair[0]);
            stop.at(1, pair[1]);
          }).from(0, 0).to(0, 1).id('wellColor' + i.toString());
        }, this);
        this._fixRowAndColumn();
        this._putCircles();
        this._svgEvents();
      },
      _fixRowAndColumn: function () {
        let cols = this.dimensions.cols;
        let rows = this.dimensions.rows;
        let rh = this.svg.nested().attr({
          'x': -this.baseSizes.label_spacing / 2.0
        }).addClass('rowHead');
        let ch = this.svg.nested().attr({
          'y': -this.baseSizes.label_spacing / 2.0
        }).addClass('colHead');
        for (let i = 0; i < rows; i++) {
          rh.plain(this._rowKey(i)).attr({
            y: this.baseSizes.spacing * (i + 0.5)
          });
        }
        for (let i = 0; i < cols; i++) {
          ch.plain(this._colKey(i)).attr({
            x: this.baseSizes.spacing * (i + 0.5)
          });
        }
      },
      _putCircles: function () {
        let cols = this.dimensions.cols;
        let rows = this.dimensions.rows;
        this.allTiles = Array(cols * rows);
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            let tile = this._createTile(row, col);
            this.allTiles[tile.index] = tile;
          }
        }
      },
      _createTile: function (r, c) {
        let g = this.svg.nested().move(this.baseSizes.spacing * c, this.baseSizes.spacing * r).addClass('tile');
        let m = this.baseSizes.spacing / 2.0;
        let d = {
          "tile": g
        };
        d.r = r;
        d.c = c;
        d.index = this.locToIndex(d);
        d.address = this.locToAddress(d);
        g.rect(this.baseSizes.spacing, this.baseSizes.spacing).addClass('highlight');
        g.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('well').fill(this.wellShadow);
        let tf = g.group().addClass('fill');
        d["circle"] = tf.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('circle').fill(this.wellColors[0]);
        tf.circle(this.baseSizes.center_radius_complete * 2).center(m, m).addClass('center');
        tf.circle(this.baseSizes.center_radius_incomplete * 2).center(m, m).addClass('center_incomplete');
        d["label"] = tf.plain("0").attr({
          x: m,
          y: m
        }).addClass('label');
        return d;
      },
      setTileComplete: function (tile, complete) {
        if (complete) {
          tile.tile.removeClass('incomplete');
        } else {
          tile.tile.addClass('incomplete');
        }
      },
      setTileVisible: function (tile, visible) {
        if (visible) {
          tile.tile.removeClass('empty');
        } else {
          tile.tile.addClass('empty');
        }
      },
      setTileColor: function (tile, color) {
        this.setTileVisible(tile, true);
        tile.colorIndex = parseInt(color);
        tile.label.plain(String(tile.colorIndex));
        if (color > 0) {
          color = (color - 1) % (this.wellColors.length - 1) + 1;
        }
        tile.circle.fill(this.wellColors[color]);
      }
    };
  };
})(SVG);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.svgEvents = function () {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      selectedIndices: [],
      _svgEvents: function () {
        // Set up event handling.
        let that = this;
        function getMousePosition(evt) {
          let CTM = that.svg.node.getScreenCTM();
          return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
          };
        }
        function dimCoord(v, max) {
          max = max - 1;
          if (v < 0) {
            return 0;
          } else if (v >= max) {
            return max;
          } else {
            return Math.trunc(v);
          }
        }
        function posToLoc(pos) {
          let s = that.baseSizes.spacing;
          let c = dimCoord(pos.x / s, that.dimensions.cols);
          let r = dimCoord(pos.y / s, that.dimensions.rows);
          return {
            r: r,
            c: c
          };
        }
        function selectionBoxPosition(pos0, pos1) {
          let d0 = posToLoc(pos0);
          let d1 = posToLoc(pos1);
          let s = that.baseSizes.spacing;
          let x0 = Math.min(d0.c, d1.c) * s;
          let y0 = Math.min(d0.r, d1.r) * s;
          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }
          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }
          let x1 = (Math.max(d0.c, d1.c) + 1) * s;
          let y1 = (Math.max(d0.r, d1.r) + 1) * s;
          return {
            x: x0,
            y: y0,
            width: x1 - x0,
            height: y1 - y0
          };
        }
        function selectTiles(pos0, pos1, secondary) {
          let d0 = posToLoc(pos0);
          let d1 = posToLoc(pos1);
          let extending = true;
          if (secondary) {
            // if d0 is already selected, we are deselecting
            let startIdx = that.locToIndex(d0);
            extending = that.selectedIndices.indexOf(startIdx) < 0;
          }
          let c0 = Math.min(d0.c, d1.c);
          let r0 = Math.min(d0.r, d1.r);
          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }
          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }
          let c1 = Math.max(d0.c, d1.c);
          let r1 = Math.max(d0.r, d1.r);
          let indices = [];
          for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
              let index = that.locToIndex({
                'r': r,
                'c': c
              });
              indices.push(index);
            }
          }
          if (secondary) {
            if (extending) {
              that.selectedIndices.forEach(function (index) {
                if (indices.indexOf(index) < 0) {
                  indices.push(index);
                }
              });
            } else {
              indices = that.selectedIndices.filter(index => indices.indexOf(index) < 0);
            }
          }

          // Numeric comparator: the default sort compares as strings (10 < 2)
          that.setSelectedIndices(indices.sort((a, b) => a - b));
        }
        let selectionBox;
        function startDrag(evt) {
          if (selectionBox) {
            selectionBox.remove();
          }
          let pos = getMousePosition(evt);
          let attrs = selectionBoxPosition(pos, pos);
          selectionBox = that.svg.rect().attr(attrs).fill('rgba(0, 0, 1, 0.2)');
          selectionBox.data('origin', pos);
        }
        function drag(evt) {
          if (selectionBox) {
            let pos = getMousePosition(evt);
            let attrs = selectionBoxPosition(selectionBox.data('origin'), pos);
            selectionBox.attr(attrs);
          }
        }
        function endDrag(evt) {
          if (selectionBox) {
            let startPos = selectionBox.data('origin');
            let pos = getMousePosition(evt);
            selectTiles(startPos, pos, evt.shiftKey);
            selectionBox.remove();
            selectionBox = null;
          }
        }
        this.svg.node.addEventListener('mousedown', startDrag);
        this.svg.node.addEventListener('mousemove', drag);
        this.svg.node.addEventListener('mouseleave', endDrag);
        this.svg.node.addEventListener('mouseup', endDrag);
        $(that.target).on("loadPlate", function (evt, data) {
          // This method should be compatible to redo/undo.
          that.loadPlate(JSON.parse(data));
        });
      },
      setSelection: function (selectedIndices) {
        this.selectedIndices = selectedIndices;
        this._setSelectedTiles();
        document.activeElement.blur();
      },
      _setSelectedTiles: function () {
        // Update selected tile display only
        let selectedIndices = this.selectedIndices;
        this.allTiles.forEach(function (tile) {
          let selected = selectedIndices.indexOf(tile.index) >= 0;
          if (selected) {
            tile.tile.addClass('selected');
          } else {
            tile.tile.removeClass('selected');
          }
        });
      },
      _getSelectedWells: function () {
        return this.selectedIndices.map(function (index) {
          let well = this.engine.derivative[index];
          if (!well) {
            well = this.defaultWell;
          }
          return well;
        }, this);
      },
      containsObject: function (obj, list) {
        function deepEqual(x, y) {
          if (x === y) {
            return true;
          } else if (typeof x == "object" && x != null && typeof y == "object" && y != null) {
            if (Object.keys(x).length !== Object.keys(y).length) {
              return false;
            }
            for (let prop in x) {
              if (x.hasOwnProperty(prop)) {
                if (y.hasOwnProperty(prop)) {
                  if (!deepEqual(x[prop], y[prop])) {
                    return false;
                  }
                } else {
                  return false;
                }
              }
            }
            return true;
          } else {
            return false;
          }
        }
        if (list) {
          for (let i = 0; i < list.length; i++) {
            if (deepEqual(obj, list[i])) {
              return true;
            }
          }
        }
        return false;
      },
      _buildCommonData: function (commonData, obj, field) {
        let commonVal = commonData[field];
        if (commonVal === undefined) {
          commonVal = null;
        }
        let objVal = obj[field];
        if (objVal === undefined) {
          objVal = null;
        }
        if (Array.isArray(commonVal)) {
          let commonArr = [];
          if (!objVal) {
            commonData[field] = commonArr;
            return;
          }
          for (let i = 0; i < commonVal.length; i++) {
            let v = commonVal[i];
            // for multiplex field
            if (v && typeof v === "object") {
              for (let j = 0; j < objVal.length; j++) {
                let v2 = objVal[j];
                if (v[field] == v2[field]) {
                  v = $.extend(true, {}, v);
                  for (let oField in v) {
                    this._buildCommonData(v, v2, oField);
                  }
                  commonArr.push(v);
                }
              }
              // if (this.containsObject(v, objVal)) {
              //   commonArr.push(v);
              // }
            } else {
              if ($.inArray(v, objVal) >= 0) {
                commonArr.push(v);
              }
            }
          }
          commonData[field] = commonArr;
        } else {
          if (objVal && typeof objVal === "object" && commonVal && typeof commonVal === "object") {
            if (objVal.value !== commonVal.value || objVal.unit !== commonVal.unit) {
              delete commonData[field];
            }
          } else if (commonVal !== objVal) {
            delete commonData[field];
          }
        }
      },
      _getCommonData: function (wells) {
        let commonData = null;
        for (let i = 0; i < wells.length; i++) {
          let well = wells[i];
          if (well == null) {
            continue;
          }
          if (commonData == null) {
            commonData = $.extend(true, {}, wells[0]);
            continue;
          }
          for (let field in commonData) {
            if (!commonData.hasOwnProperty(field)) {
              continue;
            }
            this._buildCommonData(commonData, well, field);
          }
        }
        return commonData || this.defaultWell;
      },
      _getCommonWell: function (wells) {
        let commonData = this._getCommonData(wells);
        return this.sanitizeWell(commonData);
      },
      _getAllMultipleVal: function (wells) {
        let multipleFieldList = this.multipleFieldList;
        let that = this;
        multipleFieldList.forEach(function (multiplexField) {
          if (wells.length) {
            let curMultipleVal = {};
            let multiData = null;
            wells.forEach(function (well) {
              if (well == null) {
                return;
              }
              let id = multiplexField.id;
              let wellFieldVals = well[id];
              if (wellFieldVals && wellFieldVals.length) {
                wellFieldVals.forEach(function (multipleVal) {
                  if (typeof multipleVal === 'object') {
                    if (multiData == null) {
                      multiData = $.extend(true, {}, multipleVal);
                    } else {
                      for (let oField in multiData) {
                        that._buildCommonData(multiData, multipleVal, oField);
                      }
                    }
                    if (multipleVal[id] in curMultipleVal) {
                      curMultipleVal[multipleVal[id]]++;
                    } else {
                      curMultipleVal[multipleVal[id]] = 1;
                    }
                  } else {
                    if (multipleVal in curMultipleVal) {
                      curMultipleVal[multipleVal]++;
                    } else {
                      curMultipleVal[multipleVal] = 1;
                    }
                  }
                });
              }
            });
            multiplexField.allSelectedMultipleData = multiData || {};
            multiplexField.allSelectedMultipleVal = curMultipleVal;
          } else {
            multiplexField.allSelectedMultipleData = null;
            multiplexField.allSelectedMultipleVal = null;
          }
        });
      },
      decideSelectedFields: function () {
        let wells = this._getSelectedWells();
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        let well = this._getCommonWell(wells);
        this._addDataToTabFields(well);
      },
      // get all wells that have data
      getWellSetAddressWithData: function () {
        // Numeric sort and arrow map, as in load-plate.js's sanitizeAddresses
        let indices = Object.keys(this.engine.derivative).map(Number).sort((a, b) => a - b);
        return indices.map(index => this.indexToAddress(index));
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.tabs = function () {
    // Tabs create and manage tabs at the right side of widget.
    return {
      allTabs: [],
      defaultWell: {},
      allDataTabs: [],
      // To hold all the tab contents. this contains all the tabs and its elements and elements
      // Settings as a whole. its very useful, when we have units for a specific field.
      // it goes like tabs-> individual field-> units and checkbox

      _createTabAtRight: function () {
        this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
        $(this.topRight).append(this.tabContainer);
      },
      _createTabs: function () {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);
        let tabData = this.options.attributes.tabs;
        let that = this;
        tabData.forEach(function (tab, tabIndex) {
          that.allTabs[tabIndex] = that._createElement("<div></div>").addClass("plate-setup-tab");
          $(that.allTabs[tabIndex]).data("index", tabIndex).text(tab.name);
          $(that.allTabs[tabIndex]).click(function () {
            that._tabClickHandler(this);
          });
          $(that.tabHead).append(that.allTabs[tabIndex]);
        });
        this.tabDataContainer = this._createElement("<div></div>").addClass("plate-setup-tab-data-container");
        $(this.tabContainer).append(this.tabDataContainer);
        this._addDataTabs(tabData);
        $(this.allTabs[0]).click();
        this._addTabData();
      },
      _tabClickHandler: function (clickedTab) {
        if (this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected").addClass("plate-setup-tab");
          let previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
          this.readOnlyHandler();
        }
        $(clickedTab).addClass("plate-setup-tab-selected");
        this.selectedTab = clickedTab;
        let clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },
      _addDataTabs: function (tabs) {
        this.allDataTabs = tabs.map(function () {
          return this._createElement("<div></div>").addClass("plate-setup-data-div").css("z-index", 0);
        }, this);
        $(this.tabDataContainer).append(this.allDataTabs);
      }
    };
  };
})(jQuery);
var plateMapWidget = plateMapWidget || {};
(function ($) {
  plateMapWidget.undoRedoManager = function () {
    return {
      undoRedoArray: [],
      actionPointer: null,
      addToUndoRedo: function () {
        let state = this.createState();
        if (this.actionPointer != null) {
          let i = this.actionPointer + 1;
          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }
        this.actionPointer = null;
        this.undoRedoArray.push(state);
      },
      _configureUndoRedoArray: function () {
        let data = {
          checkboxes: [],
          derivative: {},
          selectedIndices: [0]
        };
        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },
      clearHistory: function () {
        this.undoRedoArray = this.undoRedoArray.slice(-1);
        this.actionPointer = null;
      },
      undo: function () {
        console.log("undo");
        return this.shiftUndoRedo(-1);
      },
      redo: function () {
        console.log("redo");
        return this.shiftUndoRedo(1);
      },
      shiftUndoRedo: function (pointerDiff) {
        let pointer = this.actionPointer;
        if (pointer == null) {
          pointer = this.undoRedoArray.length - 1;
        }
        pointer += pointerDiff;
        return this.setUndoRedo(pointer);
      },
      setUndoRedo: function (pointer) {
        if (pointer < 0) {
          return false;
        }
        if (pointer >= this.undoRedoArray.length) {
          return false;
        }
        this.actionPointer = pointer;
        this.setData(this.undoRedoArray[pointer], true);
        return true;
      }
    };
  };
})(jQuery);