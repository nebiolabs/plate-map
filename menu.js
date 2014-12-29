var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.menu = function() {
    // This object contains Menu items and how it works;
    return {

      _createMenu: function() {

        var menuItems = {
          "Templates": {},
          "Redo": {},
          "Undo": {}
        };

        var menuContent = null;

        for(var menuItem in menuItems) {
          menuContent = this._createElement("<div></div>")
          .html(menuItem)
          .addClass("plate-setup-menu-item");

          $(menuContent).on("click", function() {
            console.log("okay menu");
            //Code for click event. May be will have to implement poping menu here.
          });

          $(this.menuContainer).append(menuContent);
        }
      },
    };
  }
})(jQuery, fabric)
