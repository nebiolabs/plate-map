"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var plateMapWidget = plateMapWidget || {};

(function ($) {
  plateMapWidget.addDataOnChange = function () {
    // This object is invoked when something in the tab fields change
    return {
      _addAllData: function _addAllData(data) {
        if (this.selectedIndices) {
          var noOfSelectedObjects = this.selectedIndices.length;
          this.selectedIndices.forEach(function (index) {
            var well;

            if (index in this.engine.derivative) {
              well = this.engine.derivative[index];
            } else {
              well = $.extend(true, {}, this.defaultWell);
              this.engine.derivative[index] = well;
            }

            well = this.processWellData(data, well, noOfSelectedObjects);
            var empty = this.engine.wellEmpty(well);

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
        } // update multiplex


        this.decideSelectedFields(); // create well when default field is sent for the cases when user delete all fields during disabledNewDeleteWell mode

        this._colorMixer();

        this.derivativeChange();
        this.addToUndoRedo();
      },
      processWellData: function processWellData(newData, curWell, noOfSelectedObjects) {
        for (var id in newData) {
          if (!newData.hasOwnProperty(id)) {
            continue;
          }

          var newVal = newData[id];

          if (newVal !== undefined && newVal !== null) {
            if (newVal.multi) {
              var preData = curWell[id];
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
      _getMultiData: function _getMultiData(preData, curData, fieldId, noOfSelectedObjects) {
        var addNew = curData.added;
        var removed = curData.removed;
        preData = preData || [];

        if (addNew) {
          if (addNew.value) {
            var multiplexId = addNew.id.toString();
            var doAll = multiplexId === '[ALL]';
            var add = !doAll;
            preData = preData.map(function (val) {
              if (doAll || val[fieldId].toString() === multiplexId) {
                add = false;

                for (var subFieldId in addNew.value) {
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

        var removeListIndex = function removeListIndex(preData, removeIndex) {
          var newPreData = [];

          for (var idx in preData) {
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
          var removeIndex; // for multiplex field

          if (removed.value) {
            for (var listIdx in preData) {
              var multiplexData = preData[listIdx];

              if (multiplexData[fieldId].toString() === removed.id.toString()) {
                removeIndex = listIdx;
              }
            } // remove nested element


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
      _colorMixer: function _colorMixer() {
        this.engine.searchAndStack();
        this.engine.applyColors();
      },
      derivativeChange: function derivativeChange() {
        this._trigger("updateWells", null, this);
      },
      createState: function createState() {
        var derivative = $.extend(true, {}, this.engine.derivative);
        var checkboxes = this.getCheckboxes();
        var selectedIndices = this.selectedIndices.slice();
        return {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedIndices": selectedIndices,
          "requiredField": this.requiredField
        };
      },
      getPlate: function getPlate() {
        var wells = {};
        var derivative = this.engine.derivative;

        for (var index in derivative) {
          if (!derivative.hasOwnProperty(index)) {
            continue;
          }

          var address = this.indexToAddress(index);
          var well = derivative[index];
          wells[address] = $.extend(true, {}, well);
        }

        var checkboxes = this.getCheckboxes();
        var selectedAddresses = this.getSelectedAddresses();
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
    _addDataToTabFields: function _addDataToTabFields(well) {
      // Configure how data is added to tab fields
      for (var i = 0; i < this.fieldList.length; i++) {
        var field = this.fieldList[i];
        var v = well[field.id];

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
      _addTabData: function _addTabData() {
        // Here we may need more changes because attributes format likely to change
        var tabData = this.options.attributes.tabs;
        var that = this;
        this.requiredField = [];
        var multiplexFieldArray = [];
        tabData.forEach(function (tab, tabPointer) {
          if (tab["fields"]) {
            var tabFields = tab["fields"];
            var fieldArray = []; // Now we look for fields in the json

            for (var i = 0; i < tabFields.length; i++) {
              var data = tabFields[i];

              if (!data.id) {
                data.id = "Auto" + that.autoId++;
                console.log("Field autoassigned id " + data.id);
              }

              if (!data.type) {
                data.type = "text";
                console.log("Field " + data.id + " autoassigned type " + data.type);
              }

              var field = void 0;

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
      _makeSubField: function _makeSubField(mainField, data, tabPointer, fieldArray) {
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
      _makeRegularField: function _makeRegularField(data, tabPointer, fieldArray, checkbox) {
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
        that.fieldMap[field.full_id] = field; // Adding checkbox

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

        return field;
      },
      _makeMultiplexField: function _makeMultiplexField(data, tabPointer, fieldArray) {
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
          full_id: data.id,
          name: data.name,
          root: wrapperDiv,
          data: data,
          required: data.required
        };
        fieldArray.push(field);
        that.fieldList.push(field);
        that.fieldMap[field.full_id] = field;
        var subFieldList = []; //create subfields

        var requiredSubField = [];

        for (var i = 0; i < data.multiplexFields.length; i++) {
          var subFieldData = data.multiplexFields[i];

          var subField = that._makeSubField(field, subFieldData, tabPointer, fieldArray);

          subFieldList.push(subField); // stores required  subField

          if (subFieldData.required) {
            requiredSubField.push(subField.id);
          }
        } //store required field


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

          that._addCheckBox(subfield); // overwrite subField setvalue


          subfield.onChange = function () {
            var v = subfield.getValue();
            var mainRefField = subfield.mainMultiplexField;
            var curId = mainRefField.singleSelectValue(); //let curDataLs = mainRefField.detailData;

            var curVal = {};
            curVal[mainRefField.id] = curId; //append subfields

            curVal[subfield.id] = v;
            var returnVal = {
              id: curId,
              value: curVal
            };

            field._changeMultiFieldValue(returnVal, null);

            var curDataLs = mainRefField.detailData;

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
      fieldWarningMsg: function fieldWarningMsg(field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.full_id;
        var img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");

        if (include) {
          if (field.root.find("#" + imgId).length <= 0) {
            field.root.find(".plate-setup-tab-name").text(" " + field.name);
            field.root.find(".plate-setup-tab-name").prepend(img);
            var popText = $("<div/>").addClass("pop-out-text");
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
      removeWarningMsg: function removeWarningMsg(field, text, include) {
        var that = this;
        var imgId = "fieldWarning" + field.full_id;

        if (include) {
          var img = $("<span>").html(that._assets.warningImg).attr("id", imgId).addClass("plate-field-warning-image");
          field.root.find(".plate-setup-tab-name").append(img);
          var popText = $("<div/>").addClass("pop-out-text");
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
      applyFieldWarning: function applyFieldWarning(wells) {
        var that = this;
        var fieldData = {};
        that.fieldList.forEach(function (field) {
          fieldData[field.id] = [];
        });
        wells.forEach(function (well) {
          if (!that.engine.wellEmpty(well)) {
            for (var fieldId in fieldData) {
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

        for (var i = 0; i < that.fieldList.length; i++) {
          var field = that.fieldList[i];

          if (field.applyMultiplexSubFieldColor) {
            field.applyMultiplexSubFieldColor(fieldData[field.id]);
          } else {
            if (field.required) {
              var include = false;
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
              }); //field.root.find(".plate-setup-tab-name").css("background", color);

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
      _bottomScreen: function _bottomScreen() {
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
      addBottomTableHeadings: function addBottomTableHeadings() {
        var row = this._createElement("<tr></tr>");

        var singleField = this._createElement("<th></th>").text("Group");

        row.prepend(singleField);
        this.rowCounter = 1;

        for (var i = 0; i < this.globalSelectedAttributes.length; i++) {
          var attr = this.globalSelectedAttributes[i];
          var field = this.fieldMap[attr];

          var _singleField = this._createElement("<th></th>").text(field.name);

          row.append(_singleField);
          this.rowCounter = this.rowCounter + 1;
        } // Now we append all the captions at the place.


        this.bottomTableBody.empty();
        this.bottomTableHead.empty();
        this.bottomTableHead.append(row);
        this.adjustFieldWidth(row);
      },
      tileAttrText: function tileAttrText(tile, attr) {
        var well = this.engine.derivative[tile.index];
        var field = this.fieldMap[attr];
        return field.getText(well[attr]);
      },
      addBottomTableRow: function addBottomTableRow(color, singleStack) {
        var that = this;
        var modelTile = this.allTiles[singleStack[0]];

        var row = this._createElement("<tr></tr>");

        var plateIdDiv = this._createElement("<td></td>").addClass("plate-setup-bottom-id");

        var numberText = this._createElement("<button/>");

        numberText.addClass("plate-setup-color-text");
        numberText.text(color);
        plateIdDiv.append(numberText);
        numberText.click(function (evt) {
          var addressToSelect = singleStack.map(that.indexToAddress, that);

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
      bottomForFirstTime: function bottomForFirstTime() {
        this.addBottomTableHeadings(); // This is executed for the very first time.. !

        var row = this._createElement("<tr></tr>");

        var colorStops = this.colorPairs[0];

        var plateIdDiv = this._createElement("<td></td>");

        plateIdDiv.css("background", "-webkit-linear-gradient(left, " + colorStops[0] + " , " + colorStops[1] + ")");
        row.append(plateIdDiv);
        this.bottomTableBody.append(row);
        this.createExportButton();
      },
      adjustFieldWidth: function adjustFieldWidth(row) {
        var length = this.rowCounter;

        if (length * 150 > 1024) {
          row.css("width", length * 152 + "px");
        }
      },
      downloadCSV: function downloadCSV(csv, filename) {
        var csvFile;
        var downloadLink; // CSV file

        csvFile = new Blob([csv], {
          type: "text/csv"
        }); // Download link

        downloadLink = document.createElement("a"); // File name

        downloadLink.download = filename; // Create a link to the file

        downloadLink.href = window.URL.createObjectURL(csvFile); // Hide download link

        downloadLink.style.display = "none"; // Add the link to DOM

        document.body.appendChild(downloadLink); // Click download link

        downloadLink.click();
      },
      exportData: function exportData(format) {
        var data = [];
        var rows = document.querySelectorAll("table tr");
        var colorLocMap = {};
        var colorLocIdxMap = this.engine.stackUpWithColor;

        for (var colorIdx in colorLocIdxMap) {
          if (colorLocIdxMap.hasOwnProperty(colorIdx)) {
            colorLocMap[colorIdx] = colorLocIdxMap[colorIdx].map(this.indexToAddress, this);
          }
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

            row.push(v); // add location column

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
            data.push(row.join("\t")); //data.push(row);   // for text type
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
      createExportButton: function createExportButton() {
        var that = this;
        var overlayContainer = $("<div>").addClass("plate-setup-bottom-control-container");
        var descriptionDiv = $("<div>").addClass("plate-setup-overlay-text-container");
        descriptionDiv.text("Color groups");
        overlayContainer.append(descriptionDiv);
        var buttonContainer = $("<div>").addClass("plate-setup-overlay-bottom-button-container"); // create export csv option

        var exportButton = $("<button/>").addClass("plate-setup-button");
        exportButton.text("Export CSV");
        buttonContainer.append(exportButton);
        exportButton.click(function () {
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
        } // creat clipboard option, CLipboard is an external js file located in vendor/asset/javascripts


        var clipboardButton = $("<button/>").addClass("plate-setup-button");
        clipboardButton.text("Copy To Clipboard");
        buttonContainer.append(clipboardButton);
        var clipboard = new ClipboardJS(clipboardButton.get(0), {
          text: function text() {
            return that.exportData("clipboard");
          }
        });
        clipboard.on('success', function () {
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

        clipboard.on('error', function () {
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
      _addCheckBox: function _addCheckBox(field) {
        var checkImage = $("<span>").html(this._assets.dontImg).addClass("plate-setup-tab-check-box bg-light").data("clicked", false);
        var linkedFieldId = field.full_id;
        checkImage.data("linkedFieldId", linkedFieldId);
        field.root.find(".plate-setup-tab-field-left-side").empty().append(checkImage);

        this._applyCheckboxHandler(checkImage); // Adding handler for change the image when clicked


        field.checkbox = checkImage;
        this.allCheckboxes.push(linkedFieldId);
      },
      _applyCheckboxHandler: function _applyCheckboxHandler(checkBoxImage) {
        var that = this;
        checkBoxImage.click(function () {
          var checkBox = $(this);
          var changes = {};
          changes[checkBox.data("linkedFieldId")] = !checkBox.data("clicked");
          that.changeCheckboxes(changes);
        });
      },
      getCheckboxes: function getCheckboxes() {
        return this.allCheckboxes.filter(function (fieldId) {
          var field = this.fieldMap[fieldId];

          if (field.mainMultiplexField) {
            var subfields = this.globalSelectedMultiplexSubfield[field.mainMultiplexField.id] || [];
            return subfields.indexOf(field.id);
          } else {
            return this.globalSelectedAttributes.indexOf(field.id) >= 0;
          }
        }, this);
      },
      changeSubFieldsCheckboxes: function changeSubFieldsCheckboxes(field, changes) {
        var that = this;
        var subFieldToInclude = [];
        field.subFieldList.forEach(function (subField) {
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
      changeCheckboxes: function changeCheckboxes(changes, noUndoRedo) {
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

        if (!noUndoRedo) {
          this.addToUndoRedo();
        }
      },
      setSubFieldCheckboxes: function setSubFieldCheckboxes(field, fieldIds) {
        var that = this;
        var subFieldToInclude = [];
        field.subFieldList.forEach(function (subField) {
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
      setCheckboxes: function setCheckboxes(fieldIds, noUndoRedo) {
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
    var dataAdapter = input.data('select2').dataAdapter;
    dataAdapter.addOptions(dataAdapter.convertToOptions(data));
    input.val(selected);
  }

  plateMapWidget.createField = function () {
    // It creates those fields in the tab , there is 4 types of them.
    return {
      _createField: function _createField(field) {
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
      _handleFieldUnits: function _handleFieldUnits(field) {
        var data = field.data; // Adding unit

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

          this._makeFieldUnits(field);
        }
      },
      _makeFieldUnits: function _makeFieldUnits(field) {
        var full_id = field.full_id;
        var units = field.units;
        var defaultUnit = field.defaultUnit;
        var unitInput = null;
        field.disabledRegular = field.disabled;
        field.parseRegularValue = field.parseValue;
        field.setRegularValue = field.setValue;
        field.getRegularValue = field.getValue;
        field.getRegularText = field.getText;

        if (units.length) {
          if (units.length === 1) {
            var unitText = $("<div></div>").addClass("plate-setup-tab-unit");
            unitText.text(defaultUnit);
            field.root.find(".plate-setup-tab-field-container").append(unitText);
          } else {
            unitInput = this._createElement("<select/>").attr("id", full_id + "Units").addClass("plate-setup-tab-unit-select-field");
            field.root.find(".plate-setup-tab-field-container").append(unitInput);
            var selected = null;
            var unitData = units.map(function (unit) {
              var o = {
                id: unit,
                text: unit
              };

              if (unit === defaultUnit) {
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

        field.disabled = function (bool) {
          bool = field.disabledRegular(bool);

          if (unitInput) {
            unitInput.prop("disabled", bool);
          }

          return bool;
        };

        field.parseValue = function (value) {
          var v;

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
          var v = field.getRegularValue();

          if (v === null) {
            return null;
          } else {
            var _ret = function () {
              var returnVal = {
                value: v,
                unit: field.getUnit()
              };

              if (field.data.hasMultiplexUnit) {
                // include unitTypeId and UnitId to returnVal
                var unitMap = field.data.unitMap;

                var _loop = function _loop(unitTypeKey) {
                  if (!unitMap.hasOwnProperty(unitTypeKey)) {
                    return "continue";
                  }

                  var unitTypeUnits = unitMap[unitTypeKey];
                  unitTypeUnits.forEach(function (unit) {
                    if (unit.text === returnVal.unit) {
                      returnVal['unitTypeId'] = unitTypeKey;
                      returnVal['unitId'] = unit.id;
                    }
                  });
                };

                for (var unitTypeKey in unitMap) {
                  var _ret2 = _loop(unitTypeKey);

                  if (_ret2 === "continue") continue;
                }
              }

              return {
                v: returnVal
              };
            }();

            if (_typeof(_ret) === "object") return _ret.v;
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
          var newUnits = [];
          var selected = null;

          if (field.units && field.units.length) {
            field.defaultUnit = field.units[0];
            newUnits = field.units.map(function (curUnit) {
              var cleanUnit = {
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

          for (var i = 0; i < units.length; i++) {
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
        }; // val now contains unit


        field.getText = function (val) {
          if (_typeof(val) === 'object' && val) {
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

        field.parseText = function (v) {
          var value = field.parseValue(v);

          if (value && _typeof(value) === "object") {
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
      _createTextField: function _createTextField(field) {
        var input = this._createElement("<input>").attr("id", field.full_id).addClass("plate-setup-tab-input");

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
      _createOpts: function _createOpts(config) {
        var opts = {
          allowClear: true,
          placeholder: "select"
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
      _createSelectField: function _createSelectField(field) {
        var full_id = field.full_id;
        var that = this;

        var input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-select-field").addClass("plate-setup-tab-input");

        field.root.find(".plate-setup-tab-field-container").append(input);

        var opts = that._createOpts(field.data);

        var optMap = {};
        opts.data.forEach(function (opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);
        select2fix(input);

        var parseValue = function parseValue(value) {
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
            throw "Invalid text value " + value + " for select field " + full_id;
          }
        };

        input.on("change", function () {
          field.onChange();
        });
        field.input = input;
      },
      _createMultiSelectField: function _createMultiSelectField(field) {
        var full_id = field.full_id;
        var that = this;

        var input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-multiselect-field");

        input.attr("multiple", "multiple");
        field.root.find(".plate-setup-tab-field-container").append(input);

        var opts = that._createOpts(field.data);

        opts.multiple = true;
        var optMap = {};
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
            return v.map(function (v) {
              return optMap[String(v)].text;
            }).join("; ");
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

          var data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };

          that._addAllData(data);
        };

        field.parseText = function (value) {
          var v = value;

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
          var v = field._parseOne(e.params.data.id);

          v = {
            id: v
          };
          field.multiOnChange(v, null);
        });
        input.on("select2:unselect", function (e) {
          var v = field._parseOne(e.params.data.id);

          v = {
            id: v
          };
          field.multiOnChange(null, v);
        });
        field.input = input;

        that._createDeleteButton(field);
      },
      _createNumericField: function _createNumericField(field) {
        var full_id = field.full_id;
        var data = field.data;

        var input = this._createElement("<input>").addClass("plate-setup-tab-input").attr("placeholder", data.placeholder || "").attr("id", full_id);

        field.root.find(".plate-setup-tab-field-container").append(input);

        field.disabled = function (bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };

        var parseValue = function parseValue(value) {
          if (value == null) {
            return null;
          }

          var v = String(value).trim();

          if (v === "") {
            return null;
          }

          v = Number(value);

          if (isNaN(v)) {
            throw "Invalid value " + value + " for numeric field " + full_id;
          }

          return v;
        };

        field.parseValue = parseValue;

        field.getValue = function () {
          var v = input.val().trim();

          if (v === "") {
            v = null;
          } else {
            v = Number(v);

            if (isNaN(v)) {
              v = null;
            }
          }

          return v;
        };

        field.setValue = function (value) {
          input.val(value);
        };

        var getText = function getText(v) {
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

        input.on("input", function () {
          var v = field.getRegularValue();

          if (isNaN(v)) {
            //flag field as invalid
            input.addClass("invalid");
          } else {
            input.removeClass("invalid");
          }

          field.onChange();
        });
        field.input = input;
      },
      _createBooleanField: function _createBooleanField(field) {
        var full_id = field.full_id;

        var input = this._createElement("<select/>").attr("id", full_id).addClass("plate-setup-tab-select-field");

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

          var v = String(value).trim().toLowerCase();

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
      _createMultiplexField: function _createMultiplexField(field) {
        var that = this; // make correct multiplex data

        this._createMultiSelectField(field); // single select


        var nameContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");

        var fieldContainer1 = this._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");

        field.root.find(".plate-setup-tab-field-right-side").append(nameContainer1, fieldContainer1);
        field.singleSelect = this._createElement("<select/>").attr("id", field.full_id + "SingleSelect").addClass("plate-setup-tab-multiplex-single-select-field");
        field.singleSelect.appendTo(fieldContainer1);
        var opts = {
          allowClear: false,
          placeholder: "select",
          minimumResultsForSearch: 10,
          data: []
        };
        field.singleSelect.select2(opts);
        select2fix(field.singleSelect);
        var multiselectSetValue = field.setValue;

        field.singleSelectValue = function () {
          var v = field.singleSelect.val();

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

        var setSingleSelectOptions = function setSingleSelectOptions(data, selected) {
          data = data || [];

          if (field.allSelectedMultipleVal) {
            var count = Object.values(field.allSelectedMultipleVal).reduce(function (a, b) {
              return a + b;
            }, 0);

            if (count) {
              var all_option = {
                id: '[ALL]',
                text: "[".concat(count, " well ").concat(field.data.name, "]"),
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

        var singleSelectChange = function singleSelectChange() {
          var v = field.singleSelectValue();
          field.updateSubFieldUnitOpts(v);
          var curSubField = null;

          if (v === '[ALL]') {
            curSubField = field.allSelectedMultipleData;
          } else {
            var curData = field.detailData || [];
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
          var newSubFieldValue = {};

          for (var i = 0; i < field.subFieldList.length; i++) {
            var subFieldId = field.subFieldList[i].id;
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

        field.setValue = function (v) {
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          var multiselectValues = null;

          if (v && v.length) {
            multiselectValues = v.map(function (val) {
              return val[field.id];
            });
          }

          multiselectSetValue(multiselectValues);
          var newOptions = field.input.select2('data') || [];
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
          var v = value;

          if (v && v.length) {
            v = v.map(function (opt) {
              var valMap = {};
              valMap[field.id] = opt[field.id];

              var _loop2 = function _loop2(subFieldId) {
                if (opt.hasOwnProperty(subFieldId)) {
                  field.subFieldList.forEach(function (subField) {
                    if (subField.id === subFieldId) {
                      valMap[subField.id] = subField.parseValue(opt[subFieldId]);
                    }
                  });
                }
              };

              for (var subFieldId in opt) {
                _loop2(subFieldId);
              }

              return valMap;
            });
          } else {
            v = null;
          }

          return v;
        };

        field.updateSubFieldUnitOpts = function (val) {
          var curOpts;
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

          var v = field.getValue();
          var curData = field.detailData;
          var curIds = [];
          var curOpt = null; //reshape data for saveback

          if (curData) {
            curIds = curData.map(function (val) {
              return val[field.id];
            });
          }

          var newMultiplexVal = [];
          var selectList = [];

          if (v) {
            v.forEach(function (selectedVal) {
              if (curData) {
                curData.forEach(function (val) {
                  if (val[field.id] === selectedVal) {
                    newMultiplexVal.push(val);
                  }
                });
              } // cases when adding new data


              if (curIds.indexOf(selectedVal) < 0) {
                var newVal = {};
                newVal[field.id] = selectedVal;
                field.updateSubFieldUnitOpts(selectedVal);
                field.subFieldList.forEach(function (subfield) {
                  // special handling for subfield which has multiplexUnit
                  if (subfield.hasUnits) {
                    if (subfield.data.hasMultiplexUnit) {
                      subfield.disabled(false);
                      field.data.options.forEach(function (opt) {
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
            }); // make data for single select options

            v.forEach(function (selectVal) {
              field.data.options.forEach(function (opt) {
                if (opt.id === selectVal) {
                  selectList.push(opt);
                }
              });
            });
            var selected = field.singleSelectValue();

            for (var i = 0; i < v.length; i++) {
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
          } // get subfields that is selected from the checkbox


          if (field.id in that.globalSelectedMultiplexSubfield) {
            var _ret3 = function () {
              var checkedSubfields = that.globalSelectedMultiplexSubfield[field.id];
              var returnVal = [];

              var _loop3 = function _loop3(valIdx) {
                if (!v.hasOwnProperty(valIdx)) {
                  return "continue";
                }

                var subV = v[valIdx];
                var subText = [];

                for (var optId in field.data.options) {
                  if (field.data.options.hasOwnProperty(optId)) {
                    var opt = field.data.options[optId];

                    if (opt.id === subV[field.id]) {
                      subText.push(opt.text);
                    }
                  }
                }

                field.subFieldList.forEach(function (subField) {
                  if (checkedSubfields.indexOf(subField.id) >= 0) {
                    var x = subField.getText(subV[subField.id]);
                    subText.push(subField.name + ": " + x);
                  }
                });
                returnVal.push("{" + subText.join(", ") + "}");
              };

              for (var valIdx in v) {
                var _ret4 = _loop3(valIdx);

                if (_ret4 === "continue") continue;
              }

              return {
                v: returnVal.join(";")
              };
            }();

            if (_typeof(_ret3) === "object") return _ret3.v;
          }
        };

        field.parseText = function (v) {
          if (v === null) {
            return "";
          } else {
            var returnVal = [];

            var _loop4 = function _loop4(valIdx) {
              if (!v.hasOwnProperty(valIdx)) {
                return "continue";
              }

              var subV = v[valIdx];
              var subText = [];

              for (var optId in field.data.options) {
                if (field.data.options.hasOwnProperty(optId)) {
                  var opt = field.data.options[optId];

                  if (opt.id === subV[field.id]) {
                    subText.push(opt.text);
                  }
                }
              }

              field.subFieldList.forEach(function (subField) {
                var x = subField.getText(subV[subField.id]);

                if (x) {
                  subText.push(x);
                }
              });
              returnVal.push(subText);
            };

            for (var valIdx in v) {
              var _ret5 = _loop4(valIdx);

              if (_ret5 === "continue") continue;
            }

            return returnVal;
          }
        };

        field.checkMultiplexCompletion = function (valList) {
          var valCount = 0;
          var completionPct = 0;
          var include = false;

          function getSubfieldStatus(vals) {
            var req = 0;
            var fill = 0;

            for (var subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }

              var subField = field.subFieldList[subFieldId];
              var curVal = vals[subField.id];

              if (subField.required) {
                include = true;
                req++;

                if (_typeof(curVal) === 'object' && curVal) {
                  if (curVal.value) {
                    fill++;
                  }
                } else if (curVal) {
                  fill++;
                }
              }
            }

            return fill / req;
          } // for cases has value in multiplex field


          if (valList) {
            if (valList.length > 0) {
              for (var idx in valList) {
                if (valList.hasOwnProperty(idx)) {
                  valCount++;
                  var vals = valList[idx];
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
        }; // valList contains all of the vals for selected val


        field.applyMultiplexSubFieldColor = function (valList) {
          function updateSubFieldWarningMap(vals) {
            for (var subFieldId in field.subFieldList) {
              if (!field.subFieldList.hasOwnProperty(subFieldId)) {
                continue;
              }

              var subField = field.subFieldList[subFieldId]; // loop through each well's multiplexval list

              if (vals === null) {
                if (field.required && subField.required) {
                  subFieldWarningMap[subField.id].warningStatus.push(true);
                }
              } else if (_typeof(vals) === "object") {
                if (vals.length === 0) {
                  if (field.required && subField.required) {
                    subFieldWarningMap[subField.id].warningStatus.push(true);
                  }
                } else {
                  for (var multiplexIdx in vals) {
                    if (!vals.hasOwnProperty(multiplexIdx)) {
                      continue;
                    }

                    var curVal = vals[multiplexIdx][subField.id];

                    if (subField.required) {
                      if (_typeof(curVal) === 'object' && curVal) {
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
          }); // turn off main field when all subfield are filled

          var mainFieldStatus = [];

          for (var subFieldId in subFieldWarningMap) {
            if (!subFieldWarningMap.hasOwnProperty(subFieldId)) {
              continue;
            }

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

          var mainFieldWarning = mainFieldStatus.indexOf(true) >= 0;
          var warningText;

          if (field.required) {
            warningText = field.name + " is a required field, please also fix missing required subfield(s) below";
          } else {
            warningText = field.name + " is not a required field, please fix missing required subfield(s) below or remove selected " + field.name;
          }

          that.fieldWarningMsg(field, warningText, mainFieldWarning);
        };

        field.parseMainFieldVal = function (val) {
          var optMap = field.data.options;

          for (var idx = 0; idx < optMap.length; idx++) {
            var curOpt = optMap[idx];

            if (curOpt.id === val) {
              return curOpt.text;
            }
          }
        };
      },
      _deleteDialog: function _deleteDialog(field) {
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
            deleteCheckedButton.click(function () {
              table.find("input:checked").each(function () {
                var val = this.value;
                field.multiOnChange(null, {
                  id: val
                });
              }); // refresh selected fields after updating the multiplex field value

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

        window.onclick = function (event) {
          if (event.target === dialogDiv[0]) {
            killDialog();
          }
        };
      },
      _deleteDialogTable: function _deleteDialogTable(field, valMap) {
        var that = this;
        var colName = [field.name, "Counts"]; //Added because it was missing... no idea what the original should have been

        if (!that.readOnly) {
          colName.push("Delete");
        }

        var table = $('<table/>');
        var thead = $('<thead/>').appendTo(table);
        var tr = $('<tr/>').appendTo(thead);
        tr.append(colName.map(function (text) {
          return $('<th/>').text(text);
        }));
        var tbody = $("<tbody/>").appendTo(table);
        field.data.options.forEach(function (opt) {
          if (opt.id in valMap) {
            var _tr = $('<tr/>').appendTo(tbody);

            var checkbox = $("<input type='checkbox'>").prop("value", opt.id);
            $("<td/>").text(opt.text).appendTo(_tr);
            $("<td/>").text(valMap[opt.id]).appendTo(_tr);

            if (!that.readOnly) {
              $("<td/>").append(checkbox).appendTo(_tr);
            }
          }
        });
        return table;
      },
      _createDeleteButton: function _createDeleteButton(field) {
        var that = this;
        var deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + "...");

        var buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");

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
        wellEmpty: function wellEmpty(well) {
          for (var prop in well) {
            if (!well.hasOwnProperty(prop)) {
              continue;
            }

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
        searchAndStack: function searchAndStack() {
          // This method search and stack the change we made.
          this.stackUpWithColor = {};
          this.stackPointer = 1;
          var derivativeJson = {};

          for (var idx in this.derivative) {
            if (!this.derivative.hasOwnProperty(idx)) {
              continue;
            }

            var data = this.derivative[idx];
            var wellData = {};

            for (var i = 0; i < THIS.globalSelectedAttributes.length; i++) {
              var attr = THIS.globalSelectedAttributes[i];

              if (attr in THIS.globalSelectedMultiplexSubfield) {
                var selectedSubFields = THIS.globalSelectedMultiplexSubfield[attr];
                var newMultiplexVal = [];

                var _loop5 = function _loop5(multiplexIdx) {
                  if (!data[attr].hasOwnProperty(multiplexIdx)) {
                    return "continue";
                  }

                  var curMultiplexVals = data[attr][multiplexIdx];
                  var newVal = {};
                  newVal[attr] = curMultiplexVals[attr];
                  selectedSubFields.forEach(function (subFieldId) {
                    newVal[subFieldId] = curMultiplexVals[subFieldId];
                  });
                  newMultiplexVal.push(newVal);
                };

                for (var multiplexIdx in data[attr]) {
                  var _ret6 = _loop5(multiplexIdx);

                  if (_ret6 === "continue") continue;
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
            var keys = Object.keys(derivativeJson).map(parseFloat);
            keys.sort(function (a, b) {
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
              for (var _i = 0; _i < keys.length; _i++) {
                var _idx = keys[_i];

                if (referenceDerivative === derivativeJson[_idx]) {
                  arr.push(_idx);
                  this.stackUpWithColor[this.stackPointer] = arr;
                  delete derivativeJson[_idx];
                }
              }

              if (arr.length > 0) this.stackPointer++;
            }
          }
        },
        applyColors: function applyColors() {
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

              for (var _i2 = 0; _i2 < arr.length; _i2++) {
                wholeNoTiles++;
                var index = this.stackUpWithColor[color][_i2];
                var _tile = THIS.allTiles[index];
                var well = this.derivative[index];
                this.colorMap.set(index, color);
                THIS.setTileColor(_tile, color); // Checks if all the required fields are filled

                var completion = this.checkCompletion(well, _tile);
                THIS.setTileComplete(_tile, completion === 1);
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
        checkCompletion: function checkCompletion(wellData) {
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
  plateMapWidget["interface"] = function () {
    // interface holds all the methods to put the interface in place
    return {
      _createInterface: function _createInterface() {
        var divIdentifier = '<div></div>';
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

        this._placePresetTabs(); // Bottom of the screen


        this._bottomScreen();

        this.bottomForFirstTime();
        var that = this;

        this._setShortcuts();

        $(document.body).keyup(function (e) {
          that._handleShortcuts(e);
        });

        this._configureUndoRedoArray();
      },
      _createElement: function _createElement(element) {
        return $(element);
      },
      _setShortcuts: function _setShortcuts() {
        var that = this;
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
      _handleShortcuts: function _handleShortcuts(e) {
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
    loadPlate: function loadPlate(data) {
      //sanitize input
      var derivative;

      if (data.hasOwnProperty('wells')) {
        derivative = {};

        for (var address in data.wells) {
          var well = data.wells[address];
          var index = this.addressToIndex(address);
          derivative[index] = this.sanitizeWell(well);
        }
      } else {
        derivative = this.engine.derivative;
      }

      var checkboxes;

      if (data.hasOwnProperty('checkboxes')) {
        checkboxes = this.sanitizeCheckboxes(data.checkboxes);
      } else {
        checkboxes = this.getCheckboxes();
      }

      var sanitized = {
        "derivative": derivative,
        "checkboxes": checkboxes
      };
      this.setData(sanitized);
    },
    sanitizeCheckboxes: function sanitizeCheckboxes(checkboxes) {
      checkboxes = checkboxes || [];
      return this.allCheckboxes.filter(function (fieldId) {
        return checkboxes.indexOf(fieldId) >= 0;
      });
    },
    sanitizeAddresses: function sanitizeAddresses(selectedAddresses) {
      selectedAddresses = selectedAddresses || [];
      var indices = selectedAddresses.map(this.addressToIndex, this);
      indices.sort();
      indices = indices.filter(function (index, i) {
        return indices.indexOf(index) === i;
      });
      return indices;
    },
    sanitizeWell: function sanitizeWell(well) {
      var newWell = {};
      this.fieldList.forEach(function (field) {
        newWell[field.id] = field.parseValue(well[field.id]);
      });
      return newWell;
    },
    setData: function setData(data, quiet) {
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
      _createOverLay: function _createOverLay() {
        var that = this;
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
      clearCriteria: function clearCriteria() {
        if (this.selectedIndices && this.selectedIndices.length) {
          var hasWellUpdate = false;
          var selectedIndices = this.selectedIndices;
          var well;

          for (var i = 0; i < selectedIndices.length; i++) {
            var index = selectedIndices[i];

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
      copyCriteria: function copyCriteria() {
        if (this.selectedIndices && this.selectedIndices.length) {
          var wells = this._getSelectedWells();

          this.commonData = this._getCommonData(wells);
        } else {
          alert("Please select any well.");
        }
      },
      pasteCriteria: function pasteCriteria() {
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
  addressToLoc: function addressToLoc(address) {
    var m = /^([A-Z]+)(\d+)$/.exec(address.trim().toUpperCase());

    if (m) {
      var row_v = m[1];
      var col = parseInt(m[2]) - 1;
      var row = 0;

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
      throw address + " not a proper plate address";
    }
  },
  locToIndex: function locToIndex(loc, dimensions) {
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
  addressToIndex: function addressToIndex(address, dimensions) {
    var loc = this.addressToLoc(address);
    return this.locToIndex(loc, dimensions);
  },
  _rowKey: function _rowKey(i) {
    var c1 = i % 26;
    var c2 = (i - c1) / 26;
    var code = String.fromCharCode(65 + c1);

    if (c2 > 0) {
      code = String.fromCharCode(64 + c2) + code;
    }

    return code;
  },
  _colKey: function _colKey(i) {
    return (i + 1).toString(10);
  },
  indexToLoc: function indexToLoc(index, dimensions) {
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
  locToAddress: function locToAddress(loc) {
    return this._rowKey(loc.r) + this._colKey(loc.c);
  },
  indexToAddress: function indexToAddress(index, dimensions) {
    var loc = this.indexToLoc(index, dimensions);
    return this.locToAddress(loc);
  },
  getDimensions: function getDimensions() {
    return $.extend(true, {}, this.dimensions);
  },
  _create: function _create() {
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

    this.target = this.element[0].id ? "#" + this.element[0].id : "." + this.element[0].className; // Import classes from other files.. Here we import it using extend and add it to this
    // object. internally we add to widget.DNA.getPlates.prototype.
    // Helpers are methods which return other methods and objects.
    // add Objects to plateMapWidget and it will be added to this object.
    // set read only well

    if (this.options.readOnly) {
      this.isReadOnly(true);
    }

    for (var component in plateMapWidget) {
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
  _init: function _init() {// This is invoked when the user use the plugin after _create is called.
    // The point is _create is invoked for the very first time and for all other
    // times _init is used.
  },
  // wellsData follows syntax: {A1:{field1: val1, field2: val2}, A2:{field1: val1, field2: val2}}
  getTextDerivative: function getTextDerivative(wellsData) {
    var textDerivative = {};
    var fieldMap = this.fieldMap;

    for (var address in wellsData) {
      if (!wellsData.hasOwnProperty(address)) {
        continue;
      }

      var textValWell = {};
      var textFieldIdWell = {};
      var curWellData = wellsData[address];

      for (var fieldId in curWellData) {
        if (!curWellData.hasOwnProperty(fieldId)) {
          continue;
        }

        if (fieldId in fieldMap) {
          var field = fieldMap[fieldId];
          var textVal = field.parseText(curWellData[fieldId]);
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
  getWellsDifferences: function getWellsDifferences(wellsHash) {
    var wells = [];

    for (var wellId in wellsHash) {
      if (wellsHash.hasOwnProperty(wellId)) {
        wells.push(wellsHash[wellId]);
      }
    }

    var differentWellsVals = {};

    if (wells.length > 1) {
      var commonWell = this._getCommonWell(wells);

      var allFieldVal = {};

      for (var fieldIdx in wells[0]) {
        if (wells[0].hasOwnProperty(fieldIdx)) {
          allFieldVal[fieldIdx] = [];
        }
      }

      for (var address in wellsHash) {
        if (!wellsHash.hasOwnProperty(address)) {
          continue;
        }

        var diffWellVal = {};
        var curWellData = wellsHash[address];

        for (var fieldId in curWellData) {
          if (!curWellData.hasOwnProperty(fieldId)) {
            continue;
          }

          var commonVal = commonWell[fieldId];
          var curVal = curWellData[fieldId];

          if (commonVal === undefined) {
            commonVal = null;
          }

          if (curVal === undefined) {
            curVal = null;
          }

          var newVal = null;

          if (Array.isArray(curVal)) {
            commonVal = commonVal || []; // get uncommonVal

            newVal = [];

            for (var idx = 0; idx < curVal.length; idx++) {
              var curMultiVal = curVal[idx]; // multiplex field

              if (curMultiVal && _typeof(curMultiVal) === "object") {
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
          } else if (curVal && _typeof(curVal) === "object") {
            if (commonVal && _typeof(commonVal) === "object") {
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
      } // clean up step for fields that are empty


      for (var _fieldId in allFieldVal) {
        if (!allFieldVal.hasOwnProperty(_fieldId)) {
          continue;
        }

        if (allFieldVal[_fieldId].length === 0) {
          for (var _address in differentWellsVals) {
            if (!differentWellsVals.hasOwnProperty(_address)) {
              continue;
            }

            delete differentWellsVals[_address][_fieldId];
          }
        }
      }

      return differentWellsVals;
    } else if (wells.length > 0) {
      var _differentWellsVals = {};

      for (var _address2 in wellsHash) {
        if (!wellsHash.hasOwnProperty(_address2)) {
          continue;
        }

        var _diffWellVal = {};
        var _curWellData = wellsHash[_address2];

        for (var _fieldId2 in _curWellData) {
          if (!_curWellData.hasOwnProperty(_fieldId2)) {
            continue;
          }

          var _curVal = _curWellData[_fieldId2];

          if (Array.isArray(_curVal)) {
            if (_curVal.length > 0) {
              _diffWellVal[_fieldId2] = _curVal;
            }
          } else if (_curVal) {
            _diffWellVal[_fieldId2] = _curVal;
          }
        }

        _differentWellsVals[_address2] = _diffWellVal;
      }

      return _differentWellsVals;
    }
  },
  setFieldsDisabled: function setFieldsDisabled(flag) {
    this.fieldList.forEach(function (field) {
      field.disabled(flag);
    });
  },
  isReadOnly: function isReadOnly(flag) {
    this.readOnly = !!flag;
    this.readOnlyHandler();
  },
  readOnlyHandler: function readOnlyHandler() {
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
  isDisableAddDeleteWell: function isDisableAddDeleteWell(flag, emptyDefaultWell) {
    if (flag) {
      var emptyWellWithDefaultVal = $.extend(true, {}, this.defaultWell);

      if (emptyDefaultWell) {
        for (var field in emptyDefaultWell) {
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
      this.addressAllowToEdit = this.getWellSetAddressWithData(); // configure undo redo action

      this.actionPointer = 0;
      this.undoRedoArray = [this.createState()];
      this.emptyWellWithDefaultVal = emptyWellWithDefaultVal;
    } else {
      this.disableAddDeleteWell = false;
      this.emptyWellWithDefaultVal = null;
    }

    this.readOnlyHandler();
  },
  selectObjectInBottomTab: function selectObjectInBottomTab() {
    var colors = [];
    var selectedIndices = this.selectedIndices;

    for (var i = 0; i < selectedIndices.length; i++) {
      var index = selectedIndices[i];
      var well = this.engine.derivative[index];

      if (well) {
        var color = this.engine.colorMap.get(index);

        if (colors.indexOf(color) < 0) {
          colors.push(color);
        }
      }
    }

    var trs = document.querySelectorAll('table.plate-setup-bottom-table tr');

    for (var _i3 = 1; _i3 < trs.length; _i3++) {
      // start at 1 to skip the table headers
      var tr = trs[_i3];
      var td = tr.children[0];
      var isSelected = colors.indexOf(Number(td.querySelector('button').innerHTML)) >= 0;
      tr.classList.toggle("selected", isSelected);
    }
  },
  getSelectedIndices: function getSelectedIndices() {
    return this.selectedIndices.slice();
  },
  getSelectedAddresses: function getSelectedAddresses() {
    return this.selectedIndices.map(function (index) {
      return this.allTiles[index].address;
    }, this);
  },
  setSelectedAddresses: function setSelectedAddresses(addresses, noUndoRedo) {
    var indices = this.sanitizeAddresses(addresses);
    this.setSelectedIndices(indices, noUndoRedo);
  },
  setSelectedIndices: function setSelectedIndices(indices, noUndoRedo) {
    if (!indices || indices.length === 0) {
      indices = [0];
    } // Indices should be sanitized


    this.setSelection(indices); //this._colorMixer();

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
      _placePresetTabs: function _placePresetTabs() {
        var _this = this;

        var presets = this.options.attributes.presets;

        if (presets && presets.length) {
          this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container").text("Checkbox presets");
          this.tabContainer.append(this.wellAttrContainer);
          this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
          this.tabContainer.append(this.presetTabContainer);

          var _loop6 = function _loop6(i) {
            var preset = presets[i];

            var divText = _this._createElement("<div></div>").addClass("plate-setup-preset-tab-div").text(preset.title);

            var presetButton = _this._createElement("<div></div>").addClass("plate-setup-preset-tab").data("preset", preset.fields).append(divText);

            _this.presetTabContainer.append(presetButton);

            var that = _this;
            presetButton.click(function () {
              var preset = $(this);

              that._selectPreset(preset);
            });

            _this.presets.push(presetButton);
          };

          for (var i = 0; i < presets.length; i++) {
            _loop6(i);
          }
        }
      },
      _clearPresetSelection: function _clearPresetSelection() {
        for (var j = 0; j < this.presets.length; j++) {
          var p = this.presets[j];
          p.removeClass("plate-setup-preset-tab-selected").addClass("plate-setup-preset-tab");
        }
      },
      _selectPreset: function _selectPreset(preset) {
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
      _createSvg: function _createSvg() {
        this.svg = new SVG(this.canvasContainer[0]);
        this.svg.attr('preserveAspectRatio', 'xMidYMin meet');
        var ls = this.baseSizes.label_spacing;
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
      _fixRowAndColumn: function _fixRowAndColumn() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;
        var rh = this.svg.nested().attr({
          'x': -this.baseSizes.label_spacing / 2.0
        }).addClass('rowHead');
        var ch = this.svg.nested().attr({
          'y': -this.baseSizes.label_spacing / 2.0
        }).addClass('colHead');

        for (var i = 0; i < rows; i++) {
          rh.plain(this._rowKey(i)).attr({
            y: this.baseSizes.spacing * (i + 0.5)
          });
        }

        for (var _i4 = 0; _i4 < cols; _i4++) {
          ch.plain(this._colKey(_i4)).attr({
            x: this.baseSizes.spacing * (_i4 + 0.5)
          });
        }
      },
      _putCircles: function _putCircles() {
        var cols = this.dimensions.cols;
        var rows = this.dimensions.rows;
        this.allTiles = Array(cols * rows);

        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            var tile = this._createTile(row, col);

            this.allTiles[tile.index] = tile;
          }
        }
      },
      _createTile: function _createTile(r, c) {
        var g = this.svg.nested().move(this.baseSizes.spacing * c, this.baseSizes.spacing * r).addClass('tile');
        var m = this.baseSizes.spacing / 2.0;
        var d = {
          "tile": g
        };
        d.r = r;
        d.c = c;
        d.index = this.locToIndex(d);
        d.address = this.locToAddress(d);
        g.rect(this.baseSizes.spacing, this.baseSizes.spacing).addClass('highlight');
        g.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('well').fill(this.wellShadow);
        var tf = g.group().addClass('fill');
        d["circle"] = tf.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('circle').fill(this.wellColors[0]);
        tf.circle(this.baseSizes.center_radius_complete * 2).center(m, m).addClass('center');
        tf.circle(this.baseSizes.center_radius_incomplete * 2).center(m, m).addClass('center_incomplete');
        d["label"] = tf.plain("0").attr({
          x: m,
          y: m
        }).addClass('label');
        return d;
      },
      setTileComplete: function setTileComplete(tile, complete) {
        if (complete) {
          tile.tile.removeClass('incomplete');
        } else {
          tile.tile.addClass('incomplete');
        }
      },
      setTileVisible: function setTileVisible(tile, visible) {
        if (visible) {
          tile.tile.removeClass('empty');
        } else {
          tile.tile.addClass('empty');
        }
      },
      setTileColor: function setTileColor(tile, color) {
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
      _svgEvents: function _svgEvents() {
        // Set up event handling.
        var that = this;

        function getMousePosition(evt) {
          var CTM = that.svg.node.getScreenCTM();
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
          var s = that.baseSizes.spacing;
          var c = dimCoord(pos.x / s, that.dimensions.cols);
          var r = dimCoord(pos.y / s, that.dimensions.rows);
          return {
            r: r,
            c: c
          };
        }

        function selectionBoxPosition(pos0, pos1) {
          var d0 = posToLoc(pos0);
          var d1 = posToLoc(pos1);
          var s = that.baseSizes.spacing;
          var x0 = Math.min(d0.c, d1.c) * s;
          var y0 = Math.min(d0.r, d1.r) * s;

          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }

          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }

          var x1 = (Math.max(d0.c, d1.c) + 1) * s;
          var y1 = (Math.max(d0.r, d1.r) + 1) * s;
          return {
            x: x0,
            y: y0,
            width: x1 - x0,
            height: y1 - y0
          };
        }

        function selectTiles(pos0, pos1, secondary) {
          var d0 = posToLoc(pos0);
          var d1 = posToLoc(pos1);
          var extending = true;

          if (secondary) {
            // if d0 is already selected, we are deselecting
            var startIdx = that.locToIndex(d0);
            extending = that.selectedIndices.indexOf(startIdx) < 0;
          }

          var c0 = Math.min(d0.c, d1.c);
          var r0 = Math.min(d0.r, d1.r);

          if (pos0.x < 0) {
            d0.c = that.dimensions.cols - 1;
          }

          if (pos0.y < 0) {
            d0.r = that.dimensions.rows - 1;
          }

          var c1 = Math.max(d0.c, d1.c);
          var r1 = Math.max(d0.r, d1.r);
          var indices = [];

          for (var r = r0; r <= r1; r++) {
            for (var c = c0; c <= c1; c++) {
              var index = that.locToIndex({
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
              indices = that.selectedIndices.filter(function (index) {
                return indices.indexOf(index) < 0;
              });
            }
          }

          that.setSelectedIndices(indices.sort());
        }

        var selectionBox;

        function startDrag(evt) {
          if (selectionBox) {
            selectionBox.remove();
          }

          var pos = getMousePosition(evt);
          var attrs = selectionBoxPosition(pos, pos);
          selectionBox = that.svg.rect().attr(attrs).fill('rgba(0, 0, 1, 0.2)');
          selectionBox.data('origin', pos);
        }

        function drag(evt) {
          if (selectionBox) {
            var pos = getMousePosition(evt);
            var attrs = selectionBoxPosition(selectionBox.data('origin'), pos);
            selectionBox.attr(attrs);
          }
        }

        function endDrag(evt) {
          if (selectionBox) {
            var startPos = selectionBox.data('origin');
            var pos = getMousePosition(evt);
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
      setSelection: function setSelection(selectedIndices) {
        this.selectedIndices = selectedIndices;

        this._setSelectedTiles();

        document.activeElement.blur();
      },
      _setSelectedTiles: function _setSelectedTiles() {
        // Update selected tile display only
        var selectedIndices = this.selectedIndices;
        this.allTiles.forEach(function (tile) {
          var selected = selectedIndices.indexOf(tile.index) >= 0;

          if (selected) {
            tile.tile.addClass('selected');
          } else {
            tile.tile.removeClass('selected');
          }
        });
      },
      _getSelectedWells: function _getSelectedWells() {
        return this.selectedIndices.map(function (index) {
          var well = this.engine.derivative[index];

          if (!well) {
            well = this.defaultWell;
          }

          return well;
        }, this);
      },
      containsObject: function containsObject(obj, list) {
        function deepEqual(x, y) {
          if (x === y) {
            return true;
          } else if (_typeof(x) == "object" && x != null && _typeof(y) == "object" && y != null) {
            if (Object.keys(x).length !== Object.keys(y).length) {
              return false;
            }

            for (var prop in x) {
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
          for (var i = 0; i < list.length; i++) {
            if (deepEqual(obj, list[i])) {
              return true;
            }
          }
        }

        return false;
      },
      _buildCommonData: function _buildCommonData(commonData, obj, field) {
        var commonVal = commonData[field];

        if (commonVal === undefined) {
          commonVal = null;
        }

        var objVal = obj[field];

        if (objVal === undefined) {
          objVal = null;
        }

        if (Array.isArray(commonVal)) {
          var commonArr = [];

          for (var i = 0; i < commonVal.length; i++) {
            var v = commonVal[i]; // for multiplex field

            if (v && _typeof(v) === "object") {
              for (var j = 0; j < objVal.length; j++) {
                var v2 = objVal[j];

                if (v[field] == v2[field]) {
                  v = $.extend(true, {}, v);

                  for (var oField in v) {
                    this._buildCommonData(v, v2, oField);
                  }

                  commonArr.push(v);
                }
              } // if (this.containsObject(v, objVal)) {
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
          if (objVal && _typeof(objVal) === "object" && commonVal && _typeof(commonVal) === "object") {
            if (objVal.value !== commonVal.value || objVal.unit !== commonVal.unit) {
              delete commonData[field];
            }
          } else if (commonVal !== objVal) {
            delete commonData[field];
          }
        }
      },
      _getCommonData: function _getCommonData(wells) {
        var commonData = null;

        for (var i = 0; i < wells.length; i++) {
          var well = wells[i];

          if (well == null) {
            continue;
          }

          if (commonData == null) {
            commonData = $.extend(true, {}, wells[0]);
            continue;
          }

          for (var field in commonData) {
            if (!commonData.hasOwnProperty(field)) {
              continue;
            }

            this._buildCommonData(commonData, well, field);
          }
        }

        return commonData || this.defaultWell;
      },
      _getCommonWell: function _getCommonWell(wells) {
        var commonData = this._getCommonData(wells);

        return this.sanitizeWell(commonData);
      },
      _getAllMultipleVal: function _getAllMultipleVal(wells) {
        var multipleFieldList = this.multipleFieldList;
        var that = this;
        multipleFieldList.forEach(function (multiplexField) {
          if (wells.length) {
            var curMultipleVal = {};
            var multiData = null;
            wells.forEach(function (well) {
              if (well == null) {
                return;
              }

              var id = multiplexField.id;
              var wellFieldVals = well[id];

              if (wellFieldVals && wellFieldVals.length) {
                wellFieldVals.forEach(function (multipleVal) {
                  if (_typeof(multipleVal) === 'object') {
                    if (multiData == null) {
                      multiData = $.extend(true, {}, multipleVal);
                    } else {
                      for (var oField in multiData) {
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
      decideSelectedFields: function decideSelectedFields() {
        var wells = this._getSelectedWells();

        this._getAllMultipleVal(wells);

        this.applyFieldWarning(wells);

        var well = this._getCommonWell(wells);

        this._addDataToTabFields(well);
      },
      // get all wells that have data
      getWellSetAddressWithData: function getWellSetAddressWithData() {
        var indices = Object.keys(this.engine.derivative).map(Number).sort();
        return indices.map(this.indexToAddress, this);
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
      _createTabAtRight: function _createTabAtRight() {
        this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
        $(this.topRight).append(this.tabContainer);
      },
      _createTabs: function _createTabs() {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);
        var tabData = this.options.attributes.tabs;
        var that = this;
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
      _tabClickHandler: function _tabClickHandler(clickedTab) {
        if (this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected").addClass("plate-setup-tab");
          var previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
          this.readOnlyHandler();
        }

        $(clickedTab).addClass("plate-setup-tab-selected");
        this.selectedTab = clickedTab;
        var clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },
      _addDataTabs: function _addDataTabs(tabs) {
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
      addToUndoRedo: function addToUndoRedo() {
        var state = this.createState();

        if (this.actionPointer != null) {
          var i = this.actionPointer + 1;

          if (i < this.undoRedoArray.length) {
            this.undoRedoArray.splice(i, this.undoRedoArray.length - i);
          }
        }

        this.actionPointer = null;
        this.undoRedoArray.push(state);
      },
      _configureUndoRedoArray: function _configureUndoRedoArray() {
        var data = {
          checkboxes: [],
          derivative: {},
          selectedIndices: [0]
        };
        this.undoRedoArray = [];
        this.actionPointer = null;
        this.undoRedoArray.push($.extend({}, data));
      },
      clearHistory: function clearHistory() {
        this.undoRedoArray = this.undoRedoArray.slice(-1);
        this.actionPointer = null;
      },
      undo: function undo() {
        console.log("undo");
        return this.shiftUndoRedo(-1);
      },
      redo: function redo() {
        console.log("redo");
        return this.shiftUndoRedo(1);
      },
      shiftUndoRedo: function shiftUndoRedo(pointerDiff) {
        var pointer = this.actionPointer;

        if (pointer == null) {
          pointer = this.undoRedoArray.length - 1;
        }

        pointer += pointerDiff;
        return this.setUndoRedo(pointer);
      },
      setUndoRedo: function setUndoRedo(pointer) {
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