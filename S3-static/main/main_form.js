
var fn=0;
$(document).ready(function(){
    $.get("4", function(response_text){
    $('#td2').text(response_text);
    });
}); 


var data=''
var albumBucketName = "tmacroms";
var bucketRegion = "us-east-2";
var IdentityPoolId = "us-east-2:562bcf25-4310-4134-9680-19ec0445cf37";

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

function submit_worker(index){
        if(index==3){
        document.getElementById("progress").innerHTML='File upload successful. Link to results will be emailed'
        return
        }
        var input=data[index]
 	var key=input[0]
	var File=input[1]
	var name=input[2]
 
  s3.upload({        Key:key,
        Body: File,
        }, function(err, data) {
        if(err) {
        alert(err+'\n'+name+' file upload failed. Canceling upload')
        document.getElementById("progress").innerHTML=''
        return null
        }
        index+=1
        submit_worker(index)
        }).on('httpUploadProgress', function (progress) {
        var uploaded = parseInt((progress.loaded * 100) / progress.total);
        document.getElementById("progress").innerHTML=name+' file upload: ' +String(uploaded) +' %'; }

        )




}

function submit_s3(){ 
  var files1 = document.getElementById("fidfs").files;
  var file1 = files1[0];

  var files2 = document.getElementById("imagef").files;
  var file2 = files2[0]; 

  var files3 = document.getElementById("rangef").files;
  var file3 = files3[0];	


  splitted1=file1.name.split('.')
  splitted2=file2.name.split('.')
  splitted3=file3.name.split('.')

	if (splitted1[splitted1.length-1].toUpperCase()!='ZIP' ){
	alert('The first input file can only be a .zip file')
	return null 
	}
        if ( splitted2[splitted2.length-1].toUpperCase()!='TIFF' && splitted2[splitted2.length-1].toUpperCase()!='JPEG' && splitted2[splitted2.length-1].toUpperCase()!='TIF' && splitted2[splitted2.length-1].toUpperCase()!='JPG' && splitted2[splitted2.length-1].toUpperCase()!='PNG' ){
        alert('The second input file can only be a tif/jpg/png file')
        return null 
		}        

        if ( splitted3[splitted3.length-1].toUpperCase()!='TXT' ){
        alert('The third input file can only be a .txt file')
        return null 
        }



	if (document.getElementById('email').value.search('@')==-1){
	alert('Please enter a valid email address')
	return null
	}
	if (file1.size/1024/1024/1024>3.5 || file2.size/1024/1024>100 || file3.size/1024/1024>1  ){
        alert('Input file size larger that max limit')
        return null
        }
	
  var submit_id= String(Math.floor(Math.random() * 10000000000000000))+'_'+document.getElementById('email').value

   var Key1=submit_id+'_'+file3.name  
   var Key2=submit_id+'_'+ file2.name  
   var Key3= submit_id+'_'+ file1.name 
  
   data=[[Key1.replace(/ /g,'_'),file3,'Text'],[Key2.replace(/ /g,'_'),file2,'Image'],[Key3.replace(/ /g,'_'),file1,'Data']]
   
    submit_worker(0)/// recursively upload files
 
	
};
function reset(){
document.getElementById("image_upload_status").innerHTML=''
document.getElementById("progress").innerHTML=''

}
function checksize(Switch){
var fname=['image1','image2'][Switch]
var x=document.getElementById(fname)
 
 if(x.files[0].size/1024/1024>100 ){
       alert("File size limit is 100 MB!");
       x.value = "";
    };

}

function Submit(){ 
   if(document.getElementById("image1").files[0]==null){
   alert('Image file is needed for upload')
   return
    }
   document.getElementById("form1").submit() 
   document.getElementById("image_upload_status").innerHTML='Image upload under progress!'
 
}

 