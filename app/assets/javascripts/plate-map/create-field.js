var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.createField = function() {
    // It create those fields in the tab , there is 4 types of them.
    return {

      _createField: function(field, data) {
        switch (data.type) {
          case "text":
            this._createTextField(field, data);
            break;

          case "numeric":
            this._createNumericField(field, data);
            break;

          case "select":
            this._createSelectField(field, data);
            break;

          case "multiselect":
            this._createMultiSelectField(field, data);
            break;

          case "boolean":
            this._createBooleanField(field, data);
            break;

          case "multiplexmultiselect":
            this._createMultiplexField(field, data);
            break;
        }
      }, 

      _createTextField: function(field, data) {
        var id = data.id; 
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
          var v = field.getValue();
          that._addData(field.id, v); 
        });

        field.input = input; 
      },

      _createSelectField: function(field, data, isMultiplex) {
        var id = data.id; 
        var that = this; 
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        if (isMultiplex){
          field.root.find(".plate-setup-tab-field-container-singleSelect").append(input);
          that.defaultWell.wellData[id] = null;
        } else {
          field.root.find(".plate-setup-tab-field-container").append(input);
          that.defaultWell.wellData[id] = null;
        }
        var opts = {
          allowClear: true, 
          placeholder: "select", 
          minimumResultsForSearch: 10
        }; 

        if (data.options) {
          //use data options
          var optMap = {}; 
          data.options.forEach(function (opt) {
            optMap[opt.id] = opt;
          })
          input.data("optionMap", optMap); 
          opts.data = data.options; 
          opts.initSelection = function (element, callback) {
            var data = element.val(); 
            data = optMap[data];
            callback(data);
          };
        } else if (data.query) {
          var query = data.query; 
          if (data.delay) {
            query = this._debounce(data.delay, query);
          }
          //TODO initSelection must set values, 
          // but only have ids not text available. 
          opts.query = query; 
        } else {
          //Tagging style
          opts.tags = data.tags || []; 
          opts.initSelection = function (element, callback) {
            var data = element.val(); 
            var opt = {id: data, text:data};
            optMap[opt.id] = opt; 
            callback(opt);
          }; 
        }

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
          var newOpts = [];
          input.data('optionMap', {});
          if (v) {
            input.select2('data',{});
            v.forEach(function (opt) {
              newOpts.push(optMap[opt.id]);
              //input.select2('data', opt);
            });

            opts.data = newOpts;
            input.select2(opts);
            //input.select2('data', newOpts);
          } else {
            input.select2();
          }
        };

        field.getText = function (v) {
          if (v == null) {
            return ""; 
          }
          return optMap[v].text; 
        }; 

        input.on("change", function(e, generated) {
          if (field.onChange){
            field.onChange();
          } else {
            var v = field.getValue();
            that._addData(e.target.id, v);
          }


        });

        field.input = input; 
      },

      _createMultiSelectField: function(field, data) {
        var id = data.id; 
        var that = this; 
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-multiselect-field");
        input.attr("multiple", "multiple"); 

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell.wellData[id] = null;

        var separator = ",";
        var opts = {
          multiple: true,
          allowClear: true, 
          placeholder: "select", 
          minimumResultsForSearch: 10
        };

        var optMap = {}; 
        if (data.options) {
          //use data options
          data.options.forEach(function (opt) {
            optMap[opt.id] = opt;
          })
          input.data("optionMap", optMap); 
          opts.data = data.options; 
          opts.initSelection = function (element, callback) {
            var data = element.val(); 
            if (data == "") {
              dat = []; 
            } else {
              data = data.split(separator).map(function (k) {
                return optMap[k];
              })
            }
            callback(data);
          };
        } else if (data.query) {
          var query = data.query; 
          if (data.delay) {
            query = this._debounce(data.delay, query);
          }
          //TODO initSelection must set values, 
          // but only have ids not text available. 
          opts.query = function (data, callback) {
            Promise.resolve(query.apply(data)).then(function (results) {
              for (var i = 0; i < results.length; i++) {
                var opt = results[i]; 
                optMap[opt.id] = opt; 
              }
              callback(results); 
            });
          }; 
        } else {
          //Tagging style
          opts.tags = data.tags || []; 
          opts.initSelection = function (element, callback) {
            var data = element.val(); 
            if (data == "") {
              dat = []; 
            } else {
              data = data.split(separator).map(function (k) {
                var opt = {id: data, text:data};
                optMap[opt.id] = opt; 
                return opt;
              }); 
            }
            callback(data);
          }; 
        }

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
          var v;
          if (field.onchange) {
            v = field.onchange(that);
          } else {
            v = field.getValue();
          }
          that._addData(id, v);
        });

        field.input = input;
      },

      _createNumericField: function(field, data) {
        var id = data.id; 
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
          that.defaultWell.unitData[id] = defaultUnit;
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
          input.val(v); 
        };

        field.parseUnit = function (unit) {
          if (unit == null) {
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

        field.getText = function (v, u) {
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
        }; 

        var changeHandler = function (e) {
          if (field.onChange){
            field.onChange(that);
          } else {
            var v = field.getValue();
            if (isNaN(v)) {
              //flag field as invalid
              input.addClass("invalid");
            } else {
              input.removeClass("invalid");
              var u = field.getUnit();
              that._addData(id, v, u);
            }
          }
        }; 

        input.on("input", changeHandler);
        if (unitInput) {
          unitInput.on("change", changeHandler);
        }

        field.input = input;
      },

      _createBooleanField: function(field, data) {
        var id = data.id; 
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
          var v = field.getValue();
          that._addData(id, v);
        });

        field.input = input;
      },

      _createMultiplexField: function(field, data) {
        // make correct multiplex data
        this._createMultiSelectField(field, data, true);

        // overwrite multiplex set value
        field.setValue = function (v) {
          var singleSelectField = field.singleSelectField;
          // used to keep track of initially loaded multiplex data
          field.detailData = v;
          if (v) {
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
                subField.input.val(curSubField[subField.id]);
              })
            }
            field.input.select2('data', newOptions);
          } else {
            // when value is null
            field.input.select2('data', []);
            singleSelectField.setOpts([]);
            // set subfield to null
            field.subFieldList.forEach (function (subField){
              subField.input.val(null);
            })
          }
        };

        field.parseValue = function (value) {
          var v = value;
          if (v && v.length) {
            v = v.map(function (opt) {
              return opt;
            });
          } else {
            v = null;
          }
          return v;
        };

        field.getMultiplexVal = function () {
          return field.detailData;
        };

        field.onchange = function (){
          var v = field.getValue();
          var curData = field.getMultiplexVal();
          var curIds = [];
          //reshape data for saveback
          if (curData) {
            curIds = curData.map(function(val){return val[field.id]});
          }

          var subFieldIds = field.subFieldList.map(function(subField) {return subField.id});

          var newMultiplexVal = [];
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
            var selectList = [];
            v.forEach(function(selectId){
              field.data.options.forEach(function(opt){
                if (opt.id === selectId ) {
                  selectList.push(opt);
                }
              });
            });
            field.singleSelectField.setOpts(selectList);
            // set the newest selected to be the current obj
            var curId = selectList[v.length - 1].id
            field.singleSelectField.setValue(curId);

            // make current selected obj
            // update subFields
            newMultiplexVal.forEach(function (val) {
              if (curId === val[field.id]) {
                field.subFieldList.forEach(function(subField){
                  var fieldVal = val[subField.id];
                  subField.input.val(fieldVal);
                })
              }
            });

            field.detailData = newMultiplexVal;
            return newMultiplexVal;
          }
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
        this._createSelectField(field.singleSelectField, field.singleSelectData, true);
        field.singleSelectField.onChange = function(){
          var v = field.singleSelectField.getValue();
          var curData = field.getMultiplexVal();
          curData.forEach(function (val) {
            if (v === val[field.id]) {
              field.subFieldList.forEach(function(subField){
                var fieldVal = val[subField.id];
                subField.input.val(fieldVal);
              })
            }
          });
        };

      }
    };
  }
})(jQuery, fabric);