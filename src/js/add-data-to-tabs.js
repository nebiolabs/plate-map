var plateLayOutWidget = plateLayOutWidget || {};

plateLayOutWidget.addDataToFields = function() {

  return {

    _addDataToTabFields: function(well) {
      // Configure how data is added to tab fields
      for (let id in this.fieldMap) {
        if (this.fieldMap.hasOwnProperty(id)) {
          this._applyFieldData(id, well[id]);
        }
      }
    },

    _applyFieldData: function(id, v) {
      if (v === undefined) {
        v = null;
      }
      this.fieldMap[id].setValue(v);
    }
  }
};
