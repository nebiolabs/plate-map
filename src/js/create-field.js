var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  function select2close(ev) {
    if (ev.params.args.originalEvent) {
      // When unselecting (in multiple mode)
      ev.params.args.originalEvent.stopPropagation();
    } else {
      // When clearing (in single mode)
      $(this).one('select2:opening', function(ev) { ev.preventDefault(); });
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
        let id = field.id;
        let that = this;
        let input = this._createElement("<input>").attr("id", id)
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
          return input.val().trim() || null;
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

        input.on("input", function() {
          field.onChange();
        });

        field.input = input;
      },

      _createOpts: function(config) {
        let opts = {
          allowClear: true,
          placeholder: "select",
          minimumResultsForSearch: 10
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

      _createSelectField: function(field) {
        let id = field.id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        let opts = that._createOpts(field.data);
        let optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });

        input.select2(opts);
        select2fix(input);

        field.parseValue = function(value) {
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
            throw "Invalid text value " + value + " for select field " + id;
          }
        };

        input.on("change", function() {
          field.onChange();
        });

        field.input = input;
      },

      _createMultiSelectField: function(field) {
        let id = field.id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

        let opts = that._createOpts(field.data);
        opts.multiple = true;
        let optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });
        input.select2(opts);
        select2fix(input);

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
            vals = vals.map(field._parseOne, this);
          } else {
            vals = null;
          }
          return vals;
        };

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
            return v.map(v => optMap[String(v)].text).join("; ");
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
          let data = {};
          data[field.id] = {
            multi: true,
            added: added,
            removed: removed
          };
          that._addAllData(data);
        };

        field.parseText = function(value) {
          let v = value;
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
          let v = field._parseOne(e.params.data.id);
          v = {id: v};
          field.multiOnChange(v, null);
        });

        input.on("select2:unselect", function (e) {
          let v = field._parseOne(e.params.data.id);
          v = {id: v};
          field.multiOnChange(null, v);
        });

        field.input = input;

        that._createDeleteButton(field);
      },

      _createNumericField: function(field) {
        let id = field.id;
        let data = field.data;
        let that = this;
        let input = this._createElement("<input>").addClass("plate-setup-tab-input")
          .attr("placeholder", data.placeholder || "").attr("id", id);

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell[id] = null;

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
          if (units.length === 1) {
            let unitText = $("<div></div>").addClass("plate-setup-tab-unit");
            unitText.text(defaultUnit);
            field.root.find(".plate-setup-tab-field-container").append(unitText);
          } else {
            unitInput = this._createElement("<select/>").attr("id", id)
              .addClass("plate-setup-tab-label-select-field");

            field.root.find(".plate-setup-tab-field-container").append(unitInput);

            let selected = null;
            let unitData = units.map(function(unit) {
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

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
          if (unitInput) {
            unitInput.prop("disabled", bool);
          }
        };

        field.setUnitOpts = function(opts) {
          field.units = opts || null;
          field.defaultUnit = null;

          let newUnits = [];
          let selected = null;
          if (field.units && field.units.length) {
            field.defaultUnit = field.units[0];
            newUnits = field.units.map(function(curUnit) {
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

        field.parseValue = function(value) {
          let v;
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
          let v = field.getRegularValue();

          if ((v === null) || isNaN(v)) {
            return null;
          } else if (field.hasUnits) {
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
          let v = String(value).trim();
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
          let v = input.val().trim();
          if (v === "") {
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
          for (let i = 0; i < units.length; i++) {
            if (unit.toLowerCase() === units[i].toLowerCase()) {
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

        field.getRegularText = function(v) {
          if (v == null) {
            return "";
          }
          v = v.toString();
          return v;
        };

        field.parseText = function(v) {
          let textVal = field.parseValue(v);
          if (textVal && typeof (textVal) === "object") {
            return textVal.value + textVal.unit;
          } else if (textVal) {
            return textVal
          } else {
            return null;
          }
        };

        input.on("input", function() {
          let v = field.getRegularValue();
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
        let id = field.id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");
        that.defaultWell[id] = null;

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

        field.disabled = function(bool) {
          field.input.prop("disabled", bool);
        };

        field.parseValue = function(value) {
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
            throw "Invalid value " + value + " for boolean field " + id;
          }
          return v;
        };

        field.getValue = function() {
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

        field.setValue = function(v) {
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

        field.getText = function(v) {
          if (v == null) {
            return "";
          }
          return v.toString();
        };

        field.parseText = field.parseValue;

        input.on("change", function() {
          field.onChange();
        });

        field.input = input;
      },

      _createMultiplexField: function(field) {
        let that = this;
        // make correct multiplex data
        this._createMultiSelectField(field);
        // overwrite default well for multiplex field
        that.defaultWell[field.id] = [];

        // single select
        let nameContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-name-singleSelect").text("Select to edit");
        let fieldContainer1 = that._createElement("<div></div>").addClass("plate-setup-tab-field-container-singleSelect");
        field.root.find(".plate-setup-tab-field-right-side").append(nameContainer1, fieldContainer1);

        field.singleSelect = this._createElement("<select/>").attr("id", field.id + "SingleSelect")
          .addClass("plate-setup-tab-multiplex-single-select-field");

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

        field.singleSelectValue = function() {
          let v = field.singleSelect.val();
          if (v === "") {
            return null;
          }
          if (v == null) {
            return null;
          }
          return field._parseOne(v)
        };

        let setSingleSelectOptions = function(data, selected) {
          data = data || [];

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

        let singleSelectChange = function() {
          let v = field.singleSelectValue();

          field.updateSubFieldUnitOpts(v);

          let curData = field.detailData || [];
          let curSubField = null;
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
        field.singleSelect.on("change.select2", singleSelectChange);

        field._changeMultiFieldValue = function(added, removed) {
          let newSubFieldValue = {};
          for (let subFieldName in field.data.multiplexFields) {
            if (field.data.multiplexFields.hasOwnProperty(subFieldName)) {
              let subFieldId = field.data.multiplexFields[subFieldName].id;
              newSubFieldValue[subFieldId] = null;
            }
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

        // overwrite multiplex set value
        field.setValue = function(v) {
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          let multiselectValues = null;
          if (v && v.length) {
            multiselectValues = v.map(val => val[field.id]);
          }

          multiselectSetValue(multiselectValues);
          let newOptions = field.input.select2('data') || [];
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
          let v = value;
          if (v && v.length) {
            v = v.map(function(opt) {
              let valMap = {};
              valMap[field.id] = opt[field.id];
              for (let subFieldId in opt) {
                if (opt.hasOwnProperty(subFieldId)) {
                  field.subFieldList.forEach(function(subField) {
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

        field.updateSubFieldUnitOpts = function(val) {
          let curOpts;
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
                let newVal = {};
                newVal[field.id] = selectedVal;

                field.updateSubFieldUnitOpts(selectedVal);
                field.subFieldList.forEach(function(subfield) {
                  // special handling for subfield which has multiplexUnit
                  if (subfield.hasUnits) {
                    if (subfield.data.hasMultiplexUnit) {
                      subfield.disabled(false);
                      field.data.options.forEach(function(opt) {
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
            v.forEach(function(selectVal) {
              field.data.options.forEach(function(opt) {
                if (opt.id === selectVal) {
                  selectList.push(opt);
                }
              });
            });

            let selected = field.singleSelectValue();
            for (let i = 0; i < v.length; i++) {
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
              field.subFieldList.forEach(function(subField) {
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

        field.parseText = function(v) {
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
              field.subFieldList.forEach(function(subField) {
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

        field.checkMultiplexCompletion = function(valList) {
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
        field.applyMultiplexSubFieldColor = function(valList) {
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
              } else if (typeof (vals) === "object") {
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

          let subFieldWarningMap = {};
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

        field.parseMainFieldVal = function(val) {
          let optMap = field.data.options;
          for (let idx = 0; idx < optMap.length; idx++) {
            let curOpt = optMap[idx];
            if (curOpt.id === val) {
              return curOpt.text
            }
          }
        };
      },

      _deleteDialog: function(field) {
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
            deleteCheckedButton.click(function() {
              table.find("input:checked").each(function() {
                let val = this.value;
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

        let cancelButton = $("<button>Cancel</button>");
        buttonRow.append(cancelButton);
        cancelButton.click(killDialog);

        dialogDiv.show();

        window.onclick = function(event) {
          if (event.target === dialogDiv[0]) {
            killDialog();
          }
        }
      },

      _deleteDialogTable: function(field, valMap) {
        let that = this;
        let colName = [field.name, "Counts"]; //Added because it was missing... no idea what the original should have been
        if (!that.readOnly) {
          colName.push("Delete");
        }
        let table = $('<table/>');
        let thead = $('<thead/>').appendTo(table);
        let tr = $('<tr/>').appendTo(thead);

        tr.append(colName.map(function(text) {
          return $('<th/>').text(text);
        }));

        let tbody = $("<tbody/>").appendTo(table);

        field.data.options.forEach(function(opt) {
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

      _createDeleteButton: function(field) {
        let that = this;
        let deleteButton = $("<button/>").addClass("plate-setup-remove-all-button");
        deleteButton.id = field.id + "Delete";
        deleteButton.text("Manage " + field.name + "...");
        let buttonContainer = that._createElement("<div></div>").addClass("plate-setup-remove-all-button-container");
        buttonContainer.append(deleteButton);

        field.deleteButton = deleteButton;
        field.root.find(".plate-setup-tab-field-right-side").append(buttonContainer);

        deleteButton.click(function() {
          that._deleteDialog(field);
        });
      }

    };
  }
})(jQuery);