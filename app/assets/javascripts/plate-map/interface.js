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

        var that = this;
        $(document).keyup(function(e) {
          that._handleShortcuts(e);
        });

        this._configureUndoRedoArray();
      },

      _createElement: function(element) {

        return $(element);
      },

      _handleShortcuts: function(e) {
        if (document.activeElement === document.body) {
          if (e.keyCode == 46) {
            this.clearCriteria();
            e.preventDefault();
          } else if (e.ctrlKey) {
            if (e.keyCode == 90) {
              // it says that we have undo/redo action is going on.
              this.callUndo();
              e.preventDefault();
            } else if (e.keyCode == 89) {
              // it says that we have undo/redo action is going on.
              this.callRedo();
              e.preventDefault();
            } else if (e.keyCode == 67) {
              this.copyCriteria();
              e.preventDefault();
            } else if (e.keyCode == 86) {
              this.pasteCriteria();
              e.preventDefault();
            } else if (e.keyCode == 88) {
              this.copyCriteria();
              this.clearCriteria();
              e.preventDefault();
            }
          }
        }
      },
    };
  }
})(jQuery, fabric);