var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.createFieldCore = function() {
    // Core field machinery shared across all field types: the
    // _createField dispatcher, the units add-on (_handleFieldUnits/
    // _makeFieldUnits), the select2-options helper (_createOpts), and
    // the select2 v4.0.8 workaround helpers used by every field type
    // that renders a select2 widget (select2close/select2fix/
    // select2setData -- promoted here from module-scope plain functions
    // to instance methods so the other create-field-<type>.js files can
    // reach them; confirmed stateless before the promotion, see
    // REFACTOR_NOTES.md §10.6 #1). Each concrete field type (text/
    // numeric/select/multiselect/boolean/multiplex) lives in its own
    // create-field-<type>.js file.
    return {

      // Registered via select2fix as a raw (unbound) event handler --
      // `this` inside is the input DOM element, set by jQuery's `.on()`,
      // exactly as when this was a module-scope function. Do not call it
      // as `this.select2close(...)`/`that.select2close(...)` directly,
      // that would rebind `this` to the widget instance instead.
      select2close: function(ev) {
        if (ev.params.args.originalEvent) {
          // When unselecting (in multiple mode)
          ev.params.args.originalEvent.stopPropagation();
        } else {
          // When clearing (in single mode)
          $(this).one('select2:opening', function(ev) { ev.preventDefault(); });
        }
      },

      select2fix: function(input) {
        // prevents select2 open on clear as of v4.0.8
        input.on('select2:unselecting', this.select2close);
      },

      select2setData: function(input, data, selected) {
        input.empty();
        let dataAdapter = input.data('select2').dataAdapter;
        dataAdapter.addOptions(dataAdapter.convertToOptions(data));
        input.val(selected);
      },

      _createField: function(field) {
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

      _makeFieldUnits: function(field) {
        let that = this;
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
            unitInput = this._createElement("<select/>").attr("id", full_id + "Units")
                .addClass("plate-setup-tab-unit-select-field");

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
          bool = field.disabledRegular(bool);
          if (unitInput) {
            unitInput.prop("disabled", bool);
          }
          return bool;
        };

        field.parseValue = function(value) {
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

        field.getValue = function() {
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
                unitTypeUnits.forEach(function(unit) {
                  if (unit.text === returnVal.unit) {
                    returnVal['unitTypeId'] = unitTypeKey;
                    returnVal['unitId'] = unit.id;
                  }
                })
              }
            }
            return returnVal;
          }
        };

        field.setValue = function(value) {
          if ($.isPlainObject(value)) {
            field.setUnit(value.unit || field.defaultUnit);
            field.setRegularValue(value.value);

          } else {
            field.setRegularValue(value);
            field.setUnit(field.defaultUnit)
          }
        };

        field.setUnitOpts = function(opts) {
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

          that.select2setData(unitInput, newUnits, selected);
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
          throw "Invalid unit " + unit + " for field " + full_id;
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

        field.parseText = function(v) {
          let value = field.parseValue(v);
          if (value && typeof (value) === "object") {
            return field.getRegularText(value.value) + value.unit;
          } else if (value != null) {
            return field.getRegularText(value)
          } else {
            return null;
          }
        };

        if (unitInput) {
          unitInput.on("change", function() {
            field.onChange();
          });
        }

        field.unitInput = unitInput;
      },

      _createOpts: function(config) {
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
          // Was "opts.ajax = ajax" -- `ajax` was an undefined free variable
          // (a leftover from the 2019 select2-v4 migration, git blame
          // 18781f5, that never finished renaming config.query to
          // config.ajax), so this threw a ReferenceError the first time any
          // caller set data.ajax. See REFACTOR_NOTES.md §10.4 #4.
          opts.ajax = config.ajax;
          data_specified = true;
        }
        if (!data_specified) {
          throw "Must specify data or ajax";
        }
        return opts;
      },

    };
  }

})(jQuery);
