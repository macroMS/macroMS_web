import xml.etree.ElementTree as ET
import copy,math
import sys
sys.path.append("/home/ubuntu/macroMS")
from GUICanvases.microMSModel import MicroMSModel
inputf=sys.argv[1]
ID=sys.argv[2]
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
inputfn='submitted_entries_for_distance_measurements.txt'

outputf=inputf.replace(inputfn,'output_distance.txt')
blobf=inputf.replace(inputfn,'blobs.txt')
blobf2=inputf.replace(inputfn,'blobs2.txt')


F=open(inputf)


blobs_initial= [[float(qq) for qq in  q.split('and')[:3]]+q.split('and')[3:] for q in F.readline().replace('\n','').split('+')]
blobs=[[q[0]+q[2]/2,q[1]+q[2]/2,q[2]/2]+[q[4]] for q in blobs_initial]
F.close()

def blobfile_maker(blobs,blobf):
    Blobs=[[str(qq) for qq in q] for q in blobs]
    content='\n'.join(['\t'.join(q) for q in Blobs])
    blobff=open(blobf,'w')
    blobff.write(header+content)
    blobff.close()

blobfile_maker(blobs,blobf)
micromm=MicroMSModel()
micromm.loadBlobFinding(blobf)
distances=micromm.distanceFilter(None,ID)
#micromm.saveCurrentBlobFinding(blobf2,False)
#blobs= [q.replace('\n','').replace('\r','').split('\t') for q in open(blobf2).readlines()[10:] ]
#blobs=[[q[0],q[1],q[2],q[2],q[3],str(distances[i]),'B',blobs_initial[i][-1]] for i, q in enumerate(blobs)]

blobs=[q[:5]+[str(distances[i])]+q[6:] for i,q in enumerate(blobs_initial)]

blobs='end'.join(['and'.join([str(qq) for qq in q]) for q in blobs])

out=open(outputf,'w')
out.write(blobs)
out.close()

