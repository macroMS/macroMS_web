import sys,time,os
sys.path.append("/home/ubuntu/macroMS")
from GUICanvases.microMSModel import MicroMSModel
import cv2 as cv
from scipy.interpolate import griddata
 
inputf=sys.argv[1]
outputpath=sys.argv[2]
_minSize=int(sys.argv[3])
_maxSize=int(sys.argv[4])
_minCircularity=float(sys.argv[5])
_colorChannel=int(sys.argv[6])
_threshold=int(sys.argv[7])
_image_threshold=int(sys.argv[8])
_refIMG=sys.argv[9]
_threshold_color=int(sys.argv[10])
if _refIMG=='1':
    inputf=inputf.replace('input.tif','input_reference.tif')
     
    
if _image_threshold!=0:
    if _threshold_color<1:
        img = cv.imread(inputf,0)
    else:
        img = cv.imread(inputf,1)[:,:,[0,2,1,0][int(_threshold_color)]]# RGB-> BGR
    if _image_threshold>0:
        ret,convertedimg = cv.threshold(img,int(_image_threshold),255,cv.THRESH_BINARY)
    if _image_threshold<0:
        ret,convertedimg = cv.threshold(img,int(-_image_threshold),255,cv.THRESH_BINARY_INV)

    path, filename = os.path.split(inputf)
    filename = os.path.splitext(filename)[0]
    newfilename = 'thresholded_%s.tif' % filename
    inputf = os.path.join(path, newfilename)
    cv.imwrite(inputf,convertedimg)
micromm=MicroMSModel()
micromm.setupMicroMS(inputf)
blobs=micromm.runGlobalBlobFind(minSize=_minSize,maxSize=_maxSize,minCircularity=_minCircularity,colorChannel=_colorChannel,threshold=_threshold)
blobs=[q.split('\t') for q in blobs]
blobs=[[str(float(q[0])+0.5),str(float(q[1])+0.5),q[2],q[2],q[3]]+['0','B','0'] for q in blobs]


     
o='end'.join(['and'.join(q) for q in blobs])

out=open(outputpath+'/output.txt','w')
out.write(o)
out.close()

 
 
