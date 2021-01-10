 
  $(document).ready(function () {
    $.get("4", function (response_text) {
      $('#td2').text(response_text);
    });
        document.getElementById("form1").action+=String(Math.floor(Math.random() * 1000000000000))+'/' 

  });
  var uploading=0
  var count=0
  var data = ''
  var uploaded_progress1=0
  var albumBucketName = "tmacroms";
  var bucketRegion = "us-east-2";
  var IdentityPoolId = "us-east-2:562bcf25-4310-4134-9680-19ec0445cf37";
  var fn = 0;
AWS.config.logger = console;
  AWS.config.update({
    region: bucketRegion,
    credentials: new AWS.CognitoIdentityCredentials({
      IdentityPoolId: IdentityPoolId
    })
  });

  var s3 = new AWS.S3({
    apiVersion: "2006-03-01",
    params: { Bucket: albumBucketName }
  });

 
  function counter(name,file){
   count+=1
    if(count==3){

   uploading=0 
       count=0
    if (uploaded_progress1<100 || uploaded_progress2<100 || uploaded_progress3<100){
    document.getElementById("progress1").innerHTML = 'File upload failed!'
    document.getElementById("progress2").innerHTML = ''
    document.getElementById("progress3").innerHTML = ''    
    return null
    }
     s3.upload({
      Key: name+'tagfile.csv',
      Body: file,
    }, function (err, data) {
      if (err) {
        document.getElementById("progress1").innerHTML = 'File upload failed! Please try uploading again'
        return null
      }  
     })
    document.getElementById("progress1").innerHTML = 'File upload completed!'
    document.getElementById("progress2").innerHTML = ''
    document.getElementById("progress3").innerHTML = ''


      }
   }

 

  function submit_s3() {
         count=0
    if(uploading==1){return null}
    var files1 = document.getElementById("fidfs").files;
    var file1 = files1[0];

    var files2 = document.getElementById("imagef").files;
    var file2 = files2[0];

    var files3 = document.getElementById("rangef").files;
    var file3 = files3[0];


    splitted1 = file1.name.split('.')
    splitted2 = file2.name.split('.')
    splitted3 = file3.name.split('.')

    if (splitted1[splitted1.length - 1].toUpperCase() != 'ZIP') {
      alert('The first input file can only be a .zip file')
      return null
    }
    if (splitted2[splitted2.length - 1].toUpperCase() != 'TIFF' && splitted2[splitted2.length - 1].toUpperCase() != 'JPEG' && splitted2[splitted2.length - 1].toUpperCase() != 'TIF' && splitted2[splitted2.length - 1].toUpperCase() != 'JPG' && splitted2[splitted2.length - 1].toUpperCase() != 'PNG') {
      alert('The second input file can only be a tif/jpg/png file')
      return null
    }

    if (splitted3[splitted3.length - 1].toUpperCase() != 'TXT') {
      alert('The third input file can only be a .txt file')
      return null
    }



    if (document.getElementById('email').value.search('@') == -1) {
      alert('Please enter a valid email address')
      return null
    }
    if (file1.size / 1024 / 1024 / 1024 > 3.5 || file2.size / 1024 / 1024 > 200 || file3.size / 1024 / 1024 > 1) {
      alert('Input file size larger that max limit')
      return null
    }
    var delimiter='_______AND_______'
    var submit_id = String(Math.floor(Math.random() * 10000000000000000)) + delimiter + document.getElementById('email').value

    var Key1 = submit_id + delimiter + file3.name.replace(/[^\w.]+/g, "_")
    var Key2 = submit_id + delimiter + file2.name.replace(/[^\w.]+/g, "_")
    var Key3 = submit_id + delimiter + file1.name.replace(/[^\w.]+/g, "_")

    data = [[Key1.replace(/ /g, '_'), file3, 'Text'], [Key2.replace(/ /g, '_'), file2, 'Image'], [Key3.replace(/ /g, '_'), file1, 'Data']]

    uploading=1
     s3.upload({
      Key: data[0][0],
      Body: data[0][1],
    }, function (err, data) {
      if (err) {
        alert(err + '\n' + name + ' file upload failed. Canceling upload')
        document.getElementById("progress").innerHTML = ''
        return null
      } 
     }).on('httpUploadProgress', function (progress) {
      uploaded_progress1 = parseInt((progress.loaded * 100) / progress.total);
      document.getElementById("progress1").innerHTML = data[0][2] + ' file upload: ' + String(uploaded_progress1) + ' %';
    }

    ).send(function(err, data) {  
    counter( submit_id + delimiter,file3) 
});




     s3.upload({
      Key: data[1][0],
      Body: data[1][1],
    }, function (err, data) {
      if (err) {
        alert(err + '\n' + name + ' file upload failed. Canceling upload')
        document.getElementById("progress").innerHTML = ''
        return null
      } 
     }).on('httpUploadProgress', function (progress) {
      uploaded_progress2 = parseInt((progress.loaded * 100) / progress.total);
      document.getElementById("progress2").innerHTML = data[1][2] + ' file upload: ' + String(uploaded_progress2) + ' %';
    }

    ).send(function(err, data) {  
    counter(submit_id + delimiter,file3) 
});




     s3.upload({
      Key: data[2][0],
      Body: data[2][1],
    }, function (err, data) {
      if (err) {
        alert(err + '\n' + name + ' file upload failed. Canceling upload')
        document.getElementById("progress").innerHTML = ''
        return null
      } 
     }).on('httpUploadProgress', function (progress) {
      uploaded_progress3 = parseInt((progress.loaded * 100) / progress.total);
      document.getElementById("progress3").innerHTML = data[2][2] + ' file upload: ' + String(uploaded_progress3) + ' %';
    }).send(function(err, data) {  
    counter(submit_id + delimiter,file3) 
});
  
       uploading=0 

  };
  function RReset() {
    document.getElementById("image_upload_status").innerHTML = ''
    document.getElementById("progress1").innerHTML = ''
    document.getElementById("progress2").innerHTML = ''
    document.getElementById("progress3").innerHTML = ''

  }
  function checksize(Switch) {
    var fname = ['image1', 'image2'][Switch]
    var x = document.getElementById(fname)

    if (x.files[0].size / 1024 / 1024 > 100) {
      alert("File size limit is 100 MB!");
      x.value = "";
    };

  }

  function Submit() {
    if (document.getElementById("image1").files[0] == null) {
      alert('Image file is needed for upload')
      return
    }
    if (document.getElementById("image2").files[0] != null && document.getElementById('plotmode').checked) {
      alert('Image for distortion target grid cannot be submitted for plot mode')
      return
    }
    document.getElementById("form1").submit()
    document.getElementById("image_upload_status").innerHTML = 'Image upload under progress!'

  }
  window.onload = function() {
   document.getElementById("plotmode").checked = false
  }
   


 