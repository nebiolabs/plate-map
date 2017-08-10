var plateLayOutWidget = plateLayOutWidget || {};

(function($, fabric) {

  plateLayOutWidget.menu = function() {
    // This object contains Menu items and how it works;
    return {

      _createMenu: function() {

        var menuItems = {
          //"Master": {},
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
        var masterTitle = this._createElement("<span></span>")
        masterTitle.html("Master:&nbsp;")
        var masterSelect = this._createElement("<select></select>")
        masterSelect.attr('id', 'master_select');

        for(var setItem in masterSetOptions) {
          var masterItem = this._createElement("<option></option>");
          masterItem.attr('value', masterSetOptions[setItem].id);
          masterItem.html(masterSetOptions[setItem].text);
          masterSelect.append(masterItem);
        }

        //masterSelect.select2();
        //masterSelect.addClass("plate-setup-menu-item")
        $(this.menuContainer).append(masterTitle);
        $(this.menuContainer).append(masterSelect);

        var applyButton = this._createElement("<button>Apply Master</button>");
        applyButton.click(applyMasterSet);
        $(this.menuContainer).append(applyButton);
        masterSelect.select2();
      },
    };
  }
})(jQuery, fabric)
