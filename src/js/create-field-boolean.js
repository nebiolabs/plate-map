var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Renders a boolean field as a 2-option select2 (true/false), rather
   * than a native checkbox. Internal storage is an actual JS boolean
   * (or null when cleared) -- setValue also accepts 1/0 as truthy/falsy
   * shorthand. See create-field-core.js's "THE FIELD CONTRACT" docblock
   * for what disabled/parseValue/getValue/setValue/getText/parseText
   * mean.
   */
  plateMapWidget.createFieldBoolean = function() {
    return {

      _createBooleanField: function(field) {
        let full_id = field.full_id;
        let input = this._createElement("<select/>").attr("id", full_id)
          .addClass("plate-setup-tab-select-field");

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
        this.select2fix(input);

        field.disabled = function(bool) {
          bool = field.isDisabled || bool;
          field.input.prop("disabled", bool);
          return bool;
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
            throw "Invalid value " + value + " for boolean field " + full_id;
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

    };
  }

})(jQuery);
