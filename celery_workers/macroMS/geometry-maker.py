#import matplotlib
#matplotlib.use('Agg')
import xml.etree.ElementTree as ET
import copy,math,cv2
import sys    
sys.path.append("/home/ubuntu/macroMS")
from GUICanvases.microMSModel import MicroMSModel
from os import path 
import numpy as np
import random ,os
from scipy.interpolate import griddata

 


#################################  vertical horizontal. 3,6,9,12 o clock position in wells ##########################################

inputf=sys.argv[1]
TSO_boolean='TRUE' in sys.argv[2].upper() 
Flip_boolean='TRUE' in sys.argv[3].upper()
adjust_dimensions=sys.argv[4].split('adjust_dimensions=')[-1]
ID=sys.argv[5]
csrf=sys.argv[6]
refIMG=sys.argv[7]
Platetype=sys.argv[8]
array_registered=sys.argv[9]
horizontal_flip_factor=1
if Flip_boolean==True:
    horizontal_flip_factor=-1

outputf=inputf.replace('submitted_entries.txt','out.xeo')
blobf=inputf.replace('submitted_entries.txt','blobs.txt')
#if path.exists(inputf.replace('submitted_entries.txt','packed_blobs.txt')):
#    blobf=inputf.replace('submitted_entries.txt','packed_blobs.txt')
ts_optimized=inputf.replace('submitted_entries.txt','TSOptimized_blobs.txt')


##################   READ ME              ########################################
# Requre 3 corner blobs.
# Usage:      python xeo_editor.py A.txt B.txt    B.txt is microMS output with the extra 3 corner blobs.

x_MALDI_plate_width,y_MALDI_plate_width=[[2,1.304],[1.304, 0.7826]][Platetype=='TLC']


header='''minSize 500
minCir  0.0
ImageInd        1
maxCir  None
channel 2
maxSize 2000
thresh  75
ROI: []
->
x       y       r       c
'''


#################################  vertical horizontal. 3,6,9,12 o clock position in wells ##########################################
 

  
F=open(inputf)
fiducials= F.readline().replace('\n','').split(',')
blobs= F.readline().replace('\n','').split(',')
F.close()

cornerblobs=[[float(qq) for qq in q.split('and')[:3]] for q in fiducials]
cornerblobs=[[q[0]+q[2]/2,q[1]+q[2]/2] for q in cornerblobs] 

blobsInfo=     [[float(qq) for qq in q.split('and')[:3]]+q.split('and')[3:] for q in blobs]
blobs=[[q[0]+q[2]/2,q[1]+q[2]/2] for q in blobsInfo]

array_register_dict=dict([(str(int((q[0]+q[2]/2)*100))+':'+str(int((q[1]+q[2]/2)*100)),q[7])for q in blobsInfo])
  
 
if refIMG=='2':
    allblobs=blobs+cornerblobs
    allblobs_array=np.array(allblobs,dtype=np.double)
    inputfolder=os.path.dirname(inputf)
    out=[q.replace('\n','').split('\t') for q in open(inputfolder+'/reference_loc').readlines()]  
    points=np.array([(float(q[0]),float(q[1])) for q in out],dtype=np.double)

    vals_x=np.array([float(q[2]) for q in out],dtype=np.double)
    vals_y=np.array([float(q[3]) for q in out],dtype=np.double)

    adjust_allblobs_array_x=griddata(points, vals_x, allblobs_array,method='linear') 
    adjust_allblobs_array_y=griddata(points, vals_y, allblobs_array,method='linear')
    adjust_allblobs_array=[q for q in zip(adjust_allblobs_array_x.tolist(),adjust_allblobs_array_y.tolist())]
    adjust_allblobs_array=np.array(adjust_allblobs_array)
    adjusted_allblobs=allblobs_array+adjust_allblobs_array
    
    untransformed_blobs_saved=copy.deepcopy(blobs)
    untransformed_cornerblobs_saved=copy.deepcopy(cornerblobs)
    
    adjusted_allblobs=adjusted_allblobs.tolist()     
    unfiltered_blobs=adjusted_allblobs[:-len(cornerblobs)]
    blobs=[[round(q[0],3),round(q[1],3)]  for q in unfiltered_blobs if not math.isnan(q[0]) ]
    
    unfiltered_cornerblobs=adjusted_allblobs[-len(cornerblobs):]
    cornerblobs=[[round(q[0],3),round(q[1],3)]  for q in unfiltered_cornerblobs if not math.isnan(q[0]) ]

    transformed_blobs_saved=  [[round(q[0],3),round(q[1],3)] for q in copy.deepcopy(unfiltered_blobs)]
    transformed_cornerblobs_saved=[[round(q[0],3),round(q[1],3)] for q in copy.deepcopy(unfiltered_cornerblobs)] 

    if len(cornerblobs)!=len(untransformed_cornerblobs_saved):
        F=open(outputf,'w')
        F.write('Fiducial point(s) filtered out. They must fall into the distortion correction area as defined by the four corner points. ')
        F.close()
        sys.exit() 

if adjust_dimensions!='':
    if refIMG!='2':
        untransformed_blobs_saved=copy.deepcopy(blobs)
        untransformed_cornerblobs_saved=copy.deepcopy(cornerblobs)
    
    sortedbyHeight=sorted(cornerblobs, key=lambda a: a[1]) 

    top1,top2=sortedbyHeight[2:]
    top_left,top_right=sorted([top1,top2], key=lambda a: a[0])
    bottom1,bottom2=sortedbyHeight[:2]
    bottom_left,bottom_right=sorted([bottom1,bottom2], key=lambda a: a[0])

    new_width=math.sqrt((bottom_right[0]-bottom_left[0])**2+(bottom_right[1]-bottom_left[1])**2)
    new_height=new_width/float(adjust_dimensions)

    points1= np.float32([bottom_left,bottom_right,top_left,top_right])
    points2= np.float32([bottom_left,[bottom_left[0]+new_width,bottom_left[1]],[bottom_left[0],bottom_left[1]+new_height],[bottom_left[0]+new_width,bottom_left[1]+new_height]])
    
    transform_matrx = cv2.getPerspectiveTransform(points1, points2)
    transformed_coords_arrays=[np.dot(transform_matrx,np.array([q[0],q[1],1])) for q in blobs+cornerblobs]
 
    transformed_coords_arrays=[[round(q[0]/q[2],3),round(q[1]/q[2],3)] for q in transformed_coords_arrays]

    #x=[q[0] for q in transformed_coords_arrays]
    #y=[q[1] for q in transformed_coords_arrays]
 
         
    
    #matplotlib.pyplot.scatter(x, y)
    #matplotlib.pyplot.savefig('/home/ubuntu/website/go/datafile/w690616626417950/books_read7.png')
    #matplotlib.pyplot.close()
    
    blobs=transformed_coords_arrays[:-len(cornerblobs)]
    cornerblobs=transformed_coords_arrays[-len(cornerblobs):]

    transformed_blobs_saved=copy.deepcopy(blobs)
    transformed_cornerblobs_saved=copy.deepcopy(cornerblobs)
    

########################################## need the filter that rejects spots outside the plate ##################################

####################################################################################################################################
    
 
def sort_by_quadrants(blobs):
    out=[]
    Xs=[q[0] for q in blobs]
    Ys=[q[1] for q in blobs]
    minX,maxX=min(Xs),max(Xs)
    minY,maxY=min(Ys),max(Ys)
    difX=(maxX-minX)/10
    difY=(maxY-minY)/10
    for ix in range(11):
        row=[]
        for iy in range(11):
            entries=[q for q in blobs if minX+difX*(ix) <=q[0]< minX+difX*(ix+1) and minY+difY*(iy) <=q[1]< minY+difY*(iy+1)]
            row.append(entries)
        switch=ix%2*-2+1

        [out.extend(q) for q in row[::switch]]
    return out
def blobfile_maker(blobs,blobf,TSO_boolean):

    if TSO_boolean==True:
        blobs=sorted(blobs, key=lambda a: a[0])
    if TSO_boolean==False and len(blobs)!=1:
        blobs=sort_by_quadrants(blobs)

    Blobs=[[str(qq) for qq in q[:2]+[1,1]] for q in blobs]
    content='\n'.join(['\t'.join(q) for q in Blobs])
    blobff=open(blobf,'w') 
    blobff.write(header+content)
    blobff.close()
 
    groupIds         =[q[2] for q in blobs]
    blobDimensions   =[q[3] for q in blobs]
    return groupIds,blobDimensions,[q[:2] for q in blobs]


blobDimensions=[q[2] for q in blobsInfo]
groupIds=[q[7] for q in blobsInfo]
Blobs=[q+[groupIds[i],blobDimensions[i]] for i,q in enumerate(blobs)]
 
groupIds,blobDimensions,blobs=blobfile_maker(Blobs,blobf,TSO_boolean) 
  
  
if TSO_boolean==True:
    micromm=MicroMSModel()
    micromm.loadBlobFinding(blobf)
    PossibleorderList=micromm.saveCurrentBlobFinding(ts_optimized,TSO_boolean,ID,csrf)
    groupIds=[groupIds[q] for q in PossibleorderList]
    blobDimensions=[blobDimensions[q] for q in PossibleorderList] 
    blobs= [q.replace('\n','').replace('\r','').split('\t')[:2] for q in open(ts_optimized).readlines()[10:] ]
    blobs=[[float(q[0]),float(q[1])] for q in blobs]
 
x,y=[q[0] for q in cornerblobs],[q[1] for q in cornerblobs]
min_x,max_x=min(x),max(x) 
min_y,max_y=min(y),max(y)  

margin_of_error_x=(max_x-min_x)*0.20
margin_of_error_y=(max_y-min_y)*0.20

out=[q for q in blobs if q[0]<min_x-margin_of_error_x or q[0]>max_x+margin_of_error_x or q[1]<min_y-margin_of_error_y or q[1]>max_y+margin_of_error_y  ]

if len(out)!=0:
    F=open(outputf,'w')
    F.write('Blobs were found outside the rectangular area defined by the fiducial points. The blobs must be removed to prevent MALDI instrument error.')
    F.close()
    sys.exit() 
        
def coord_converter(image_coord,image_min_coord,image_max_coord,MALDI_plate_dimension):
    factor=MALDI_plate_dimension/(image_max_coord-image_min_coord)
    return (image_coord-image_min_coord)*factor-MALDI_plate_dimension/2.0

coords=[[horizontal_flip_factor*coord_converter(q[0],min_x,max_x,x_MALDI_plate_width),-coord_converter(q[1],min_y,max_y,y_MALDI_plate_width)] for q in blobs+cornerblobs]
corner_coords=coords[-len(cornerblobs):]
coords =coords[:-len(cornerblobs)]
 

################################### making XML file for Ultraflex ######################################
fname=['MTP_384_ground_steel.xeo','PAC_reference.xeo','TLC_reference.xeo'][['MTP384','PAC','TLC'].index(Platetype)]
tree = ET.parse('/home/ubuntu/macroMS/'+fname)                         

root = tree.getroot() 

for original_entry in root.findall('PlateSpots')[0].findall('PlateSpot'):
    root.findall('PlateSpots')[0].remove(original_entry)
	
if refIMG=='2'  or adjust_dimensions!='' :   #### The PositionName contains pixel coordinates of blobs. For visualization, you want the unadjusted pixel coordinates.
    blobs=[untransformed_blobs_saved[transformed_blobs_saved.index(q)] for q in blobs]
    cornerblobs=[untransformed_cornerblobs_saved[transformed_cornerblobs_saved.index(q)] for q in cornerblobs]
 
 
    	
root.findall('PlateSpots')[0].attrib['PositionNumber']=str(len(coords))
positionindex=0 


for i, corner_coord in enumerate(corner_coords[:3]):
    new_entry=copy.deepcopy(original_entry)
    new_entry.attrib['PositionIndex']=str(positionindex)
    new_entry.attrib['PositionName']='fiducial_'+['bottom','top'][float(corner_coord[1])>0]+'_'+['left','right'][float(corner_coord[0])>0]+'_null'
    new_entry.attrib['UnitCoord_X']=str(float(corner_coord[0]))
    new_entry.attrib['UnitCoord_Y']=str(float(corner_coord[1]))
    root.findall('PlateSpots')[0].append(new_entry)
    positionindex+=1

for i, (X_coord,Y_coord) in enumerate(coords):
    new_entry=copy.deepcopy(original_entry)
    new_entry.attrib['PositionIndex']=str(positionindex)
    if array_registered=='true':
        new_entry.attrib['PositionName']=str(0)+'_'+str(blobs[i][0])+'_'+str(blobs[i][1])+'_'+str((int( str( (blobs[i][0]+1)*123)[2]) +int(blobs[i][1]+1)*51)%(int(blobDimensions[i])*2+10))+'_'+str(blobDimensions[i])+'_'+array_register_dict[str(int(blobs[i][0]*100))+':'+str(int(blobs[i][1]*100))]
    else: 
        new_entry.attrib['PositionName']=str(groupIds[i])+'_'+str(blobs[i][0])+'_'+str(blobs[i][1])+'_'+str((int( str( (blobs[i][0]+1)*123)[2]) +int(blobs[i][1]+1)*51)%(int(blobDimensions[i])*2+10))+'_'+str(blobDimensions[i])
    new_entry.attrib['UnitCoord_X']=str(X_coord)
    new_entry.attrib['UnitCoord_Y']=str(Y_coord)
    root.findall('PlateSpots')[0].append(new_entry)
    positionindex+=1

 
 
tree.write(outputf) 
x='<!-- $Revision: 1.4 $--> \n'+open(outputf).read() 
F=open(outputf,'w')
F.write(x)
F.close()
 
