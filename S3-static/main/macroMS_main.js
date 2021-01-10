
var filter_selections = "   <a class='lab' id='mincut_label'>Minimum:</a><input type='text' pattern='^[0-9.-]*$' id='mincut' size='5'><br><a class='lab' id='maxcut_label'>Maximum:</a><input type='text' pattern='^[0-9.-]*$' id='maxcut' size='5' ><br><button onclick='update_filtered_blobs(1)'>View filtered</button> <button onclick='update_filtered_blobs(3)'>Revert </button><button onclick='update_filtered_blobs(2)'>Finalize</button> "

var baseurl = "https://macroms.scs.illinois.edu/"

if (RefIMG == 2) {
  document.getElementById('section6').innerHTML += "<br><button id='show_corners'>Show distortion correction area </button>"
  document.getElementById("Satus_bar2").innerText += "      [Optical correction mode]"

}
if (plotmode == "true") {
  document.getElementById("section1").style.display = 'none'
  document.getElementById("header1").style.display = 'none'
  document.getElementById("section_plot").style.display = 'inline'
} else { if (Revisit != "1") { status_update('Page expires in 24 hrs after image upload ') } }


document.getElementById("Array_mode").checked = false
document.getElementById("horizontal_flip_geometry").checked = false
document.getElementById("TSO_geometry").checked = false
document.getElementById('radiobutton5').checked = false;
  window.onload = function() {
   document.getElementById("Array_mode").checked = false
  }
   



function show_multiple() {
  var entries = document.getElementById("Bloblist").value
  var data = Papa.parse(entries, {
    delimiter: "\t"
  });

  var data_indexes = Object.keys(data['data'])

  var out_with_data = []
  var out_with_data_data = []

  var out_without_data = []
  var out_without_data_data = []

  var out_data = []
  for (ii = 0; ii < data_indexes.length; ii++) {
    if (data['data'][data_indexes[ii]][0] == null) { continue }
    var splited_line = data['data'][data_indexes[ii]][0].split('_')
    if (splited_line.length == 6) {
      var entry = [splited_line[2], splited_line[3], splited_line[5], splited_line[5], '1', '0', 'B', String(ii + 1)]
      if (isNumeric(data['data'][data_indexes[ii]][1])) {

        out_with_data.push(entry)
        out_with_data_data.push(data['data'][data_indexes[ii]][1])

      } else {

        out_without_data.push(entry)
        out_without_data_data.push(0)
      }
    }
  }
  if (Math.min(...out_data) == Math.max(...out_data)) {
    alert('All data are the same!')
    return
  }

  purge_blobs()
  if (out_with_data.length > 0) { gu2_1(out_with_data, out_with_data_data) }
  if (out_without_data.length > 0) { gu2_1(out_without_data, out_without_data_data) }
  if (out_without_data.length+out_with_data.length ==1){hEl.goToElementLocation(hEl.elements[0].id)}
   
}
function Load_CSV_blobs(data) {

  var S = []
  for (var count = 0, n = data.length; count < n; ++count) {

    if (data[count].length == 3 && isNumeric(data[count][0]) && isNumeric(data[count][1]) && isNumeric(data[count][2])) {

      S.push(String(data[count][0]) + 'and' + String(data[count][1]) + 'and' + String(data[count][2]) + 'and' + String(data[count][2]) + 'and1and0andBand0')

    }
    if (data[count].length == 4 && isNumeric(data[count][0]) && isNumeric(data[count][1]) && isNumeric(data[count][2]) && isNumeric(data[count][3])) {

      S.push(String(data[count][0]) + 'and' + String(data[count][1]) + 'and' + String(data[count][2]) + 'and' + String(data[count][2]) + 'and1and0andBand' + String(parseInt(data[count][3])))

    }
  }

  if (S.length > 1000) {
    alert('Max limit is 1000. Load cancelled')
    return null
  }
  gu4(false);
  gu2(S, false);

}





function handleFileSelect(evt) {
  var file = evt.target.files[0];
  Papa.parse(file, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function (results) {
      Load_CSV_blobs(results['data']);
    }
  });

}

function handleFileSelect2(evt) {
  var file = evt.target.files[0];
  Papa.parse(file, {
    header: false,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function (results) {
      Load_samplenames(results['data']);
    }
  });
}


function Array_mode_Prep() {
  if (document.getElementById('Array_mode').checked) {
    document.getElementById("mark_corner_flag").innerText = 'Mark corners'

    document.getElementById("Array_mode_options").style.display = 'inline'

    status_update("Adding blob by drag & drop temporarily disabled")
  } else {
    document.getElementById("Array_mode_options").style.display = 'none';

    document.getElementById("mark_corner_flag").innerText = 'Edit blobs'

    status_update("Adding blob by drag & drop is now enabled")


  }
}


function switch_to_reg() {
  if (procrs_switch == false && procrs != []) {
    procrs_switch = true
    document.getElementById('threshold_color').value = '-1'
    viewer.setFilterOptions({
      filters: {
        processors: []
      },
    });

  }
  else if (procrs_switch == true && procrs != []) {
    procrs_switch = false
    document.getElementById('threshold_color').value = procrs_choice
    viewer.setFilterOptions({
      filters: {
        processors: procrs
      },
    });

  }
}


function update_threshold() {
  procrs_switch = false
  var threshold = document.getElementById('threshold_selector').value;
  procrs_choice = document.getElementById('threshold_color').value;
  var color = document.getElementById('threshold_color').value;
  document.getElementById('threshold_value').innerText = threshold;

  var invert = false

  if (color > 3) {
    invert = true
    color -= 4
  }
  if (color > -1) {

    procrs = [OpenSeadragon.Filters.THRESHOLDING(threshold, color)]
    if (invert == true) {
      procrs.push(OpenSeadragon.Filters.INVERT())
    }
    viewer.setFilterOptions({
      filters: {
        processors: procrs
      },
      loadMode: 'sync'
    });
  }

  else {
    procrs = []
    viewer.setFilterOptions({
      filters: {
        processors: procrs
      },
    });

  }

}


function filter_graph(choice) {

  var blobs = blobs_before_filter
  if (blobs.length < 2) {
    alert('At least two or more blobs are required')
    return 0
  }

  if (somethingisrunning == true) {
    alert("This submission is ignored, server is still processing the previous submission! Please avoid double clicking on the button, or clicking the button before another job is finished. (i.e. clicking Circular Pack button right after clicking Run microMS button is prohibited)")
    return 0
  }

  document.getElementById('filter_selections').innerHTML = filter_selections

  filter_switch = choice + 1
  var data = []
  for (var i = 0, n = blobs.length; i < n; ++i) {
    dat = blobs[i].split('and')[parseInt(filter_switch) + 2]
    if (filter_switch == 1) {
      dat = (dat / 2) * (dat / 2) * Math.PI
    }
    data.push(dat)
  }
  var trace = {
    x: data,
    type: 'histogram',
  };
  var data = [trace];
  var layout = {

    title: ['Size vs Counts', 'Circularity vs Counts', 'Distance vs Counts'][choice],
    margin: {
      l: 30,
      r: 30,
      t: 80,
      b: 30,
    }, yaxis: {
      fixedrange: true
    },
    bargap: 0,
  };

  Plotly.newPlot('plotly-div', data, layout, { scrollZoom: true, displaylogo: false, doubleClickDelay: 1000, modeBarButtonsToRemove: ['toImage', 'sendDataToCloud', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'select2d', 'autoScale2d', 'toggleSpikelines'] });


  var graphDiv = document.getElementById('plotly-div');
  graphDiv.on('plotly_relayout',
    function (eventdata) {
      x1 = eventdata['xaxis.range[0]'];
      x2 = eventdata['xaxis.range[1]'];
      if (isNumeric(x1) && isNumeric(x2)) {
        document.getElementById('mincut').value = String(x1)
        document.getElementById('maxcut').value = String(x2)
      }
    });
  document.getElementById('mincut_label').innerText = ['Size min:', 'Circularity min:', 'Distance min:'][filter_switch - 1]
  document.getElementById('mincut').value = ''
  document.getElementById('maxcut_label').innerText = ['Size max:', 'Circularity max:', 'Distance max:'][filter_switch - 1]
  document.getElementById('maxcut').value = ''
}
function update_filtered_blobs(mode) {
  var mincut = parseFloat(document.getElementById('mincut').value)
  var maxcut = parseFloat(document.getElementById('maxcut').value)
  if (filter_switch == 1) {
    mincut = Math.sqrt(mincut / Math.PI) * 2
    maxcut = Math.sqrt(maxcut / Math.PI) * 2
  }
  if (mode == 1) {
    var blobs = blobs_before_filter
    filtered_out_save = []
    var filteredin = []
    for (var i = 0, n = blobs.length; i < n; ++i) {
      dat = parseFloat(blobs[i].split('and')[parseInt(filter_switch) + 2])
      if (mincut > dat || dat > maxcut) {
        filtered_out_save.push(blobs[i])
      } else {
        filteredin.push(blobs[i])
      }

    }
    purge_blobs()
    gu2(filteredin, true)
    status_update(String(filteredin.length) + ' blobs out of ' + String(blobs_before_filter.length) + " blobs selected.")

  }

  if (mode == 2) {
    blobs_before_filter = find_true_added_blobs()
    document.getElementById("plotly-div").innerHTML = ''
    status_update('')
  }

  if (mode == 3) {
    purge_blobs()
    gu2(blobs_before_filter, true)
    status_update('')
  }
}





$(document).ready(function () {
  $("#Run_microms").click(function (event) {
    var R = find_true_ROIs()
    var checklist = [isNumeric($("#minSize").val()), isNumeric($("#maxSize").val()), isNumeric($("#minCircularity").val()), isNumeric($("#colorChannel").val()), isNumeric($("#threshold").val())]

    if (checklist.includes(false)) {
      alert('The input paramters includes non-numeric or empty entry. Run terminated.')
      return 0
    }



    if (somethingisrunning == false) {
      somethingisrunning = true
      status_update('Finding blobs..')
      var threshold_color = $("#threshold_color").val();
      if (threshold_color == -1) {
        threshold_color = 0
      }
      if (threshold_color < 4) {
        image_threshold = document.getElementById('threshold_selector').value;
      }
      else {
        threshold_color -= 4
        image_threshold = document.getElementById('threshold_selector').value * -1;
      }



      $.ajax({
        url: baseurl + "6",
        method: "GET",
        data: {

          dziid: folder_ID,
          minSize: $("#minSize").val(),
          maxSize: $("#maxSize").val(),
          minCircularity: $("#minCircularity").val(),
          colorChannel: $("#colorChannel").val(),
          threshold: $("#threshold").val(),
          image_threshold: image_threshold,
          refIMG: RefIMG,
          threshold_color: threshold_color,

        },
        dataType: "html",
        success: function (response_text) {
          somethingisrunning = false
          if (response_text.length > 0) {
            var S = response_text.split('end');
            if (R.length != 0) {
              remove_ROI_Filter()
              var S_filtered = ROI_Filter(S)
              gu2(S_filtered, false);
              somethingisrunning = false
              S = S_filtered
            } else {
              gu4(false);
              gu2(S, false);
              somethingisrunning = false

            }

            blobs_before_filter = find_true_added_blobs()
            ispacked = false;
            status_update('microMS found ' + S.length.toString() + ' blobs')
          }
          else {
            status_update('')
            alert('No feature could be found with the given search parameters')
          }


        },
        error: function (jqXHR, exception) {
          status_update('')
          somethingisrunning = false
          var msg = '';
          if (jqXHR.status === 0) {
            msg = 'No connection. Verify network';
          } else if (jqXHR.status == 404) {
            msg = 'Requested page not found [404]';
          } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
          } else if (exception === 'parsererror') {
            msg = 'Requested parse failed.';
          } else if (exception === 'timeout') {
            msg = 'Time out error.';
          } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
          } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
          }
          alert(msg);
        },
        timeout: 250000,

      });


    } else { alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished. (i.e. clicking Circular Pack button right after clicking Run microMS button is prohibited)") }

  });


  $("#circular_pack").click(function () {
    if (isNumeric($("#pack_offset").val()) == false) {
      alert('The input paramters includes non-numeric or empty entry. Run terminated.')
      return 0
    }
    if (ispacked == true) {
      alert('Circular packing cannot performed on already packed blobs. Click the reset blobs/fiducials button to pack new blobs')
      return 0
    }
    var blobs = find_true_added_blobs()

    if (blobs.length != 0) {
      if (somethingisrunning == false) {
        somethingisrunning = true
        status_update('Packing blobs..')

        $.ajax({
          headers: { "X-CSRFToken": token },
          url: baseurl + "7",
          method: "POST",
          data: {
            csrf: token,
            dziID: folder_ID,
            offset: $("#pack_offset").val(),
            blob_added: blobs.join('end'),
          },
          dataType: "html",
          success: function (response_text) {

            somethingisrunning = false
            status_update('Packing finished ')
            var S = response_text.split('end');
            gu4(false);
            gu2(S, false);
            blobs_before_filter = find_true_added_blobs()

            ispacked = true
            status_update('Packing resulted ' + S.length.toString() + ' blobs')


          },
          error: function (jqXHR, exception) {
            status_update('')
            somethingisrunning = false
            var msg = '';
            if (jqXHR.status === 0) {
              msg = 'No connection. Verify network';
            } else if (jqXHR.status == 404) {
              msg = 'Requested page not found [404]';
            } else if (jqXHR.status == 500) {
              msg = 'Internal Server Error [500].';
            } else if (exception === 'parsererror') {
              msg = 'Requested parse failed.';
            } else if (exception === 'timeout') {
              msg = 'Time out error.';
            } else if (exception === 'abort') {
              msg = 'Ajax request aborted.';
            } else {
              msg = 'Uncaught Error.\n' + jqXHR.responseText;
            }
            alert(msg);
          },
          timeout: 250000,
        });
      } else { alert("This submission is ignored, server is still processing the previous submission! Please avoid double clicking on the button, or clicking the button before another job is finished. (i.e. clicking Circular Pack button right after clicking Run microMS button is prohibited)") }
    } else { alert("At least one blob is needed") }

  });

  $("#array_register").click(function (event) {
    var blobs = find_true_added_blobs()
    var cornerblobs = find_corner_blobs_in_array()
    blobs = blobs.filter(function (el) { return cornerblobs.indexOf(el) < 0; });

    var RowN = document.getElementById('RowN').value
    var ColN = document.getElementById('ColN').value
    var expected_number_blobs = parseInt(RowN) * parseInt(ColN)
    if (isNumeric(RowN) == false || isNumeric(ColN) == false) {
      alert("Wrong input value for array number!")
      return

    }
    if (blobs.length + cornerblobs.length != expected_number_blobs) {

      alert(String(expected_number_blobs) + ' blobs were expected for array registration. ' + String(blobs.length + cornerblobs.length) + ' was provided.')
      return
    }




    if (cornerblobs.length != 4) {

      alert("Procedure needs 4 corner points. " + String(cornerblobs.length) + ' was provided. Activate the Edit blobs button and the Grid array button by clicking, and click the four corner blobs of the rectangular grid array. ')
      return
    }

    if (somethingisrunning == false) {
      somethingisrunning = true
      status_update('Performing grid array registration..')




      $.ajax({
        headers: { "X-CSRFToken": token },
        url: baseurl + "12",
        method: "POST",
        data: {
          csrf: token,
          blob_added: blobs.join('end'),
          fiducial_added: cornerblobs.join('end'),
          dziID: folder_ID,
          rowN: RowN,
          colN: ColN,
          arraynamemode: true,

        },
        dataType: "html",
        success: function (response_text) {
          gu4(false);
          var array_blobs = response_text.split('=')[0]
          var array_blobs_lines = array_blobs.split('\n')
          var input_blobs = []
          sorted_registered_array = []
          for (var i = 0, n = array_blobs_lines.length - 1; i < n; ++i) {
            var array_blobs_line_splitted = array_blobs_lines[i].split('\t')
            sorted_registered_array.push(array_blobs_line_splitted)

            for (var ii = 0, nn = array_blobs_line_splitted.length; ii < nn; ++ii) {
              input_blobs.push(array_blobs_line_splitted[ii])

            }
          }
          gu2(input_blobs, true);



          update_graph(response_text)
          document.getElementById("plot_registered_array_error").style.display = 'inline'
          document.getElementById("plot_registered_colrow_button").style.display = 'inline'
          document.getElementById("load_registered_array_sample_names_id").style.display = 'inline'
          document.getElementById("sample_fontsize_label").style.display = 'inline'
          document.getElementById("sample_fontsize").style.display = 'inline'


          somethingisrunning = false
          reference_calculated = true
          status_update('Run finished. Additional blob will be dropped in the output file.')
        },
        error: function (jqXHR, exception) {
          status_update('')
          somethingisrunning = false
          var msg = '';
          if (jqXHR.status === 0) {
            msg = 'No connection. Verify network';
          } else if (jqXHR.status == 404) {
            msg = 'Requested page not found [404]';
          } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
          } else if (exception === 'parsererror') {
            msg = 'Requested parse failed.';
          } else if (exception === 'timeout') {
            msg = 'Time out error.';
          } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
          } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
          }
          alert(msg);
        },
        timeout: 250000,
      });

    } else { alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished.  ") }

  });
  
   $("#array_addition").click(function (event) {
    var cornerblobs = find_corner_blobs_in_array()

    var RowN = document.getElementById('RowN').value
    var ColN = document.getElementById('ColN').value


    if (isNumeric(RowN) == false || isNumeric(ColN) == false) {
      alert("Wrong input value for array number!")
      return

    } 
    if (parseInt(RowN) > 50 || parseInt(ColN) > 50) {
      alert("For creating a new array, row number or column number cannot be larger than 50. The limit does not apply to array registration.")
      return

    } 

    if (cornerblobs.length != 4) {

      alert("Procedure needs 4 corner points. " + String(cornerblobs.length) + ' was provided. Activate the Edit blobs button and the Grid array button by clicking, and click the four corner blobs of the rectangular grid array. ')
      return
    }

    if (somethingisrunning == false) {
      somethingisrunning = true
      status_update('Performing grid array registration..')




      $.ajax({
        headers: { "X-CSRFToken": token },
        url: baseurl + "12",
        method: "POST",
        data: {
          csrf: token,
          fiducial_added: cornerblobs.join('end'),
          dziID: folder_ID,
          rowN: RowN,
          colN: ColN,
          arraynamemode: 'addition',
          blob_added: '',
        },
        dataType: "html",
        success: function (response_text) {
          gu4(false);
          var array_blobs = response_text.split('=')[0]
          var array_blobs_lines = array_blobs.split('\n')
          var input_blobs = []
          sorted_registered_array = []
          for (var i = 0, n = array_blobs_lines.length - 1; i < n; ++i) {
            var array_blobs_line_splitted = array_blobs_lines[i].split('\t')
            sorted_registered_array.push(array_blobs_line_splitted)

            for (var ii = 0, nn = array_blobs_line_splitted.length; ii < nn; ++ii) {
              input_blobs.push(array_blobs_line_splitted[ii])

            }
          }
          gu2(input_blobs, true);



          document.getElementById("plot_registered_array_error").style.display = 'none'
          document.getElementById("plot_registered_colrow_button").style.display = 'none'
          document.getElementById("load_registered_array_sample_names_id").style.display = 'inline'
          document.getElementById("sample_fontsize_label").style.display = 'inline'
          document.getElementById("sample_fontsize").style.display = 'inline'


          somethingisrunning = false
          reference_calculated = true
          status_update('Run finished. Additional blob will be dropped in the output file.')
        },
        error: function (jqXHR, exception) {
          status_update('')
          somethingisrunning = false
          var msg = '';
          if (jqXHR.status === 0) {
            msg = 'No connection. Verify network';
          } else if (jqXHR.status == 404) {
            msg = 'Requested page not found [404]';
          } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
          } else if (exception === 'parsererror') {
            msg = 'Requested parse failed.';
          } else if (exception === 'timeout') {
            msg = 'Time out error.';
          } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
          } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
          }
          alert(msg);
        },
        timeout: 250000,
      });

    } else { alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished.  ") }

  });

  $("#geometryf").click(function () {
    var blobs = find_true_added_blobs()
    var fiducials = find_true_fiducials()
    var adjust_dimension_switch = isNumeric($("#adjust_dimensions").val())
    var msg = ''
    var platetype = document.getElementById('platetype').value
    if (document.getElementById('Array_mode').checked) {

      if (reference_calculated == false) {
        alert('There is no registered grid array.   ')
        return 0

      }

      if (ispacked == true) {
        alert('Geometry file generation for circular packed blobs is not allowed in grid array register mode. Unclick the register grid array button, or use unpacked blobs ')
        return 0

      }

    }

    if (document.getElementById('Array_mode').checked == false && reference_calculated == true) {

      msg = 'Geometry file was created without the array registration'
    }


    if (platetype == '1') {
      alert('Please select MALDI plate type')
      return 0
    }


    if (blobs.length > 12000) {
      alert('12,000 is the max limit for macroMS!')
      return 0
    }
    if ($("#TSO_geometry").is(":checked") == false && blobs.length > 4000) {
      alert('MALDI path optimization must be performed for > 4000 blobs!')
      return 0
    }
    if (adjust_dimension_switch == false && $("#adjust_dimensions").val() != '') {
      alert('The input box includes non-number value, including emtpy space created by the space key. Please remove non-number characters. Run terminated.')
      return 0
    }
    if ($("#adjust_dimensions").val() == '') {
      if (blobs.length == 0 || fiducials.length != 3) {
        alert("Coordinate file generation requires three fiducial points and at least one blob ")
        return
      }
    }

    else {
      if (blobs.length == 0 || fiducials.length != 4) {

        alert("Four fiducial points and at least one blob are required for coordinate file generation with camera perspective correction")
        return
      }
    }

    if (somethingisrunning == false) {
      somethingisrunning = true
      status_update('Generating output file.')
      $.ajax({
        headers: { "X-CSRFToken": token },
        url: baseurl + "5",
        method: "POST",
        data: {
          csrf: token,
          blob_added: blobs.join('end'),
          fiducial_added: fiducials.join('end'),
          dziID: folder_ID,
          horizontal_flip_geometry: $("#horizontal_flip_geometry").is(":checked"),
          TSO_geometry: $("#TSO_geometry").is(":checked"),
          adjust_dimensions: $("#adjust_dimensions").val(),
          refIMG: RefIMG,
          Platetype: platetype,
          arraymode: document.getElementById('Array_mode').checked,
        },
        dataType: "html",
        success: function (responseText) {
          somethingisrunning = false
          if (responseText.indexOf('<PlateType>') < 0) {
            alert("Error generating geometry file.\n\n" + responseText)
            return
          }

          status_update(msg)
          status_update('Downloading. Do not edit the output file.')
          download(responseText, image_name.substr(0, image_name.lastIndexOf('.')) + ".xeo");
        },
        error: function (jqXHR, exception) {
          status_update('')
          somethingisrunning = false
          var msg = '';
          if (jqXHR.status === 0) {
            msg = 'No connection. Verify network';
          } else if (jqXHR.status == 404) {
            msg = 'Requested page not found [404]';
          } else if (jqXHR.status == 500) {
            msg = 'Internal Server Error [500].';
          } else if (exception === 'parsererror') {
            msg = 'Requested parse failed.';
          } else if (exception === 'timeout') {
            msg = 'Time out error.';
          } else if (exception === 'abort') {
            msg = 'Ajax request aborted.';
          } else {
            msg = 'Uncaught Error.\n' + jqXHR.responseText;
          }
          alert(msg);
        },
        timeout: 250000,

      });
    } else { alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished. (i.e. clicking Circular Pack button right after clicking Run microMS button is prohibited)") }
  });


  $("#show_corners").click(function (event) {

    var corners = find_true_refcorners()
    if (corners.length > 0) {
      return
    }
    if (somethingisrunning == false) {
      somethingisrunning = true
    }
    else {
      alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished.  ")
      return
    }

    $.ajax({
      url: baseurl + "16",
      method: "GET",
      data: {

        dziid: folder_ID,

      },
      dataType: "html",
      success: function (response_text) {

        var points = response_text.split('\n')
        points = points.slice(0, points.length - 1)
        var Points=[]
        for (var i = 0, n = points.length; i < n; ++i) {
          Points.push([parseFloat(points[i].split('\t')[0]), parseFloat(points[i].split('\t')[1])])
        }
        add_reference_marks2(Points)
        somethingisrunning = false
 

 
      },
      error: function (jqXHR, exception) {
        status_update('')
        somethingisrunning = false
        var msg = '';
        if (jqXHR.status === 0) {
          msg = 'No connection. Verify network';
        } else if (jqXHR.status == 404) {
          msg = 'Requested page not found [404]';
        } else if (jqXHR.status == 500) {
          msg = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
          msg = 'Requested parse failed.';
        } else if (exception === 'timeout') {
          msg = 'Time out error.';
        } else if (exception === 'abort') {
          msg = 'Ajax request aborted.';
        } else {
          msg = 'Uncaught Error.\n' + jqXHR.responseText;
        }
        alert(msg);
      },
      timeout: 250000,


    });



  });


  $("#file-upload").change(handleFileSelect);
  $("#file-upload2").change(handleFileSelect2);


  $("#savepoint2").click(function () {
    var blobs = find_true_added_blobs()
    var fiducials = find_true_fiducials()


    if (blobs.length == 0 && fiducials.length == 0) {
      return 0
    };
    $.ajax({
      headers: { "X-CSRFToken": token },
      url: baseurl + "18",
      method: "POST",
      data: {
        csrf: token,
        dziID: folder_ID,
        blob_added: blobs.join('end'),
        fiducial_added: fiducials.join('end'),
        fontsize: Fontsize,

      },
      dataType: "html",
      success: function (response_text) {
        status_update('Features saved in server for next visit. Record URL address.')
      },
      error: function (jqXHR, exception) {

        status_update('')
        var msg = '';
        if (jqXHR.status === 0) {
          msg = 'No connection. Verify network';
        } else if (jqXHR.status == 404) {
          msg = 'Requested page not found [404]';
        } else if (jqXHR.status == 500) {
          msg = 'Internal Server Error [500].';
        } else if (exception === 'parsererror') {
          msg = 'Requested parse failed.';
        } else if (exception === 'timeout') {
          msg = 'Time out error.';
        } else if (exception === 'abort') {
          msg = 'Ajax request aborted.';
        } else {
          msg = 'Uncaught Error.\n' + jqXHR.responseText;
        }
        alert(msg);
      },
      timeout: 250000,
    });

  });




});
var procrs = []
var procrs_choice = '0'
var procrs_switch = false
var setROI_ = false;
var ROI_box = [];
var saved_message = '';
var ismouseover = 0;
var mag = 0.0001;
var isrect = 0;
var blob_radio_selected = true
var fiducial_radio_selected = false
var roiremove_radio_selected = false
var somethingisrunning = false
var reference_calculated = false
var TIF_image_pixel_size_X = ''
var TIF_image_pixel_size_Y = ''
var boxsize = ''
var ispacked = false
var filter_switch = 0
var blobs_before_filter = []
var savepoint_blobs = []
var savepoint_fiducials = []
var canvas_switch = 0
var plot_registered_colrow_button = false
var savepoint_ispacked = false
var threshold_saved_value = 128
var threshold_saved_color = 0
var inverse_switch_saved = false
var color_saved = -1
var roi_set_selected = false
var sorted_registered_array = []
var Fontsize = 10
var distortion_area_plotted=false
function remove_element(ID) {
  const e = hEl.getElementById(ID)
  var ID = e.id.split('and')
  hEl.elements.splice(hEl.elements.indexOf(e), 1)
}

function remove_element_by_click(ID) {
  const e = hEl.getElementById(ID)
  var ID = e.id.split('and')
  hEl.elements.splice(hEl.elements.indexOf(e), 1)
  if (fiducial_radio_selected == true) {

    if (ID[6] == 'B') {
      add_fiducial(parseFloat(ID[0]), parseFloat(ID[1]), parseFloat(ID[2]), parseFloat(ID[3]), ID[4], ID[5], 'F', ID[7])
    }
  }

  if (document.getElementById('Array_mode').checked) {

    if (ID[6] == 'B') {
      add_corner_blob_array(parseFloat(ID[0]), parseFloat(ID[1]), parseFloat(ID[2]), parseFloat(ID[3]), ID[4], ID[5], 'B', ID[7])
    }
  }


}
function status_update(Message) {
  document.getElementById('Satus_bar').innerText = Message
}



function update_blobs_status() {
  var blobs = find_true_added_blobs()
  var fiducials = find_true_fiducials()

  status_update(blobs.length.toString() + ' blobs and ' + fiducials.length.toString() + ' fiducials counted')
}
function gu2(Lis, reuse_switch) {
  if (reuse_switch == false) {
    for (var count = 0, n = Lis.length; count < n; ++count) {
      var LisLis = Lis[count].split('and');
      var X = parseFloat(LisLis[0]);    ///X position in pixel 
      var Y = parseFloat(LisLis[1]);    ///Y position in pixel
      var w = parseFloat(LisLis[2]) * 2;///weight
      var h = parseFloat(LisLis[3]) * 2;///height
      var c = parseFloat(LisLis[4]);///circularity
      var d = parseFloat(LisLis[5]);///Distance
      var i = LisLis[6];            ///identity=fiducial or blob
      var g = LisLis[7];  ///group from packing 
      gu3(X - w / 2, Y - h / 2, w, h, c, d, i, g);
    }
  } else {
    for (var count = 0, n = Lis.length; count < n; ++count) {
      var LisLis = Lis[count].split('and');
      var X = parseFloat(LisLis[0]);
      var Y = parseFloat(LisLis[1]);
      var w = parseFloat(LisLis[2]);
      var h = parseFloat(LisLis[3]);
      var c = parseFloat(LisLis[4]);
      var d = parseFloat(LisLis[5]);
      var i = LisLis[6];
      var g = LisLis[7];
      gu3(X, Y, w, h, c, d, i, g);


    }

  }
};
function gu3(X, Y, w, h, c, d, i, g) {

  if (w < 1 || h < 1) {
    w = 1;
    h = 1;
  }
  if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
    return null
  }

  var sq = document.createElement("div")


  sq.style = "box-sizing: border-box;border:solid 2px #3cff33"
  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X,
    y: Y,
    width: w,
    height: h,
  });
  g = String(g)
  if (g.split('-').length > 2) {
    var textbox = document.createElement("div")
    var string = g.split('-')[2]
    textbox.innerHTML = string
    textbox.style.color = '#3cff33'


    var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g) + '___________label'
    hEl.addElement({
      id: ID,
      element: textbox,
      x: X,
      y: Y + h,
      width: w,
      height: 0,
      fontSize: Fontsize,
    });
  }
  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)
};


function gu2_1(Lis, Dat) {
  var null_data_switch = 0
  if (Math.min(...Dat) == Math.max(...Dat)) { null_data_switch = 1 }
  var Min_val = Math.min(...Dat);
  var Max_val = Math.max(...Dat) - Min_val;

  for (var count = 0, n = Lis.length; count < n; ++count) {
    var LisLis = Lis[count];
    var X = parseFloat(LisLis[0]);
    var Y = parseFloat(LisLis[1]);
    var w = parseFloat(LisLis[2]);
    var h = parseFloat(LisLis[3]);
    var c = parseFloat(LisLis[4]);
    var d = parseFloat(LisLis[5]);
    var i = LisLis[6];
    var g = parseInt(LisLis[7]);

    var value = (Dat[count] - Min_val) / Max_val
    var HH = (1.0 - value) * 240
    var color = "hsl(" + HH + ", 100%, 50%)";
    if (null_data_switch == 1) { color = '#3cff33' }
    gu3_1(X - w / 2, Y - h / 2, w, h, c, d, i, g, color);
  }
};
function gu3_1(X, Y, w, h, c, d, i, g, ColoR) {

  if (w < 1 || h < 1) {
    w = 2
    h = 2
  }
  if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
    return null
  }
  var sq = document.createElement("div")
  sq.style = "box-sizing: border-box;border:solid 2px " + ColoR
  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X,
    y: Y,
    width: w,
    height: h,
  });

  var textbox = document.createElement("div")
  textbox.innerHTML = 'X:' + String(X + w / 2) + '&#10Y:' + String(Y + w / 2)
  textbox.style.color = '#3cff33'

  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: textbox,
    x: X,
    y: Y + h,
    width: 11 * String(g).length,
    height: 20,
    fontSize: 2,
  });

  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)

};

function add_corner_blob_array(X, Y, w, h, c, d, i, g) {

  if (w < 1 || h < 1) {
    w = 1;
    h = 1;
  }
  if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
    return null
  }

  var sq = document.createElement("div")


  sq.style = "background-color:#3cff33;box-sizing: border-box;border:solid 2px #3cff33"
  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X,
    y: Y,
    width: w,
    height: h,
  });
  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)
};

function add_fiducial(X, Y, w, h, c, d, i, g) {
  if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
    return null
  }
  var sq = document.createElement("div")

  sq.style = "box-sizing: border-box;border:solid 2px red"


  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X,
    y: Y,
    width: w,
    height: h,
  });
  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)
};

function add_ROI(X, Y, w, h, c, d, i, g) {
  if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
    return null
  }
  var sq = document.createElement("div")

  sq.style = "box-sizing: border-box;border:solid 2px yellow"


  var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X,
    y: Y,
    width: w,
    height: h,
  });
  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)
};

 

function add_reference_marks(X, Y) {
  var sq = document.createElement("div")
  sq.style = 'background-color:rgb(255,255,0)'
  var ID = String(X) + 'and' + String(Y) + 'and' + String(10) + 'and' + String(10) + 'and' + String(1) + 'and' + String(0) + 'and' + String('C') + 'and' + String(0)
  hEl.addElement({
    id: ID,
    element: sq,
    x: X - 1.5,
    y: Y - 1.5,
    width: 3,
    height: 3,
  });
  mag = -mag
  viewer.viewport.zoomTo(viewer.viewport.getZoom(true) + mag)
};





function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function find_true_added_blobs() {
  var blobelements = hEl.elements;
  var blobelementsid = []
  for (var i = 0, n = blobelements.length; i < n; ++i) {

    if (blobelements[i].id.split('and')[6] == 'B' && blobelements[i].id.split('___________labe').length != 2) {
      blobelementsid.push(blobelements[i].id)
    }
  }

  return blobelementsid
}

function find_true_added_blobs_and_labels() {
  var blobelements = hEl.elements;
  var blobelementsid = []
  for (var i = 0, n = blobelements.length; i < n; ++i) {

    if (blobelements[i].id.split('and')[6] == 'B') {
      blobelementsid.push(blobelements[i].id)
    }
  }

  return blobelementsid
}

function find_true_fiducials() {
  var fiducialelements = hEl.elements;
  var fiducialelementsid = []
  for (var i = 0, n = fiducialelements.length; i < n; ++i) {
    if (fiducialelements[i].id.split('and')[6] == 'F') {
      fiducialelementsid.push(fiducialelements[i].id)
    }
  }
  return fiducialelementsid
}

function find_true_refcorners() {
  var refcornerselements = hEl.elements;
  var refcornerselementsid = []
  for (var i = 0, n = refcornerselements.length; i < n; ++i) {
    if (refcornerselements[i].id.split('and')[6] == 'C') {
      refcornerselementsid.push(refcornerselements[i].id)
    }
  }
  return refcornerselementsid
}

function find_true_ROIs() {
  var ROIelements = hEl.elements;
  var ROIelementsid = []
  for (var i = 0, n = ROIelements.length; i < n; ++i) {
    if (ROIelements[i].id.split('and')[6] == 'R') {
      ROIelementsid.push(ROIelements[i].id)
    }
  }
  return ROIelementsid
}

function find_corner_blobs_in_array() {
  var allelements = hEl.elements
  var cornerelementsid = []
  for (var i = 0, n = allelements.length; i < n; ++i) {
    if (allelements[i].element.innerHTML.indexOf('background-color') > -1) {
      cornerelementsid.push(allelements[i].id)
    }
  }
  return cornerelementsid
}


function remove_ROI_elements(X, Y, width, height) {
  var arr1 = find_true_added_blobs_and_labels()
  var arr2 = find_true_fiducials()
  var arr3 = find_true_ROIs()
  var added2 = arr1.concat(arr2)
  var added = added2.concat(arr3)
  var ROIremovelist = []
  for (var i = 0, n = added.length; i < n; ++i) {
    G = added[i].split('and');
    var x = Number(G[0]), y = Number(G[1]), w = Number(G[2]), h = Number(G[3]);
    var x_pos = x + w / 2
    var y_pos = y + h / 2
    if (X < x_pos && x_pos < X + width && Y < y_pos && y_pos < Y + height) {
      ROIremovelist.push(added[i])
    }
  }

  hEl.removeElementsById(ROIremovelist)
}






function gu4(remove_fiducials) {
  var S = find_true_added_blobs_and_labels()
  var F = find_true_fiducials()
  if (S.length > 0) {
    hEl.removeElementsById(S)
  }
  if (remove_fiducials == true && F.length > 0) {
    hEl.removeElementsById(F);
  }

};

function gu5() {
  ispacked = false
  gu4(true)
  status_update('Blobs and fiducials are reset')
  document.getElementById("plot_registered_array_error").style.display = 'none'
  document.getElementById("plot_registered_colrow_button").style.display = 'none'
  document.getElementById("load_registered_array_sample_names_id").style.display = 'none'
  document.getElementById("sample_fontsize_label").style.display = 'none'
  document.getElementById("sample_fontsize").style.display = 'none'





  sorted_registered_array = []
  section3.style.display = 'none'
  section5.style.display = 'inline'
  d3.select(viewer.svgOverlay().node()).selectAll("*").remove();
  reference_calculated = false
  var canvas_switch = 0
  var plot_registered_colrow_button = false
}

function gu6() {
  gu4(true)
  status_update('Targets were deleted')
  document.getElementById('Bloblist').value = '';
}

function add_fiducials(Lis) {
  for (var count = 0, n = Lis.length; count < n; ++count) {
    var LisLis = Lis[count].split('and');
    var X = parseFloat(LisLis[0]);
    var Y = parseFloat(LisLis[1]);
    var w = parseFloat(LisLis[2]);
    var h = parseFloat(LisLis[3]);
    var c = parseFloat(LisLis[4]);
    var d = parseFloat(LisLis[5]);
    var i = LisLis[6];
    var g = parseInt(LisLis[7]);
    add_fiducial(X, Y, w, h, c, d, i, g)

  }
}

function Savepoint() {
  if (document.getElementById('savepoint1').innerHTML == 'Savepoint') {

    document.getElementById('savepoint1').innerHTML = 'Revert'
    savepoint_blobs = find_true_added_blobs()
    savepoint_fiducials = find_true_fiducials()
    savepoint_ispacked = ispacked
    status_update(String(savepoint_blobs.length) + ' blobs and ' + String(savepoint_fiducials.length) + ' fiducials are saved')

    return 0
  }
  if (document.getElementById('savepoint1').innerHTML == 'Revert') {
    document.getElementById('savepoint1').innerHTML = 'Savepoint'
    gu4(true)
    gu2(savepoint_blobs, true)
    add_fiducials(savepoint_fiducials)
    status_update(String(savepoint_blobs.length) + ' saved blobs and ' + String(savepoint_fiducials.length) + ' saved fiducials are plotted')


    ispacked = savepoint_ispacked
    savepoint_ispacked = false
    savepoint_blobs = []
    savepoint_fiducials = []
    return 0

  }

}

function getsession() {

  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", baseurl + "19/" + folder_ID, false);



  try {
    xmlhttp.send();
  }
  catch (e) {
    alert('Please check network connectivity. \n\n' + e.message)
    return 'Error'
  }


  if (xmlhttp.status == 200) {
    result = xmlhttp.responseText;
  } else {
    alert('Error code: ' + String(xmlhttp.status) + '\n\n' + xmlhttp.responseText)
    return 'Error'
  }
  var fid = result.split('\n')[0]
  var F = fid.split('end')
  if (F[0] != "") {
    add_fiducials(F)
  }

  var blobs = result.split('\n')[1]
  Fontsize = result.split('\n')[2]

  var B = blobs.split('end');
  if (B[0].split('and')[7].split('-').length != 0) {
    document.getElementById("Array_mode").checked = true;
    reference_calculated = true

  }
  if (B[0] != "") {
    gu2(B, true);
  }


  return result;
}


function purge_blobs() {
  var C = find_true_refcorners()
  var f = find_true_fiducials()
  var R = find_true_ROIs()
  var ff = C.concat(f)
  var F = ff.concat(R)
  var blobelements = hEl.elements;
  var blobelementsid = []

  for (var i = 0, n = blobelements.length; i < n; ++i) {
    blobelementsid.push(blobelements[i].id)
  }
  blobelementsid = blobelementsid.filter(function (el) { return F.indexOf(el) < 0; });
  hEl.removeElementsById(blobelementsid)
}

var viewer = OpenSeadragon({
  id: 'section5',
  prefixUrl: 'https://tmacroms-static.s3.us-east-2.amazonaws.com/main/images/',
  tileSources: 'https://tmacroms.s3.us-east-2.amazonaws.com/stat_out_' + folder_ID + '/submitted_dzi.dzi',
  maxZoomLevel: 100,
  minZoomLevel: 0.5,
  defaultZoomLevel: 1,
  gestureSettingsMouse: { clickToZoom: false },
  showNavigator: true,
  navigatorPosition: "BOTTOM_LEFT",
  zoomPerScroll: 1.4,
  crossOriginPolicy: 'Anonymous',
});
viewer.addHandler('open', function () {
  TIF_image_pixel_size_X = viewer.world.getItemAt(0).getContentSize().x;
  TIF_image_pixel_size_Y = viewer.world.getItemAt(0).getContentSize().y;
  boxsize = (TIF_image_pixel_size_Y + TIF_image_pixel_size_X) / 200
  radiobuttonf()
  if (Revisit == '1') {
    getsession()
  }
});

var overlay = this.viewer.svgOverlay();

var svgContainer = d3.select(overlay.node())




var lineFunction = d3.line()
  .x(function (d) { return d.x; })
  .y(function (d) { return d.y; })




var hEl = viewer.HTMLelements();


var selection = viewer.selection({
  showSelectionControl: false,
  allowRotation: false,
  showConfirmDenyButtons: false,
});
selection.enable();


function radiobuttonf() {
  var radiobutton1 = document.getElementById("radiobutton1");
  if (radiobutton1.checked == true) {
    blob_radio_selected = true;
  } else {
    blob_radio_selected = false;
  }
  var radiobutton2 = document.getElementById("radiobutton2");
  if (radiobutton2.checked == true) {
    fiducial_radio_selected = true;
  } else {
    fiducial_radio_selected = false;
  }
  var radiobutton3 = document.getElementById("radiobutton3");
  if (radiobutton3.checked == true) {
    roiremove_radio_selected = true;
  } else {
    roiremove_radio_selected = false;
  }
  var radiobutton4 = document.getElementById("radiobutton4");
  if (radiobutton4.checked == true) {
    viewer.canvas.focus();
  }
  var radiobutton6 = document.getElementById("radiobutton6");
  if (radiobutton6.checked == true) {
    roi_set_selected = true;
  } else {
    roi_set_selected = false;
  }

}


function ROI_Filter(Lis) {
  var ROIs = find_true_ROIs()
  var filtered_Lis = []


  for (var i = 0, n = Lis.length; i < n; ++i) {

    G = Lis[i].split('and');
    var x = Number(G[0]), y = Number(G[1]), w = Number(G[2]), h = Number(G[3]);
    var x_pos = x
    var y_pos = y

    for (var ii = 0, nn = ROIs.length; ii < nn; ++ii) {


      ROI = ROIs[ii].split('and');
      var X = Number(ROI[0]), Y = Number(ROI[1]), width = Number(ROI[2]), height = Number(ROI[3]);

      if (X < x_pos && x_pos < X + width && Y < y_pos && y_pos < Y + height) {
        filtered_Lis.push(Lis[i])
      }

    }
  }
  var unique = filtered_Lis.filter(function (item, i, ar) { return ar.indexOf(item) === i; });
  return unique
}

function remove_ROI_Filter() {
  var ROIs = find_true_ROIs()
  var arr1 = find_true_added_blobs()
  var arr2 = find_true_fiducials()
  var added = arr1.concat(arr2)

  var ROIremovelist = []


  for (var i = 0, n = added.length; i < n; ++i) {

    G = added[i].split('and');
    var x = Number(G[0]), y = Number(G[1]), w = Number(G[2]), h = Number(G[3]);
    var x_pos = x + w / 2
    var y_pos = y + h / 2

    for (var ii = 0, nn = ROIs.length; ii < nn; ++ii) {


      ROI = ROIs[ii].split('and');
      var X = Number(ROI[0]), Y = Number(ROI[1]), width = Number(ROI[2]), height = Number(ROI[3]);

      if (X < x_pos && x_pos < X + width && Y < y_pos && y_pos < Y + height) {
        ROIremovelist.push(added[i])
      }

    }
  }

  var unique = ROIremovelist.filter(function (item, i, ar) { return ar.indexOf(item) === i; });

  hEl.removeElementsById(unique)
}









function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  a.sort()
  b.sort()
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}


function switch_filtering_mode() {
  var FilteringModeButton = document.getElementById("radiobutton5");
  var section1 = document.getElementById("section1");
  var section2 = document.getElementById("section2");

  if (FilteringModeButton.checked == true) {
    section1.style.display = 'none'
    section2.style.display = 'inline'
    document.getElementById("plotly-div").innerHTML = ''
    document.getElementById('filter_selections').innerHTML = ''

    blobs_before_filter = find_true_added_blobs()
    blob_radio_selected = false;
    fiducial_radio_selected = false;
    roiremove_radio_selected = false;
    status_update('Manual editing during filtering is ignored')
    var radList = document.getElementsByName('interaction_choice');
    for (var i = 0; i < radList.length; i++) {
      if (radList[i].checked) document.getElementById(radList[i].id).checked = false;
    }

  } else {
    status_update('')

    var array1 = blobs_before_filter
    var array2 = find_true_added_blobs()
    if (arraysEqual(array1, array2) == false) {
      purge_blobs()
      gu2(blobs_before_filter, true)
    }
    section2.style.display = 'none'
    section1.style.display = 'inline'
    document.getElementById('mincut').value = ''
    document.getElementById('maxcut').value = ''
    document.getElementById("Distance_button").style.display = 'none';
    document.getElementById("Distance_button2").style.display = 'inline';
  }


}

function measure_distance() {
  if (blobs_before_filter.length < 2) {
    alert('At least two or more blobs are required for distance measurements!')
    return 0
  }
  if (blobs_before_filter.length > 20000) {
    alert('Max limit is 20000 blobs!')
    return 0
  }
  if (somethingisrunning == true) {
    alert("This submission is ignored, server is still processing the previous submission! Please avoid double clicking on the button, or clicking the button before another job is finished. (i.e. clicking Circular Pack button right after clicking Run microMS button is prohibited)")
    return 0
  }
  status_update('Measuring distances..')
  somethingisrunning = true;





  $.ajax({
    headers: { "X-CSRFToken": token },
    url: baseurl + "8",
    method: "POST",
    data: {
      csrf: token,
      dziID: folder_ID,
      Blobs: blobs_before_filter.join('+')
    },
    dataType: "html",
    success: function (response_text) {
      somethingisrunning = false
      blobs_before_filter = response_text.split('end');
      gu4(false);
      gu2(blobs_before_filter, true);
      status_update('')
      document.getElementById("Distance_button").style.display = 'inline';
      document.getElementById("Distance_button").click();
      document.getElementById("Distance_button2").style.display = 'none';

    },
    error: function (jqXHR, exception) {
      somethingisrunning = false
      status_update('')
      var msg = '';
      if (jqXHR.status === 0) {
        msg = 'No connection. Verify network';
      } else if (jqXHR.status == 404) {
        msg = 'Requested page not found [404]';
      } else if (jqXHR.status == 500) {
        msg = 'Internal Server Error [500].';
      } else if (exception === 'parsererror') {
        msg = 'Requested parse failed.';
      } else if (exception === 'timeout') {
        msg = 'Time out error.';
      } else if (exception === 'abort') {
        msg = 'Ajax request aborted.';
      } else {
        msg = 'Uncaught Error.\n' + jqXHR.responseText;
      }
      alert(msg);
    },
    timeout: 250000,
  });


};
 

function update_graph(text) {
  var x = text.split('=')[1].split('\n');
  x_data = []
  for (var i = 0, n = x.length; i < n; ++i) {
    x_row = x[i].split('\t')
    x_row_float = []
    for (var ii = 0, nn = x_row.length; ii < nn; ++ii) {
      x_row_float.push(x_row[ii])
    }
    x_data.push(x_row_float)
  }
  var data_x = [{
    z: x_data,
    type: 'surface'
  }];

  var layout_x = {
    title: 'Z= X-axis error in pixel numbers, X= column number, Y= row number ',
  };




  var y = text.split('=')[2].split('\n');
  y_data = []
  for (var i = 0, n = y.length; i < n; ++i) {
    y_row = y[i].split('\t')
    y_row_float = []
    for (var ii = 0, nn = y_row.length; ii < nn; ++ii) {
      y_row_float.push(y_row[ii])
    }
    y_data.push(y_row_float)
  }
  var data_y = [{
    z: y_data,
    type: 'surface'
  }];

  var layout_y = {
    title: 'Z= Y-axis error in pixel numbers, X= column number, Y= row number ',

  };

  var config = {
    displaylogo: false, doubleClickDelay: 1000, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'select2d', 'autoScale2d', 'toggleSpikelines'],

  }



  Plotly.newPlot('section3_1', data_x, layout_x, config);
  Plotly.newPlot('section3_2', data_y, layout_y, config);




}

function revert_to_canvas() {

  var section3 = document.getElementById("section3");
  var section5 = document.getElementById("section5");
  if (canvas_switch == 1) {
    section5.style.display = 'inline'
    section3.style.display = 'none'
    document.getElementById("plot_registered_array_error").innerHTML = "Plot error"

    canvas_switch = 0
  } else {
    section5.style.display = 'none'
    section3.style.display = 'inline'
    document.getElementById("plot_registered_array_error").innerHTML = "Revert back"

    canvas_switch = 1
  }

}
function finalize_array() {
}

function plot_registration() {
  if (plot_registered_colrow_button == true) {
    plot_registered_colrow_button = false
    d3.select(viewer.svgOverlay().node()).selectAll("*").remove();
    document.getElementById("plot_registered_colrow_button").innerHTML = "Plot column & row"
  document.getElementById("show_corners").innerHTML = "Show distortion correction area"

    return null
  }
  d3.select(viewer.svgOverlay().node()).selectAll("*").remove();
  if (RefIMG == 2) {
    document.getElementById("show_corners").innerHTML = "Show distortion correction area"  
  }

   distortion_area_plotted = false

  var sorted_registered_array_processed = []

  for (var i = 0, nn = sorted_registered_array.length; i < nn; ++i) {
    var sorted_registered_array_line = sorted_registered_array[i]
    var line = []
    for (var iii = 0, n = sorted_registered_array_line.length; iii < n; ++iii) {
      var entry = sorted_registered_array_line[iii].split('and')
      line.push([entry[0], entry[1], entry[2], entry[7]])
    }
    sorted_registered_array_processed.push(line)
  }
  for (var i = 0, nn = sorted_registered_array_processed[0].length; i < nn; ++i) {
    var line = []
    for (var ii = 0, n = sorted_registered_array_processed.length; ii < n; ++ii) {
      var line_in_array = sorted_registered_array_processed[ii]
      var point = viewer.viewport.imageToViewportCoordinates(parseFloat(line_in_array[i][0]) + parseFloat(line_in_array[i][2]) / 2, parseFloat(line_in_array[i][1]) + parseFloat(line_in_array[i][2]) / 2)
      line.push(point)

    }
    var lineGraph = svgContainer.append("path")
      .attr("d", lineFunction(line))
      .attr("stroke", "yellow")
      .attr("stroke-width", 0.005)
      .attr("fill", "none")
      .attr("id", "gurachi");

  }

  for (var i = 0, n = sorted_registered_array_processed.length; i < n; ++i) {
    var line = []
    var line_in_array = sorted_registered_array_processed[i]
    for (var ii = 0, nn = line_in_array.length; ii < nn; ++ii) {
      var point = viewer.viewport.imageToViewportCoordinates(parseFloat(line_in_array[ii][0]) + parseFloat(line_in_array[ii][2]) / 2, parseFloat(line_in_array[ii][1]) + parseFloat(line_in_array[ii][2]) / 2)
      line.push(point)

    }
    var lineGraph = svgContainer.append("path")
      .attr("d", lineFunction(line))
      .attr("stroke", "red")
      .attr("stroke-width", 0.005)
      .attr("fill", "none")
      .attr("id", "gurachi");

  }


  plot_registered_colrow_button = true
  document.getElementById("plot_registered_colrow_button").innerHTML = "Revert back"

  return null
}
function Load_samplenames(data) {

  var fontsize = document.getElementById("sample_fontsize").value
  if (isNumeric(Fontsize) == 'False') {
    alert('Font size set for font name is not numeric. Please fix')
    return null
  }
  Fontsize = fontsize
  var Blobs_in_registered_array = find_true_added_blobs()
  var out = []
  var rowN = sorted_registered_array.length
  var colN = sorted_registered_array[0].length
  if (rowN != data.length) { alert('Row number in array does not match row number in the name matrix! Row number set by user: ' + String(rowN) + ' Row number in the name matrix: ' + String(data.length)); return }
  if (colN != data[0].length) { alert('Column number in array does not match column number in the name matrix! Column number set by user: ' + String(colN) + ' Row number in the name matrix: ' + String(data[0].length)); return }

  var S = []

  for (var i = 0, n = sorted_registered_array.length; i < n; ++i) {
    var sorted_registered_array_line = sorted_registered_array[i]
    for (var ii = 0, g = sorted_registered_array_line.length; ii < g; ++ii) {
      var entry = sorted_registered_array_line[ii]
      var name = String(data[i][ii])

      if(Blobs_in_registered_array.indexOf(entry)==-1){
       continue
       }
      if(name.length>27){alert("Provided name(s) is longer than max character length of 27. Name loading is cancelled")
      return null
      }
      
      S.push(entry + '-' + name.replace(/\W+/g, "_"))
      
    }

  }
  gu4(false);
  gu2(S, true);

}


function add_reference_marks2(points){
   var Points=[points[0],points[1],points[3],points[2],points[0]]
  if (distortion_area_plotted == true) {
    distortion_area_plotted = false
    d3.select(viewer.svgOverlay().node()).selectAll("*").remove();
    document.getElementById("show_corners").innerHTML = "Show distortion correction area"
    document.getElementById("plot_registered_colrow_button").innerHTML = "Plot column & row"

    return null
  }
  d3.select(viewer.svgOverlay().node()).selectAll("*").remove();
    document.getElementById("plot_registered_colrow_button").innerHTML = "Plot column & row"
    plot_registered_colrow_button = false

  var line=[]
   for (var ii = 0, n = Points.length; ii < n; ++ii) {
      var point = viewer.viewport.imageToViewportCoordinates(Points[ii][0], Points[ii][1])
       line.push(point)
    }
    var lineGraph = svgContainer.append("path")
      .attr("d", lineFunction(line))
      .attr("stroke", "yellow")
      .attr("stroke-width", 0.005)
      .attr("fill", "none")
      .attr("id", "gurachi");
      distortion_area_plotted=true
        document.getElementById('show_corners').innerText = 'Revert';
 
}
