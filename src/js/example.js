// Wait for all the script load from the loader.js and fire up
window.onload = function() {
  var fields = {
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
  var amplicons_field = {
    amplicons: {
      required: true,
      id: 'amplicons',
      name: "Amplicons",
      type: "multiplex",
      placeHolder: "Amplicons",
      options: [
        {
          id: 'A',
          text: 'Amplicon_A'
        },
        {
          id: 'B',
          text: 'Amplicon_B'
        },
        {
          id: 'C',
          text: 'Amplicon_C'
        },
        {
          id: 'D',
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
  var attributes = {
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

  function makeNewPlate(obj) {
    var d = $("#my-plate-layout").plateLayOut("getDimensions");
    var rows = d.rows;
    var cols = d.cols;
    var wells = {};
    for (var r = 0; r < rows; r++) {
      var volume = 100;
      var pol = (r < (rows / 2)) ? 234 : 123;
      var on_ice = Boolean(r % 2);
      for (var c = 0; c < cols; c++) {
        var i = r * cols + c;
        var v = volume;
        var vunit = "mL";
        var amplicons = [{
          amplicons: "A",
          template_ngul: 'a',
          primer_umolarity: 2,
          probe_umolarity: 3,
          dilution_factor: 4
        },
          {
            amplicons: "B",
            template_ngul: 'b',
            primer_umolarity: 22,
            probe_umolarity: 33,
            dilution_factor: 44
          }];
        if (v < 1) {
          v *= 1000;
          vunit = "uL";
        }
        wells[i.toString()] = {
          volume: v,
          pol: pol,
          amplicons: amplicons,
          on_ice: on_ice
        };
        if ((c % 2) > 0) {
          volume /= 10
        }
      }
    }
    return {
      derivative: wells,
      checkboxes: ["volume", "pol"]
    };
  }

  $("#my-plate-layout").plateLayOut({
    numRows: 8,
    numCols: 12,
    attributes: attributes,
    // scrollToGroup: false, // optional

    updateWells: function(event, data) {
      //data has changed
      window.plateData = data;
      console.log(Object.keys(data.derivative).length + " wells updated");
    },
    created: function(event, data) {
      console.log("Created");
    }
  });
  window.plateData = makeNewPlate();
  $("#my-plate-layout").plateLayOut("getPlates", window.plateData);
};