var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.interface = function() {
    // interface holds all the methods to put the interface in place
    return {

      _createInterface: function() {

        let divIdentifier = '<div></div>';
        this.container = this._createElement(divIdentifier).addClass("plate-setup-wrapper");
        this.topSection = this._createElement(divIdentifier).addClass("plate-setup-top-section");

        this.topLeft = this._createElement(divIdentifier).addClass("plate-setup-top-left");
        this.topRight = this._createElement(divIdentifier).addClass("plate-setup-top-right");

        this.overLayContainer = this._createElement(divIdentifier).addClass("plate-setup-overlay-container");
        this.canvasContainer = this._createElement(divIdentifier).addClass("plate-setup-canvas-container");

        this._createOverLay();
        $(this.topLeft).append(this.overLayContainer);
        $(this.topLeft).append(this.canvasContainer);

        $(this.topSection).append(this.topLeft);
        $(this.topSection).append(this.topRight);

        $(this.container).append(this.topSection);
        $(this.element).append(this.container);

        this._createSvg();

        this._createTabAtRight();
        this._createTabs();

        this._placePresetTabs();
        // Bottom of the screen
        this._bottomScreen();

        this.bottomForFirstTime();

        let that = this;
        this._setShortcuts();
        $(document.body).keyup(function(e) {
          that._handleShortcuts(e);
        });

        this._configureUndoRedoArray();
      },

      _createElement: function(element) {
        return $(element);
      },

      _setShortcuts: function() {
        let that = this;
        window.addEventListener("cut", function(e) {
          if (document.activeElement === document.body) {
            that.copyCriteria();
            that.clearCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("copy", function(e) {
          if (document.activeElement === document.body) {
            that.copyCriteria();
            e.preventDefault();
          }
        });
        window.addEventListener("paste", function(e) {
          if (document.activeElement === document.body) {
            that.pasteCriteria();
            e.preventDefault();
          }
        });
      },

      _handleShortcuts: function(e) {
        if (document.activeElement === document.body) {
          if (e.keyCode === 46) {
            this.clearCriteria();
            e.preventDefault();
          } else if (e.ctrlKey || e.metaKey) {
            if (e.keyCode === 90) {
              if (e.shiftKey) {
                this.redo();
              } else {
                this.undo();
              }
              e.preventDefault();
            } else if (e.keyCode === 89) {
              this.redo();
              e.preventDefault();
            }
          }
        }
      },
    };
  }
})(jQuery);