var plateLayOutWidget = plateLayOutWidget || {};

(function($) {

  plateLayOutWidget.loadPlate = function(THIS) {
    // Methods which look after data changes and stack up accordingly
    // Remember THIS points to plateLayOutWidget and 'this' points to engine
    return {

      loadPlate: function(data) {
        //sanitize input
        var derivative = {};
        for (var address in data.wells) {
          var well = data.wells[address];
          var index = this.addressToIndex(address);
          derivative[index] = this.sanitizeWell(well);
        }
        var checkboxes = data.checkboxes || [];
        var indices = this.sanitizeAddresses(data.selectedAddresses);
        if (indices.length === 0) {
          indices = [0];
        }

        var sanitized = {
          "derivative": derivative,
          "checkboxes": checkboxes,
          "selectedIndices": indices,
        };

        this.setData(sanitized);
      },

      sanitizeAddresses: function(selectedAddresses) {
        selectedAddresses = selectedAddresses || [];
        let indices = selectedAddresses.map(this.addressToIndex, this);
        indices.sort();
        indices = indices.filter(function (index, i) {
          return indices.indexOf(index) === i;
        });
        return indices;
      },

      sanitizeWell: function(well) {
        var newWell = {};
        this.fieldList.forEach(function (field) {
          newWell[field.id] = field.parseValue(well[field.id]);
        });
        return newWell;
      },

      setData: function(data, quiet) {
        this.engine.derivative = data.derivative;
        this.setCheckboxes(data.checkboxes, true);
        this.setSelectedIndices(data.selectedIndices, true);
        this.derivativeChange();
        if (!quiet) {
          this.addToUndoRedo();
        }
      },

    }
  }
})(jQuery);