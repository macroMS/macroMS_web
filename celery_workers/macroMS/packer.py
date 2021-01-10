import xml.etree.ElementTree as ET
import copy,math
import sys    
sys.path.append("/home/ubuntu/macroMS")
from GUICanvases.microMSModel import MicroMSModel
inputf=sys.argv[1] 
offset=sys.argv[2]  
 
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


outputf=inputf.replace('submitted_entries_for_packing.txt','output_pack.txt')
blobf=inputf.replace('submitted_entries_for_packing.txt','blobs.txt')
blobf2=inputf.replace('submitted_entries_for_packing.txt','packed_blobs.txt')

F=open(inputf)
blobs= F.readline().replace('\n','').split(',')
blobs=    [[float(qq) for qq in q.split('and')[:3]] for q in blobs]
blobs=[[q[0]+q[2]/2,q[1]+q[2]/2,q[2]/2] for q in blobs]
F.close()

def blobfile_maker(blobs,blobf):
    Blobs=[[str(qq) for qq in q+[1]] for q in blobs]
    content='\n'.join(['\t'.join(q) for q in Blobs])
    blobff=open(blobf,'w') 
    blobff.write(header+content)
    blobff.close()

blobfile_maker(blobs,blobf)
micromm=MicroMSModel()
micromm.loadBlobFinding(blobf)
micromm.circularPackBlobs( 1, 4, int(offset))
micromm.savePackedBlobs(blobf2)
blobs= [q.replace('\n','').replace('\r','').split('\t') for q in open(blobf2).readlines()[10:] ]
blobs=[[q[0],q[1],q[2],q[2],str(1),str(0),'B',q[-1]] for q in blobs]

blobs='end'.join(['and'.join(q) for q in blobs])

out=open(outputf,'w')
out.write(blobs)
out.close()

