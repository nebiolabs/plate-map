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

        this._placeWellAttr();
        this._placeWellAttrTabs();
        // Bottom of the screen
        this._bottomScreen();
        // Canvas
        this._canvas();

      },

      _createElement: function(element) {

        return $(element);
      },

      _createCanvas: function() {

        this.normalCanvas = this._createElement("<canvas>").attr("id", "DNAcanvas");
        $(this.canvasContainer).append(this.normalCanvas);
      },

      _createTabAtRight: function() {
        this.tabContainer = this._createElement("<div></div>").addClass("plate-setup-tab-container");
        $(this.topRight).append(this.tabContainer);
      },

      _createOverLay: function() {

        //this.radioContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-radio-container");
        //$(this.overLayContainer).append(this.radioContainer);
        this.overLayTextContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-text-container");
        $(this.overLayTextContainer).html("Completion Percentage:");
        $(this.overLayContainer).append(this.overLayTextContainer);
        this.overLayButtonContainer = this._createElement("<div></div>").addClass("plate-setup-overlay-button-container");
        $(this.overLayContainer).append(this.overLayButtonContainer);

        this.copyCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.copyCrieteriaButton).text("Copy Criteria");
        $(this.overLayButtonContainer).append(this.copyCrieteriaButton);

        this.pasteCrieteriaButton = this._createElement("<button />").addClass("plate-setup-button");
        $(this.pasteCrieteriaButton).text("Paste Criteria");
        $(this.overLayButtonContainer).append(this.pasteCrieteriaButton);
      },

      _initiateFabricCanvas: function() {

        this.mainFabricCanvas = new fabric.Canvas('DNAcanvas', {
          backgroundColor: '#f5f5f5',
          selection: true,
          stateful: true
        })
        .setWidth(632)
        .setHeight(482);
      },



      _createTabs: function() {
        // this could be done using z-index. just imagine few cards stacked up.
        // Check if options has tab data.
        // Originally we will be pulling tab data from developer.
        // Now we are building upon dummy data.
        this.tabHead = this._createElement("<div></div>").addClass("plate-setup-tab-head");
        $(this.tabContainer).append(this.tabHead);

        var tabData = this.options.attributes;

        var tabIndex = 0;

        for(var tab in tabData) {
          this.allTabs[tabIndex ++] = this._createElement("<div></div>").addClass("plate-setup-tab");
          $(this.allTabs[tabIndex - 1]).data("index", tabIndex - 1)
          .html(tab);

          var that = this;

          $(this.allTabs[tabIndex - 1]).click(function() {
            that._tabClickHandler(this);
          });

          $(this.tabHead).append(this.allTabs[tabIndex - 1]);

        }

        this.tabDataContainer = this._createElement("<div></div>").addClass("plate-setup-tab-data-container");
        $(this.tabContainer).append(this.tabDataContainer);

        this._addDataTabs(tabData);

        $(this.allTabs[0]).click();

        this._addTabData();
      },

      _tabClickHandler: function(clickedTab) {

        if(this.selectedTab) {
          $(this.selectedTab).removeClass("plate-setup-tab-selected")
          .addClass("plate-setup-tab");

          var previouslyClickedTabIndex = $(this.selectedTab).data("index");
          $(this.allDataTabs[previouslyClickedTabIndex]).css("z-index", 0);
        }

        $(clickedTab).addClass("plate-setup-tab-selected");

        this.selectedTab = clickedTab;
        //console.log(this.allDataTabs[$(this.selectedTab).data("index")]);
        var clickedTabIndex = $(clickedTab).data("index");
        $(this.allDataTabs[clickedTabIndex]).css("z-index", 1000);
      },

      _addDataTabs: function(tabs) {

        var tabIndex = 0;

        for(var tabData in tabs) {
          this.allDataTabs[tabIndex ++] = this._createElement("<div></div>").addClass("plate-setup-data-div")
          .css("z-index", 0);
          $(this.tabDataContainer).append(this.allDataTabs[tabIndex - 1]);
        }
      },

      _placeWellAttr: function() {

        this.wellAttrContainer = this._createElement("<div></div>").addClass("plate-setup-well-attr-container")
        .html("Well Attribute Tabs");
        $(this.tabContainer).append(this.wellAttrContainer);
      },

      _placeWellAttrTabs: function() {

        this.presetTabContainer = this._createElement("<div></div>").addClass("plate-setup-preset-container");
        $(this.tabContainer).append(this.presetTabContainer);
        // From where I am going to get this data ??
        var wellAttrData = {
          "Preset 1": {

          },

          "Preset 2": {

          },

          "Preset 3": {

          },

          "Preset 4": {

          }
        }

        var presetArray = [];
        var counter = 0;
        for(var preset in wellAttrData) {
          var divText = this._createElement("<div></div>").html(preset)
          .addClass("plate-setup-prest-tab-div");
          presetArray[counter ++] = this._createElement("<div></div>").addClass("plate-setup-prest-tab")
          .append(divText);
          $(this.presetTabContainer).append(presetArray[counter - 1]);

          var that = this;

          $(presetArray[counter - 1]).click(function() {
            that._presetClickHandler(this);
          });
        }
      },

      _presetClickHandler: function(clickedPreset) {

        if(this.previouslyClickedPreset) {
          $(this.previouslyClickedPreset).removeClass("plate-setup-prest-tab-selected")
          .addClass("plate-setup-prest-tab");
        }

        $(clickedPreset).addClass("plate-setup-prest-tab-selected");
        this.previouslyClickedPreset = clickedPreset;
        // What does preset tabs do ??
      },

    }

  }

})(jQuery, fabric);
