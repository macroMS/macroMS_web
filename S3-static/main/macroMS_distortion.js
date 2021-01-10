    var baseurl="https://macroms.scs.illinois.edu/"
    var filter_selections = "   <a class='lab'  id='mincut_label'>Minimum:</a><input type='text' pattern='^[0-9.-]*$' id='mincut' size='5'><br><a class='lab'  id='maxcut_label'>Maximum:</a><input type='text' pattern='^[0-9.-]*$' id='maxcut' size='5' ><br><button onclick='update_filtered_blobs(1)'>View filtered</button> <button onclick='update_filtered_blobs(3)'>Revert </button><button onclick='update_filtered_blobs(2)'>Finalize</button> "

     var procrs=[]
    var procrs_choice='0'
    var procrs_switch=false
    var temp_text=''

      function update_threshold() {
      procrs_switch=false
      var threshold = document.getElementById('threshold_selector').value;
      procrs_choice=document.getElementById('threshold_color').value;
      var color = document.getElementById('threshold_color').value;
      document.getElementById('threshold_value').innerText = threshold;

      var invert=false
      
      if (color>3) {
        invert=true 
        color-=4 
      }
      if(color>-1){ 

      procrs = [OpenSeadragon.Filters.THRESHOLDING(threshold,color)]
      if (invert==true) {
        procrs.push(OpenSeadragon.Filters.INVERT())
      }
      viewer.setFilterOptions({
        filters: {
          processors: procrs
        },
        loadMode: 'sync'
      });}

      else{
      procrs=[]
              viewer.setFilterOptions({
          filters: {
            processors:  procrs
          },
        });

       }
 
    }

    function switch_to_reg(){  
    if(procrs_switch==false && procrs!=[]){
      procrs_switch=true
     document.getElementById('threshold_color').value='-1'
     viewer.setFilterOptions({
          filters: {
            processors:  []
          },
        });
 
    } 
    else if(procrs_switch==true && procrs!=[]){
      procrs_switch=false
     document.getElementById('threshold_color').value=procrs_choice
     viewer.setFilterOptions({
          filters: {
            processors: procrs
          },
        });
 
    }
    }

    function proceed(){
     if(reference_calculated==true){
     window.location.href=baseurl+"3/"+folder_id
      }else{
     alert('Distortion measurement must be performed before proceeding!')
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
        },
        yaxis: {
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

    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }




    $(document).ready(function () {


      $("#Run_microms").click(function (event) {
        var checklist = [isNumeric($("#minSize").val()), isNumeric($("#maxSize").val()), isNumeric($("#minCircularity").val()), isNumeric($("#colorChannel").val()), isNumeric($("#threshold").val())]

        if (checklist.includes(false)) {
          alert('The input paramters includes non-numeric or empty entry. Run terminated.')
          return 0
        }

        if (somethingisrunning == false) {
          somethingisrunning = true
          status_update('Finding blobs..')
          var threshold_color=$("#threshold_color").val();
           if (threshold_color==-1) {
              threshold_color = 0
            }             
            if (threshold_color<4) {
              image_threshold = document.getElementById('threshold_selector').value;
            }
            else {
              threshold_color-=4
              image_threshold = document.getElementById('threshold_selector').value * -1;
            }




          $.ajax({
            url: baseurl+ "6",
            method: "GET",
            data: {

              dziid:folder_id ,
              minSize: $("#minSize").val(),
              maxSize: $("#maxSize").val(),
              minCircularity: $("#minCircularity").val(),
              colorChannel: $("#colorChannel").val(),
              threshold: $("#threshold").val(),
              image_threshold: image_threshold,
              refIMG: RefIMG,
              threshold_color:  threshold_color,  

            },
            dataType: "html",
            success: function (response_text) {
              somethingisrunning = false
              if (response_text.length > 0) {
                var S = response_text.split('end');
                gu4(false);
                gu2(S, false);
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





        } else { alert("This submission is ignored, server is still processing the previous submission!  Please avoid double clicking on the button, or clicking the button before another job is finished.  ") }

      });

 


      $("#Gosubmit").click(function (event) {
        var blobs = find_true_added_blobs()
        var fiducials = find_true_fiducials()
        var RowN = document.getElementById('RowN').value
        var ColN = document.getElementById('ColN').value
        var expected_number_blobs = parseInt(RowN) * parseInt(ColN)
        var imagingtype_switch=document.getElementById('imagingtype').value 

        if ( RowN<2  ||  ColN<2 ) {
          alert("Row number and column number should be larger than 1")
          return

        }

        if (blobs.length != expected_number_blobs - 4 || fiducials.length != 4) {

          alert("Distorion correction expected " + String(expected_number_blobs - 4) + ' blobs and 4 marked corners. ' + String(blobs.length) + ' blobs and '+String(fiducials.length)+ ' marked corners provided.')
          return
        }


        if (isNumeric(RowN) == false || isNumeric(ColN) == false) {
          alert("Wrong input value for array number!")
          return

        }

 
 

        if (imagingtype == 1) {
        alert("Please select the imaging method")
        return
        }

 
        if (somethingisrunning == false) {
          somethingisrunning = true
          status_update('Measuring distortion..')




          $.ajax({
            headers: { "X-CSRFToken": token },
            url: baseurl+"12",
            method: "POST",
            data: {
              csrf: token,
              blob_added: blobs.join('end'),
              fiducial_added: fiducials.join('end'),
              dziID: folder_id,
              rowN: RowN,
              colN: ColN,
              imagingtype_switch: imagingtype_switch,

            },
            dataType: "html",
            success: function (response_text) {
              update_graph(response_text)
              temp_text=response_text
              reference_calculated = true
              somethingisrunning = false
              status_update('')
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



    });


     $("#download_measurement").click(function () {
          if (reference_calculated==false) {
          alert('Download aborted; distortion is not measured.')
          return 0     
    
        }       

        if (somethingisrunning == false) {
          somethingisrunning = true
          $.ajax({
            headers: { "X-CSRFToken": token },
            url: baseurl+"20",
            method: "GET",
            data: {
              dziID: folder_id,
            },
            dataType: "html",
            success: function (responseText) {
              somethingisrunning = false      
               
     
              download(responseText,   image_name.substr(0, image_name.lastIndexOf('.')) + "_distortion_graph.txt" );
              status_update('Downloading. Do not edit the output file')
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



    var ismouseover = 0;
    var mag = 0.0001;
    var isrect = 0;
    var blob_radio_selected = true
    var fiducial_radio_selected = false
    var roiremove_radio_selected = false
    var somethingisrunning = false
    var TIF_image_pixel_size_X = ''
    var TIF_image_pixel_size_Y = ''
    var boxsize = ''
    var ispacked = false
    var filter_switch = 0
    var blobs_before_filter = []
    var threshold_saved_value = 128
    var inverse_switch_saved = false
    var reference_calculated = false


    function update_graph(text) {
      var x = text.split('=')[0].split('\n');
      var x_data = []
      for (var i = 0, n = x.length-1; i < n; ++i) {
        x_row = x[i].split('\t')
        x_row_float = []
        for (var ii = 0, nn = x_row.length; ii < nn; ++ii) {
          x_row_float.push(x_row[ii])
        }
        x_data.push(x_row_float)
      }
      x_data=x_data.reverse()
      var data_x = [{
        z: x_data,
        type: 'surface'
      }];

      var layout_x = {
        title: 'Z= X-axis distortion in pixel numbers, X= column number, Y= row number ',
      };




      var y = text.split('=')[1].split('\n');
      var y_data = []
      for (var i = 0, n = y.length-1; i < n; ++i) {
        y_row = y[i].split('\t')
        y_row_float = []
        for (var ii = 0, nn = y_row.length; ii < nn; ++ii) {
          y_row_float.push(y_row[ii])
        }
        y_data.push(y_row_float)
      }
        y_data=y_data.reverse()
      var data_y = [{
        z: y_data,
        type: 'surface'
      }];

      var layout_y = {
        title: 'Z= Y-axis distortion in pixel numbers, X= column number, Y= row number ',

      };
     
      var config = {
        displaylogo: false, doubleClickDelay: 1000, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'select2d', 'autoScale2d', 'toggleSpikelines'],

      }

      var section3 = document.getElementById("section3");
      var section2 = document.getElementById("section2");
      var section5 = document.getElementById("section5");
      var section1 = document.getElementById("section1");
      var art      = document.getElementById("art1");


      section5.style.display = 'none'
      section1.style.display = 'none'
      section2.style.display = 'none'
      section3.style.display = 'inline'
      art.style.display = 'none'

      var ViewModeButton = document.getElementById("radiobutton6");
      ViewModeButton.checked = true
      Plotly.newPlot('section3_1', data_x, layout_x, config);
      Plotly.newPlot('section3_2', data_y, layout_y, config);
 




    }


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
    }

    function status_update(Message) {

      document.getElementById('Satus_bar').innerHTML = Message

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
          var X = parseFloat(LisLis[0]);
          var Y = parseFloat(LisLis[1]);
          var w = parseFloat(LisLis[2]) * 2;
          var h = parseFloat(LisLis[3]) * 2;
          var c = parseFloat(LisLis[4]);
          var d = parseFloat(LisLis[5]);
          var i = LisLis[6];
          var g = parseInt(LisLis[7]);
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
          var g = parseInt(LisLis[7]);
          gu3(X, Y, w, h, c, d, i, g);


        }

      }
    };


    function gu3(X, Y, w, h, c, d, i, g) {

      if (w < 1 || h < 1) {
        w = 2
        h = 2
        X -= 1
        Y -= 1
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
    function isNumeric(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function find_true_added_blobs() {
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



    function remove_ROI_elements(X, Y, width, height) {
      var arr1 = find_true_added_blobs()
      var arr2 = find_true_fiducials()
      var added = arr1.concat(arr2)
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
      var S = find_true_added_blobs()
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
        add_fiducial(X, Y, w, h, c, d, i, g);


      }
    }

    function Savepoint() {
      if (document.getElementById('savepoint').innerHTML == 'Savepoint') {
        document.getElementById('savepoint').innerHTML = 'Revert'
        savepoint_blobs = find_true_added_blobs()
        savepoint_fiducials = find_true_fiducials()
        savepoint_ispacked = ispacked
        status_update(String(savepoint_blobs.length) + ' blobs and ' + String(savepoint_fiducials.length) + ' corner points are saved')
        return 0
      }
      if (document.getElementById('savepoint').innerHTML == 'Revert') {
        document.getElementById('savepoint').innerHTML = 'Savepoint'
        gu4(true)
        gu2(savepoint_blobs, true)
        add_fiducials(savepoint_fiducials)
        status_update(String(savepoint_blobs.length) + ' saved blobs and ' + String(savepoint_fiducials.length) + ' saved corner points are plotted')

        ispacked = savepoint_ispacked
        savepoint_ispacked = false
        savepoint_blobs = []
        savepoint_fiducials = []

        return 0

      }

    }

    function purge_blobs() {
      var F = find_true_fiducials()
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
      tileSources: 'https://tmacroms.s3.us-east-2.amazonaws.com/stat_out_'+folder_id+'/submitted_dzi_reference.dzi',
      crossOriginPolicy: 'Anonymous',
      maxZoomLevel: 100,
      minZoomLevel: 0.5,
      defaultZoomLevel: 1,
      gestureSettingsMouse: { clickToZoom: false },
      showNavigator: true,
      navigatorPosition: "BOTTOM_LEFT",
      zoomPerScroll: 1.4,
    });
    viewer.addHandler('open', function () {
      TIF_image_pixel_size_X = viewer.world.getItemAt(0).getContentSize().x;
      TIF_image_pixel_size_Y = viewer.world.getItemAt(0).getContentSize().y;
      boxsize = (TIF_image_pixel_size_Y + TIF_image_pixel_size_X) / 200
      radiobuttonf()
    });


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
        status_update('Manual blob editing during filter mode is ignored')
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


    function switch_view_mode() {
      var ViewModeButton = document.getElementById("radiobutton6");
      var section3 = document.getElementById("section3");
      var section1 = document.getElementById("section1");
      var section2 = document.getElementById("section2");
      var section5 = document.getElementById("section5");
      var art      = document.getElementById("art1");

      if (ViewModeButton.checked == true) {
        section1.style.display = 'none'
        section2.style.display = 'none'
        section5.style.display = 'none'
        section3.style.display = 'inline'
        art.style.display = 'none'
      }
      else {
        section5.style.display = 'inline'
        section1.style.display = 'inline'
        section2.style.display = 'none'
        section3.style.display = 'none'
        art.style.display = 'inline'
        
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
        url: "8",
        method: "POST",
        data: {
          csrf: token,
          dziID: folder_id,
          Blobs: blobs_before_filter.join('+')
        },
        dataType: "json",
        complete: function (r) {
          somethingisrunning = false
          response_text = r.responseText;

          blobs_before_filter = response_text.split('end');
          gu4(false);
          gu2(blobs_before_filter, true);
          status_update('')
          document.getElementById("Distance_button").style.display = 'inline';
          document.getElementById("Distance_button").click();
          document.getElementById("Distance_button2").style.display = 'none';

        }

      });


    };
    document.getElementById('radiobutton5').checked = false;
 