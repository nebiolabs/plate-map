var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.createFieldNumeric = function() {
    // Renders a numeric input field.
    return {

      _createNumericField: function(field) {
        let full_id = field.full_id;
        let data = field.data;
        let input = this._createElement("<input>").addClass("plate-setup-tab-input")
          .attr("placeholder", data.placeholder || "").attr("id", full_id);

        field.root.find(".plate-setup-tab-field-container").append(input);

        field.disabled = function(bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };

        let parseValue = function(value) {
          if (value == null) {
            return null;
          }
          let v = String(value).trim();
          if (v === "") {
            return null;
          }
          
          return v;
        };
        field.parseValue = parseValue;

        field.getValue = function() {
          let v = input.val().trim();
          if (v === "") {
            v = null;
          }
          return v;
        };

        // _makeFieldUnits (below) only ever assigns field.getRegularValue
        // when the field has units/defaultUnit configured -- but this
        // field's own "input" handler (below) calls it unconditionally.
        // Pre-set it here to the plain getter so a numeric field with
        // NEITHER units NOR defaultUnit still has a working
        // getRegularValue instead of throwing on every edit. If units ARE
        // configured, _makeFieldUnits overwrites this with the same value
        // anyway (it runs before overriding field.getValue itself), so
        // this is a no-op in that case.
        field.getRegularValue = field.getValue;

        field.setValue = function(value) {
          input.val(value);
        };

        let getText = function(v) {
          if (v == null) {
            return "";
          }
          v = v.toString();
          return v;
        };
        field.getText = getText;

        field.parseText = function(v) {
          return getText(parseValue(v));
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

        field.input = input;
      },

    };
  }

})(jQuery);
