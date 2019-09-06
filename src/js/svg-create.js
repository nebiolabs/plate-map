var plateMapWidget = plateMapWidget || {};

(function(SVG) {

  plateMapWidget.svgCreate = function() {
    //
    return {

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

      _createSvg: function() {
        this.svg = new SVG(this.canvasContainer[0]).addClass();
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

      setTileComplete: function (tile, complete) {
        if (complete) {
          tile.tile.removeClass('incomplete');
        } else {
          tile.tile.addClass('incomplete');
        }
      },

      setTileVisible: function (tile, visible) {
        if (visible) {
          tile.tile.removeClass('empty');
        } else {
          tile.tile.addClass('empty');
        }
      },

      setTileColor: function (tile, color) {
        this.setTileVisible(tile, true);
        tile.colorIndex = parseInt(color);
        tile.label.plain(String(tile.colorIndex));

        if (color > 0) {
          color = ((color - 1) % (this.wellColors.length - 1)) + 1;
        }

        tile.circle.fill(this.wellColors[color])
      }
    };
  }
})(SVG);