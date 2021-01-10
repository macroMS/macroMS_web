import sys,os,time
sys.path.append("/home/ubuntu/.local/lib/python2.7/site-packages")  ###  lamda invoked runs have issues with user permission

import time,os,random,pymzml,xlsxwriter,shutil,email_sender,boto3,numpy
from scipy.ndimage import uniform_filter1d


time.sleep(60)   ##### delete for debug mode

current_entry=sys.argv[1]
canshutdown=True#True ###### delete for debug mode

def is_number(s):
    try:
        float(s)
        return True
    except ValueError:
        return False

def alignment_offset(spectrum,alignment_points):
    out=[]
    for point in alignment_points:
        slice=[qq for qq in spectrum if point-.5<qq[0]<point+.5]
        slice_mz,slice_int=zip(*slice)
        slice_int=uniform_filter1d(slice_int, size=3)
        slice=[q for q in zip(slice_mz,slice_int)]
        sorted_slice=sorted(slice, key=lambda a: a[1])
        out.append(sorted_slice[-1][0]-point)
    return out

def align_spectrum(spectrum_MZ,alignment_points,offsets):
    spectrum_MZ=numpy.array(spectrum_MZ)
    if len(alignment_points)==1:
        return list(spectrum_MZ-offsets[0])
    spectrum_MZ-=(spectrum_MZ-alignment_points[0])/(alignment_points[1]-alignment_points[0])*(offsets[1]-offsets[0])+offsets[0]
    return list(spectrum_MZ)
     
            
def Run(current_entry):
    
    failed=False
    msg='' 
    
    
    os.system('aws s3 cp s3://tmacroms/  /home/ubuntu/data   --recursive  --exclude "*" --include \"'+current_entry+'*\" ')
    os.system('aws s3 rm s3://tmacroms/    --recursive  --exclude "*" --include \"'+current_entry+'*\" ')
    os.system('unzip  data/'+current_entry+'*.zip -d data')
    os.system('rm  data/'+current_entry+'*.zip')
    data_dir='data'
    out_dir='output'
    delimiter='_______AND_______'
 
    datafs=os.listdir(data_dir)
    email=[q for q in datafs if q.count('@')!=0][0].split(delimiter)[1]
    img=[q for q in datafs if q.upper().split('.')[-1] in ['JPG','JPEG','PNG','TIF','TIFF'] and q.count(current_entry)!=0 ][0]
    original_img=img.split(delimiter)[2]
    
    folders=[q for q in datafs if os.path.isdir(data_dir+'/'+q)]
    if  len(folders)>1 or len(folders)==0:############################### check for folder hirachy in datadir 
        failed=True
        msg+='Data format error: incorrect folder structure in zip file.  Check if you did compress a single folder containing the data files. '  
        return None
    
    txt=[q for q in datafs if q.upper().split('.')[-1]=='TXT'][0]
    cont=[q.replace(' ','\t').replace('\t',' ').replace('\r','').replace('\n','').split() for q in open(data_dir+'/'+txt).readlines() if q.replace('\t','').replace('\r','').replace('\n','').replace(' ','')!='']
    rang=[[qq for qq in q if qq!=''] for q in cont]
    nums=[]
    [nums.extend(q) for q in rang]
     
     
    alignment_points=[] 
    for q in rang:
        q=sorted(q)
        isstring=False
        if len(q)>2 or len(q)==0:
            failed=True
            msg+='m/z range file error: Number of elements in a line is wrong. Cut + paste from Excel sheet recommended\n\n'
            continue
        for qq in q:
            if is_number(qq)==False:
                failed=True
                msg+='m/z range file error: File includes an element that is not a number\n\n'
                isstring=True
                continue
            if float(qq)<0:
                failed=True
                msg+='m/z range file error: File includes a negative value\n\n'
                continue
        if isstring==True:
            continue
        if len(q)==1:
            alignment_points.append(float(q[0]))
            if len(alignment_points)>2:
                failed=True
                msg+='m/z range file error: More than two alignment points are provided \n\n'
                continue
            continue
        if float(q[0])>1 and float(q[1])-float(q[0])>1:
            failed=True
            msg+='m/z range file error: File includes m/z range(s) with a width larger than 1 m/z\n\n'
            continue
    if len(rang)-len(alignment_points)>10:
        msg+='m/z range file error: More than 10 m/z ranges are listed\n\n'
        failed=True
             
    ranges=[sorted([float(qq) for qq in q]) for q in rang if len(q)==2 and is_number(q[0]) and is_number(q[1])]
    ranges=sorted(ranges, key=lambda a: a[0])
    for i,q in enumerate(ranges):
        if q[0]<1:
            ranges[i]=[q[1]-q[0],q[1]+q[0]]
    
    alignment_points=sorted(alignment_points)
    locations=[]
    [locations.extend(q) for q in ranges]
    ranges=[[q-0.5,q+0.5] for q in alignment_points]+ranges
    
    
    
     
    datafs2=[ q  for q in os.listdir(data_dir+'/'+folders[0]) if q.split('-')[0].count('_')==6 or q.split('-')[0].count('_')==5]
    if len(datafs2)==0:################################ presence of MALDI output files 
        failed=True
        msg+='Data format error: No recognizable output files in the zip file. Check if you did compress a single folder containing the data files, or check the macroMS manual. ' 
        return None
      
    if failed==True:############################# 
        email_sender.Email_send(email,msg,False)
        os.system('rm -rf output/*')
        os.system('rm -rf data/*')
        return None
    
    
    
    ##############################################
 
    
    os.system('WINEDEBUG=fixme-all wine /home/ubuntu/CompassXport/CompassXportConsole.exe -multi '+'"'+data_dir+'"'+' -mode 2 -raw 1')
    
    mzML_paths=[]
    ischecked=False
    for root, dirs, files in os.walk(data_dir):
        for File in files:
            if File.endswith('.mzML'):
                mzML_path=root+'/'+File
                if mzML_path.count('_null/')!=0:
                    continue
    
                mzML_paths.append(mzML_path)
                if ischecked==False:
                    ischecked=True
                    spectra=[q for q in pymzml.run.Reader(mzML_path)][0]
                    minMz=min(spectra.mz)
                    maxMz=max(spectra.mz)
                    msg=''
                    if maxMz-minMz>1000:
                        msg+='Error: mass spectrum range is greater than the required limit of 1000 m/z'
                    if len([q for q in nums if minMz > float(q) or maxMz < float(q) ])>0:
                        msg+='\n\nOne of the values in the range file is not within the m/z range for the data'
                    if msg!='':
                        email_sender.Email_send(email,msg,False)
                        os.system('rm -rf output/*')
                        os.system('rm -rf data/*')
                        return None 
    
    out=open(out_dir+'/blobs_locations.js','w')
    
    fname, file_extension = os.path.splitext(original_img)
    workbook = xlsxwriter.Workbook(out_dir+'/'+fname+'.xlsx',{'strings_to_numbers':  True,})
    worksheet = workbook.add_worksheet()
    worksheet.set_column('A:A', 40)
    
    worksheet.write(0,0,'File name')
    worksheet.write(0,1,'X pos')
    worksheet.write(0,2,'Y pos')
    worksheet.write(0,3,'Size')
    
    groupswitch=0
    arrayswitch=0
    if len(list(set([q.split('/')[2].split('_')[1] for q in mzML_paths])))>1:
        groupswitch=1
        worksheet.write(0,4,'Group ID')
        
     
    worksheet.write(0,4+groupswitch,'Blob ID')
    
    if datafs2[0].count('-')==1:
        arrayswitch=2
        worksheet.write(0,4+groupswitch+1,'Row #')
        worksheet.write(0,4+groupswitch+2,'Col #')
        
    if datafs2[0].count('-')==2:
        arrayswitch=3
        worksheet.write(0,4+groupswitch+1,'Row #')
        worksheet.write(0,4+groupswitch+2,'Col #')    
        worksheet.write(0,4+groupswitch+3,'Sample name')    

    
    line="var bloblocs = '"
    line2="var fnames = '"
    line3="var image_filename = '"
    line3+=original_img 
    for i, Range in enumerate(ranges):
        worksheet.write(0,i+5+groupswitch+arrayswitch,str(Range[0])+'-'+str(Range[1]))
        line+=str(Range[0])+'-'+str(Range[1])+' '
    for i,mzML in enumerate(mzML_paths):                         
        spectra=[q for q in pymzml.run.Reader(mzML)][0]
        spectrum=[q for q in zip(spectra.mz,spectra.i)]
        if len(alignment_points)>0:
            offsets=alignment_offset(spectrum,alignment_points)
        line_mz=[]
        line_int=[]
        data=[]
        mzML_info=mzML.split('/')[2]
        mzML_info_shorter=mzML_info[2:]
        for Range in ranges: 
            try:
                Slice=[qq for qq in spectrum if Range[0]-2.5<qq[0]<Range[1]+2.5]
                slice_mz,slice_int=zip(*Slice)
                if len(alignment_points)>0: 
                    slice_mz=align_spectrum(slice_mz,alignment_points,offsets)
                line_mz.append('-'.join([str(q) for q in slice_mz]))
                line_int.append('-'.join([str(q) for q in slice_int]))
                aligned_Slice=[q for q in zip(slice_mz,slice_int)]
                slice_int=[qq[1] for qq in aligned_Slice if Range[0]<qq[0]<Range[1]]    #align_spectrum
                data.append(str(sum(slice_int)))
                
            except Exception as e:
                print(e)
                data.append(str(0))        
                line_mz.append(str(Range))
                line_int.append(str(0))        
        out2=open(out_dir+'/'+mzML_info_shorter+'.txt','w')    
        mzdat='='.join(line_mz)+'\n'
        intdat='='.join(line_int)+'\n'
        out2.write(mzdat)
        out2.write(intdat)
        out2.close()
        line2+=mzML_info_shorter+'.txtend'
        if arrayswitch==0:
            info=[ [str(i+1)],[mzML_info.split('_')[1],str(i+1)]][groupswitch]
        if arrayswitch==2:        
            array_dat=mzML_info.split('_')[6].split('-') 
            info=[ [str(i+1),array_dat[0],array_dat[1]],[mzML_info.split('_')[1],str(i+1),array_dat[0],array_dat[1]]][groupswitch]
        if arrayswitch==3:  
            array_dat=mzML_info.split('_')[6].split('-') 
            info=[ [str(i+1),array_dat[0],array_dat[1],array_dat[2]],[mzML_info.split('_')[1],str(i+1),array_dat[0],array_dat[1],array_dat[2]]][groupswitch]

        location=[ mzML_info.split('_')[2],mzML_info.split('_')[3]]
        size=[ mzML_info.split('_')[5]]

        for ii,dat in enumerate([mzML_info]+location+size+info+data):
            worksheet.write(i+1, ii,dat )
        info=[mzML_info.split('_')[1],str(i+1)]
        line+='-'.join(info+[mzML_info.split('_')[2],mzML_info.split('_')[3]  ]+data+[mzML_info.split('_')[5]])+'end'
    out.write(line+ "'\n") # information 
    out.write(line2+"'\n")# file names
    out.write(line3+"'")#  image file name
    
    out.close()
    workbook.close()  
    
    tifn=''
    if img.split('.')[-1].upper() in ['JPG','JPEG','PNG']:
        os.system('convert -auto-orient -compress none '+data_dir+r'/'+img+ ' '+data_dir+r'/input.tif' )
        tifn=data_dir+r'/input.tif'
    if img.split('.')[-1].upper() in ['TIF','TIFF']:
        tifn=data_dir+'/'+img
    os.system('vips dzsave '+tifn+' '+out_dir +'/submitted_dzi --suffix  .jpg[Q=100]')
    os.system('aws s3 sync '+out_dir+' s3://tmacroms/out_'+current_entry+ ' --acl public-read')
    os.system('rm -rf output/*')
    os.system('rm -rf data/*')
    email_sender.Email_send(email,current_entry+'========splitter========='+original_img,True)
    return None
def check_queue_delete_message(): 
    sqs = boto3.resource('sqs', region_name='us-east-2')
 
    queue = sqs.get_queue_by_name(QueueName='XXXXXXXXXXXXXXXX.fifo')
    sqs = boto3.client('sqs', region_name='us-east-2')
    response = sqs.receive_message(QueueUrl=queue.url, MaxNumberOfMessages=1, VisibilityTimeout=30,WaitTimeSeconds=0)
    
    if 'Messages' not in response:
        return None
    message = response['Messages'][0]
    receipt_handle = message['ReceiptHandle']
    content =message['Body']    
    sqs.delete_message(QueueUrl=queue.url,ReceiptHandle=receipt_handle)
    return content
#current_entry=check_queue_delete_message()
#Run(current_entry)  #ADD for debug mode     
for q in range(10):
    #break  # ADD for debug mode
    if current_entry==None:
        current_entry=check_queue_delete_message()
        time.sleep(2)
        continue
    try:
        Run(current_entry)
    except Exception as e:
        email_sender.Email_send('XXXXXXXXXXXXXX','Error in the macroMS data processing. Instance not terminated for visit by Admin. Error: '+str(e),False)
        #canshutdown=True
        break 
    current_entry=check_queue_delete_message()
    time.sleep(2)

if canshutdown==True:
    os.system('rm -rf output/*')
    os.system('rm -rf data/*')
    os.system('sudo shutdown -h now')
