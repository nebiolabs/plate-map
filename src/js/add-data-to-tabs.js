var plateMapWidget = plateMapWidget || {};

plateMapWidget.addDataToFields = function() {

  return {

    _addDataToTabFields: function(well) {
      // Configure how data is added to tab fields
      for (let i = 0; i < this.fieldList.length; i++) {
        let field = this.fieldList[i];
        let v = well[field.id];
        if (v === undefined) {
          v = null;
        }
        field.setValue(v);
      }
    }
  }
};
