
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponseRedirect
import  re ,os,time, subprocess,random,math
#import pbs.pbs as pbs
from django.utils.encoding import smart_str
from django.http import HttpResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from website import  settings
import sys,random,string,re
#from PIL import Image

#from models import Command 
###################################
Django_base_dir=r'/home/ubuntu/website/'
Worker_note_path=r'/home/ubuntu/data'
Data_dir=r'/home/ubuntu/efs/'

#################################
def get_num_pixels(filepath):
    with Image.open(filepath) as F:
        width, height = F.size
        return width*height
def remove_finished_files(Path):
    fs=os.listdir(Path)
    if len([q for q in fs if q.split('.')[-1]=='txt'])!=0:
        os.system('rm '+Path+'/*.txt')
    if len([q for q in fs if q.split('.')[-1]=='xeo'])!=0:
        os.system('rm '+Path+'/*.xeo')
 
 
def index1(request):
    context= {
            'jobID': '3/'+random.choice(string.ascii_letters)+str(int(random.random()*1000)) ,
            }
    return render(request, 'main_form.html', context) 
        

def handle_uploaded_image(path,name,foldername,f,flag):
    cmd=''
    switch_i_dont_know_why_this_is_needed=0
    infoname=['fname.info','fname2.info'][flag]
    out=open(path+r'/'+infoname,'w')
    out.write(f.name)
    out.close()
    if f.name.split('.')[-1].upper() in ['JPG','JPEG','PNG']:
        nonTifName='input.'+f.name.split('.')[-1].lower() 
        switch_i_dont_know_why_this_is_needed=1
        with open(path+r'/'+nonTifName, 'wb+') as destination:
            for chunk in f:
                destination.write(chunk)
        try:
            pix=os.popen('identify '+path+r'/'+nonTifName).read().split()[2]
        except:
            return 1
         
        cmd+='convert -auto-orient -compress none '+path+r'/'+nonTifName+' '+path+r'/'+name +' ; '
        path=path
    if f.name.split('.')[-1].upper() in ['TIF','TIFF']:    
        with open(path+r'/'+name, 'wb+') as destination:
            for chunk in f:
                destination.write(chunk)    
        try:
            pix=os.popen('identify '+path+r'/'+name).read().split()[2]
        except:
            return 1
    pix_count=int(pix.split('x')[0])*int(pix.split('x')[1])  
    if pix_count>30000000:
        return 1    
    cmd+=' mkdir ./static ;' 
    os.system('chmod 777 '+path)
    if flag==False:
        cmd+=['','sudo '][switch_i_dont_know_why_this_is_needed]+'vips dzsave '+path+r'/'+name +' ./static/submitted_dzi --suffix  .jpg[Q=100] ; '
    if flag==True:
        cmd+=['','sudo '][switch_i_dont_know_why_this_is_needed]+'vips dzsave '+path+r'/'+name +' ./static/submitted_dzi_reference --suffix  .jpg[Q=100] ; '        
    cmd+= ['','sudo '][switch_i_dont_know_why_this_is_needed]+'aws s3 sync ./static s3://tmacroms/stat_out_'+foldername+ ' --acl public-read ; sudo rm -rf ./static ' 
    output=os.popen(' python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' FALSE').read()
    os.system('chmod 777 '+path)
    return 0             
def handle_uploaded_txt(path,f):
    content=f.read().decode("ascii")
    cf=content.split('=========\n')[1]
    rf=content.split('=========\n')[2] 
    out=open(path+r'/coner_points','w')
    out.write(cf)
    out.close()
    out=open(path+r'/reference_loc','w')
    out.write(rf)
    out.close()


def submission_form_check(request):
    filecheck=False
    for key in request.FILES.keys():
        if key=='-l' and request.FILES[key].name.split('.')[-1].upper() not in ['TIF','TIFF','PNG','JPEG','JPG']:
            return True
        if key=='-l' or key=='-l2': 
            try:
                request.FILES[key].name.encode('ascii') 
            except:
                return True
        if key=='-l2' and request.FILES[key].name.split('.')[-1].upper() =='TXT':
            firstline=request.FILES[key].read().decode("ascii")
            request.FILES[key].seek(0)
            if str(firstline).count('=========\n')!=2:
                return True
        if key=='-l2' and request.FILES[key].name.split('.')[-1].upper() not in ['TIF','TIFF','PNG','JPEG','JPG','TXT']:
            return True
    return False   
def index3(request,foldername):

    basedir=Data_dir########################################

    directory=basedir+foldername
    if not os.path.exists(directory):
        os.makedirs(directory)
        os.makedirs(directory+'/static') 
                

    if os.path.exists(directory+'/reference_loc')==True and os.path.exists(directory+'/savepoint')==True:
        filename=open(directory+'/fname.info').read()
        context= {
            'ID': foldername,
             'RefImg': '2',
             'Revisit':'1',
             'image_name':filename,
            }
        return render(request, 'bibindex.html', context)  
        
                
    if os.path.exists(directory+'/savepoint'):
        filename=open(directory+'/fname.info').read()
        context= {
            'ID': foldername,
             'RefImg': '0',
             'Revisit':'1',
             'image_name':filename,
            }
        return render(request, 'bibindex.html', context)  
        
        
    if os.path.exists(directory+'/reference_loc'):
        filename=open(directory+'/fname.info').read()
        context= {
            'RefImg': "2",
            'ID': str(foldername),
            'Revisit':'0',
            'image_name':filename,
        }
        return render(request, 'bibindex.html', context)     
        
 
        
    if '-l' in request.FILES.keys() and request.FILES['-l'].size>settings.MAX_UPLOAD_SIZE:
        return render_to_response('response_form2.html' )
    if '-l2' in request.FILES.keys() and request.FILES['-l2'].name.split('.')[-1].upper() in ['TIF','TIFF','PNG','JPEG','JPG'] and request.FILES['-l2'].size >settings.MAX_UPLOAD_SIZE:
        return render_to_response('response_form2.html' )   
    if '-l2' in request.FILES.keys() and request.FILES['-l2'].name.split('.')[-1].upper()=='TXT'  and request.FILES['-l2'].size > 1048576:
        return render_to_response('response_form2.html' )         
    if submission_form_check(request):
        return render_to_response('response_form2.html' )

   
    zipoutputfolder=''
    filecheck=0
    plotmode='false'
    if 'plotmode' in request.POST.keys():
        plotmode='true'
        filecheck+=handle_uploaded_image(directory,'input.tif',foldername,request.FILES['-l'],False)
    if '-l2' in request.FILES.keys() and request.FILES['-l2'].name.split('.')[-1].upper() in ['TIF','TIFF','PNG','JPEG','JPG']:
        filecheck+=handle_uploaded_image(directory,'input_reference.tif',foldername,request.FILES['-l2'],True)
    if '-l2' in request.FILES.keys() and request.FILES['-l2'].name.split('.')[-1].upper() =='TXT':
        handle_uploaded_txt(directory,request.FILES['-l2'])
        filename=open(directory+'/fname.info').read()
        context= {
            'RefImg': "2",
            'ID': str(foldername),
            'Revisit':'0',
            'image_name':filename,
        }
        return render(request, 'bibindex.html', context)     
        
    if filecheck!=0:
        return render_to_response('response_form2.html' )
    if '-l2' not in request.FILES.keys():
        filename=open(directory+'/fname.info').read()
        context= {
            'ID': foldername,
             'RefImg': '0',
             'Revisit':'0',
             'image_name':filename,
             'plot_mode': plotmode,
            }
        return render(request, 'bibindex.html', context)    
    if '-l2' in request.FILES.keys():
        filename=open(directory+'/fname2.info').read()
        context= {
            'ID': foldername,
            'RefImg': '1',
             'Revisit':'0',
             'image_name':filename,

            }
        return render(request, 'bibindex_reference.html', context) 
                
    #RODEO_command_generate_submit(directory,request,zipoutputfolder)      
 
    #return render_to_response('response_form.html' ) 
def index4(request):
    f='/home/ubuntu/website/go/ip_data.txt'
    f=open(f)
    n=0
    for q in f:
        n+=q.count('submit')
    f.close()
    return HttpResponse(str(n))
def index5(request):
    fiducials=request.POST['fiducial_added'].split('end')
    blobs=request.POST['blob_added'].split('end')
    TSO_geometry=request.POST['TSO_geometry']
    horizontal_flip_geometry=request.POST['horizontal_flip_geometry']
    ID=request.POST['dziID']   
    adjust_dimensions=request.POST['adjust_dimensions']
    csrf=request.POST['csrf']
    refIMG=request.POST['refIMG']
    Platetype=request.POST['Platetype']
    arraymode=request.POST['arraymode']
     
    outputdir=Data_dir+ID+'/submitted_entries.txt'
    #fiducials=list(set(fiducials)-set(removed))
    #blobs=list(set(blobs)-set(removed))
    out=open(outputdir,'w')
    out.write(','.join(fiducials)+'\n')
    out.write(','.join(blobs)+'\n')
    out.close()
    cmd='sudo python3.5 /home/ubuntu/macroMS/geometry-maker.py '+outputdir+' '+TSO_geometry+' '+horizontal_flip_geometry+' adjust_dimensions='+adjust_dimensions+ ' '+ID+' '+csrf+' '+refIMG+' '+Platetype+' '+arraymode
    output=os.popen(' python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' FALSE').read()

    geofile = open(outputdir.replace('submitted_entries.txt','out.xeo'),'r')
    response = HttpResponse(geofile, content_type='application/force-download')
    response['Content-Disposition'] = 'attachment; filename="%s"' % 'out.xeo'
    geofile.close()
    #remove_finished_files(Django_base_dir+'go/datafile/'+ID)
    return  HttpResponse(response)

def index6(request):
    input_parameters=[request.GET['minSize'],request.GET['maxSize'],request.GET['minCircularity'],request.GET['colorChannel'],request.GET['threshold'],request.GET['image_threshold'],request.GET['refIMG'],request.GET['threshold_color']]
    inputf=Data_dir+request.GET['dziid']+'/input.tif ' 
    outputdir=Data_dir+request.GET['dziid']
    cmd='python3.5 /home/ubuntu/macroMS/macroMS-web.py '+inputf+outputdir+ ' '+' '.join(input_parameters)   
    output=os.popen('  python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' TRUE').read()

    
    outlines=open(outputdir+'/output.txt').read().replace('\n','')
    remove_finished_files(outputdir)
    return HttpResponse(outlines)

#@csrf_exempt
def index7(request):
    offset=request.POST['offset']
    ID=request.POST['dziID']
    blobs=request.POST['blob_added'].split('end')

    outputdir=Data_dir+ID+'/submitted_entries_for_packing.txt'
    out=open(outputdir,'w')
    out.write(','.join(blobs)+'\n')
    out.close()
    cmd='python3.5 /home/ubuntu/macroMS/packer.py '+outputdir+' '+offset
    output=os.popen(' python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' FALSE').read()
    outlines=open(outputdir.replace('submitted_entries_for_packing.txt','output_pack.txt')).read().replace('\n','')

    return HttpResponse(outlines)
def index8(request):
    ID=request.POST['dziID']
    Blobs=request.POST['Blobs']
    outputdir=Data_dir+ID+'/submitted_entries_for_distance_measurements.txt'
    out=open(outputdir,'w')
    out.write(Blobs)
    out.close()
    cmd='sudo python3.5 /home/ubuntu/macroMS/blobs_distance_operation.py '+outputdir+' '+ID
    output=os.popen(' python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' FALSE').read()

    outlines=open(outputdir.replace('submitted_entries_for_distance_measurements.txt','output_distance.txt')).read().replace('\n','')
    remove_finished_files(Data_dir+ID)
    return HttpResponse(outlines)
@csrf_exempt
def index9(request):
    ID=request.POST['ID']
    TSorder=request.POST['order']
    outputdir=Data_dir+ID.split('-')[0]+'/'+ID+'.txt'
    outf=open(outputdir,'w')
    outf.write(TSorder)
    outf.close()
    return HttpResponse('Done')
@csrf_exempt
def index10(request):
    ID=request.POST['ID']
    distances=request.POST['distances']
    outputdir=Data_dir+ID.split('-')[0]+'/distance_output.txt'
    outf=open(outputdir,'w')
    outf.write(distances)
    outf.close()
    return HttpResponse('Done')
def index11(request,fname):
    context= {
        'ID': fname,
        }
    return render(request, 'results_image.html', context)
def index12(request):
    ID=request.POST['dziID'] 
    RowN=request.POST['rowN'] 
    ColN=request.POST['colN'] 
    
    arraynamemode='False'
    if 'arraynamemode' in request.POST.keys():
        arraynamemode='True'
        if request.POST['arraynamemode']=='addition':
            arraynamemode='Addition'
    

    imagingtype_switch='null'
    if 'imagingtype_switch' in request.POST.keys():
        imagingtype_switch=request.POST['imagingtype_switch'] 
     
    inputdir= Data_dir+ID+'/submitted_ref_entries.txt'
    outputdir=Data_dir+ID+'/reference_loc'
    out=open(inputdir,'w')    
    fiducials=request.POST['fiducial_added'].split('end')
    blobs=request.POST['blob_added'].split('end')
    out.write(','.join(fiducials)+'\n')
    out.write(','.join(blobs)+'\n') 
    out.close() 
    cmd='sudo python3.5 /home/ubuntu/macroMS/reference-maker.py '+inputdir+' '+outputdir+' '+RowN+' '+ColN+' '+arraynamemode+' '+imagingtype_switch
    output=os.popen('  python3.5 /home/ubuntu/website/go/celery_runner.py '+'\"'+cmd+'\"' +' FALSE').read()
    readfilename=''
    f=open(Data_dir+ID+'/'+['distortion_graph.txt','array_register_output.txt'][arraynamemode=='True' or arraynamemode=='Addition']) 
    content=f.read()
    f.close()
    remove_finished_files(Data_dir+ID)
    return  HttpResponse(content)
def index14(request):
    fname=request.GET['dziID']
    fname=str(int((int(fname)+2334234)/3333333-2342))
    context= {
         'RefImg': "2",
        'ID': str(fname),
             'Revisit':'0',

        }
    return render(request, 'bibindex.html', context)    
def index15(request):
    ID=request.GET['dziid'] 
    ID=str((int(ID)+2342)*3333333-2334234)
    return HttpResponse('14?dziID='+ID)
def index16(request):
    ID=request.GET['dziid']
    cf=open(Data_dir+ID+'/coner_points')
    cont=cf.read()
    cf.close()
    return HttpResponse(cont)
def index18(request):
    ID=request.POST['dziID']
    fiducials=request.POST['fiducial_added'] 
    blobs=request.POST['blob_added'] 
    fontsize=request.POST['fontsize']
    outputdir=Data_dir+ID+'/savepoint' 
    out=open(outputdir,'w')
    out.write(fiducials+'\n')
    out.write(blobs+'\n')
    out.write(fontsize)
    out.close()
    return HttpResponse('success')
def index19(request,foldername):
    cf=open(Data_dir+foldername+'/savepoint')
    cont=cf.read()
    cf.close()
    return HttpResponse(cont)
def index20(request):
    ID=request.GET['dziID']
    cf=open(Data_dir+ID+'/coner_points')
    cf_cont=cf.read()
    cf.close()
    rf=open(Data_dir+ID+'/reference_loc')
    rf_cont=rf.read()
    rf.close()
    cont='=========\n'+cf_cont+'=========\n'+rf_cont
    return HttpResponse(cont)

