var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataOnChange = function() {
    // This object is invoked when something in the tab fields change
    return {

      _addAllData: function(data) {
        // Method to add data when something changes in the tabs. Its going to be tricky , just starting.
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          var wells = [];
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex];
            var well;
            if (tile.index in this.engine.derivative) {
              well = this.engine.derivative[tile.index];
            } else {
              well = $.extend(true, {}, this.defaultWell);
              this.engine.derivative[tile.index] = well;
            }
            var processedData = this.processWellData(data, well, noOfSelectedObjects, wells);
            wells = processedData.wells;
            well = processedData.well;
            var empty = this.engine.wellEmpty(well);
            if (empty) {
              if (this.emptyWellWithDefaultVal && this.disableAddDeleteWell) {
                var wellCopy = JSON.parse(JSON.stringify(well));
                var defaultValue = this.emptyWellWithDefaultVal;
                for (var key in defaultValue) {
                  if (key in wellCopy) {
                    wellCopy[key] = defaultValue[key];
                    this._applyFieldData(key, defaultValue[key]);
                  }
                }
                this.engine.derivative[tile.index] = wellCopy;
              } else {
                delete this.engine.derivative[tile.index];
              }
            }
          }
        }
        // update multiplex remove all field
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode
        this._colorMixer();
        this.derivativeChange();
      },

      processWellData: function(newData, curWell, noOfSelectedObjects, wellList) {

        if (!wellList) {
          wellList = [];
        }
        for (var id in newData) {
          var v;
          if (newData[id] !== undefined && newData[id] !== null) {
            if (newData[id].multi) {
              var curData = newData[id];
              var preData = curWell[id];
              var newDt = this._getMultiData(preData, curData, id, noOfSelectedObjects);
              // need to replace newData
              v = JSON.parse(JSON.stringify(newDt));
            } else {
              v = JSON.parse(JSON.stringify(newData[id]));
            }
          } else {
            v = JSON.parse(JSON.stringify(newData[id]));
          }
          curWell[id] = v;
          wellList.push(curWell);
        }

        return {
          well: curWell,
          wells: wellList
        }
      },

      _getMultiData: function(preData, curData, fieldId, noOfSelectedObjects) {
        var addNew = curData.added;
        var removed = curData.removed;
        if (addNew) {
          if (preData) {
            if (addNew.value) {
              var add = true;
              for (var listIdx in preData) {
                var multiplexData = preData[listIdx];
                // for cases when the add new data exist in well
                if (multiplexData[fieldId].toString() === addNew.id.toString()) {
                  add = false;
                  // update subfield value
                  preData = preData.map(function(val) {
                    if (val[fieldId].toString() === addNew.id.toString()) {
                      for (var subFieldId in val) {
                        // over write previous data if only one well is selected
                        if (subFieldId in addNew.value && subFieldId !== fieldId) {
                          if (noOfSelectedObjects === 1) {
                            val[subFieldId] = addNew.value[subFieldId];
                          } else if (addNew.value[subFieldId]) {
                            val[subFieldId] = addNew.value[subFieldId];
                          }
                        }
                      }
                    }
                    return val;
                  })
                }
              }
              if (add) {
                preData.push(addNew.value);
              }
            } else if (preData.indexOf(addNew) < 0) {
              preData.push(addNew);
            }
          } else {
            preData = [];
            if (addNew.value) {
              preData.push(addNew.value);
            } else if (addNew) {
              preData.push(addNew);
            }
          }
        }

        var removeListIndex = function(preData, removeIndex) {
          var newPreData = [];
          for (var idx in preData) {
            if (parseInt(idx) !== parseInt(removeIndex)) {
              newPreData.push(preData[idx]);
            }
          }
          return newPreData;
        };

        if (removed) {
          var removeIndex;
          // for multiplex field
          if (removed.value) {
            for (var listIdx in preData) {
              var multiplexData = preData[listIdx];
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
        if (preData && (preData.length == 0)) {
          preData = null;
        }
        return preData
      },

      _colorMixer: function() {
        if (!this.undoRedoActive) {
          var data = this.createObject();
          this.addToUndoRedo(data);
        }
        this.engine.searchAndStack();
        this.engine.applyColors();
        this.mainFabricCanvas.renderAll();
      },

      derivativeChange: function() {
        this._trigger("updateWells", null, this.createObject());
      },

      createObject: function() {
        var derivative = $.extend(true, {}, this.engine.derivative);
        var checkboxes = this.globalSelectedAttributes.slice();
        var selectedAreas = this.selectedAreas.slice();
        var focalWell = this.focalWell;

        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selectedAreas,
          "focalWell": focalWell,
          "requiredField": this.requiredField
        };
      }
    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addDataToFields = function() {

    return {

      _addDataToTabFields: function(values) {
        // Configure how data is added to tab fields
        for (var id in values) {
          this._applyFieldData(id, values[id]);
        }
      },

      _applyFieldData: function(id, v) {
        this.fieldMap[id].setValue(v);
      }
    }
  }
})(jQuery, fabric)
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
        tabData.forEach(function(tab, tabPointer) {
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
              }
              ;
            }

            that.allDataTabs[tabPointer]["fields"] = fieldArray;
          } else {
            console.log("unknown format in field initialization");
          }
        });
        that.multipleFieldList = multiplexFieldArray;
      },

      _makeSubField: function(data, tabPointer, fieldArray) {
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

      _makeRegularField: function(data, tabPointer, fieldArray, checkbox) {
        var that = this;
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

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

        field.onChange = function() {
          var v = field.getValue();
          var data = {};
          data[field.id] = v;
          that._addAllData(data);
        };
        return field;
      },

      _makeMultiplexField: function(data, tabPointer, fieldArray) {
        var that = this;
        var wrapperDiv = that._createElement("<div></div>").addClass("plate-setup-tab-default-field");
        var wrapperDivLeftSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-left-side");
        var wrapperDivRightSide = that._createElement("<div></div>").addClass("plate-setup-tab-field-right-side ");
        var nameContainer = that._createElement("<div></div>").addClass("plate-setup-tab-name").text(data.name);
        var fieldContainer = that._createElement("<div></div>").addClass("plate-setup-tab-field-container");

        wrapperDivRightSide.append(nameContainer);
        wrapperDivRightSide.append(fieldContainer);
        wrapperDiv.append(wrapperDivLeftSide);
        wrapperDiv.append(wrapperDivRightSide);
        that.allDataTabs[tabPointer].append(wrapperDiv);

        var field = {
          id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };

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
        if (field.required || requiredSubField.length) {
          this.requiredField.push({
            multiplexId: field.id,
            subFields: requiredSubField
          });
        }

        field.subFieldList = subFieldList;
        that._createField(field);
        that._addCheckBox(field);

        subFieldList.forEach(function(subfield) {
          subfield.mainMultiplexField = field;
          fieldArray.push(subfield);
          that._createField(subfield);
          that._addCheckBox(subfield);
          delete that.defaultWell[subfield.id];
          // overwrite subField setvalue
          subfield.onChange = function() {
            var v = subfield.getValue();
            var mainRefField = subfield.mainMultiplexField;
            var curId = mainRefField.singleSelectValue();
            //var curDataLs = mainRefField.detailData;
            var curVal = {};
            curVal[mainRefField.id] = curId;
            //append subfields
            curVal[subfield.id] = v;
            var returnVal = {
              id: curId,
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);
            var curDataLs = mainRefField.detailData;
            if (curDataLs !== null) {
              curId = mainRefField.singleSelectValue();
              curDataLs = curDataLs.map(function(curData) {
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

})(jQuery, fabric);

var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.addWarningMsg = function() {
    // For those check boxes associated with every field in the tab
    return {
      fieldWarningMsg: function(field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.id;
        var img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        //field.root.find(".plate-setup-tab-name").append('<img id="theImg" src="theImg.png" />')
        if (include) {
          if (field.root.find("#" + imgId).length <= 0) {
            field.root.find(".plate-setup-tab-name").text(" " + field.name);
            field.root.find(".plate-setup-tab-name").prepend(img);

            var popText = $("<div/>").addClass("pop-out-text");
            popText.text(text);
            field.root.find(".plate-setup-tab-name").append(popText);

            $("#" + imgId).hover(function(e) {
              popText[0].style.display = 'flex';
            }, function() {
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

      removeWarningMsg: function(field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.id;
        var img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
        //field.root.find(".plate-setup-tab-name").append('<img id="theImg" src="theImg.png" />')
        if (include) {
          field.root.find(".plate-setup-tab-name").append(img);

          var popText = $("<div/>").addClass("pop-out-text");
          popText.text(text);
          field.root.find(".plate-setup-tab-name").append(popText);

          $("#" + imgId).hover(function(e) {
            popText[0].style.display = 'inline-block';
          }, function() {
            popText.hide();
          });

        } else {
          $("#" + imgId).remove();
          if (field.root.find("#" + imgId).length > 0) {
            //field.root.find(".plate-setup-tab-name").remove(img);
            $("#" + imgId).remove();
          }
        }
      },

      applyFieldWarning: function(wells) {
        var that = this;
        var req = 0;
        var fill = 0;
        var fieldData = {};
        that.fieldList.forEach(function(field) {
          fieldData[field.id] = [];
        });
        wells.forEach(function(well) {
          if (!that.engine.wellEmpty(well)) {
            for (var fieldId in fieldData) {
              if (fieldId in well) {
                fieldData[fieldId].push(well[fieldId]);
              } else {
                fieldData[fieldId].push(null);
              }
            }
          }
        });
        for (var i = 0; i < that.fieldList.length; i++) {
          var field = that.fieldList[i];
          if (field.applyMultiplexSubFieldColor) {
            field.applyMultiplexSubFieldColor(fieldData[field.id]);
          } else {
            if (field.required) {
              var include = false;
              fieldData[field.id].forEach(function(val) {
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
    }
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.bottomTable = function() {
    // for bottom table
    return {
      _bottomScreen: function() {
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

      addBottomTableHeadings: function() {

        var row = this._createElement("<tr></tr>");

        var singleField = this._createElement("<th></th>")
          .text("Group");
        row.prepend(singleField);

        this.rowCounter = 1;

        for (var i = 0; i < this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i];
          var field = this.fieldMap[attr];
          var singleField = this._createElement("<th></th>").text(field.name);
          row.append(singleField);
          this.rowCounter = this.rowCounter + 1;
        }

        // Now we append all the captions at the place.
        this.bottomTableBody.empty();
        this.bottomTableHead.empty();
        this.bottomTableHead.append(row);
        this.adjustFieldWidth(this.bottomRow);
      },

      tileAttrText: function(tile, attr) {
        var well = this.engine.derivative[tile.index];
        var field = this.fieldMap[attr];
        return field.getText(well[attr]);
      },

      addBottomTableRow: function(color, singleStack) {
        var that = this;
        var modelTile = this.allTiles[singleStack[0]];
        var row = this._createElement("<tr></tr>");
        var plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");
        var numberText = this._createElement("<button/>");
        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);

        numberText.click(function(evt) {
          var addressToSelect = singleStack.map(function(addressIdx) {
            return that.indexToAddress(addressIdx)
          });
          if (evt.ctrlKey) {
            that.getSelectedAddress().forEach(function(val) {
              if (addressToSelect.indexOf(val) < 0) {
                addressToSelect.push(val);
              }
            })
          }
          that.setSelectedWell(addressToSelect);
          that._trigger("selectedWells", null, {selectedAddress: that.getSelectedAddress()});
        });

        if (color > 0) {
          color = ((color - 1) % (this.colorPairs.length - 1)) + 1;
        }
        var colorStops = this.colorPairs[color];

        plateIdDiv.css("background", "linear-gradient(to right, " + colorStops[0] + " , " + colorStops[1] + ")");

        row.append(plateIdDiv);

        for (var i = 0; i < this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i];
          var text = this.tileAttrText(modelTile, attr);
          var dataDiv = this._createElement("<td></td>").text(text);
          row.append(dataDiv);
        }
        this.bottomTableBody.append(row);
        this.adjustFieldWidth(row);
      },

      bottomForFirstTime: function() {
        this.addBottomTableHeadings();
        // This is executed for the very first time.. !
        var row = this._createElement("<tr></tr>");

        var colorStops = this.colorPairs[0];
        var plateIdDiv = this._createElement("<td></td>");
        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTableBody.append(row);
        this.createExportButton();
      },

      adjustFieldWidth: function(row) {

        var length = this.rowCounter;
        if ((length) * 150 > 1024) {
          row.css("width", (length) * 152 + "px");
        }
      },

      downloadCSV: function(csv, filename) {
        var csvFile;
        var downloadLink;

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

      exportData: function(format) {
        var data = [];
        var rows = document.querySelectorAll("table tr");

        var colorLocMap = {};
        var colorLocIdxMap = this.engine.stackUpWithColor;
        var dim = this.getDimensions();
        var that = this;
        for (var colorIdx in colorLocIdxMap) {
          colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(function(locIdx) {
            return that.indexToAddress(locIdx, dim);
          })
        }

        for (var i = 0; i < rows.length; i++) {
          var row = [],
            cols = rows[i].querySelectorAll("td, th");

          for (var j = 0; j < cols.length; j++) {
            var v = "";
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
              } else if (format === 'clipboard') {
                row.push("Location");
              }

            }
            if (i !== 0 && j === 0) {
              var loc = '';
              if (colorLocMap[parseInt(cols[j].innerText)]) {
                if (format === "csv") {
                  loc = '"' + colorLocMap[parseInt(cols[j].innerText)].join(",") + '"';
                } else if (format === 'clipboard') {
                  loc = colorLocMap[parseInt(cols[j].innerText)].join(",");
                }
              }
              row.push(loc);
            }
          }

          if (format === "csv") {
            data.push(row.join(","));
          } else if (format === 'clipboard') {
            data.push(row.join("\t"));
            //data.push(row);   // for text type
          }

        }
        if (format === "csv") {
          // Download CSV file
          this.downloadCSV(data.join("\n"), 'table.csv');
        } else if (format === 'clipboard') {
          //return formatTableToString(data);   // for text type
          return data.join("\n");
        }
      },

      createExportButton: function() {
        var that = this;
        var overlayContainer = $("<div>").addClass("plate-setup-bottom-control-container");

        var descriptionDiv = $("<div>").addClass("plate-setup-overlay-text-container");
        descriptionDiv.text("Color groups");
        overlayContainer.append(descriptionDiv);

        var buttonContainer = $("<div>").addClass("plate-setup-overlay-bottom-button-container");

        // create export csv option
        var exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);

        exportButton.click(function() {
          that.exportData('csv');
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
        var clipboardButton = $("<button/>").addClass("plate-setup-button");
        clipboardButton.text("Copy To Clipboard");
        buttonContainer.append(clipboardButton);

        var clipboard = new ClipboardJS(clipboardButton.get(0), {
          text: function() {
            return that.exportData("clipboard");
          }
        });

        clipboard.on('success', function(e) {
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

        clipboard.on('error', function(e) {
          clipboardButton.text("Failed to copy table to clipboard: browser may be incompatible");
          setTimeout(resetClipboardText, 3000);
        });

        overlayContainer.append(buttonContainer);
        this.bottomContainer.prepend(overlayContainer);
      }
    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvas = function() {
    //
    return {

      allSelectedObjects: null, // Contains all the selected objets, when click and drag.

      allPreviouslySelectedObjects: null,

      colorPointer: 0,

      goldenRatio: 0.618033988749895,

      _createCanvas: function() {
        this.normalCanvas = this._createElement("<canvas>").attr("id", "DNAcanvas");
        $(this.canvasContainer).append(this.normalCanvas);
      },

      _initiateFabricCanvas: function() {
        var w = this.canvasContainer.width();
        var h = this.canvasContainer.height();

        this._setCanvasArea(w, h);

        this.mainFabricCanvas = new fabric.Canvas('DNAcanvas', {
          backgroundColor: '#f5f5f5',
          selection: false,
          stateful: false,
          hoverCursor: "pointer",
          renderOnAddRemove: false,
        })
          .setWidth(w)
          .setHeight(h);
      },

    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.checkBox = function() {
    // For those check boxes associated with every field in the tab
    return {

      globalSelectedAttributes: [],

      _addCheckBox: function(field) {
        var checkImage = $("<span>").html(this._assets.dontImg).addClass("plate-setup-tab-check-box bg-light")
          .data("clicked", false);
        checkImage.data("linkedFieldId", field.id);
        field.root.find(".plate-setup-tab-field-left-side").empty().append(checkImage);
        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked
        field.checkbox = checkImage;
      },

      _applyCheckboxHandler: function(checkBoxImage) {
        // We add checkbox handler here, thing is it s not checkbox , its an image and we change
        // source
        var that = this;
        checkBoxImage.click(function(evt, machineClick) {
          var checkBox = $(this);

          var changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");

          that.changeCheckboxes(changes);
        });
      },

      changeSubFieldsCheckboxes: function(field, changes) {
        var that = this;
        var subFieldToInclude = [];

        field.subFieldList.forEach(function(subField) {
          var checkImage = subField.checkbox;
          var fieldId = checkImage.data("linkedFieldId");
          var clicked = checkImage.data("clicked");
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

      changeCheckboxes: function(changes) {
        var gsa = [];
        var multiplexCheckedSubField = {};
        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          if (field.checkbox) {
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.changeSubFieldsCheckboxes(field, changes);
            }

            var checkImage = field.checkbox;
            var fieldId = checkImage.data("linkedFieldId");
            var clicked = checkImage.data("clicked");
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
      },

      setSubFieldCheckboxes: function(field, fieldIds) {
        var that = this;
        var subFieldToInclude = [];
        field.subFieldList.forEach(function(subField) {
          var checkImage = subField.checkbox;
          var fieldId = checkImage.data("linkedFieldId");
          var clicked = fieldIds.indexOf(fieldId) >= 0;
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

      setCheckboxes: function(fieldIds) {
        fieldIds = fieldIds || [];
        var gsa = [];
        var multiplexCheckedSubField = {};

        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          if (field.checkbox) {
            // special handling for multiplex field
            if (field.subFieldList) {
              multiplexCheckedSubField[field.id] = this.setSubFieldCheckboxes(field, fieldIds);
            }

            var checkImage = field.checkbox;
            var fieldId = checkImage.data("linkedFieldId");
            var clicked = fieldIds.indexOf(fieldId) >= 0;
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
      }

    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.colorManager = function() {

    return {
      // See these are color pairs for the gradient.
      colorPairs: [
        ["#e6e6e6", "#808080"],
        ["#66e8ff", "#0082c8"],
        ["#ff7fb1", "#e6194b"],
        ["#a2ffb1", "#3cb44b"],
        ["#f784ff", "#911eb4"],
        ["#ffe897", "#f58231"],
        ["#6666ff", "#0000FF"],
        ["#ffff7f", "#ffe119"],
        ["#acffff", "#46f0f0"],
        ["#ff98ff", "#f032e6"],
        ["#ffffa2", "#d2f53c"],
        ["#ffffff", "#fabebe"],
        ["#66e6e6", "#008080"],
        ["#ffffff", "#e6beff"],
        ["#ffd48e", "#aa6e28"],
        ["#e66666", "#800000"],
        ["#ffffff", "#aaffc3"],
        ["#e6e666", "#808000"],
        ["#ffffff", "#ffd8b1"],
        ["#66a9ef", "#004389"],
        ["#ff6672", "#a7000c"],
        ["#66db72", "#00750c"],
        ["#b866db", "#520075"],
        ["#ffa966", "#b64300"],
        ["#ffff66", "#c0a200"],
        ["#6dffff", "#07b1b1"],
        ["#ff66ff", "#b100a7"],
        ["#f9ff66", "#93b600"],
        ["#ffe5e5", "#bb7f7f"],
        ["#66a7a7", "#004141"],
        ["#ffe5ff", "#a77fc0"],
        ["#d19566", "#6b2f00"],
        ["#ffffef", "#c0bb89"],
        ["#d1ffea", "#6bc084"],
        ["#a7a766", "#414100"],
        ["#ffffd8", "#c09972"],
        ["#a5ffff", "#3fc1ff"],
        ["#ffbef0", "#ff588a"],
        ["#e1fff0", "#7bf38a"],
        ["#ffc3ff", "#d05df3"],
        ["#ffffd6", "#ffc170"],
        ["#a5a5ff", "#3f3fff"],
        ["#ffffbe", "#ffff58"],
        ["#ebffff", "#85ffff"],
        ["#ffd7ff", "#ff71ff"],
        ["#a5ffff", "#3fbfbf"],
        ["#ffffcd", "#e9ad67"],
        ["#ffa5a5", "#bf3f3f"],
        ["#ffffa5", "#bfbf3f"]
      ]
    }
  }

})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createCanvasElements = function() {
    // this class manages creating all the elements within canvas
    return {

      scaleFactor: 1,

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

      _setCanvasArea: function(w, h) {
        this.scaleFactor = Math.min(
          h / (this.dimensions.rows * this.baseSizes.spacing + this.baseSizes.label_spacing),
          w / (this.dimensions.cols * this.baseSizes.spacing + this.baseSizes.label_spacing));

        var sizes = {};
        for (var prop in this.baseSizes) {
          sizes[prop] = this.baseSizes[prop] * this.scaleFactor;
        }
        this.sizes = sizes;
      },

      _canvas: function() {
        // Those 1,2,3 s and A,B,C s
        this._fixRowAndColumn();

        // All those circles in the canvas.
        this._putCircles();
      },

      _fixRowAndColumn: function() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var spacing = this.sizes.spacing;
        var d1 = this.sizes.label_spacing / 2;
        var d2 = this.sizes.label_spacing + this.sizes.spacing / 2;
        var fontSize = this.sizes.label_size;

        // For column
        var top = d1;
        var left = d2;
        for (var i = 1; i <= cols; i++) {
          var tempFabricText = new fabric.IText(i.toString(), {
            fill: 'black',
            originX: 'center',
            originY: 'center',
            fontSize: fontSize,
            top: top,
            left: left,
            fontFamily: 'sans-serif',
            selectable: false,
            fontWeight: "400"
          });
          left += spacing;

          this.mainFabricCanvas.add(tempFabricText);
        }

        // for row
        top = d2;
        left = d1;
        for (var i = 1; i <= rows; i++) {
          var tempFabricText = new fabric.IText(this.rowIndex[i - 1], {
            fill: 'black',
            originX: 'center',
            originY: 'center',
            fontSize: fontSize,
            top: top,
            left: left,
            fontFamily: 'sans-serif',
            selectable: false,
            fontWeight: "400"
          });
          top += spacing;

          this.mainFabricCanvas.add(tempFabricText);
        }
      },

      _putCircles: function() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var tileCounter = 0;
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var index = this.allTiles.length;
            var tile = this._createTile(row, col);
            tile.index = tileCounter++;
            this.allTiles.push(tile);
            this.mainFabricCanvas.add(tile.background);
            this.mainFabricCanvas.add(tile.highlight);
            this.mainFabricCanvas.add(tile.circle);
            this.mainFabricCanvas.add(tile.circleCenter);
            this.mainFabricCanvas.add(tile.circleText);
          }
        }

        this._addLargeRectangleOverlay();
        this._fabricEvents();
      },

      _createTile: function(row, col) {
        var tile = {};

        tile.visible = false;
        tile.colorIndex = null;
        tile.row = row;
        tile.col = col;
        tile.address = this.rowIndex[row] + (col + 1);

        var top = (row + 1) * this.sizes.spacing;
        var left = (col + 1) * this.sizes.spacing;

        tile.background = new fabric.Circle({
          top: top,
          left: left,
          radius: this.sizes.tile_radius,
          originX: 'center',
          originY: 'center',
          hasControls: false,
          hasBorders: false,
          lockMovementX: true,
          lockMovementY: true,
          evented: false,
        });

        tile.background.setGradient("fill", {
          type: "radial",
          x1: this.sizes.tile_radius,
          x2: this.sizes.tile_radius,
          y1: this.sizes.tile_radius + this.sizes.gap,
          y2: this.sizes.tile_radius + this.sizes.gap,
          r1: this.sizes.tile_radius - this.sizes.gap,
          r2: this.sizes.tile_radius,
          colorStops: {
            0: 'rgba(0,0,0,0.1)',
            1: 'rgba(0,0,0,0.2)'
          }
        });

        tile.highlight = new fabric.Rect({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          width: this.sizes.spacing,
          height: this.sizes.spacing,
          fill: "rgba(0,0,0,0.4)",
          evented: false,
          visible: false
        });

        tile.circle = new fabric.Circle({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          radius: this.sizes.tile_radius,
          stroke: 'gray',
          strokeWidth: this.sizes.stroke,
          evented: false,
          visible: false
        });

        tile.circleCenter = new fabric.Circle({
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          radius: this.sizes.center_radius_incomplete,
          fill: "white",
          stroke: 'gray',
          strokeWidth: this.sizes.stroke,
          evented: false,
          visible: false
        });

        tile.circleText = new fabric.IText("", {
          originX: 'center',
          originY: 'center',
          top: top,
          left: left,
          fill: 'black',
          fontFamily: 'sans-serif',
          fontSize: this.sizes.text_size,
          lockScalingX: true,
          lockScalingY: true,
          evented: false,
          visible: false
        });

        return tile;
      },

      setTileComplete: function(tile, complete) {
        if (complete) {
          tile.circleCenter.radius = this.sizes.center_radius_complete;
          tile.circleText.fill = "black";
          tile.circleText.fontWeight = 'normal';
        } else {
          tile.circleCenter.radius = this.sizes.center_radius_incomplete;
          tile.circleText.fill = "red";
          tile.circleText.fontWeight = 'bold';
        }
      },

      setTileVisible: function(tile, visible) {
        tile.visible = visible;
        tile.circle.visible = tile.visible;
        tile.circleCenter.visible = tile.visible;
        tile.circleText.visible = tile.visible;
      },

      setTileColor: function(tile, color) {
        this.setTileVisible(tile, true);
        tile.colorIndex = parseInt(color);
        tile.circleText.text = String(tile.colorIndex);

        if (color > 0) {
          color = ((color - 1) % (this.colorPairs.length - 1)) + 1;
        }
        var colorStops = this.colorPairs[color];

        tile.circle.setGradient("fill", {
          y2: 2 * this.sizes.tile_radius,
          colorStops: colorStops
        });
      },

      _addLargeRectangleOverlay: function() {

        this.overLay = new fabric.Rect({
          width: 632,
          height: 482,
          left: 0,
          top: 0,
          opacity: 0.0,
          originX: 'left',
          originY: 'top',
          lockMovementY: true,
          lockMovementX: true,
          selectable: false
        });

        this.mainFabricCanvas.add(this.overLay);
      }
    };
  }
})(jQuery, fabric);

var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createField = function() {
    // It creates those fields in the tab , there is 4 types of them.
    return {

      _createField: function(field) {
        switch (field.data.type) {
          case "text":
            this._createTextField(field);
            break;

          case "numeric":
            this._createNumericField(field);
            break;

          case "select":
            this._createSelectField(field);
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

      _createTextField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<input>").attr("id", id)
          .addClass("plate-setup-tab-input");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        field.parseValue = function(v) {
          if (v) {
            v = String(v);
          } else {
            v = null;
          }
          return v;
        };

        field.getValue = function() {
          var v = input.val().trim();
          if (v == "") {
            v = null;
          }
          return v;
        };

        field.setValue = function(v) {
          input.val(v);
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          return v;
        };

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
        };

        field.parseText = field.parseValue;

        input.on("input", function(e, generated) {
          field.onChange();
        });

        field.input = input;
      },

      _createOpts: function(config) {
        var opts = {
          allowClear: true,
          placeholder: "select",
          minimumResultsForSearch: 10
        };
        var data_specified = false;

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

      _createSelectField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        var opts = that._createOpts(field.data);
        var optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });

        input.select2(opts);

        field.parseValue = function(value) {
          var v = value;

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
            throw "Invalid value " + value + " for select field " + id;
          }
        };

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
        };

        field.getValue = function() {
          return field.parseValue(input.val());
        };

        field.setValue = function(v) {
          input.val(v);
          input.trigger("change.select2")
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          return optMap[String(v)].text;
        };

        field.parseText = function(value) {
          var v = value;

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
            throw "Invalid text value " + value + " for select field " + id;
          }
        };

        input.on("change", function(e, generated) {
          field.onChange();
        });


        input.on('select2:unselect', function (evt) {
            // Prevent select2 v4.0.6rc1 opening dropdown on unselect
            input.one('select2:opening', function(e) { e.preventDefault(); });
        });

        field.input = input;
      },

      _createMultiSelectField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        var opts = that._createOpts(field.data);
        opts.multiple = true;
        var optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);

        field.disabled = function(bool) {
          input.prop("disabled", bool);
        };

        field._parseOne = function(val) {
          val = String(val);
          if (val in optMap) {
            return optMap[val].id;
          } else {
            throw "Invalid value " + val + " for multiselect field " + id;
          }
        };

        field._parseMany = function(vals) {
          if (vals && vals.length) {
            vals = vals.map(field._parseOne);
          } else {
            vals = null;
          }
          return vals;
        }

        field.parseValue = function(value) {
          return field._parseMany(value);
        };

        field.getValue = function() {
          return field._parseMany(input.val());
        };

        field.setValue = function(v) {
          v = v || [];
          input.val(v);
          input.trigger("change.select2");
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          if (v.length > 0) {
            return v.map(function(v) {
              return optMap[String(v)].text
            }).join("; ");
          }
          return "";
        };

        field.multiOnChange = function(added, removed) {
          if (added) {
            added = added.id;
          }
          if (removed) {
            removed = removed.id;
          }
          var data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };

          that._addAllData(data);
        };

        field.parseText = function(value) {
          var v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              opt = String(opt);
              if (opt in optMap) {
                return optMap[opt].text;
              } else {
                throw "Invalid text value " + opt + " for multiselect field " + id;
              }
            });
          } else {
            v = null;
          }
          return v;
        };

        input.on("select2:select", function (e) {
          var v = field._parseOne(e.params.data.id)
          v = {id: v};
          field.multiOnChange(v, null);
        });

        input.on("select2:unselect", function (e) {
          var v = field._parseOne(e.params.data.id)
          v = {id: v};
          field.multiOnChange(null, v);
          // Prevent select2 v4.0.6rc1 opening dropdown on unselect
          input.one('select2:opening', function(e) { e.preventDefault(); });
        });

        field.input = input;

        that._createDeleteButton(field);
      },

      _createNumericField: function(field) {
        var id = field.id;
        var data = field.data;
        var that = this;
        var input = this._createElement("<input>").addClass("plate-setup-tab-input")
          .attr("placeholder", data.placeholder || "").attr("id", id);

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        // Adding unit
        var units = data.units || [];
        var defaultUnit = data.defaultUnit || null;
        var unitInput = null;
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
          if (units.length == 1) {
            var unitText = $("<div></div>").addClass("plate-setup-tab-unit");
            unitText.text(defaultUnit);
            field.root.find(".plate-setup-tab-field-container").append(unitText);
          } else {
            unitInput = this._createElement("<select/>").attr("id", id)
              .addClass("plate-setup-tab-label-select-field");

            field.root.find(".plate-setup-tab-field-container").append(unitInput);

            var selected = null;
            var unitData = units.map(function(unit) {
              var o = {
                id: unit,
                text: unit
              };
              if (unit == defaultUnit) {
                selected = unit;
              }
              return o;
            });

            var opts = {
              data: unitData,
              allowClear: false,
              minimumResultsForSearch: 10
            };

            unitInput.select2(opts);
            unitInput.val(selected);
          }
        }

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
          if (unitInput) {
            unitInput.prop("disabled", bool);
          }
        };

        field.setUnitOpts = function(opts) {
          field.units = opts || null;
          field.defaultUnit = null;

          var newUnits = [];
          var selected = null;
          if (field.units && field.units.length) {
            field.defaultUnit = field.units[0];
            newUnits = field.units.map(function(curUnit) {
              var cleanUnit = {
                id: curUnit,
                text: curUnit
              };
              if (curUnit == field.defaultUnit) {
                selected = curUnit;
              }
              return cleanUnit;
            });
          }

          var newOpts = {
            data: newUnits,
            allowClear: false,
            minimumResultsForSearch: 10
          };
          unitInput.select2("destroy");
          unitInput.val(null);
          unitInput.empty();
          unitInput.select2(newOpts);
          unitInput.val(selected);
        };

        field.parseValue = function(value) {
          var v;
          if ($.isPlainObject(value)) {
            if (field.hasUnits) {
              v = field.parseRegularValue(value.value);
              if (v === null) {
                return null;
              }
              return {
                value: v,
                unit: field.parseUnit(value.unit)
              };
            } else {
              throw "Value must be plain numeric for numeric field " + id;
            }
          } else {
            if (field.hasUnits) {
              v = field.parseRegularValue(value);
              if (v === null) {
                return null;
              }
              return {
                value: v,
                unit: field.defaultUnit
              };
            } else {
              return field.parseRegularValue(value);
            }
          }
        };

        field.getValue = function() {
          var v = field.getRegularValue();

          if ((v === null) || isNaN(v)) {
            return null;
          } else if (field.hasUnits) {
            var returnVal = {
              value: v,
              unit: field.getUnit()
            };

            if (field.data.hasMultiplexUnit) {
              // include unitTypeId and UnitId to returnVal
              for (var unitTypeKey in field.data.unitMap) {
                var unitTypeUnits = field.data.unitMap[unitTypeKey];
                unitTypeUnits.forEach(function(unit) {
                  if (unit.text === returnVal.unit) {
                    returnVal['unitTypeId'] = unitTypeKey;
                    returnVal['unitId'] = unit.id;
                  }
                })
              }
            }
            return returnVal;
          } else {
            return v;
          }
        };

        field.setValue = function(value) {
          if (field.hasUnits) {
            if ($.isPlainObject(value)) {
              field.setUnit(value.unit || field.defaultUnit);
              field.setRegularValue(value.value);

            } else {
              field.setRegularValue(value);
              field.setUnit(field.defaultUnit)
            }
          } else {
            field.setRegularValue(value);
          }
        };

        field.parseRegularValue = function(value) {
          if (value == null) {
            return null;
          }
          var v = String(value).trim();
          if (v === "") {
            return null;
          }
          v = Number(value);
          if (isNaN(v)) {
            throw "Invalid value " + value + " for numeric field " + id;
          }
          return v;
        };

        field.getRegularValue = function() {
          var v = input.val().trim();
          if (v == "") {
            v = null;
          } else {
            v = Number(v);
          }
          return v;
        };

        field.setRegularValue = function(value) {
          input.val(value);
        };

        field.parseUnit = function(unit) {
          if (unit == null || unit === "") {
            return field.defaultUnit;
          }
          for (var i = 0; i < units.length; i++) {
            if (unit.toLowerCase() == units[i].toLowerCase()) {
              return units[i];
            }
          }
          throw "Invalid unit " + unit + " for field " + id;
        };

        field.getUnit = function() {
          if (unitInput) {
            return unitInput.val();
          } else {
            return field.defaultUnit;
          }
        };

        field.setUnit = function(unit) {
          if (unitInput) {
            unit = unit || field.defaultUnit;
            unitInput.val(unit);
            unitInput.trigger("change.select2");
          }
        };

        // val now contains unit
        field.getText = function(val) {
          if (typeof (val) === 'object' && val) {
            var v = val.value;
            var u = val.unit;
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

        field.getRegularText = function(v) {
          if (v == null) {
            return "";
          }
          v = v.toString();
          return v;
        };

        field.parseText = function(v) {
          var textVal = field.parseValue(v);
          if (textVal && typeof (textVal) === "object") {
            return textVal.value + textVal.unit;
          } else if (textVal) {
            return textVal
          } else {
            return null;
          }
        };

        input.on("input", function() {
          var v = field.getRegularValue();
          if (isNaN(v)) {
            //flag field as invalid
            input.addClass("invalid");
          } else {
            input.removeClass("invalid");
          }
          field.onChange();
        });
        if (unitInput) {
          unitInput.on("change", function() {
            field.onChange();
          });
        }

        field.input = input;
        field.unitInput = unitInput;
      },

      _createBooleanField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");
        that.defaultWell[id] = null;

        field.root.find(".plate-setup-tab-field-container").append(input);
        var tval = {
          id: "true",
          text: "true"
        };
        var fval = {
          id: "false",
          text: "false"
        };
        var opts = {
          data: [tval, fval],
          placeholder: "select",
          allowClear: true,
          minimumResultsForSearch: -1
        };

        input.select2(opts);

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
        };

        field.parseValue = function(value) {
          if (value == null) {
            return null;
          }
          var v = String(value).trim().toLowerCase();
          if (v === "true") {
            v = true;
          } else if (v === "false") {
            v = false;
          } else if (v === "") {
            v = null;
          } else {
            throw "Invalid value " + value + " for boolean field " + id;
          }
          return v;
        };

        field.getValue = function() {
          var v = input.val();
          switch (v) {
            case "true":
              return true;
            case "false":
              return false;
            default:
              return null;
          }
        };

        field.setValue = function(v) {
          if (v == true || v === "true") {
            v = "true";
          } else if (v == false || v === "false") {
            v = "false";
          } else {
            v = null;
          }
          input.val(v);
          input.trigger("change.select2");
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          return v.toString();
        };

        field.parseText = field.parseValue;

        input.on("change", function(e) {
          field.onChange();
        });


        input.on('select2:unselect', function (evt) {
          // Prevent select2 v4.0.6rc1 opening dropdown on unselect
          input.one('select2:opening', function(e) { e.preventDefault(); });
        });

        field.input = input;
      },

      _createMultiplexField: function(field) {
        var that = this;
        // make correct multiplex data
        this._createMultiSelectField(field);
        // overwrite default well for multiplex field
        that.defaultWell[field.id] = [];

        // single select
        var nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
        var fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
        field.root.find(".plate-setup-tab-field-right-side").append(nameContainer1, fieldContainer1);

        field.singleSelect = this._createElement("<select/>").attr("id", field.id + "SingleSelect")
          .addClass("plate-setup-tab-multiplex-single-select-field");

        field.singleSelect.appendTo(fieldContainer1);

        var multiselectSetValue = field.setValue;

        field.singleSelectValue = function() {
          var v = field.singleSelect.val();
          if (v === "") {
            return null;
          }
          if (v == null) {
            return null;
          }
          return field._parseOne(v)
        };

        var setSingleSelectOptions = function(v, selected_v) {
          var opts = {
            allowClear: false,
            placeholder: "select",
            minimumResultsForSearch: 10,
            data: v || []
          };
          if (!selected_v) {
            if (opts.data.length) {
              selected_v = opts.data[0].id;
            } else {
              selected_v = null;
            }
          }
          if (field.singleSelect.hasClass("select2-hidden-accessible")) {
            field.singleSelect.select2("destroy");
          }
          field.singleSelect.val(null);
          field.singleSelect.empty();
          field.singleSelect.select2(opts);
          field.singleSelect.val(selected_v);
          field.singleSelect.prop("disabled", opts.data.length == 0);
          field.singleSelect.trigger("change.select2");
          field.singleSelect.on("change.select2", singleSelectChange);
        };

        var singleSelectChange = function() {
          var v = field.singleSelectValue();

          field.updateSubFieldUnitOpts(v);

          var curData = field.detailData || [];
          var curSubField = null;
          curData.forEach(function(val) {
            if (val[field.id] === v) {
              curSubField = val;
            }
          });

          if (curSubField) {
            // setvalue for subfield
            field.subFieldList.forEach(function(subField) {
              subField.disabled(false);
              subField.setValue(curSubField[subField.id]);
            });
          } else {
            field.subFieldList.forEach(function(subField) {
              subField.disabled(true);
              subField.setValue(null);
            });
          }
          that.readOnlyHandler();
        };

        setSingleSelectOptions([]);

        field._changeMultiFieldValue = function(added, removed) {
          var newSubFieldValue = {};
          for (var subFieldName in field.data.multiplexFields) {
            var subFieldId = field.data.multiplexFields[subFieldName].id;
            newSubFieldValue[subFieldId] = null;
          }

          var val;
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

          var data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };

        // overwrite multiplex set value
        field.setValue = function(v) {
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          var multiselectValues = null;
          if (v && v.length) {
            multiselectValues = v.map(function(val) {
              return val[field.id]
            });
          }

          multiselectSetValue(multiselectValues);
          var newOptions = field.input.select2('data') || [];
          setSingleSelectOptions(newOptions);
          singleSelectChange();
        };

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
          field.subFieldList.forEach(function(subField) {
            subField.disabled(bool);
          });
          if (bool) {
            nameContainer1.text("Select to inspect");
          } else {
            nameContainer1.text("Select to edit");
          }
        };

        field.parseValue = function(value) {
          var v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              var valMap = {};
              valMap[field.id] = opt[field.id];
              for (var subFieldId in opt) {
                field.subFieldList.forEach(function(subField) {
                  if (subField.id === subFieldId) {
                    valMap[subField.id] = subField.parseValue(opt[subFieldId]);
                  }
                });
              }
              return valMap;
            });
          } else {
            v = null;
          }
          return v;
        };

        field.updateSubFieldUnitOpts = function(val) {
          var curOpts;
          field.data.options.forEach(function(opt) {
            if (opt.id === val) {
              curOpts = opt;
            }
          });
          field.subFieldList.forEach(function(subField) {
            if (subField.data.hasMultiplexUnit) {
              if (curOpts && curOpts.hasOwnProperty("unitOptions")) {
                subField.setUnitOpts(curOpts.unitOptions[subField.id]);
              } else {
                subField.setUnitOpts(null);
              }
            }
          })
        };

        field.multiOnChange = function(added, removed) {
          field._changeMultiFieldValue(added, removed);
          var v = field.getValue();
          var curData = field.detailData;
          var curIds = [];
          var curOpt = null;
          //reshape data for saveback
          if (curData) {
            curIds = curData.map(function(val) {
              return val[field.id]
            });
          }

          var newMultiplexVal = [];
          var selectList = [];
          if (v) {
            v.forEach(function(selectedVal) {
              if (curData) {
                curData.forEach(function(val) {
                  if (val[field.id] === selectedVal) {
                    newMultiplexVal.push(val)
                  }
                });
              }
              // cases when adding new data
              if (curIds.indexOf(selectedVal) < 0) {
                var newVal = {};
                newVal[field.id] = selectedVal;

                field.updateSubFieldUnitOpts(selectedVal);
                field.subFieldList.forEach(function(subfield) {
                  // special handling for subfield which has multiplexUnit
                  if (subfield.hasUnits) {
                    if (subfield.data.hasMultiplexUnit) {
                      subfield.disabled(false);
                      field.data.options.forEach(function(opt) {
                        if (opt.id === selectedVal) {
                          var val = {
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
                      var val = {
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
            v.forEach(function(selectVal) {
              field.data.options.forEach(function(opt) {
                if (opt.id === selectVal) {
                  selectList.push(opt);
                }
              });
            });

            var selected = field.singleSelectValue();
            for (var i = 0; i < v.length; i++) {
              if (added && (added.id === v[i])) {
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

        field.getText = function(v) {
          if (v === null) {
            return "";
          }
          // get subfields that is selected from the checkbox
          if (field.id in that.globalSelectedMultiplexSubfield) {
            var checkedSubfields = that.globalSelectedMultiplexSubfield[field.id];
            var returnVal = [];
            for (var valIdx in v) {
              var subV = v[valIdx];
              var subText = [];
              for (var optId in field.data.options) {
                var opt = field.data.options[optId];
                if (opt.id === subV[field.id]) {
                  subText.push(opt.text);
                }
              }
              field.subFieldList.forEach(function(subField) {
                if (checkedSubfields.indexOf(subField.id) >= 0) {
                  var x = subField.getText(subV[subField.id]);
                  subText.push(subField.name + ": " + x);
                }
              });
              returnVal.push("{" + subText.join(", ") + "}");
            }
            return returnVal.join(";");
          }
        };

        field.parseText = function(v) {
          if (v === null) {
            return "";
          } else {
            var returnVal = [];
            for (var valIdx in v) {
              var subV = v[valIdx];
              var subText = [];
              for (var optId in field.data.options) {
                var opt = field.data.options[optId];
                if (opt.id === subV[field.id]) {
                  subText.push(opt.text);
                }
              }
              field.subFieldList.forEach(function(subField) {
                var x = subField.getText(subV[subField.id]);
                if (x) {
                  subText.push(x);
                }
              });
              returnVal.push(subText);
            }
            return returnVal;
          }
        };

        field.checkMultiplexCompletion = function(valList) {
          var valCount = 0;
          var completionPct = 0;
          var include = false;

          function getSubfieldStatus(vals) {
            var req = 0;
            var fill = 0;
            for (var subFieldId in field.subFieldList) {
              var subField = field.subFieldList[subFieldId];
              var curVal = vals[subField.id];
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
              for (var idx in valList) {
                valCount++;
                var vals = valList[idx];
                completionPct += getSubfieldStatus(vals);
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
        field.applyMultiplexSubFieldColor = function(valList) {
          function updateSubFieldWarningMap(vals) {
            for (var subFieldId in field.subFieldList) {
              var subField = field.subFieldList[subFieldId];
              // loop through each well's multiplexval list
              if (vals === null) {
                if (field.required && subField.required) {
                  subFieldWarningMap[subField.id].warningStatus.push(true);
                }
              } else if (typeof (vals) === "object") {
                if (vals.length === 0) {
                  if (field.required && subField.required) {
                    subFieldWarningMap[subField.id].warningStatus.push(true);
                  }
                } else {
                  for (var multiplexIdx in vals) {
                    var curVal = vals[multiplexIdx][subField.id];
                    if (subField.required) {
                      if (typeof (curVal) === 'object' && curVal) {
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

          var subFieldWarningMap = {};
          field.subFieldList.forEach(function(subField) {
            if (subField.required) {
              subFieldWarningMap[subField.id] = {
                field: subField,
                warningStatus: []
              };
            }
          });

          valList.forEach(function(multiplexVals) {
            updateSubFieldWarningMap(multiplexVals);
          });
          // turn off main field when all subfield are filled

          var requiredSubField = [];
          var mainFieldStatus = [];
          for (var subFieldId in subFieldWarningMap) {
            var subField = subFieldWarningMap[subFieldId].field;
            if (subFieldWarningMap[subFieldId].warningStatus.indexOf(true) >= 0) {
              var text = subField.name + " is a required subfield for " + field.name + ", please make sure all " + field.name + " have " + subField.name;
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
          var mainFieldWarning = false;
          if (mainFieldStatus.indexOf(true) < 0) {
            mainFieldWarning = false;
          } else {
            mainFieldWarning = true;
          }
          var warningText;
          if (field.required) {
            warningText = field.name + " is a required field, please also fix missing required subfield(s) below";
          } else {
            warningText = field.name + " is not a required field, please fix missing required subfield(s) below or remove selected " + field.name;
          }
          that.fieldWarningMsg(field, warningText, mainFieldWarning);
        };

        field.parseMainFieldVal = function(val) {
          var optMap = field.data.options;
          for (var idx = 0; idx < optMap.length; idx++) {
            var curOpt = optMap[idx];
            if (curOpt.id === val) {
              return curOpt.text
            }
          }
        };
      },

      _deleteDialog: function(field) {
        var that = this;

        var valMap = field.allSelectedMultipleVal;
        var valToRemove;
        if (valMap) {
          valToRemove = Object.keys(valMap);
        } else {
          valToRemove = [];
        }


        var dialogDiv = $("<div/>").addClass("plate-modal");
        this.container.append(dialogDiv);

        function killDialog() {
          dialogDiv.hide();
          dialogDiv.remove();
        }

        var dialogContent = $("<div/>").addClass("plate-modal-content").css('width', '550px').appendTo(dialogDiv);
        var tableArea = $("<div/>").appendTo(dialogContent);
        var buttonRow = $("<div/>").addClass("dialog-buttons").css("justify-content", "flex-end").appendTo(dialogContent);

        if (valToRemove.length > 0) {
          // apply CSS property for table
          $("<p/>").text(field.name + " in selected wells: choose items to delete and click the delete button below").appendTo(tableArea);

          var table = that._deleteDialogTable(field, valMap);
          table.appendTo(tableArea);
          table.addClass("plate-popout-table");
          table.find('td').addClass("plate-popout-td");
          table.find('th').addClass("plate-popout-th");
          table.find('tr').addClass("plate-popout-tr");
          if (!that.readOnly) {
            var deleteCheckedButton = $("<button class='multiple-field-manage-delete-button'>Delete Checked Items</button>");
            buttonRow.append(deleteCheckedButton);
            deleteCheckedButton.click(function() {
              table.find("input:checked").each(function() {
                var val = this.value;
                field.multiOnChange(null, {id: val});
              });
              // refresh selected fields after updating the multiplex field value
              that.decideSelectedFields();
              killDialog();
            });
          }

        } else {
          $("<p/>").text("No " + field.name + " in the selected wells").appendTo(tableArea);
        }

        var cancelButton = $("<button>Cancel</button>");
        buttonRow.append(cancelButton);
        cancelButton.click(killDialog);

        dialogDiv.show();

        window.onclick = function(event) {
          if (event.target == dialogDiv[0]) {
            killDialog();
          }
        }
      },

      _deleteDialogTable: function(field, valMap) {
        var that = this;
        var colName = [field.name, "Counts"]; //Added because it was missing... no idea what the original should have been
        if (!that.readOnly) {
          colName.push("Delete");
        }
        var table = $('<table/>');
        var thead = $('<thead/>').appendTo(table);
        var tr = $('<tr/>').appendTo(thead);

        tr.append(colName.map(function(text) {
          return $('<th/>').text(text);
        }));

        var tbody = $("<tbody/>").appendTo(table);

        field.data.options.forEach(function(opt) {
          if (opt.id in valMap) {
            var tr = $('<tr/>').appendTo(tbody);
            var checkbox = $("<input type='checkbox'>").prop("value", opt.id);
            $("<td/>").text(opt.text).appendTo(tr);
            $("<td/>").text(valMap[opt.id]).appendTo(tr);
            if (!that.readOnly) {
              $("<td/>").append(checkbox).appendTo(tr);
            }
          }
        });

        return table;
      },

      _createDeleteButton: function(field) {
        var that = this;
        var deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + "...");
        var buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");
        buttonContainer.append(deleteButton);

        field.deleteButton = deleteButton;
        field.root.find(".plate-setup-tab-field-right-side").append(buttonContainer);

        deleteButton.click(function() {
          that._deleteDialog(field);
        });
      }

    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.engine = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    // Use THIS to refer parent this.
    return {
      engine: {

        derivative: {},
        colorMap: new Map(),
        stackUpWithColor: {},
        stackPointer: 2,

        wellEmpty: function(well) {
          for (var prop in well) {
            var curVal = well[prop];
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

        searchAndStack: function() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 1;
          var derivativeJson = {};
          for (var idx in this.derivative) {
            var data = this.derivative[idx];
            var wellData = {};
            for (var i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              var attr = THIS.globalSelectedAttributes[i];

              if (attr in THIS.globalSelectedMultiplexSubfield) {
                var selectedSubFields = THIS.globalSelectedMultiplexSubfield[attr];
                var newMultiplexVal = [];
                for (var multiplexIdx in data[attr]) {
                  var curMultiplexVals = data[attr][multiplexIdx];
                  var newVal = {};
                  newVal[attr] = curMultiplexVals[attr];
                  selectedSubFields.forEach(function(subFieldId) {
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
            var keys = Object.keys(derivativeJson).map(function(k) {
              return parseFloat(k, 10);
            });
            keys.sort(function(a, b) {
              return a - b;
            });

            var refDerivativeIndex = keys[0];
            var referenceDerivative = derivativeJson[refDerivativeIndex];
            var arr = [];

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
              for (var i = 0; i < keys.length; i++) {
                var idx = keys[i];
                if (referenceDerivative == derivativeJson[idx]) {
                  arr.push(idx);
                  this.stackUpWithColor[this.stackPointer] = arr;
                  delete derivativeJson[idx];
                }
              }
              if (arr.length > 0)
                this.stackPointer++;
            }
          }
        },

        applyColors: function() {

          var wholeNoTiles = 0;
          var wholePercentage = 0;

          THIS.addBottomTableHeadings();

          for (var i = 0; i < THIS.allTiles.length; i++) {
            var tile = THIS.allTiles[i];
            THIS.setTileVisible(tile, false);
          }

          for (var color = 0; color < this.stackPointer; color++) {
            var arr = this.stackUpWithColor[color];
            if (arr) {
              THIS.addBottomTableRow(color, arr);

              for (var tileIndex in arr) {
                wholeNoTiles++;
                var index = this.stackUpWithColor[color][tileIndex];
                var tile = THIS.allTiles[index];
                var well = this.derivative[index];
                this.colorMap.set(index, color);
                THIS.setTileColor(tile, color);
                // Checks if all the required fields are filled
                var completion = this.checkCompletion(well, tile);
                THIS.setTileComplete(tile, completion == 1);
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
        },

        checkCompletion: function(wellData, tile) {
          var req = 0;
          var fill = 0;
          for (var i = 0; i < THIS.fieldList.length; i++) {
            var field = THIS.fieldList[i];
            if (field.checkMultiplexCompletion) {
              // also apply color
              var multiplexStatus = field.checkMultiplexCompletion(wellData[field.id]);
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
        },
      }
    }
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.fabricEvents = function() {
    // This object contains Menu items and how it works;
    return {
      colorToIndex: {},
      startCoords: {
        x: 0,
        y: 0
      },
      focalWell: {
        row: 0,
        col: 0
      },
      selectedAreas: [],

      _clickCoords: function(evt) {
        //Get XY Coords for a given event. 
        var rect = evt.e.target.getBoundingClientRect();
        return {
          x: evt.e.clientX - rect.left,
          y: evt.e.clientY - rect.top
        };
      },

      _fabricEvents: function() {
        // Set up event handling. 
        var that = this;

        $(that.target).on("getPlates", function(evt, data) {
          // This method should be compatable to redo/undo.
          that.getPlates(JSON.parse(data));
        });

        that.mainFabricCanvas.on("mouse:down", function(evt) {
          // Start selecting new area
          that.selecting = true;
          var coords = that._clickCoords(evt);

          var areas = that.selectedAreas.slice();
          var focalWell = that.focalWell;
          var startCoords = that._wellToCoords(focalWell, true);
          var rect = that._coordsToRect(startCoords, coords);

          if (evt.e.ctrlKey) {
            //adding new area
            startCoords = coords;
            rect = that._coordsToRect(startCoords, coords);
            focalWell = that._coordsToWell(startCoords);
            if (evt.e.shiftKey) {
              //replacing existing areas
              areas = [that._rectToArea(rect)];
            } else {
              areas.push(that._rectToArea(rect));
            }
          } else {
            if (evt.e.shiftKey) {
              //Altering last area
              areas[areas.length - 1] = that._rectToArea(rect);
            } else {
              //Creating new area
              startCoords = coords;
              rect = that._coordsToRect(startCoords, coords);
              focalWell = that._coordsToWell(startCoords);
              areas = [that._rectToArea(rect)];
            }
          }

          that.startCoords = startCoords;
          that.setSelection(areas, focalWell);
          that.mainFabricCanvas.renderAll();
        });

        that.mainFabricCanvas.on("mouse:move", function(evt) {
          if (that.selecting) {
            // continue selecting new area
            var areas = that.selectedAreas.slice();
            var endCoords = that._clickCoords(evt);
            var rect = that._coordsToRect(that.startCoords, endCoords);
            var area = that._rectToArea(rect);
            if (area) {
              areas[areas.length - 1] = area;
            }

            that.setSelection(areas, that.focalWell);
            that.mainFabricCanvas.renderAll();
          }

        });

        that.mainFabricCanvas.on("mouse:up", function(evt) {
          // finish selecting new area
          that.selecting = false;
          var areas = that.selectedAreas.slice();
          var endCoords = that._clickCoords(evt);
          var rect = that._coordsToRect(that.startCoords, endCoords);
          var area = that._rectToArea(rect);
          if (area) {
            areas[areas.length - 1] = area;
          }

          that.setSelection(areas, that.focalWell);
          that.decideSelectedFields();
          that.mainFabricCanvas.renderAll();
          that._trigger("selectedWells", null, {selectedAddress: that.getSelectedAddress()});
          if (that.options.scrollToGroup === undefined || that.options.scrollToGroup) {
            that.selectObjectInBottomTab();
          }
        });
      },

      setSelection: function(areas, focalWell) {
        this.selectedAreas = areas;
        this.focalWell = focalWell;
        this.allSelectedObjects = this._areasToTiles(areas);
        this._setSelectedTiles();
        this._setFocalWellRect(this.focalWell);
        document.activeElement.blur();
      },

      _setFocalWellRect: function(well) {
        var flag;
        // check if not allow to add or delete existing wells
        if (this.disableAddDeleteWell) {
          var address = this.locToAddress({
            r: well.row,
            c: well.col
          });
          if (this.addressAllowToEdit.indexOf(address) < 0) {
            flag = false;
            this.setFieldsDisabled(true);
          } else {
            flag = true;
            this.setFieldsDisabled(false);
          }
        } else if (well) {
          flag = true;
        }

        if (flag) {
          var rect = this._areaToRect(this._wellToArea(well));
          var strokeWidth = 2;
          if (this.focalWellRect) {
            //update focalWellRect
            this.focalWellRect.top = rect.top;
            this.focalWellRect.left = rect.left;
            this.focalWellRect.width = rect.width - strokeWidth;
            this.focalWellRect.height = rect.height - strokeWidth;
          } else {
            //create focalWellRect
            this.focalWellRect = new fabric.Rect({
              width: rect.width - strokeWidth,
              height: rect.height - strokeWidth,
              left: rect.left,
              top: rect.top,
              fill: null,
              strokeWidth: strokeWidth,
              stroke: "black",
              selectable: false
            });
            this.mainFabricCanvas.add(this.focalWellRect);
          }
        } else {
          //clear focalWellRect
          this.mainFabricCanvas.remove(this.focalWellRect);
          this.focalWellRect = null;
        }
      },

      _setSelectedTiles: function() {
        // Update selected tile display only
        var selectedTiles = this.allSelectedObjects;
        this.allTiles.forEach(function(tile) {
          var selected = selectedTiles.indexOf(tile) >= 0;
          tile.highlight.visible = selected;
        })
      },

      _getSelectedWells: function() {
        var that = this;
        return this.allSelectedObjects.map(function(tile) {
          var well = that.engine.derivative[tile.index];
          if (!well) {
            well = that.defaultWell;
          }
          return well;
        });
      },

      _getCommonFields: function(wells) {
        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell);
          for (var i = 1; i < wells.length; i++) {
            var fields = wells[i];
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field];
                var agrArr = [];
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  if (v && typeof (v) === "object") {
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr;
              } else {
                if (fields[field] && typeof (fields[field]) === "object" && referenceFields[field] && typeof (referenceFields[field]) === "object") {
                  if ((fields[field].value !== referenceFields[field].value) || (fields[field].unit !== referenceFields[field].unit)) {
                    delete referenceFields[field];
                  }
                } else if (referenceFields[field] != fields[field]) {
                  delete referenceFields[field];
                }
              }
            }
          }
          return referenceFields
        } else {
          return {};
        }
      },

      containsObject: function(obj, list) {
        var equality = [];
        if (list) {
          list.forEach(function(val) {
            //evaluate val and obj
            var evaluate = [];
            Object.keys(val).forEach(function(listKey) {
              if (Object.keys(obj).indexOf(listKey) >= 0) {
                var curVal = val[listKey];
                if (typeof (curVal) === 'object' && curVal) {
                  if (obj[listKey]) {
                    evaluate.push((curVal.unit === obj[listKey].unit) && (curVal.value === obj[listKey].value));
                  } else {
                    // when obj[listKey] is null but curVal is not
                    evaluate.push(false);
                  }
                } else {
                  evaluate.push(curVal === obj[listKey]);
                }
              }
            });
            equality.push(evaluate.indexOf(false) < 0);
          });
          return equality.indexOf(true) >= 0;
        } else {
          return false;
        }
      },

      _getCommonWell: function(wells) {
        if (wells.length) {
          var referenceWell = wells[0];
          var referenceFields = $.extend(true, {}, referenceWell);
          for (var i = 1; i < wells.length; i++) {
            var well = wells[i];
            var fields = well;
            for (var field in referenceFields) {
              if (Array.isArray(referenceFields[field])) {
                var refArr = referenceFields[field];
                var agrArr = [];
                for (var j = 0; j < refArr.length; j++) {
                  var v = refArr[j];
                  // for multiplex field
                  if (typeof (refArr[j]) === "object") {
                    if (this.containsObject(v, fields[field])) {
                      agrArr.push(v);
                    }
                  } else {
                    if ($.inArray(v, fields[field]) >= 0) {
                      agrArr.push(v);
                    }
                  }
                }
                referenceFields[field] = agrArr;
              } else {
                if (fields[field] && typeof (fields[field]) === "object" && referenceFields[field] && typeof (referenceFields[field]) === "object") {
                  if ((fields[field].value !== referenceFields[field].value) || (fields[field].unit !== referenceFields[field].unit)) {
                    referenceFields[field] = null;
                  }
                } else if (referenceFields[field] != fields[field]) {
                  referenceFields[field] = null;
                }

              }
            }
          }
          return referenceFields;
        } else {
          return this.defaultWell;
        }
      },

      _getAllMultipleVal: function(wells) {
        var multipleFieldList = this.multipleFieldList;

        multipleFieldList.forEach(function(multiplexField) {
          if (wells.length) {
            var curMultipleVal = {};
            wells.forEach(function(wellData) {
              var id = multiplexField.id;
              if (wellData[id]) {
                if (wellData[id].length > 0) {
                  wellData[id].forEach(function(multipleVal) {
                    if (typeof (multipleVal) === 'object') {
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
                  })
                }
              }
            });
            multiplexField.allSelectedMultipleVal = curMultipleVal;
          } else {
            multiplexField.allSelectedMultipleVal = null
          }
        });
      },

      decideSelectedFields: function() {
        var wells = this._getSelectedWells();
        this._getAllMultipleVal(wells);
        this.applyFieldWarning(wells);
        var well = this._getCommonWell(wells);
        this._addDataToTabFields(well);
      },

      // get well value differences for each well in wellsHash
      getDifferentWellsVals: function(wellsHash) {
        var wells = [];
        for (var wellId in wellsHash) {
          wells.push(wellsHash[wellId]);
        }
        var differentWellsVals = {};
        if (wells.length > 1) {
          var commonWell = this._getCommonWell(wells);
          var allFieldVal = {};
          for (var fieldIdx in wellsHash[0]) {
            allFieldVal[fieldIdx] = [];
          }
          for (var wellIdx in wells) {
            var diffWellVal = {};
            var curWellData = wells[wellIdx];
            for (var fieldId in curWellData) {
              var commonVal = commonWell[fieldId];
              var curVal = curWellData[fieldId];
              var newVal = null;
              if (Array.isArray(curVal)) {
                // get uncommonVal
                newVal = [];
                for (var idx = 0; idx < curVal.length; idx++) {
                  var curMultiVal = curVal[idx];
                  // multiplex field
                  if (curMultiVal && typeof (curMultiVal === "object")) {
                    if (!this.containsObject(curMultiVal, commonVal)) {
                      newVal.push(curMultiVal);
                      if (!this.containsObject(curMultiVal, allFieldVal[fieldId])) {
                        allFieldVal[fieldId].push(curMultiVal);
                      }
                    }
                  } else {
                    if (commonVal.indexOf(curMultiVal) >= 0) {
                      newVal.push(curMultiVal);
                      if (!allFieldVal[fieldId].indexOf(curMultiVal) >= 0) {
                        allFieldVal[fieldId].push(curMultiVal);
                      }
                    }
                  }
                }
              } else if (curVal && typeof (curVal) === "object") {
                if (commonVal && typeof (commonVal) === "object") {
                  if (!((curVal.value === commonVal.value) || (curVal.unit === commonVal.unit))) {
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


            differentWellsVals[wellIdx] = diffWellVal;
          }

          // clean up step for fields that are empty
          for (var fieldId in allFieldVal) {
            if (allFieldVal[fieldId].length === 0) {
              for (var wellIdx in differentWellsVals) {
                delete differentWellsVals[wellIdx][fieldId];
              }
            }
          }

          return differentWellsVals;
        } else if (wellsHash[0]) {
          var well = {};
          for (var fieldId in wellsHash[0]) {
            var curVal = wellsHash[0][fieldId];
            if (Array.isArray(curVal)) {
              if (curVal.length > 0) {
                well[fieldId] = curVal
              }
            } else if (curVal) {
              well[fieldId] = curVal;
            }
          }
          return {
            0: well
          };
        }
      },

      // get all wells that has data
      getWellSetAddressWithData: function() {
        var address = [];
        var derivative = this.engine.derivative;
        for (var id in derivative) {
          address.push(this.indexToAddress(id));
        }
        return address;
      }

    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

plateLayOutWidget.assets = function() {
  return {
    _assets: {
      doImg: '&#10003;',
      dontImg: '',
      warningImg: '&#9888;'
    }
  };
};

var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.interface = function() {
    // interface holds all the methods to put the interface in place
    return {

      _createInterface: function() {

        var divIdentifier = '<div></div>';
        this.container = this._createElement(divIdentifier).addClass("plate-setup-wrapper");
        this.topSection = this._createElement(divIdentifier).addClass("plate-setup-top-section");

        this.topLeft = this._createElement(divIdentifier).addClass("plate-setup-top-left");
        this.topRight = this._createElement(divIdentifier).addClass("plate-setup-top-right");

        this.overLayContainer = this._createElement(divIdentifier).addClass("plate-setup-overlay-container");
        this.canvasContainer = this._createElement(divIdentifier).addClass("plate-setup-canvas-container");

        this._createOverLay();
        $(this.topLeft).append(this.overLayContainer);

        this._createCanvas();
        $(this.topLeft).append(this.canvasContainer);


        $(this.topSection).append(this.topLeft);
        $(this.topSection).append(this.topRight);

        $(this.container).append(this.topSection);
        $(this.element).append(this.container);

        this._initiateFabricCanvas();

        this._createTabAtRight();
        this._createTabs();

        this._placePresetTabs();
        // Bottom of the screen
        this._bottomScreen();
        // Canvas
        this._canvas();

        this.bottomForFirstTime();

        var that = this;
        this._setShortcuts();
        $(document.body).keyup(function(e) {
          that._handleShortcuts(e);
        });

        this._configureUndoRedoArray();
      },

      _createElement: function(element) {
        return $(element);
      },

      _setShortcuts: function() {
        var that = this;
        window.addEventListener("cut", function(e) {
          if (document.activeElement == document.body) {
            that.copyCriteria();
            that.clearCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("copy", function(e) {
          if (document.activeElement == document.body) {
            that.copyCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("paste", function(e) {
          if (document.activeElement == document.body) {
            that.pasteCriteria();
            e.preventDefault();
          }
        });
      },

      _handleShortcuts: function(e) {
        if (document.activeElement === document.body) {
          if (e.keyCode == 46) {
            this.clearCriteria();
            e.preventDefault();
          } else if (e.ctrlKey || e.metaKey) {
            if (e.keyCode == 90) {
              if (e.shiftKey) {
                this.redo();
              } else {
                this.undo();
              }
              e.preventDefault();
            } else if (e.keyCode == 89) {
              this.redo();
              e.preventDefault();
            }
          }
        }
      },
    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      getPlates: function(data) {
        //sanitize input
        var derivative = {};
        for (var index in data.derivative) {
          var well = data.derivative[index];
          derivative[index] = this.sanitizeWell(well);
        }

        var checkboxes = data.checkboxes || [];
        var selection = this.sanitizeAreas(data.selectedAreas, data.focalWell);

        var sanitized = {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedAreas": selection.selectedAreas,
          "focalWell": selection.focalWell
        };

        this.setData(sanitized);
      },

      sanitizeAreas: function(selectedAreas, focalWell) {
        var that = this;
        var rows = this.dimensions.rows;
        var cols = this.dimensions.cols;

        if (!selectedAreas) {
          selectedAreas = [];
        }
        if (selectedAreas.length) {
          selectedAreas = selectedAreas.map(function(area) {
            return {
              minCol: that._coordIndex(Math.min(area.minCol, area.maxCol), cols),
              minRow: that._coordIndex(Math.min(area.minRow, area.maxRow), rows),
              maxCol: that._coordIndex(Math.max(area.minCol, area.maxCol), cols),
              maxRow: that._coordIndex(Math.max(area.minRow, area.maxRow), rows)
            };
          });
          var area = selectedAreas[selectedAreas.length - 1];
          if (focalWell && !this._wellInArea(focalWell, area)) {
            focalWell = null;
          }
          if (!focalWell) {
            focalWell = {
              row: area.minRow,
              col: area.minCol
            };
          }
        } else {
          if (!focalWell) {
            focalWell = {
              row: 0,
              col: 0
            };
          }
          selectedAreas = [this._wellToArea(focalWell)];
        }
        return {
          selectedAreas: selectedAreas,
          focalWell: focalWell
        };
      },

      sanitizeWell: function(well) {
        var newWell = {};
        for (var i = 0; i < this.fieldList.length; i++) {
          var field = this.fieldList[i];
          newWell[field.id] = field.parseValue(well[field.id]);
        }
        return newWell;
      },

      setData: function(data) {
        this.engine.derivative = $.extend(true, {}, data.derivative);
        this.setCheckboxes(data.checkboxes);
        this.setSelection(data.selectedAreas, data.focalWell);
        this._colorMixer();
        this.decideSelectedFields();
        this.mainFabricCanvas.renderAll();
      },

    }
  }
})(jQuery, fabric);
var GET_PLATES = 'getPlates';
var IS_READ_ONLY = 'isReadOnly';
var IS_DISABLE_ADD_DELETE_WELL = 'isDisableAddDeleteWell';
var GET_SELECTED_OBJECT = 'getSelectedObject';
var SETSELECTEDWELL = 'setSelectedWell';
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.overlay = function() {
    // overlay holds all the methods to put the part just above the canvas which contains all those
    // 'completion percentage' annd 'copy Criteria' button etc ...
    return {

      _createOverLay: function() {

        var that = this;
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        this.overLayTextContainer.text("Completion Percentage:");
        this.overLayContainer.append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        this.overLayContainer.append(this.overLayButtonContainer);

        this.clearCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.clearCriteriaButton.text("Clear");
        this.overLayButtonContainer.append(this.clearCriteriaButton);

        this.clearCriteriaButton.click(function(evt) {
          that.clearCriteria();
        });

        this.copyCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.copyCriteriaButton.text("Copy");
        this.overLayButtonContainer.append(this.copyCriteriaButton);

        this.copyCriteriaButton.click(function(evt) {
          that.copyCriteria();
        });

        this.pasteCriteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        this.pasteCriteriaButton.text("Paste");
        this.overLayButtonContainer.append(this.pasteCriteriaButton);

        this.pasteCriteriaButton.click(function(evt) {
          that.pasteCriteria();
        });

        this.undoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.undoButton.text("Undo");
        this.overLayButtonContainer.append(this.undoButton);

        this.undoButton.click(function(evt) {
          that.undo();
        });

        this.redoButton = this._createElement("<button />").addClass("plate-setup-button");
        this.redoButton.text("Redo");
        this.overLayButtonContainer.append(this.redoButton);

        this.redoButton.click(function(evt) {
          that.redo();
        });

      },

      clearCriteria: function() {
        if (this.allSelectedObjects) {
          var noOfSelectedObjects = this.allSelectedObjects.length;
          var hasWellUpdate = false;
          for (var objectIndex = 0; objectIndex < noOfSelectedObjects; objectIndex++) {
            var tile = this.allSelectedObjects[objectIndex];
            if (tile.index in this.engine.derivative) {
              // handling for clearing well when not allowed to add or delete wells
              if (this.emptyWellWithDefaultVal && this.disableAddDeleteWell) {
                var well = JSON.parse(JSON.stringify(this.defaultWell));
                var defaultValue = this.emptyWellWithDefaultVal;
                for (var key in defaultValue) {
                  if (key in well) {
                    well[key] = defaultValue[key];
                    this._applyFieldData(key, defaultValue[key]);
                  } else {
                    console.log("Well does not contain key: " + key + ", please contact support");
                  }
                }
                this.engine.derivative[tile.index] = well;
              } else {
                delete this.engine.derivative[tile.index];
              }
              hasWellUpdate = true;
            }
          }
          if (hasWellUpdate) {
            this.derivativeChange();
          }

          this._colorMixer();
          this.decideSelectedFields();
        } else {
          alert("Please select any well");
        }
      },

      copyCriteria: function() {
        if (this.allSelectedObjects) {
          var wells = this._getSelectedWells();
          this.commonWell = this._getCommonFields(wells);
        } else {
          alert("Please select any well.");
        }
      },

      pasteCriteria: function() {
        if (this.commonWell) {
          this._addAllData(this.commonWell);
          this.decideSelectedFields();
          this.mainFabricCanvas.renderAll();
        }
      }
    };
  }
})(jQuery, fabric);
$.widget("DNA.plateLayOut", {

  plateLayOutWidget: {},

  options: {
    value: 0
  },

  allTiles: [], // All tiles containes all thise circles in the canvas

  addressToLoc: function(layoutAddress) {
    var m = /^([A-Z]+)(\d+)$/.exec(layoutAddress.trim().toUpperCase())
    if (m) {
      var row_v = m[1];
      var col = parseInt(m[2]) - 1;
      var row;
      for (var i = 0; i < row_v.length; i++) {
        var c = row_v.charCodeAt(i) - 65;
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
      throw layoutAddress + " not a proper layout address";
    }
  },

  locToIndex: function(loc, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }
    if (loc.r < 0) {
      t
    }
    if (!(loc.r >= 0 && loc.r < dimensions.rows)) {
      throw "Row index " + (loc.r + 1) + " invalid";
    }
    if (!(loc.c >= 0 && loc.c < dimensions.cols)) {
      throw "Column index " + (loc.c + 1) + " invalid";
    }
    return loc.r * dimensions.cols + loc.c;
  },

  addressToIndex: function(layoutAddress, dimensions) {
    var loc = this.addressToLoc(layoutAddress);
    return this.locToIndex(loc, dimensions);
  },

  _rowKey: function(i) {
    var c1 = i % 26;
    var c2 = (i - c1) / 26;
    var code = String.fromCharCode(65 + c1);
    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }
    return code;
  },

  indexToLoc: function(index, dimensions) {
    if (!dimensions) {
      dimensions = this.dimensions;
    }

    if (index >= dimensions.rows * dimensions.cols) {
      throw "Index too high: " + index.toString(10);
    }
    var loc = {};
    loc.c = index % dimensions.cols;
    loc.r = (index - loc.c) / dimensions.cols;

    return loc;
  },

  locToAddress: function(loc) {
    return this._rowKey(loc.r) + (loc.c + 1).toString(10);
  },

  indexToAddress: function(index, dimensions) {
    var loc = this.indexToLoc(index, dimensions);
    return this.locToAddress(loc);
  },

  getDimensions: function() {
    return $.extend(true, {}, this.dimensions);
  },

  _create: function() {
    var rows = parseInt(this.options.numRows || 8);
    var cols = parseInt(this.options.numCols || 12);
    this.dimensions = {
      rows: rows,
      cols: cols
    };
    this.rowIndex = [];
    for (var i = 0; i < rows; i++) {
      this.rowIndex.push(this._rowKey(i));
    }

    this.target = (this.element[0].id) ? "#" + this.element[0].id : "." + this.element[0].className;

    // Import classes from other files.. Here we import it using extend and add it to this
    // object. internally we add to widget.DNA.getPlates.prototype.
    // Helpers are methods which return other methods and objects.
    // add Objects to plateLayOutWidget and it will be added to this object.
    // set read only well
    if (this.options.readOnly) {
      this.isReadOnly(true);
    }

    for (var component in plateLayOutWidget) {
      // Incase some properties has to initialize with data from options hash,
      // we provide it sending this object.
      $.extend(this, new plateLayOutWidget[component](this));
    }

    this._createInterface();

    this._trigger("created", null, this);

    return this;
  },

  _init: function() {
    // This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },

  addData: function() {
    alert("wow this is good");
  },

  // wellsData follows syntax: {0:{field1: val1, field2: val2}, 1:{field1: val1, field2: val2}}
  getTextDerivative: function(wellsData) {
    var textDerivative = {};
    var fieldMap = this.fieldMap;
    for (var idx in wellsData) {
      var textValWell = {};
      var textFieldIdWell = {};
      var curWellData = wellsData[idx];
      for (var fieldId in curWellData) {
        if (fieldId in this.fieldMap) {
          var field = this.fieldMap[fieldId];
          var textVal = field.parseText(curWellData[fieldId]);
          textFieldIdWell[field.name] = textVal;
          textValWell[fieldId] = textVal;
        } else {
          // do not convert if not a field (ex: layout_address)
          textFieldIdWell[fieldId] = curWellData[fieldId];
          textValWell[fieldId] = curWellData[fieldId];
        }
      }
      textDerivative[idx] = {
        textVal: textValWell,
        textFieldVal: textFieldIdWell
      };
    }

    return textDerivative;
  },

  // wellsData follows syntax: {0:{field1: val1, field2: val2}, 1:{field1: val1, field2: val2}}
  getWellsDifferences: function(wellsData) {
    return this.getDifferentWellsVals(wellsData);
  },

  setFieldsDisabled: function(flag) {
    this.fieldList.forEach(function(field) {
      field.disabled(flag);
    });
  },

  isReadOnly: function(flag) {
    if (flag) {
      this.readOnly = true;
    } else {
      this.readOnly = false;
    }
    this.readOnlyHandler();
  },

  readOnlyHandler: function() {
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
  isDisableAddDeleteWell: function(flag, column_with_default_val) {
    if (flag) {
      this.disableAddDeleteWell = true;
      this.addressAllowToEdit = this.getWellSetAddressWithData();
      // configure undo redo action
      this.actionPointer = 0;
      this.undoRedoArray = [];
      this.undoRedoArray.push(this.createObject());
      if (column_with_default_val) {
        this.emptyWellWithDefaultVal = column_with_default_val;
      }
    } else {
      this.disableAddDeleteWell = false;
      this.setFieldsDisabled(false);
      this.emptyWellWithDefaultVal = null;
    }
    this._fabricEvents();
  },

  getSelectedObject: function() {
    var selectedAddress = [];
    for (var i = 0; i < this.allSelectedObjects.length; i++) {
      selectedAddress.push(this.allSelectedObjects[i].address);
    }
    var selectedObjects = {};
    var derivative = this.engine.derivative;
    for (var index in derivative) {
      var address = this.indexToAddress(index);
      if (selectedAddress.indexOf(address) >= 0) {
        var well = JSON.parse(JSON.stringify(derivative[index]));
        well.colorIndex = this.engine.colorMap.get(Number(index));
        selectedObjects[address] = well;
      }
    }
    return selectedObjects;
  },

  selectObjectInBottomTab: function() {
    var selectedObjects = this.getSelectedObject();
    var selectedObjectAddress;
    for (var prop in selectedObjects) {
      if (!selectedObjectAddress) {
        selectedObjectAddress = prop;
      } else {
        return;  // scroll to matching group only if a single well has been selected
      }
    }
    if (selectedObjects[selectedObjectAddress]) {
      var colorIndex = selectedObjects[selectedObjectAddress].colorIndex;
      var trs = document.querySelectorAll('table.plate-setup-bottom-table tr');
      for (var i = 1; i < trs.length; i++) { // start at 1 to skip the table headers
        var tds = trs[i].children;
        var isSelected = tds[0].querySelector('button').innerHTML === colorIndex.toString();
        for (var j = 1; j < tds.length; j++) {
          if (isSelected) {
            tds[j].style.background = '#22cb94';
          } else {
            tds[j].style.background = '#ffffff';
          }
        }
        if (isSelected) {
          scrollTo(document.querySelector('.plate-setup-bottom-table-container'), tds[0].offsetTop, 300);
        }
      }
    }
  },

  getSelectedIndex: function() {
    return this.allSelectedObjects.map(function(selectedObj) {
      return that.addressToIndex(selectedObj.address)
    });
  },

  getSelectedAddress: function() {
    return this.allSelectedObjects.map(function(selectedObj) {
      return selectedObj.address;
    });
  },

  setSelectedWell: function(addressList) {
    var areas = [];
    var minRow = 999;
    var locMap = {};
    for (var id = 0; id < addressList.length; id++) {
      var wellIdx = this.addressToIndex(addressList[id]);
      var loc = this.indexToLoc(wellIdx);
      areas.push({
        minCol: loc.c,
        minRow: loc.r,
        maxCol: loc.c,
        maxRow: loc.r
      });
      if (loc.r <= minRow) {
        minRow = loc.r;
        if (loc.r in locMap) {
          locMap[loc.r].push(loc.c);
        } else {
          locMap[loc.r] = [loc.c];
        }
      }
    }
    var focalWell = {
      row: minRow,
      col: Math.min.apply(null, locMap[minRow])
    };

    this.setSelection(areas, focalWell);
    this.decideSelectedFields();
    this.mainFabricCanvas.renderAll();
  }

});

// https://stackoverflow.com/questions/17733076/smooth-scroll-anchor-links-without-jquery
function scrollTo(element, to, duration) {
  if (duration <= 0) return;
  var difference = to - element.scrollTop;
  var perTick = difference / duration * 10;
  setTimeout(function() {
    element.scrollTop = element.scrollTop + perTick;
    if (element.scrollTop === to) return;
    scrollTo(element, to, duration - 10);
  }, 10);
}
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.preset = function(me) {
    // All the preset action goes here
    return {

      presets: [],

      _placePresetTabs: function() {
        var presets = this.options.attributes.presets;

        if (presets && presets.length) {
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
            .text("Checkbox presets");
          this.tabContainer.append(this.wellAttrContainer);

          this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
          this.tabContainer.append(this.presetTabContainer);

          for (var i = 0; i < presets.length; i++) {
            var preset = presets[i];
            var divText = this._createElement("<div></div>").addClass("plate-setup-preset-tab-div")
              .text(preset.title);

            var presetButton = this._createElement("<div></div>").addClass("plate-setup-preset-tab")
              .data("preset", preset.fields).append(divText);
            this.presetTabContainer.append(presetButton);

            var that = this;
            presetButton.click(function() {
              var preset = $(this);
              that._selectPreset(preset);
            });
            this.presets.push(presetButton);
          }
        }
      },

      _clearPresetSelection: function() {
        for (var j = 0; j < this.presets.length; j++) {
          var p = this.presets[j];
          p.removeClass("plate-setup-preset-tab-selected")
            .addClass("plate-setup-preset-tab");
        }
      },

      _selectPreset: function(preset) {
        this.setCheckboxes(preset.data("preset"));
        preset.removeClass("plate-setup-preset-tab")
          .addClass("plate-setup-preset-tab-selected");
      },
    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.tabs = function() {
    // Tabs crete and manage tabs at the right side of the canvas.
    return {

      allTabs: [],

      defaultWell: {},

      allDataTabs: [], // To hold all the tab contents. this contains all the tabs and its elements and elements
      // Settings as a whole. its very usefull, when we have units for a specific field.
      // it goes like tabs-> individual field-> units and checkbox

      _createTabAtRight: function() {
        this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
        $(this.topRight).append(this.tabContainer);
      },

      _createTabs: function() {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);

        var tabData = this.options.attributes.tabs;
        var that = this;

        tabData.forEach(function(tab, tabIndex) {
          that.allTabs[tabIndex] = that._createElement("<div></div>").addClass("plate-setup-tab");
          $(that.allTabs[tabIndex]).data("index", tabIndex)
            .text(tab.name);

          $(that.allTabs[tabIndex]).click(function() {
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

      _tabClickHandler: function(clickedTab) {

        if (this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected")
            .addClass("plate-setup-tab");

          var previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
          this.readOnlyHandler();
        }

        $(clickedTab).addClass("plate-setup-tab-selected");

        this.selectedTab = clickedTab;

        var clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },

      _addDataTabs: function(tabs) {

        var tabIndex = 0;

        for (var tabData in tabs) {
          this.allDataTabs[tabIndex++] = this._createElement("<div></div>").addClass("plate-setup-data-div")
            .css("z-index", 0);
          $(this.tabDataContainer).append(this.allDataTabs[tabIndex - 1]);
        }
      }
    };
  }
})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.undoRedoManager = function(THIS) {

    return {

      undoRedoArray: [],

      actionPointer: null,

      addToUndoRedo: function(data) {

        if (this.actionPointer != null) {
          var i = this.actionPointer + 1;
          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }
        this.actionPointer = null;
        this.undoRedoArray.push($.extend(true, {}, data));
      },

      _configureUndoRedoArray: function() {

        var data = {
          checkboxes: [],
          derivative: {},
          selectedAreas: [{
            minRow: 0,
            minCol: 0,
            maxRow: 0,
            maxCol: 0
          }],
          focalWell: {
            row: 0,
            col: 0
          }
        };

        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },

      undo: function() {
        console.log("undo");
        return this.shiftUndoRedo(-1);
      },

      redo: function() {
        console.log("redo");
        return this.shiftUndoRedo(1);
      },

      shiftUndoRedo: function(pointerDiff) {
        var pointer = this.actionPointer;
        if (pointer == null) {
          pointer = this.undoRedoArray.length - 1;
        }
        pointer += pointerDiff;
        return this.setUndoRedo(pointer);
      },

      setUndoRedo: function(pointer) {
        if (pointer < 0) {
          return false;
        }
        if (pointer >= this.undoRedoArray.length) {
          return false;
        }
        this.undoRedoActive = true;
        this.setData(this.undoRedoArray[pointer]);
        this.actionPointer = pointer;
        this.undoRedoActive = false;
        this.derivativeChange();
        return true;
      }
    }
  };

})(jQuery, fabric);
var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.wellArea = function(fabric) {

    return {

      _areasToTiles: function(areas) {
        //Convert areas to tiles
        var cols = this.dimensions.cols;
        var that = this;
        return areas.reduce(function(tiles, area) {
          if (area) {
            for (var r = area.minRow; r <= area.maxRow; r++) {
              for (var c = area.minCol; c <= area.maxCol; c++) {
                var tile = that.allTiles[c + cols * r];
                if (tiles.indexOf(tile) < 0) {
                  if (that.disableAddDeleteWell) {
                    if (that.addressAllowToEdit.indexOf(tile.address) >= 0) {
                      tiles.push(tile);
                    }
                  } else {
                    tiles.push(tile);
                  }
                }
              }
            }
          }
          return tiles;
        }, []);
      },

      _encodeArea: function(area) {
        //Encode area as string
        if ((area.minRow == area.maxRow) && (area.minCol == area.maxCol)) {
          return this.rowIndex[area.minRow] + area.minCol.toString(10);
        } else {
          return this.rowIndex[area.minRow] + area.minCol.toString(10) + ":" + this.rowIndex[area.maxRow] + area.maxCol.toString(10);
        }
      },

      _encodeAreas: function(areas) {
        //Encode an array of areas as a string
        var that = this;
        return areas.map(function(area) {
          return that._encodeArea(area);
        }).join(",");
      },

      _decodeWell: function(wellAddress) {
        var that = this;
        var adRx = new RegExp("^\\s*(" + that.rowIndex.join("|") + ")(\\d+)\\s*$")
        var rcRx = /^\s*R(\d+)C(\d+)\s*$/i;

        var match;
        match = wellAddress.match(adRx);
        if (match) {
          var row = that.rowIndex.indexOf(match[1]);
          if (row >= 0) {
            return {
              row: row,
              col: parseInt(match[2]) - 1
            };
          }
        }
        match = wellAddress.match(rcRx);
        if (match) {
          return {
            row: parseInt(match[1]) - 1,
            col: parseInt(match[2]) - 1
          };
        }

        throw "Invalid well address: " + wellAddress;
      },

      _decodeArea: function(areaAddress) {
        //Decode single area as string
        var that = this;
        var wells = areaAddress.split(":").map(function(wellAddress) {
          return that._decodeWell(wellAddress);
        })
        if (wells.length == 1) {
          return {
            minRow: wells[0].row,
            minCol: wells[0].col,
            maxRow: wells[0].row,
            maxCol: wells[0].col
          }
        } else if (wells.length == 2) {
          var minRow = Math.min(wells[0].row, wells[1].row)
          return {
            minRow: Math.min(wells[0].row, wells[1].row),
            minCol: Math.min(wells[0].col, wells[1].col),
            maxRow: Math.max(wells[0].row, wells[1].row),
            maxCol: Math.max(wells[0].col, wells[1].col)
          }
        } else {
          throw "Invalid address: " + areaAddress;
        }
      },

      _decodeAreas: function(areasAddress) {
        //Decode single area as string
        var that = this;
        return areasAddress.split(",").map(function(areaAddress) {
          return that._decodeArea(areaAddress);
        });
      },

      _wellToArea: function(well) {
        //Convert a well to an area
        return {
          minCol: well.col,
          minRow: well.row,
          maxCol: well.col,
          maxRow: well.row
        }
      },

      _wellInArea: function(well, area) {
        //Determine if a well lies within an area
        return well.row >= area.minRow && well.row <= area.maxRow && well.col >= area.minCol && well.col <= area.maxCol;
      },

      _coordsToRect: function(startCoords, endCoords) {
        //Convert two XY coords to a bounding box
        var left = Math.min(startCoords.x, endCoords.x);
        var top = Math.min(startCoords.y, endCoords.y);
        var height = Math.abs(endCoords.y - startCoords.y);
        var width = Math.abs(endCoords.x - startCoords.x);
        return {
          top: top,
          left: left,
          height: height,
          width: width
        };
      },

      _coordIndex: function(v, count) {
        var i;
        if (v < 0) {
          i = 0;
        } else if (v >= count) {
          i = count - 1;
        } else {
          i = Math.floor(v);
        }
        return i;
      },

      _coordsToWell: function(coord) {
        //Convert a coordinate to a well
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;

        var w = this.sizes.spacing;
        var m = this.sizes.label_spacing;

        var x = (coord.x - m) / w;
        var y = (coord.y - m) / w;

        var row = this._coordIndex(y, rows);
        var col = this._coordIndex(x, cols);

        return {
          row: row,
          col: col,
        };
      },

      _wellToCoords: function(well, center) {
        //Convert a well to a coordinate
        var w = this.sizes.spacing;
        var m = this.sizes.label_spacing;
        var x = well.col * w + m;
        var y = well.row * w + m;
        if (center) {
          var hw = w / 2;
          x = x + hw;
          y = y + hw;
        }

        return {
          x: x,
          y: y
        };
      },

      _areaToRect: function(area) {
        //Convert area to rectangle
        var rows = area.maxRow - area.minRow + 1;
        var cols = area.maxCol - area.minCol + 1;

        var w = this.sizes.spacing;
        var m = this.sizes.label_spacing;

        return {
          top: area.minRow * w + m,
          left: area.minCol * w + m,
          height: rows * w,
          width: cols * w
        }
      },

      _rectToArea: function(rect) {
        //Convert a rectangular region to an area
        var rows = this.dimensions.rows;
        var cols = this.dimensions.cols;

        var w = this.sizes.spacing;
        var m = this.sizes.label_spacing;

        var left = (rect.left - m) / w;
        var top = (rect.top - m) / w;
        var height = rect.height / w;
        var width = rect.width / w;
        var right = left + width;
        var bottom = top + height;

        //select whole row
        if (right < 0) {
          right = cols;
        }
        if (left >= cols) {
          left = 0;
        }
        //select whole col
        if (bottom < 0) {
          bottom = rows;
        }
        if (top <= 0) {
          top = 0;
        }

        return {
          minCol: this._coordIndex(left, cols),
          minRow: this._coordIndex(top, rows),
          maxCol: this._coordIndex(right, cols),
          maxRow: this._coordIndex(bottom, rows)
        };
      }

    }
  }
})(jQuery, fabric);