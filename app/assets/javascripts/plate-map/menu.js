var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.menu = function() {
    // This object contains Menu items and how it works;
    return {

      _createMenu: function() {
        var menuItems = {
          "Redo": {},
          "Undo": {}
        };

        var menuContent = null;
        var that = this;
        for(var menuItem in menuItems) {
          menuContent = this._createElement("<div></div>")
          .html(menuItem)
          .addClass("plate-setup-menu-item");

          $(menuContent).on("click", function(evt) {

            if($(this).html() == "Undo") { // May be we shoush change it to an array, So that "undo" is not required.
              that.callUndo();
            } else if($(this).html() == "Redo") {
              that.callRedo();
            }
            //Code for click event. May be will have to implement poping menu here.
          });

          $(this.menuContainer).append(menuContent);
        }
      },
    };
  }
})(jQuery, fabric)
