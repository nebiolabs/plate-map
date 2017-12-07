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
        that.defaultWell.wellData[id] = null;

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

      _createSelectField: function(field, isMultiplex) {
        var id = field.id;
        var that = this;
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        if (isMultiplex) {
          field.root.find(".plate-setup-tab-field-container-singleSelect").append(input);
        } else {
          field.root.find(".plate-setup-tab-field-container").append(input);
          that.defaultWell.wellData[id] = null;
        }
        var opts = that._createOpts(field.data);
        var optMap = {};
        opts.data.forEach(function(opt) {
          optMap[opt.id] = opt;
        });

        if (isMultiplex) {
          opts.allowClear = false;
        }
        input.select2(opts);

        field.parseValue = function(value) {
          var v = value;

          if (isMultiplex) {
            v = v.map(function(val) {
              return val[field.id];
            });

            if (v.length > 0) {
              v = v[0];
            } else {
              v = "";
            }
          }

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
        that.defaultWell.wellData[id] = null;

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

        field.multiOnChange = function (added, removed) {
          if (added) {
            added = added.id.toString();
          }
          if (removed) {
            removed = removed.id.toString();
          }
          var data = {
          };
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };

          that._addAllData(data);
        };

        input.on("change", function(e, generated) {
          var added = e.added;
          var removed = e.removed;
          //field.onChange();
          field.multiOnChange(added, removed);
        });

        field.input = input;
      },

      _createNumericField: function(field) {
        var id = field.id;
        var data = field.data;
        var that = this;
        var input = this._createElement("<input>").addClass("plate-setup-tab-input")
          .attr("placeholder", data.placeholder || "").attr("id", id);

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell.wellData[id] = null;

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

            var unitData = units.map(function(unit) {
              var o = {
                id: unit,
                text: unit
              };
              if (unit == defaultUnit) {
                o.selected = true;
              }
              return o;
            });

            var opts = {
              data: unitData,
              allowClear: false,
              minimumResultsForSearch: 10
            };

            unitInput.select2(opts);
          }
        }

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
          if (unitInput) {
            unitInput.prop("disabled", bool);
          }
        };

        field.setUnitOpts = function(opts) {
          field.units = opts || field.units;
          field.defaultUnit = opts[0];

          var newUnits = opts.map(function(curUnit) {
            var cleanUnit = {};
            if (curUnit.text === field.defaultUnit) {
              cleanUnit.selected = true;
            }
            cleanUnit.id = curUnit;
            cleanUnit.text = curUnit;
            return cleanUnit;
          });

          var newOpts = {
            data: newUnits,
            allowClear: false,
            minimumResultsForSearch: 10
          };
          unitInput.select2(newOpts);
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
            unit = {
              id: unit,
              text: unit
            };
            unitInput.select2("data", unit);
          }
        };

        // val now contains unit
        field.getText = function(val) {
          if (typeof(val) === 'object' && val) {
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
        that.defaultWell.wellData[id] = null;

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
        that.defaultWell.wellData[field.id] = [];

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
            if (removed.value){
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
          var singleSelectField = field.singleSelectField;
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          if (v && v.length) {
            // handling for single select box
            var mainFieldId = v.map(function(val) {
              return val[field.id]
            });
            var optMap = {};
            singleSelectField.data.options.forEach(function(val) {
              optMap[val.id] = val;
            });
            var newOptions = mainFieldId.map(function(i) {
              return optMap[i];
            });
            singleSelectField.setOpts(newOptions);
            if (newOptions.length > 0) {
              singleSelectField.disabled(false);
              var curId = newOptions[0].id;
              var curSubField;
              singleSelectField.setValue(curId);

              // update multiplex subfield unit options
              field.updateSubFieldUnitOpts(curId);
              v.forEach(function(val) {
                if (val[field.id] === curId) {
                  curSubField = val;
                }
              });
              // setvalue for subfield
              field.subFieldList.forEach(function(subField) {
                subField.disabled(false);
                subField.setValue(curSubField[subField.id]);
              })
            }
            field.input.select2('data', newOptions);
          } else {
            // when value is null
            field.input.select2('data', []);
            singleSelectField.setOpts([]);
            singleSelectField.disabled(true);
            // set subfield to null
            field.subFieldList.forEach(function(subField) {
              subField.disabled(true);
              subField.setValue(null);
            });
          }
        };

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
          field.singleSelectField.input.prop("disabled", bool);
          field.subFieldList.forEach(function(subField) {
            subField.input.prop("disabled", bool);
          });
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
              if (curOpts.hasOwnProperty("unitOptions")) {
								subField.setUnitOpts(curOpts.unitOptions[subField.id]);
              } else {
                subField.setUnitOpts(null);
              }
            }
          })
        };

        field.multiOnChange = function(added, removed) {
          field._changeMultiFieldValue(added, removed);

          // need to remove code
          var v = field.getValue();
          var curData = field.detailData;
          var curIds = [];
          var curId = null;
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
                        if (subfield.data.units.length > 1){
                          subfield.disabled(false);
                        }
                      }
                      var val = {
                        value: null,
                        unit: subfield.defaultUnit
                      };
                      newVal[subfield.id] = subfield.parseValue(val);
                    }
                  }
                   else {
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
            curId = selectList[v.length - 1].id;
          }

          field.singleSelectField.setOpts(selectList);
          field.singleSelectField.setValue(curId);

          // make current selected obj
          // update subFields
          if (newMultiplexVal.length > 0) {
            field.singleSelectField.input.prop("disabled", false);
            newMultiplexVal.forEach(function(val) {
              if (curId === val[field.id]) {
                field.subFieldList.forEach(function(subField) {
                  subField.input.prop("disabled", false);
                  var fieldVal = val[subField.id];
                  subField.setValue(fieldVal);
                })
              }
            });
          } else {
            field.singleSelectField.input.prop("disabled", true);
            field.subFieldList.forEach(function(subField) {
              var fieldVal = null;
              subField.input.prop("disabled", true);
              subField.setValue(fieldVal);
            });
          }

          field.detailData = newMultiplexVal;
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

        field.checkMultiplexCompletion = function(valList) {
          var req = 0;
          var fill = 0;
          var include = false;

          function getSubfieldStatus (vals, req, fill) {
            for (var subFieldId in field.subFieldList) {
              var subField = field.subFieldList[subFieldId];
              var curVal = vals[subField.id];
              if (subField.required) {
                req++;
                if (typeof(curVal) === 'object' && curVal) {
                  if (curVal.value) {
                    fill++;
                  }
                } else if (curVal) {
                  fill++;
                }
              }
            }
            return {
              req: req,
              fill: fill
            };
          }

          // for cases has value in multiplex field
          if (valList.length > 0) {
            if (field.required) {
              req++;
              fill++;
              include = true;
            }
            for (var idx in valList) {
              var vals = valList[idx];
              var status = getSubfieldStatus (vals, req, fill);
              req = status.req;
              fill = status.fill;
            }
          }  else {
            if (field.required) {
              req++;
              include = true;
            }
          }

          return {
            include: include,
            req: req,
            fill: fill
          };
        };

        // valList contains all of the vals for selected val
        field.applyMultiplexSubFieldColor = function(valList){
          function containNonEmptyVal (valList) {
            for (var wellIdx in valList){
              var wellVal = valList[wellIdx];
              if (wellVal.length > 0) {
                return true;
              }
            }
            return false
          }

          function setSubfieldColor (color) {
            for (var subFieldId in field.subFieldList) {
              var subField = field.subFieldList[subFieldId];
              if (subField.required) {
                subField.root.find(".plate-setup-tab-name").css("background", color);
              }
            }
          }

          function updateSubFieldColorMap (vals) {
            for (var subFieldId in field.subFieldList) {
              var subField = field.subFieldList[subFieldId];
              for (var multiplexIdx in vals) {
                var curVal = vals[multiplexIdx][subField.id];
                if (subField.required) {
                  if (typeof(curVal) === 'object' && curVal) {
                    if (!curVal.value) {
                      subFieldColorMap[subField.id].color.push("red");
                    }
                  } else if (!curVal) {
                    subFieldColorMap[subField.id].color.push("red");
                  }
                }
              }


            }
          }

          var subFieldColorMap = {};
          field.subFieldList.forEach(function(subField){
            if (subField.required) {
              subFieldColorMap[subField.id] = {
                field: subField,
                color: []
              };
            }
          });

          // in the range of valList, if one value in that field is not satisfied, replace the color to red
          if (containNonEmptyVal(valList)) {
            valList.forEach(function(multiplexVals) {
              if (field.required) {
                field.root.find(".plate-setup-tab-name").css("background", "red");
              }

              updateSubFieldColorMap(multiplexVals);
            });

            var mainFieldColor = "white";
            for (var subFieldId in subFieldColorMap){
              var subFieldMap = subFieldColorMap[subFieldId];
              if (subFieldMap.color.indexOf('red') >= 0) {
                subFieldMap.field.root.find(".plate-setup-tab-name").css("background", "red");
                mainFieldColor = "red"
              } else {
                subFieldMap.field.root.find(".plate-setup-tab-name").css("background", "white");
              }
            }
            field.root.find(".plate-setup-tab-name").css("background", mainFieldColor);

          }  else {
            if (field.required) {
              field.root.find(".plate-setup-tab-name").css("background", "red");
              setSubfieldColor("red");
            } else {
              setSubfieldColor("white");
            }
          }
        };

        // create single select field and handle on change evaluation
        this._createSelectField(field.singleSelectField, true);
        field.singleSelectField.onChange = function() {
          var v = field.singleSelectField.getValue();
          field.updateSubFieldUnitOpts(v);

          var curData = field.detailData;
          curData.forEach(function(val) {
            if (v === val[field.id]) {
              field.subFieldList.forEach(function(subField) {
                var fieldVal = val[subField.id];
                subField.setValue(fieldVal);
              })
            }
          });
        };

      }
    };
  }
})(jQuery, fabric);