var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createField = function() {
    // It create those fields in the tab , there is 4 types of them.
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

        if (config.options) {
          opts.data = config.options;
        } else if (config.query) {
          var query = config.query;
          if (config.delay) {
            query = this._debounce(config.delay, query);
          }
          opts.query = query;
        } else {
          throw "Must specify data or query";
        }
        return opts;
      },

      _createSelectField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        var opts = that._createOpts(field.data);
        var optMap = {};
        opts.data.forEach(function(opt) {
          optMap[opt.id] = opt;
        });

        input.select2(opts);

        field.parseValue = function(value) {
          var v = value;

          if (v == "") {
            v = null;
          }
          if (v == null) {
            return null;
          }
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
          var v = input.select2('data');
          return v ? v.id : null;
        };

        field.setValue = function(v) {
          if (v) {
            v = optMap[v];
          }
          input.select2('data', v);
        };

        field.setOpts = function(v) {
          input.select2('data', {});
          opts.data = v || [];
          input.select2(opts);
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          return optMap[v].text;
        };

        field.parseText = function(value) {
          var v = value;

          if (v == "") {
            v = null;
          }
          if (v == null) {
            return null;
          }
          if (v in optMap) {
            return optMap[v].text;
          } else {
            throw "Invalid text value " + value + " for select field " + id;
          }
        };

        input.on("change", function(e, generated) {
          field.onChange();
        });

        field.input = input;
      },

      _createMultiSelectField: function(field) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        var separator = ",";
        var opts = that._createOpts(field.data);
        opts.multiple = true;
        var optMap = {};
        opts.data.forEach(function(opt) {
          optMap[opt.id] = opt;
        });
        input.select2(opts);

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
        };

        field.parseValue = function(value) {
          var v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              if (opt in optMap) {
                return optMap[opt].id;
              } else {
                throw "Invalid value " + opt + " for multiselect field " + id;
              }
            });
          } else {
            v = null;
          }
          return v;
        };

        field.setOpts = function(v) {
          var allOpts = field.data.options;
          var selectedVal = [];
          for (var id in allOpts) {
            var curOpts = allOpts[id];
            if (v.indexOf(curOpts["id"]) >= 0) {
              selectedVal.push(curOpts);
            }
          }

          opts.data = selectedVal;
          input.select2(opts);
        };

        field.getValue = function() {
          var v = input.select2('data');
          if (v.length) {
            return v.map(function(i) {
              return i.id;
            });
          }
          return null;
        };

        field.setValue = function(v) {
          v = v || [];
          v = v.map(function(i) {
            return optMap[i];
          });
          input.select2('data', v);
        };

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          if (v.length > 0) {
            return v.map(function(v) {
              return optMap[v].text
            }).join("; ");
          }
          return "";
        };

        field.multiOnChange = function(added, removed) {
          if (added) {
            added = added.id.toString();
          }
          if (removed) {
            removed = removed.id.toString();
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

        input.on("change", function(e, generated) {
          var added = e.added;
          var removed = e.removed;
          //field.onChange();
          field.multiOnChange(added, removed);
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
            unitInput = this._createElement("<input/>").attr("id", id)
              .addClass("plate-setup-tab-label-select-field");

            field.root.find(".plate-setup-tab-field-container").append(unitInput);

            var selected = null;
            var unitData = units.map(function(unit) {
              var o = {
                id: unit,
                text: unit
              };
              if (unit == defaultUnit) {
                selected = o;
              }
              return o;
            });

            var opts = {
              data: unitData,
              allowClear: false,
              minimumResultsForSearch: 10
            };

            unitInput.select2(opts);
            unitInput.select2("data", selected);
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
                selected = cleanUnit;
              }
              return cleanUnit;
            });
          }

          var newOpts = {
            data: newUnits,
            allowClear: false,
            minimumResultsForSearch: 10
          };
          unitInput.select2(newOpts);
          unitInput.select2("data", selected);
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
            if (unit != null) {
              unit = {
                id: unit,
                text: unit
              };
            }
            unitInput.select2("data", unit);
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
        var input = this._createElement("<input/>").attr("id", id)
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
          minimumResultsForSearch: -1,
          initSelection: function(element, callback) {
            var v = element.val();
            callback({
              id: v,
              text: v
            });
          }
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
          if (v == "true") {
            v = true;
          } else if (v == "false") {
            v = false;
          } else if (v == "") {
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
          if (v == true || v == "true") {
            v = tval;
          } else if (v == false || v == "false") {
            v = fval;
          } else {
            v = null;
          }
          input.select2('data', v);
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

        field.singleSelect = this._createElement("<input/>").attr("id", field.id + "SingleSelect")
          .addClass("plate-setup-tab-multiplex-single-select-field");

        field.singleSelect.appendTo(fieldContainer1);

        field.singleSelectValue = function() {
          var v = field.singleSelect.select2("data");
          if (v != null) {
            v = v.id;
          }
          return v;
        };

        var setSingleSelectOptions = function(v, selected_v) {
          var opts = {
            allowClear: false,
            placeholder: "select",
            minimumResultsForSearch: 10,
            data: v || []
          }
          if (!selected_v) {
            if (opts.data.length) {
              selected_v = opts.data[0];
            } else {
              selected_v = null;
            }
          }
          field.singleSelect.select2('data', []);
          field.singleSelect.select2(opts);
          field.singleSelect.select2('data', selected_v);
          field.singleSelect.prop("disabled", opts.data.length == 0);
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

        field.singleSelect.on("change", singleSelectChange);

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

        var multiselectSetValue = field.setValue;

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
            v.forEach(function(selectId) {
              field.data.options.forEach(function(opt) {
                if (opt.id === selectId) {
                  selectList.push(opt);
                }
              });
            });
            // set the newest selected to be the current obj
            curOpt = selectList[v.length - 1];
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


        var dialogDiv = $("<div/>").addClass("delete-dialog modal");
        $('body').append(dialogDiv);

        function killDialog() {
          dialogDiv.hide();
          dialogDiv.remove();
        }

        var dialogContent = $("<div/>").addClass("modal-content").appendTo(dialogDiv);
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