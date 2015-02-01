var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.colorManager = function() {

    return {
        // See these are color pairs for the gradient.
        // We leave the first color blank to make calculation easier.
        colorPairs: ["#", "#e10404", "#500000", "#f8666c", "#970e10", "#ff9600", "#ff3600", "#ffc100", "#ff6a00",
                      "#ffd5ed", "#ffb1df"], /*"#ffe735", "#ffaa0e", "#fff77a", "#ffe021", "#dbfa89", "#bcf61f",
                      "#a9eac9", "#2eb146", "#376a00", "#254800", "#84f0ff", "#5feaff", "#2ea2be", "#113d55",
                      "#003d7d", "#001021", "#a316e7", "#750edb", "#a70075", "#5e0040", "#ee11ee", "#c803c8",
                      "#5c5c5c", "#423a42", "#a3a3a3", "#6f6f6f"], */

        colorPairObject: {
          "#e10404": "#500000",
          "#f8666c": "#970e10",
          "#ff9600": "#ff3600",
          "#ffc100": "#ff6a00",
          "#ffd5ed": "#ffb1df",
          "#ffe735": "#ffaa0e",
          "#fff77a": "#ffe021",
          "#dbfa89": "#bcf61f",
          "#a9eac9": "#2eb146",
          "#376a00": "#254800",
          "#84f0ff": "#5feaff",
          "#2ea2be": "#113d55",
          "#003d7d": "#001021",
          "#a316e7": "#750edb",
          "#a70075": "#5e0040",
          "#ee11ee": "#c803c8",
          "#5c5c5c": "#423a42",
          "#a3a3a3": "#6f6f6f"
        },

        colorIndexValues: {
          "#e10404": 1,
          "#f8666c": 2,
          "#ff9600": 3,
          "#ffc100": 4,
          "#ffd5ed": 5,
          "#ffe735": 6,
          "#fff77a": 7,
          "#dbfa89": 8,
          "#a9eac9": 9,
          "#376a00": 10,
          "#84f0ff": 11,
          "#2ea2be": 12,
          "#003d7d": 13,
          "#a316e7": 14,
          "#a70075": 15,
          "#ee11ee": 16,
          "#5c5c5c": 17,
          "#a3a3a3": 18
        },

        getColor: function() {
          console.log("Wow");
        }
    }
  }

})(jQuery, fabric);
