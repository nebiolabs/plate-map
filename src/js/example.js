// Wait for all the script load from the loader.js and fire up
window.onload = function() {
  let fields = {
    polymerase: {
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
    volume: {
      required: true,
      id: 'volume',
      name: 'Volume',
      type: 'numeric',
      placeholder: "Volume",
      units: ["uL", "mL"],
      defaultUnit: "uL"
    },
    conc: {
      required: true,
      id: 'conc',
      name: 'Concentration',
      type: 'numeric',
      placeholder: "Conc.",
      defaultUnit: "ng/ul (final)"
    },
    on_ice: {
      required: true,
      id: "on_ice",
      name: "On Ice",
      type: "boolean",
      placeHolder: "On Ice"
    }
  };
  let amplicons_field = {
    amplicons: {
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
      multiplexFields: {
        template_ngul: {
          required: true,
          id: 'template_ngul',
          name: 'template conc',
          type: 'select',
          options: [
            {id: 'a', text: "a"},
            {id: 'b', text: "b"},
            {id: 'c', text: "c"}
          ]
        },
        primer_umolarity: {
          required: true,
          id: 'primer_umolarity',
          name: 'Primer conc',
          type: 'numeric',
          placeHolder: "Primer",
          units: ['uM (final)', "unit1"],
          defaultUnit: 'uM (final)'
        },
        probe_umolarity: {
          required: true,
          id: 'probe_umolarity',
          name: 'Probe conc',
          type: 'numeric',
          placeHolder: "Probe",
          defaultUnit: 'uM (final)'
        },
        dilution_factor: {
          required: true,
          id: 'dilution_factor',
          name: 'Dilution factor',
          type: 'numeric',
          placeHolder: "Dilution factor",
          defaultUnit: 'X'
        }
      },
    },
  };
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
        name: "Settings",
        fields: fields
      },
      {
        name: "amplicons",
        fields: amplicons_field
      }
    ]
  };
  window.plateData = {};

  let widget = $("#my-plate-layout");

  function makeNewPlate() {
    let d = widget.plateLayOut("getDimensions");
    let rows = d.rows;
    let cols = d.cols;
    let wells = {};
    for (let r = 0; r < rows; r++) {
      let volume = 100;
      let pol = (r < (rows / 2)) ? 234 : 123;
      let on_ice = Boolean(r % 2);
      for (let c = 0; c < cols; c++) {
        let address = widget.plateLayOut("locToAddress", {"r": r, "c": c});
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

  widget.plateLayOut({
    numRows: 8,
    numCols: 12,
    attributes: attributes,

    updateWells: function() {
      //data has changed
      window.plateData = widget.plateLayOut("getPlate") ;
      console.log(Object.keys(window.plateData.wells).length + " wells updated");
    },
    created: function() {
      console.log("Created");
    }
  });
  window.plateData = makeNewPlate();
  widget.plateLayOut("loadPlate", window.plateData);
  widget.plateLayOut("clearHistory");
};