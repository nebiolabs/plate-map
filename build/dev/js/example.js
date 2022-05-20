// Wait for all the script load from the loader.js and fire up
window.onload = function() {
  let fields = [
    {
      required: true,
      id: 'pol',
      name: 'Polymerase',
      type: 'multiselect',
      placeHolder: "Polymerase",
      options: [
        {
          id: 234,
          text: 'Taq 1, processive enzyme with long name'
        },
        {
          id: 123,
          text: 'Taq 2'
        },
        {
          id: 3,
          text: 'Taq 3'
        },
        {
          id: 4,
          text: 'Taq 4'
        },
        {
          id: 5,
          text: 'Taq 5'
        }
      ]
    },
    {
      required: true,
      id: 'volume',
      name: 'Volume',
      type: 'numeric',
      placeholder: "Volume",
      units: ["uL", "mL"],
      defaultUnit: "uL"
    },
    {
      required: true,
      id: 'conc',
      name: 'Concentration',
      type: 'numeric',
      placeholder: "Conc.",
      defaultUnit: "ng/ul (final)"
    },
    {
      required: true,
      id: "on_ice",
      name: "On Ice",
      type: "boolean",
      placeHolder: "On Ice"
    }
  ];

  let amplicons_fields = [
    {
      required: true,
      id: 'amplicons',
      name: "Amplicons",
      type: "multiplex",
      placeHolder: "Amplicons",
      options: [
        {
          id: 11,
          text: 'Amplicon_A'
        },
        {
          id: 12,
          text: 'Amplicon_B'
        },
        {
          id: 13,
          text: 'Amplicon_C'
        },
        {
          id: 14,
          text: 'Amplicon_D'
        }
      ],
      multiplexFields:  [
        {
          required: true,
          id: 'template_ngul',
          setAll: true,
          name: 'template conc',
          type: 'select',
          options: [
            {id: 'a', text: "a"},
            {id: 'b', text: "b"},
            {id: 'c', text: "c"}
          ],
          units: ['uM (final)', "unit1"],
          defaultUnit: 'uM (final)'
        },
        {
          required: true,
          id: 'primer_umolarity',
          name: 'Primer conc',
          type: 'numeric',
          placeHolder: "Primer",
          units: ['uM (final)', "unit1"],
          defaultUnit: 'uM (final)'
        },
        {
          required: true,
          id: 'probe_umolarity',
          name: 'Probe conc',
          type: 'numeric',
          placeHolder: "Probe",
          defaultUnit: 'uM (final)'
        },
        {
          required: true,
          id: 'dilution_factor',
          name: 'Dilution factor',
          type: 'numeric',
          placeHolder: "Dilution factor",
          // defaultUnit: 'X'
        }
      ],
    },
  ];

  let product_fields = [
    {
      required: true,
      id: 'product_id',
      name: 'Product',
      type: 'multiplex',
      placeHolder: 'Product',
      options: [
        {
          id: 1,
          text: '-Agarase I'
        },
        {
          id: 2,
          text: '-N-Acetylgalactosaminidase'
        },
        {
          id: 3,
          text: '-N-Acetylglucosaminidase S'
        }
      ],
      multiplexFields: [
        {
          required: true,
          id: 'lot_id',
          setAll: true,
          name: 'Lot',
          type: 'select',
          options: [
            {id: 587, text: '028'},
            {id: 8284, text: '29'},
            {id: 8736, text: '30'},
            {id: 9192, text: '10007192'},
            {id: 10477, text: '10119863'}
          ]
        }
      ]
    }
  ]

  let attributes = {
    presets: [
      {
        title: "Pol/Vol",
        fields: ["volume", "pol"]
      },
      {
        title: "Vol",
        fields: ["volume"]
      }
    ],
    tabs: [
      {
        name: 'Product',
        fields: product_fields
      },
      {
        name: "Settings",
        fields: fields
      },
      {
        name: "Amplicons",
        fields: amplicons_fields
      }
    ]
  };
  window.plateData = {};

  let widget = $("#my-plate-map");

  function makeNewPlate() {
    let d = widget.plateMap("getDimensions");
    let rows = d.rows;
    let cols = d.cols;
    let wells = {};
    for (let r = 0; r < rows; r++) {
      let volume = 100;
      let pol = (r < (rows / 2)) ? 234 : 123;
      let on_ice = Boolean(r % 2);
      for (let c = 0; c < cols; c++) {
        let address = widget.plateMap("locToAddress", {"r": r, "c": c});
        let v = volume;
        let vunit = "mL";
        let amplicons = [{
          amplicons: 11,
          template_ngul: 'a',
          primer_umolarity: 2,
          probe_umolarity: 3,
          dilution_factor: 4
        }, {
          amplicons: 12,
          template_ngul: 'b',
          primer_umolarity: 22,
          probe_umolarity: 33,
          dilution_factor: 44
        }];
        if (v < 1) {
          v *= 1000;
          vunit = "uL";
        }
        wells[address] = {
          volume: v,
          pol: [pol],
          amplicons: amplicons,
          on_ice: on_ice
        };
        if ((c % 2) > 0) {
          volume /= 10
        }
      }
    }
    return {
      wells: wells,
      checkboxes: ["volume", "pol"]
    };
  }

  widget.plateMap({
    numRows: 8,
    numCols: 12,
    attributes: attributes,

    updateWells: function() {
      //data has changed
      window.plateData = widget.plateMap("getPlate") ;
      console.log(Object.keys(window.plateData.wells).length + " wells updated");
    },
    created: function() {
      console.log("Created");
    }
  });
  window.plateData = makeNewPlate();
  widget.plateMap("loadPlate", window.plateData);
  widget.plateMap("clearHistory");
};