var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.interface = function() {
    // interface holds all the methods to put the interface in place
    return {

      _createInterface: function() {

        var divIdentifier = '<div></div>';
        this.container = this._createElement(divIdentifier).addClass("plate-setup-wrapper");
        this.topSection = this._createElement(divIdentifier).addClass("plate-setup-top-section");

        this.topLeft = this._createElement(divIdentifier).addClass("plate-setup-top-left");
        this.topRight = this._createElement(divIdentifier).addClass("plate-setup-top-right");

        this.menuContainer = this._createElement(divIdentifier).addClass("plate-setup-menu-container");
        this.overLayContainer = this._createElement(divIdentifier).addClass("plate-setup-overlay-container");
        this.canvasContainer = this._createElement(divIdentifier).addClass("plate-setup-canvas-container");

        this._createMenu();
        $(this.topLeft).append(this.menuContainer);

        this._createOverLay();
        $(this.topLeft).append(this.overLayContainer);

        this._createCanvas();
        $(this.topLeft).append(this.canvasContainer);


        $(this.topSection).append(this.topLeft);
        $(this.topSection).append(this.topRight);

        $(this.container).append(this.topSection);
        $(this.element).html(this.container);

        this._initiateFabricCanvas();

        this._createTabAtRight();
        this._createTabs();

        this._placePresetCaption();
        this._placePresetTabs();
        // Bottom of the screen
        this._bottomScreen();
        // Canvas
        this._canvas();

        this.bottomForFirstTime();
      },

      _createElement: function(element) {

        return $(element);
      }

    };
  }
})(jQuery, fabric);
