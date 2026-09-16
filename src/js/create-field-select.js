var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.createFieldSelect = function() {
    // Renders a single-select (select2) field.
    return {

      _createSelectField: function(field) {
        let full_id = field.full_id;
        let that = this;
        let input = this._createElement("<select/>").attr("id", full_id)
          .addClass("plate-setup-tab-select-field").addClass("plate-setup-tab-input");

        field.root.find(".plate-setup-tab-field-container").append(input);

        let opts = that._createOpts(field.data);
        let optMap = {};
        opts.data.forEach(function(opt) {
          optMap[String(opt.id)] = opt;
        });

        input.select2(opts);
        that.select2fix(input);

        let parseValue = function(value) {
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

        field.disabled = function(bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };

        field.getValue = function() {
          return parseValue(input.val());
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
            throw "Invalid text value " + value + " for select field " + full_id;
          }
        };

        input.on("change", function() {
          field.onChange();
        });

        field.input = input;
      },

    };
  }

})(jQuery);
