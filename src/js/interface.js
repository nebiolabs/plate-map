var plateMapWidget = plateMapWidget || {};

(function($) {

  /**
   * Builds the widget's overall DOM skeleton (container -> top section
   * [overlay + canvas | tabs] -> bottom table) and wires up global
   * keyboard shortcuts (cut/copy/paste, undo/redo, delete). This is the
   * file whose _createInterface is called once from plate-map.js's
   * _create, after all other plateMapWidget.* mixins have already been
   * merged onto the instance -- so every method it calls here
   * (_createOverLay, _createSvg, _createTabAtRight, etc.) is defined
   * elsewhere but already available on `this`.
   */
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

      // Thin jQuery-wrapping helper used everywhere in src/js/ instead of
      // calling $(...) directly -- exists as a single indirection point,
      // not because it does anything beyond that today.
      _createElement: function(element) {
        return $(element);
      },

      // Wires the browser's native cut/copy/paste events (NOT custom
      // keybindings -- see _handleShortcuts below for those) to
      // copy/clear/paste-criteria, but only when nothing else on the
      // page has focus (document.activeElement === document.body) --
      // so these don't fire while a user is cutting/copying/pasting text
      // inside an actual input field.
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

      // Handles Delete (clear selection), Ctrl/Cmd+Z (undo, or redo with
      // Shift), and Ctrl/Cmd+Y (redo) -- again gated on
      // document.activeElement === document.body so these don't fire
      // while a text input has focus (see the dedicated regression test
      // in test/e2e/undo-redo-ui.spec.js).
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