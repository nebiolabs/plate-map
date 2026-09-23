var plateMapWidget = plateMapWidget || {};

(function(SVG) {

  /**
   * Renders the plate grid itself as SVG (via SVG.js v2): one gradient
   * fill per color-palette entry (this.wellColors, derived from
   * color-manager.js's colorPairs), one tile group per well
   * (this.allTiles, indexed by numeric well index), row/column header
   * labels, and the tile-appearance setters (setTileColor/
   * setTileComplete/setTileVisible) called by engine.js's applyColors.
   * Mouse-drag well selection is wired up separately, in svg-events.js's
   * _svgEvents (called at the end of _createSvg here).
   */
  plateMapWidget.svgCreate = function() {
    //
    return {

      // Pixel-space layout constants for the whole plate grid.
      baseSizes: {
        spacing: 48,
        tile_radius: 22,
        center_radius_complete: 10,
        center_radius_incomplete: 14,
        label_size: 14,
        label_spacing: 24,
        text_size: 13,
        stroke: 0.5,
        gap: 2
      },

      allTiles: [],

      // Builds the SVG root, the well-shadow radial gradient, one linear
      // gradient per color-palette entry (this.wellColors -- note
      // wellColors.length === colorPairs.length always, since this is
      // built via colorPairs.map; see color-manager.js's
      // _wrapColorIndex), the row/column headers, every well tile, and
      // finally wires up mouse-drag selection (_svgEvents,
      // svg-events.js).
      _createSvg: function() {
        this.svg = new SVG(this.canvasContainer[0]);
        this.svg.attr('preserveAspectRatio', 'xMidYMin meet');
        let ls = this.baseSizes.label_spacing;

        this.svg.viewbox(-ls, -ls, ls + this.dimensions.cols * this.baseSizes.spacing, ls + this.dimensions.rows * this.baseSizes.spacing);

        this.wellShadow = this.svg.gradient('radial', function (stop) {
          stop.at(0.8, 'rgba(0,0,0,0.1)');
          stop.at(1, 'rgba(0,0,0,0.2)');
        }).from("50%", "50%").to("50%", "55%").radius("50%").attr('id', 'wellShadow');

        this.wellColors = this.colorPairs.map(function (pair, i) {
            return this.svg.gradient('linear', function (stop) {
                stop.at(0, pair[0]);
                stop.at(1, pair[1]);
            }).from(0, 0).to(0, 1).id('wellColor' + i.toString());
        }, this);

        this._fixRowAndColumn();
        this._putCircles();
        this._svgEvents();
      },

      // Draws the row-letter and column-number header labels along the
      // grid's left/top edges.
      _fixRowAndColumn: function () {
        let cols = this.dimensions.cols;
        let rows = this.dimensions.rows;

        let rh = this.svg.nested().attr({'x': -this.baseSizes.label_spacing / 2.0}).addClass('rowHead');
        let ch = this.svg.nested().attr({'y': -this.baseSizes.label_spacing / 2.0}).addClass('colHead');

        for (let i = 0; i < rows; i++) {
          rh.plain(this._rowKey(i)).attr({y: this.baseSizes.spacing * (i + 0.5)});
        }
        for (let i = 0; i < cols; i++) {
          ch.plain(this._colKey(i)).attr({x: this.baseSizes.spacing * (i + 0.5)});
        }
      },

      // Creates one tile (via _createTile) for every well in the grid,
      // populating this.allTiles indexed by numeric well index.
      _putCircles: function () {
        let cols = this.dimensions.cols;
        let rows = this.dimensions.rows;
        this.allTiles = Array(cols * rows);

        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            let tile = this._createTile(row, col);
            this.allTiles[tile.index] = tile;
          }
        }
      },

      // Builds one well's SVG group: the highlight rect (drag-selection
      // feedback), the shadow circle, and the "fill" group (color-filled
      // circle + completion-status center dot + numeric group label) --
      // together forming the visual tile object returned and stored in
      // this.allTiles.
      _createTile: function (r, c) {
        let g = this.svg.nested().move(this.baseSizes.spacing * c, this.baseSizes.spacing * r).addClass('tile');
        let m = this.baseSizes.spacing / 2.0;

        let d = {"tile": g};
        d.r = r;
        d.c = c;
        d.index = this.locToIndex(d);
        d.address = this.locToAddress(d);

        g.rect(this.baseSizes.spacing, this.baseSizes.spacing).addClass('highlight');
        g.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('well').fill(this.wellShadow);

        let tf = g.group().addClass('fill');
        d["circle"] = tf.circle(this.baseSizes.tile_radius * 2).center(m, m).addClass('circle').fill(this.wellColors[0]);
        tf.circle(this.baseSizes.center_radius_complete * 2).center(m, m).addClass('center');
        tf.circle(this.baseSizes.center_radius_incomplete * 2).center(m, m).addClass('center_incomplete');
        d["label"] = tf.plain("0").attr({x: m, y: m}).addClass('label');

        return d;
      },

      // Toggles the "incomplete" CSS class (drives the center-dot style
      // that visually distinguishes fully-filled-in wells from partially
      // filled ones -- see checkCompletion in engine.js).
      setTileComplete: function (tile, complete) {
        if (complete) {
          tile.tile.removeClass('incomplete');
        } else {
          tile.tile.addClass('incomplete');
        }
      },

      // Toggles the "empty" CSS class (a well with no group/color
      // assigned yet, before engine.js's applyColors runs on it).
      setTileVisible: function (tile, visible) {
        if (visible) {
          tile.tile.removeClass('empty');
        } else {
          tile.tile.addClass('empty');
        }
      },

      // Sets a tile's visible group/color number (tile.colorIndex --
      // the RAW, unwrapped group number, so this can exceed the
      // palette's size for plates with many distinct groups; see
      // test/unit/engine-grouping.test.js) and its rendered fill (which
      // DOES wrap, via _wrapColorIndex from color-manager.js, cycling
      // through the palette so index 0 stays reserved for the "no data"
      // gray swatch). This same wraparound formula is independently
      // applied to the bottom-table swatch background in
      // bottom-table.js's addBottomTableRow.
      setTileColor: function (tile, color) {
        this.setTileVisible(tile, true);
        tile.colorIndex = parseInt(color);
        tile.label.plain(String(tile.colorIndex));

        color = this._wrapColorIndex(color);

        tile.circle.fill(this.wellColors[color])
      }
    };
  }
})(SVG);