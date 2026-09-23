var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Renders a plain text field: a single <input>, internal storage is a
   * plain string (or null when empty). See create-field-core.js's
   * "THE FIELD CONTRACT" docblock for what disabled/parseValue/
   * getValue/setValue/getText/parseText mean.
   */
  plateMapWidget.createFieldText = function() {
    return {

      _createTextField: function(field) {
        let input = this._createElement("<input>").attr("id", field.full_id)
          .addClass("plate-setup-tab-input");

        field.root.find(".plate-setup-tab-field-container").append(input);

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
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
        };

        field.parseText = field.parseValue;

        input.on("input", function() {
          field.onChange();
        });

        field.input = input;
      },

    };
  }

})(jQuery);
