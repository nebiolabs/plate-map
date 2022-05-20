export function parseConditions(cond, unitMapList) {
  if (cond !== null && cond !== undefined) {
    let r = cond.map(function (element) {
      let unitOpts = {};
      unitMapList.forEach(function(unitMap) {
        let unitVals = unitMap.unitHash[element[1]];
        if (typeof unitVals != 'undefined'){
          unitOpts[unitMap.unitSubFieldId] = unitVals.map(function(unit){
            return unit.text;
          });
        } else {
          // when unit type is has no unit, return all the units
          unitOpts[unitMap.unitSubFieldId] = unitsToList(unitMapList.unitHash);
        }
      });
      return {
        "id": element[0],
        "unitOptions": unitOpts,
        "text": element[2]
      };
    });
    r.sort(optionSort);
    return r;
  }
}

export function unitsToList(unitMap) {
  let cleanList = [];
  for (let unitType in unitMap) {
    unitMap[unitType].forEach(function(units){
      cleanList.push(units.text);
    });
  }
  return cleanList;
}

export function optionSort(a, b) {
  if (a.text < b.text)
    return -1;
  if (a.text > b.text)
    return 1;
  return 0
}

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

  /////////////////
  // PRODUCT LOT //
  /////////////////

  // conds container is [[condition_id, unit_type_id, condition_name] ...]
  // product_options is [[product_id, product_id, product_name] ...]
  let product_options = [
      [1, 1, '-Agarase I'],
      [28, 28, "5' Deadenylase"],
      [33, 33, 'dGTP']
  ]

  // units container is {unit_type_id: [unit_id, unit_name], ...}
  // lot_options is {product_id: [lot_id, lot_name], ...}
  let lot_options = {
    1: [
      {id: 587, text: '028'},
      {id: 8284, text: '29'},
      {id: 8736, text: '30'},
      {id: 9192, text: '10007192'},
      {id: 10477, text: '10119863'}
    ],
    28: [
      {id: 3795, text: '2'},
      {id: 4718, text: '4'}
    ],
    33: [
      {id: 8591, text: '10091556'},
      {id: 10019, text: '10109116'}
    ]
  }

  let product_fields = [
    {
      required: false,
      id: 'product_id',
      name: 'Product',
      type: 'multiplex',
      placeHolder: 'Product',
      options: parseConditions(
          product_options,
          [{
            unitSubFieldId: 'lot_id',
            unitHash: lot_options
          }]
      )
      ,
      multiplexFields: [
        {
          required: true,
          id: 'lot_id',
          name: 'Lot',
          type: 'text',
          units: unitsToList(lot_options),
        }
      ]
    }
  ]

  /////////////////
  // PRODUCT LOT //
  /////////////////

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