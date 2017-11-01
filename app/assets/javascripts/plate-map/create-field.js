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

        field.parseValue = function (v) {
          if (v) {
            v = String(v);
          } else {
            v = null; 
          }
          return v; 
        }; 

        field.getValue = function () {
          var v = input.val().trim();
          if (v == "") {
            v = null; 
          }
          return v; 
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

        input.on("input", function(e, generated) {
          field.onChange();
        });

        field.input = input; 
      },

      _createOpts: function (config) {
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

        if (isMultiplex){
          field.root.find(".plate-setup-tab-field-container-singleSelect").append(input);
        } else {
          field.root.find(".plate-setup-tab-field-container").append(input);
          that.defaultWell.wellData[id] = null;
        }
        var opts = that._createOpts(field.data); 
        var optMap = {}; 
        opts.data.forEach(function (opt) {
          optMap[opt.id] = opt; 
        });
        input.select2(opts); 

        field.parseValue = function (value) {
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

        field.getValue = function () {
          var v = input.select2('data');
          return v ? v.id : null; 
        }; 

        field.setValue = function (v) {
          if (v) {
            v = optMap[v];
          }
          input.select2('data', v); 
        };

        field.setOpts = function (v) {
          input.select2('data',{});
          opts.data = v || []; 
          input.select2(opts); 
        };

        field.getText = function (v) {
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
        opts.data.forEach(function (opt) {
          optMap[opt.id] = opt; 
        });
        input.select2(opts); 

        field.parseValue = function (value) {
          var v = value; 
          if (v && v.length) {
            v = v.map(function (opt) {
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

        field.getValue = function () {
          var v = input.select2('data');
          if (v.length) {
            return v.map(function (i) {
              return i.id;
            });
          }
          return null;
        };

        field.setValue = function (v) {
          v = v || [];
          v = v.map(function (i) {return optMap[i];});
          input.select2('data', v);
        };

        field.getText = function (v) {
          if (v == null) {
            return ""; 
          }
          if (v.length > 0) {
            return v.map(function (v) {return optMap[v].text}).join("; "); 
          }
          return ""; 
         };

        input.on("change", function(e, generated) {
          field.onChange();
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
          that.defaultWell.wellData[id] = {value: null, unit: defaultUnit};
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

            var unitData = units.map(function (unit) {
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

        field.parseValue = function (value) {
          if (typeof(value) === 'object' && value) {
            var v = field.parseRegularValue(value.value);
            var u = field.parseUnit(value.unit);
            return {
              value: v,
              unit: u
            };
          } else {
            var v = field.parseRegularValue(value);
            if (field.parseUnit(field.getUnit())) {
              return {
                value: v,
                unit: field.parseUnit(field.getUnit())
              };
            } else {
              return v;
            }
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

        field.getValue = function () {
          var v = input.val().trim();
          if (v == "") {
            v = null;
          } else {
            v = Number(v); 
          }
          return v; 
        };

        field.setValue = function (v) {
          if (typeof(v) === 'object' && v) {
            input.val(v.value);
            field.setUnit(v.unit);
          } else {
            v = field.parseValue(v);
            if (typeof(v) === 'object' && v) {
              input.val(v.value);
              field.setUnit(v.unit);
            } else {
              field.setRegularValue(v);
            }

          }
        };

        field.setRegularValue = function (v) {
          input.val(v); 
        };

        field.parseUnit = function (unit) {
          if (unit == null || unit === "") {
            return defaultUnit;
          }
          for (var i = 0; i < units.length; i++) {
            if (unit.toLowerCase() == units[i].toLowerCase()) {
              return units[i]; 
            }
          }
          throw "Invalid unit " + unit + " for field " + id; 
        };

        field.getUnit = function () {
          if (unitInput) {
            return unitInput.val();
          } else {
            return defaultUnit; 
          }
        }; 

        field.setUnit = function (u) {
          if (unitInput) {
            if (u) {
              u = {id: u, text:u};
            } else {
              u = null; 
            }
            unitInput.select2("data", u); 
          }
        };

        // val now contains unit
        field.getText = function (val) {
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

        field.getRegularText = function (v) {
          if (v == null) {
            return "";
          }
          v = v.toString();
          return v;
        }; 

        input.on("input", function () {
          var v = field.getValue();
          if (isNaN(v)) {
            //flag field as invalid
            input.addClass("invalid");
          } else {
            input.removeClass("invalid");
          }
          field.onChange();
        });
        if (unitInput) {
          unitInput.on("change", function () {
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
        var tval = {id:"true", text:"true"}; 
        var fval = {id:"false", text:"false"}; 
        var opts = {
          data: [tval, fval],
          placeholder: "select",
          allowClear: true,
          minimumResultsForSearch: -1,
          initSelection: function (element, callback) {
            var v = element.val(); 
            callback({id: v, text:v});
          }
        }

        input.select2(opts);

        field.parseValue = function (value) {
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
          if (v == true || v == "true") {
            v = tval;
          } else if (v == false || v == "false") {
            v = fval;
          } else {
            v = null; 
          }
          input.select2('data', v); 
        };

        field.getText = function (v) {
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

        // overwrite multiplex set value
        field.setValue = function (v) {
          var singleSelectField = field.singleSelectField;
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          // v[0] is used to filter out cases when v is empty array
          if (v && v[0]) {
            // handling for single select box
            var subFieldData = v;

            v = v.map(function(val){return val[field.id]});
            var optMap = {};
            singleSelectField.data.options.forEach(function(val) {
              optMap[val.id] = val;
            });
            var newOptions = v.map(function (i) {return optMap[i];});
            singleSelectField.setOpts(newOptions);
            if (newOptions.length > 0) {
              singleSelectField.input.prop("disabled", false);
              var curId = newOptions[0].id;
              var curSubField;
              singleSelectField.setValue(curId);
              subFieldData.forEach(function(val){
                if (val[field.id] === curId) {
                  curSubField = val;
                }
              });
              // setvalue for subfield
              field.subFieldList.forEach (function (subField){
                subField.input.prop("disabled", false);
                subField.setSubFieldValue(curSubField[subField.id]);
              })
            }
            field.input.select2('data', newOptions);
          } else {
            // when value is null
            field.input.select2('data', []);
            singleSelectField.setOpts([]);
            singleSelectField.input.prop("disabled", true);
            // set subfield to null
            field.subFieldList.forEach (function (subField){
              subField.input.prop("disabled", true);
              subField.setSubFieldValue(null);
            })
          }
        };

        field.parseValue = function (value) {
          var v = value;
          if (v && v.length) {
            v = v.map(function (opt) {
              var valMap = {};
              valMap[field.id] = opt[field.id];
              for (var subFieldId in opt) {
                field.subFieldList.forEach(function (subField){
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

        field.getMultiplexVal = function () {
          return field.detailData;
        };

        field.onChange = function (){
          var v = field.getValue();
          var curData = field.getMultiplexVal();
          var curIds = [];
          var curId = null;
          //reshape data for saveback
          if (curData) {
            curIds = curData.map(function(val){return val[field.id]});
          }

          var subFieldIds = field.subFieldList.map(function(subField) {return subField.id});

          var newMultiplexVal = [];
          var selectList = [];
          if (v) {
            v.forEach(function(selectedVal) {
              if (curData){
                if (curData) {
                  curData.forEach(function(val) {
                    if (val[field.id] === selectedVal) {
                      newMultiplexVal.push(val)
                    }
                  });
                }
              }
              // cases when adding new data
              if (curIds.indexOf(selectedVal) < 0) {
                var newVal = {};
                newVal[field.id] = selectedVal;
                subFieldIds.forEach(function(fieldId) {
                  newVal[fieldId] = null;
                });
                newMultiplexVal.push(newVal);
              }
            });

            // make data for single select options
            v.forEach(function(selectId){
              field.data.options.forEach(function(opt){
                if (opt.id === selectId ) {
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
            newMultiplexVal.forEach(function (val) {
              if (curId === val[field.id]) {
                field.subFieldList.forEach(function(subField){
                  subField.input.prop("disabled", false);
                  var fieldVal = val[subField.id];
                  subField.setSubFieldValue(fieldVal);
                })
              }
            });
          } else {
            field.singleSelectField.input.prop("disabled", true);
            field.subFieldList.forEach(function (subField) {
              var fieldVal = null;
              subField.input.prop("disabled", true);
              subField.setSubFieldValue(fieldVal);
            });
          }

          field.detailData = newMultiplexVal;
          that._addData(field.id, newMultiplexVal);
        };

        field.getText = function (v) {
          if (v === null) {
            return "";
          }
          var vCopy = Object.create(v);
          if (vCopy.length > 0) {
            return vCopy.map(function (vId) {
              vId[field.id] = vId[field.id];
              return JSON.stringify(vId)
            }).join("; ");
          }
          return "";
        };
        // create single select field and handle on change evaluation
        this._createSelectField(field.singleSelectField, true);
        field.singleSelectField.onChange = function(){
          var v = field.singleSelectField.getValue();
          var curData = field.getMultiplexVal();
          curData.forEach(function (val) {
            if (v === val[field.id]) {
              field.subFieldList.forEach(function(subField){
                var fieldVal = val[subField.id];
                subField.setSubFieldValue(fieldVal);
              })
            }
          });
        };

      }
    };
  }
})(jQuery, fabric);