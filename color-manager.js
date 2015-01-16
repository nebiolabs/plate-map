var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.colorManager = function() {

    return {
        // See these are color pairs for the gradient.
        colorPairs: ["#af1313", "#4f0000", "#fc242d", "#a20f12", "#ff9600", "#ff3600", "#ffc100", "#ff6a00",
                      "#ffd5ed", "#ffb1df", "#ffe735", "#ffaa0e", "#fff77a", "#ffe021", "#dbfa89", "#bcf61f",
                      "#a9eac9", "#2eb146", "#376a00", "#254800", "#84f0ff", "#5feaff", "#2ea2be", "#113d55",
                      "#003d7d", "#001021", "#a316e7", "#750edb", "#a70075", "#5d0040", "#ee11ee", "#c803c8",
                      "#5b5b5b", "#433a43", "#a2a2a2", "#6f6f6f"],

        getColor: function() {
          console.log("Wow");
        }
    }
  }

})(jQuery, fabric);
