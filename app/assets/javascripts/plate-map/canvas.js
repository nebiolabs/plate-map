var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvas = function() {
    //
    return {

      allSelectedObjects: null, // Contains all the selected objets, when click and drag.

      allPreviouslySelectedObjects: null,

      colorPointer: 0,

      goldenRatio: 0.618033988749895,

      _createCanvas: function() {
        this.normalCanvas = this._createElement("<canvas>").attr("id", "DNAcanvas");
        $(this.canvasContainer).append(this.normalCanvas);
      },

      _initiateFabricCanvas: function() {
        var w = this.canvasContainer.width(); 
        var h = this.canvasContainer.height(); 

        this._setCanvasArea(w, h);

        this.mainFabricCanvas = new fabric.Canvas('DNAcanvas', {
            backgroundColor: '#f5f5f5',
            selection: true,
            stateful: false,
            hoverCursor: "pointer",
            renderOnAddRemove: false,
          })
          .setWidth(w)
          .setHeight(h);
      },

    };
  }
})(jQuery, fabric);