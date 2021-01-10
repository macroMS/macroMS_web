 
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
    var current_spot = ''
    var blobs_before_filter = []
    var threshold_saved_value = 128
    var inverse_switch_saved = false
    var selected_blob = []
    if (fnames == '') {
      status_update('Plotting spectra is disabled due to data analysis error')
    }
    fnames = fnames.split('end')
    document.getElementById("image_name").innerHTML = "Input image : "+image_filename
     

    function clearup2(n) {
      if (Blobgroups.length > 1) {
        if (n == 1) {
          document.getElementById("Blobgroups").value = ''
          document.getElementById("Bloblist").value = ''
        }
        if (n == 2) {
          document.getElementById("Blobs").value = ''
          document.getElementById("Bloblist").value = ''
        }
        if (n == 3) {
          document.getElementById("Blobs").value = ''
          document.getElementById("Blobgroups").value = ''
        }
      } else {

        if (n == 1) {
          document.getElementById("Bloblist").value = ''
        }
        if (n == 2) {
          document.getElementById("Blobs").value = ''
          document.getElementById("Bloblist").value = ''
        }
        if (n == 3) {
          document.getElementById("Blobs").value = ''
        }


      }

    }


    function onlyUnique(value, index, self) {
      return self.indexOf(value) === index;
    }

    var blobgroupswitch = 1
    var dat = bloblocs.split(' ')
    var mzranges = dat.slice(0, dat.length - 1)



    var checkboxes = '<br><a>m/z ranges for plotting</a><br>';
    for (i = 0; i < mzranges.length; i++) {
      checkboxes += "<input type='checkbox' id='" + mzranges[i] + "' name='mzranges' value='" + mzranges[i] + "'><label for='" + mzranges[i] + "'>" + mzranges[i] + "</label><br>"
    }
    document.getElementById("mzranges").innerHTML = checkboxes

    var blobdata = dat[dat.length - 1].split('end')
    blobdata = blobdata.slice(0, blobdata.length - 1)
    var blobs = []
    for (i = 0; i < blobdata.length; i++) {
      blobs.push(blobdata[i].split('-'))
    }
    var Blob_entries = ' <option value=""> </option>'
    var Blobgroup_entries = ' <option value=""> </option>'
    var blob = blobs[0]
    var Blobs = [];
    var Blobgroups = [];
    for (i = 0; i < blobs.length; i++) {
      Blobgroups.push(parseInt(blobs[i][0]))
      Blobs.push(parseInt(blobs[i][1]))
    }
    Blobgroups = Blobgroups.filter(onlyUnique);
    Blobs = Blobs.sort(function (a, b) { return a - b })
    Blobgroups = Blobgroups.sort(function (a, b) { return a - b })
    if (Blobgroups.length > 1) {

      for (i = 0; i < Blobs.length; i++) {
        Blob_entries += "<option value=\"" + Blobs[i] + "\">" + Blobs[i] + "</option>"
      }
      for (i = 0; i < Blobgroups.length; i++) {
        Blobgroup_entries += "<option value=\"" + Blobgroups[i] + "\">" + Blobgroups[i] + "</option>"
      }


      document.getElementById("Blobs").innerHTML = Blob_entries
      document.getElementById("Blobgroups").innerHTML = Blobgroup_entries
      document.getElementById("mode_selection").innerHTML = "Blob ID: <input type='radio' name='interaction_choice' id='blobradio' checked  >   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Group ID : <input type='radio' name='interaction_choice' id='groupradio'  > "
    }
    else {
      document.getElementById("blobgroup").innerHTML = ''

      for (i = 0; i < Blobs.length; i++) {
        Blob_entries += "<option value=\"" + Blobs[i] + "\">" + Blobs[i] + "</option>"
         

      }
      document.getElementById("Blobs").innerHTML = Blob_entries
    }





    function blob_action() {
      var out = []
      var movetarget = []
      for (i = 0; i < blobs.length; i++) {
        if (blobs[i][blobgroupswitch] == document.getElementById('Blobs').value) {
          var data = blobs[i].slice(blobgroupswitch + 3, blobs[i].length - 1).join('-')
          var entry = [blobs[i][blobgroupswitch + 1], blobs[i][blobgroupswitch + 2],  blobs[i][blobs[i].length - 1], blobs[i][blobs[i].length - 1], '0', '0', data, blobs[i][blobgroupswitch]]
          out.push(entry.join('and'))
          movetarget.push([parseFloat(blobs[i][blobgroupswitch + 1]), parseFloat(blobs[i][blobgroupswitch + 2])])
        }
      }
      selected_blob = out
      purge_blobs()
      gu2(out, false)

      if (current_spot != hEl.elements[0].id) {
        hEl.goToElementLocation(hEl.elements[0].id)
      }
      current_spot = hEl.elements[0].id


    }


    function blobgroup_action() {
      var out = []
      for (i = 0; i < blobs.length; i++) {
        if (blobs[i][blobgroupswitch - 1] == document.getElementById('Blobgroups').value) {
          var data = blobs[i].slice(blobgroupswitch + 3, blobs[i].length - 1).join('-')
          var entry = [blobs[i][blobgroupswitch + 1], blobs[i][blobgroupswitch + 2], blobs[i][blobs[i].length - 1], blobs[i][blobs[i].length - 1], '0', '0', data, blobs[i][blobgroupswitch]]
          out.push(entry.join('and'))
        }
      }
      selected_blob = out
      purge_blobs()
      gu2(out, false)
      if (current_spot != hEl.elements[0].id) {
        hEl.goToElementLocation(hEl.elements[0].id)
      }
      current_spot = hEl.elements[0].id
    }



    function show_multiple() {
      var blobswitch = 1
      var element = document.getElementById("blobradio");

      if (typeof (element) != 'undefined' && element != null) {
        if (document.getElementById("blobradio").checked == true) {
          blobswitch = 1
        }
        if (document.getElementById("groupradio").checked == true) {
          blobswitch = 0
        }

      }

      var out_with_data=[]
      var out_without_data=[]
      var entries = document.getElementById("Bloblist").value///.replace(/[\r\n]/g, ' ').replace(/,/g, ' ').split(' ')
      var data = Papa.parse(entries,{delimiter: "\t"}); 
      var data_indexes=Object.keys(data['data'])
      var entries=[]
      var entries_data=[]
      var out_data=[]
      for (ii = 0; ii < data_indexes.length; ii++) {
        entries.push(data['data'][data_indexes[ii]][0])
        entries_data.push(data['data'][data_indexes[ii]][1])
      }


       

      for (ii = 0; ii < entries.length; ii++) {
        for (i = 0; i < blobs.length; i++) {
          if (blobs[i][blobswitch] == parseInt(entries[ii])) {

            var data = blobs[i].slice(blobgroupswitch + 3, blobs[i].length - 1).join('-')
            var entry = [blobs[i][blobgroupswitch + 1], blobs[i][blobgroupswitch + 2],  blobs[i][blobs[i].length - 1], blobs[i][blobs[i].length - 1], '0', '0', data, blobs[i][1]]
            if(isNaN(entries_data[ii])==true){
            out_without_data.push(entry.join('and'))
            }else{
            out_with_data.push(entry.join('and'))            
            out_data.push(entries_data[ii])
            }
 
          }
        }
      }
      var out=out_without_data.concat(out_with_data)  

      selected_blob = out

      purge_blobs()
      if(out_without_data.length>0){gu2(out_without_data, false)}
      if(out_with_data.length>0){gu2_1(out_with_data,out_data)}       

      if (current_spot != hEl.elements[0].id) {
        hEl.goToElementLocation(hEl.elements[0].id)
      }
      current_spot = hEl.elements[0].id
    }



    function loadFile(filePath) {

      var result = null;
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.open("GET", 'https://tmacroms.s3.us-east-2.amazonaws.com/out_'+folder_id+'/' + filePath, false);



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

      return result;
    }

    function Array_to_floats(Lis) {
      var out = []
      for (iiiii = 0; iiiii < Lis.length; iiiii++) {
        out.push(parseFloat(Lis[iiiii]))
      }
      return out
    }
    function MS_spectrum_filter(mz,intensity,mz_range){
var filterd_mz=[]
var filterd_intensity=[]

var zipped_spectrum = mz.map(function(e, i) {
  return [e, intensity[i]];
    });

      for (var count = 0, n = zipped_spectrum.length; count < n; ++count) {
           
        if (mz_range[0] < zipped_spectrum[count][0]    && zipped_spectrum[count][0] < mz_range[1] ) {
          filterd_mz.push(zipped_spectrum[count][0])
          filterd_intensity.push(zipped_spectrum[count][1])
            
        }
      }  

return [filterd_mz,filterd_intensity]
}

    function plot() {
      var entries = document.getElementById("Bloblist").value.replace(/[\r\n]/g, ' ').replace(/,/g, ' ').split(' ')
      var x = []
      for (var count = 0, n = entries.length; count < n; ++count) {
        if (isNumeric(entries[count]) == true) {
          x.push(entries[count])
        }
      }

      if (Blobgroups.length > 1) {
        if (document.getElementById('Blobgroups').value == '' && document.getElementById('Blobs').value == '' && x.length == 0) {
          alert('No entry provided for plotting!')
          return
        }
      } else {
        if (document.getElementById('Blobs').value == '' && x.length == 0) {
          alert('No entry provided for plotting!')
          return
        }

      }
      if (x.length != 0) {
        show_multiple()
      }

      if (document.getElementById('Blobs').value != '') {
        blob_action()
      }
      if (Blobgroups.length > 1) {

        if (document.getElementById('Blobgroups').value != '') {
          blobgroup_action()
        }
      }


      var boxes = document.getElementsByName("mzranges");
      var indexes = [];
      for (var count = 0, n = boxes.length; count < n; ++count) {
        if (boxes[count].checked == true) {
          indexes.push(mzranges.indexOf(boxes[count].value))
        }
      }
      if (indexes.length == 0) {
        alert('No m/z range provided')
        return
      }
      if (indexes.length > 5) {
        alert('Ranges more than 5 cannot be plotted')
        return
      }

      var section1 = document.getElementById("section1");
      var section2 = document.getElementById("section2");
      var section2_1 = document.getElementById("section2_1");
      var container = document.getElementById("container");
      var top_bar = document.getElementById("top_bar");





      var fs = []
      filtered_fnames = []
      filtered_blobns = []
      for (ii = 0; ii < selected_blob.length; ii++) {
        for (i = 0; i < fnames.length; i++) {
          if (fnames[i].split('_')[1] == selected_blob[ii].split('and')[0] && fnames[i].split('_')[2] == selected_blob[ii].split('and')[1]) {
            filtered_fnames.push(fnames[i])
            filtered_blobns.push(selected_blob[ii].split('and')[selected_blob[ii].split('and').length - 1])
            fs.push(fnames[i])


          }
        }
      }
      var subplots = [];
      var gindex = 1
      var shapes_layout = []
      var colors = ['crimson', 'blue', 'green', 'indigo', 'magenta', 'yellowgreen', 'darkslateblue', 'black', 'violet', 'orange']
      var Range = parseFloat(document.getElementById("x_range").value)

      var x_Ranges = []

      var range_title = 'Mass spectra at the selected m/z ranges '

      for (i = 0; i < fs.length; i++) {
        var cont = loadFile(fs[i])

        if (cont == 'Error') {
          return null
        }
        var inten = cont.split('\n')[1].split('=')
        var mz = cont.split('\n')[0].split('=')
        for (ii = 0; ii < indexes.length; ii++) {
          var showswitch = false
          var X = Array_to_floats(mz[indexes[ii]].split('-'))
          var Y = Array_to_floats(inten[indexes[ii]].split('-'))
          
          var x_range=[parseFloat(mzranges[indexes[ii]].split('-')[0]) - Range, parseFloat(mzranges[indexes[ii]].split('-')[1]) + Range]
          var outp=MS_spectrum_filter(X,Y,x_range)
          X=outp[0]
          Y=outp[1] 
          x_Ranges.push(x_range)
          if (ii == 0) {
            showswitch = true
          }
          var subplot = {
            x: X,
            y: Y,
            xaxis: 'x' + String(gindex),
            yaxis: 'y' + String(gindex),
            type: 'scatter',
            showlegend: showswitch,
            name: '[' + filtered_blobns[i] + '] 0_' + filtered_fnames[i].replace(/.txt/g, ''),
            line: {
              color: colors[i % 10],
              width: 3

            }
          }
          subplots.push(subplot)
          gindex += 1

          if (i == 0) {

            var Shape = {
              type: 'rect',
              // x-reference is assigned to the x-values
              xref: 'x' + String(ii + 1),
              yref: 'y' + String(ii + 1),

              // y-reference is assigned to the plot paper [0,1]
              yref: 'paper',
              x0: mzranges[indexes[ii]].split('-')[0],
              y0: 0,
              x1: mzranges[indexes[ii]].split('-')[1],
              y1: 1,
              fillcolor: '#d3d3d3',
              opacity: 0.4,
              line: { width: 0 },
            }
            shapes_layout.push(Shape)


          };
        }
      }

      jSON = "var layout = {legend: {itemclick: false,itemdoubleclick: false}, title: {text:'" + range_title + "'}" + ",grid: {rows: fs.length,columns: indexes.length, pattern: 'independent', }, shapes: shapes_layout,"
      for (ii = 0; ii < subplots.length; ii++) {
        jSON += 'yaxis' + String(ii + 1) + ': {fixedrange: true},'
        jSON += 'xaxis' + String(ii + 1) + ': {fixedrange: true,range:[' + String(x_Ranges[ii][0]) + ',' + String(x_Ranges[ii][1]) + ']},'
      }
      jSON += '}'
      eval(jSON)

      var num = filtered_fnames.length * 40

      if (num < 100) {
        num = 100
      }

      section2.style.height = String(num) + "%"
      container.height = String(num) + "%"
      section2_1.style.height = String(num) + "%"

      var config
      config = {
        displaylogo: false, modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'hoverClosestCartesian', 'hoverCompareCartesian', 'select2d', 'autoScale2d', 'toggleSpikelines'],
        toImageButtonOptions: {
          format: 'jpeg', // one of png, svg, jpeg, webp
          filename: 'plot',
          height: fs.length * 800,
          width: 2000,
          scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
        }
      }

      section1.style.display = 'none'
      section2.style.display = 'inline'


      Plotly.newPlot('section2', subplots, layout, config);




    }







    function revertimage() {
      var section1 = document.getElementById("section1");
      var section2 = document.getElementById("section2");

      var section2_1 = document.getElementById("section2_1");

      section2.style.height = "100%"
      section2_1.style.height = "100%"
      container.height = "100%"
      section1.style.display = 'inline'
      section2.style.display = 'none'
    }






    function remove_element(ID) {
      const e = hEl.getElementById(ID)
      hEl.elements.splice(hEl.elements.indexOf(e), 1)

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
          var w = parseFloat(LisLis[2]);
          var h = parseFloat(LisLis[3]);
          var c = parseFloat(LisLis[4]);
          var d = parseFloat(LisLis[5]);
          var i = LisLis[6];
          var g = parseInt(LisLis[7]);
          gu3(X - w / 2, Y - h / 2, w, h, c, d, i, g,'#3cff33');
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
          gu3(X, Y, w, h, c, d, i, g, '#3cff33');


        }

      }
    };

 function gu2_1(Lis, Dat) { 
        var Min_val=Math.min(...Dat);
        var Max_val=Math.max(...Dat)-Min_val;
 
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
          
          var value=(Dat[count]-Min_val)/Max_val
          var HH = (1.0 - value) * 240
          var color= "hsl(" + HH + ", 100%, 50%)";
          gu3(X - w / 2, Y - h / 2, w, h, c, d, i, g,color);
        } 
    };


    function gu3(X, Y, w, h, c, d, i, g,ColoR) { 

      if (w < 1 || h < 1) {
        w = 2
        h = 2
      }
      if (X + w / 2 < 0 || TIF_image_pixel_size_X < X + w / 2 || Y + h / 2 < 0 || TIF_image_pixel_size_Y < Y + h / 2) {
        return null
      }
      var sq = document.createElement("div")
      sq.style = "box-sizing: border-box;border:solid 2px "+ColoR
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
      textbox.innerHTML = String(g)
      textbox.style.color='#3cff33'

      var ID = String(X) + 'and' + String(Y) + 'and' + String(w) + 'and' + String(h) + 'and' + String(c) + 'and' + String(d) + 'and' + String(i) + 'and' + String(g)
      hEl.addElement({
        id: ID,
        element: textbox,
        x: X,  
        y: Y+h,
        width: 11 * String(g).length,
        height: 20,
        fontSize: 5,
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



    function gu4(remove_fiducials) {
      var S = find_true_added_blobs()
      var F = find_true_fiducials()
      if (S.length > 0) {
        hEl.removeElementsById(S)
      }
      if (remove_fiducials == true && F.length > 0) {
        hEl.removeElementsById(F);
      }
      status_update('Blobs and fiducials are reset')

    };

    function gu5() {
      ispacked = false
      gu4(true)

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
      id: 'section1',
      prefixUrl: 'https://tmacroms-static.s3.us-east-2.amazonaws.com/images/',
      tileSources: 'https://tmacroms.s3.us-east-2.amazonaws.com/out_'+folder_id+'/submitted_dzi.dzi',
      maxZoomLevel: 10,
      minZoomLevel: .5,
      defaultZoomLevel: 1,
      gestureSettingsMouse: { clickToZoom: false },
      showNavigator: true,
      navigatorPosition: "BOTTOM_LEFT",
      zoomPerScroll: 1.5,
      autoResize: true,
      showRotationControl: true,
      showFlipControl: true,
    });
    viewer.addHandler('open', function () {
      TIF_image_pixel_size_X = viewer.world.getItemAt(0).getContentSize().x;
      TIF_image_pixel_size_Y = viewer.world.getItemAt(0).getContentSize().y;
      boxsize = (TIF_image_pixel_size_Y + TIF_image_pixel_size_X) / 200
    });

    viewer.addHandler('flip', function(event) {
    viewer.viewport.zoomTo(1)
    if(viewer.viewport.getFlip()==true){
    status_update('Flipped mirror image results in a limited zoom level ')
     viewer.viewport.maxZoomLevel=2}else{
    status_update('')

     viewer.viewport.maxZoomLevel=10
     }
    });

    var hEl = viewer.HTMLelements();

 