var plateMapWidget = plateMapWidget || {};

(function($) {

  plateMapWidget.tabs = function() {
    // Tabs create and manage tabs at the right side of widget.
    return {

      allTabs: [],

      defaultWell: {},

      allDataTabs: [], // To hold all the tab contents. this contains all the tabs and its elements and elements
      // Settings as a whole. its very usefull, when we have units for a specific field.
      // it goes like tabs-> individual field-> units and checkbox

      _createTabAtRight: function() {
        this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
        $(this.topRight).append(this.tabContainer);
      },

      _createTabs: function() {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);

        let tabData = this.options.attributes.tabs;
        let that = this;

        tabData.forEach(function(tab, tabIndex) {
          that.allTabs[tabIndex] = that._createElement("<div></div>").addClass("plate-setup-tab");
          $(that.allTabs[tabIndex]).data("index", tabIndex)
            .text(tab.name);

          $(that.allTabs[tabIndex]).click(function() {
            that._tabClickHandler(this);
          });

          $(that.tabHead).append(that.allTabs[tabIndex]);
        });

        this.tabDataContainer = this._createElement("<div></div>").addClass("plate-setup-tab-data-container");
        $(this.tabContainer).append(this.tabDataContainer);

        this._addDataTabs(tabData);

        $(this.allTabs[0]).click();

        this._addTabData();
      },

      _tabClickHandler: function(clickedTab) {

        if (this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected")
            .addClass("plate-setup-tab");

          let previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
          this.readOnlyHandler();
        }

        $(clickedTab).addClass("plate-setup-tab-selected");

        this.selectedTab = clickedTab;

        let clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },

      _addDataTabs: function(tabs) {
        this.allDataTabs = tabs.map(function () {
          return this._createElement("<div></div>").addClass("plate-setup-data-div").css("z-index", 0);
        }, this);
        $(this.tabContainer).append(this.allDataTabs);
      }
    };
  }
})(jQuery);