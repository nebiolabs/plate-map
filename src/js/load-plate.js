var plateMapWidget = plateMapWidget || {};

plateMapWidget.loadPlate = function() {
  // Methods which look after data changes and stack up accordingly
  // Remember THIS points to plateMapWidget and 'this' points to engine
  return {

    loadPlate: function(data) {
      //sanitize input
      let derivative;
      if (data.hasOwnProperty('wells')) {
        derivative = {};
        for (let address in data.wells) {
          let well = data.wells[address];
          let index = this.addressToIndex(address);
          derivative[index] = this.sanitizeWell(well);
        }
      } else {
        derivative = this.engine.derivative;
      }

      let checkboxes;
      if (data.hasOwnProperty('checkboxes')) {
        checkboxes = this.sanitizeCheckboxes(data.checkboxes);
      } else {
        checkboxes = this.getCheckboxes();
      }

      let indices;
      if (data.hasOwnProperty('selectedAddresses')) {
        indices = this.sanitizeAddresses(data.selectedAddresses);
      } else {
        indices = this.getSelectedIndices();
      }
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

    sanitizeCheckboxes: function(checkboxes) {
      checkboxes = checkboxes || [];
      return this.allCheckboxes.filter(fieldId => checkboxes.indexOf(fieldId) >= 0);
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
