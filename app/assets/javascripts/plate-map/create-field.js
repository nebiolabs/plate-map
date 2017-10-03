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

      _createSelectField: function(field, data) {
        var id = data.id; 
        var that = this; 
        var input = this._createElement("<input/>").attr("id", id)
          .addClass("plate-setup-tab-select-field");

        field.root.find(".plate-setup-tab-field-container").append(input);
        that.defaultWell.wellData[id] = null;

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

        field.getText = function (v) {
          if (v == null) {
            return ""; 
          }
          return optMap[v].text; 
        }; 

        input.on("change", function(e, generated) {
          var v = field.getValue(); 
          that._addData(e.target.id, v);
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
            v = v.map(function (opt_id) {
              if (opt_id in optMap) {
                return optMap[opt_id].id;
              } else {
                throw "Invalid value " + opt_id + " for multiselect field " + id; 
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
          var v = field.getValue(); 
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
          input.data("units", units); 
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

        field.hasUnits = units.length > 0; 

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
          var v = field.getValue(); 
          if (isNaN(v)) {
            //flag field as invalid
            input.addClass("invalid"); 
          } else {
            input.removeClass("invalid"); 
            var u = field.getUnit();
            that._addData(id, v, u); 
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

    };
  }
})(jQuery, fabric);