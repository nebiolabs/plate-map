var plateMapWidget = plateMapWidget || {};

plateMapWidget.loadPlate = function() {
  // Methods which look after data changes and stack up accordingly
  // Remember THIS points to plateMapWidget and 'this' points to engine
  return {

    loadPlate: function(data) {
      //sanitize input
      let derivative = {};
      for (let address in data.wells) {
        let well = data.wells[address];
        let index = this.addressToIndex(address);
        derivative[index] = this.sanitizeWell(well);
      }
      let checkboxes = data.checkboxes || [];
      let indices = this.sanitizeAddresses(data.selectedAddresses);
      if (indices.length === 0) {
        indices = [0];
      }

      let sanitized = {
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
      indices = indices.filter((index, i) => indices.indexOf(index) === i);
      return indices;
    },

    sanitizeWell: function(well) {
      let newWell = {};
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
};
