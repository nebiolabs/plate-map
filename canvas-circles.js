var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.canvasCircles = function() {
    // This object contains circles
    return {

      addCircle: function(currentColor, tileToAdd, colorStops, colorIndex) {

        var colors = colorStops || { 0: this.colorPairs[currentColor - 1],
                                     1: this.colorPairs[currentColor]
                                   };
        var circle = new fabric.Circle({
          radius: 22,
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.3) 0 2px 2px',
          evented: false,
          colorStops: colors
        });

        circle.colorIndex = (colorIndex) ? colorIndex : this.colorPointer + 1;

        this._setGradient(circle, colors);

        var circleCenter = new fabric.Circle({
          radius: 14,
          fill: "white",
          originX:'center',
          originY: 'center',
          top: tileToAdd.top,
          left: tileToAdd.left,
          shadow: 'rgba(0,0,0,0.1) 0 -1px 0',
          evented: false,
        });

        var circleText = new fabric.IText(""+circle.colorIndex+"", {
            top: tileToAdd.top,
            left: tileToAdd.left,
            fill: 'black',
            evented: false,
            fontSize: 12,
            lockScalingX: true,
            lockScalingY: true,
            originX:'center',
            originY: 'center',
            visible: false
        });

        if(this.afterLimitPointer) {
          circleText.setVisible(true);
        }
        circle.parent = tileToAdd; // Linking the objects;
        tileToAdd.circle = circle;
        tileToAdd.circleCenter = circleCenter;
        tileToAdd.circleText = circleText;
        this.mainFabricCanvas.add(circle);
        this.mainFabricCanvas.add(circleCenter);
        this.mainFabricCanvas.add(circleText);

        return true;
      },

      _setGradient: function(circle, colorStops) {

        var colorStops =  colorStops || {
                                          0: "#ffc100",
                                          1: "#ff6a00"
                                        };
        circle.setGradient("fill", {
          x1: 0,
          y1: 0,
          x2: 0,
          y2: circle.height,
          colorStops: colorStops
        });

      },

     };
  }
})(jQuery, fabric)
