import requests,time
  
import base64,sys
import urllib.parse
import math,os
def TSPRoute(inlist, ID,csrf):
    datapath='/home/ubuntu/efs/'
    chunk_size=1000
    blobn=float(len(inlist))
#   if blobn>10000:
#        chunk_size=int(blobn/chunk_size*chunk_size+20)
    chunks_n=math.ceil(blobn/chunk_size)
    actual_chunk_size=int(blobn)/chunks_n
    divided_inlist=[]
    for ii in range(chunks_n):
        chunk=[q for i,q in enumerate(inlist) if (0+ii)*actual_chunk_size<=i<(1+ii)*actual_chunk_size]
        url = ' XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
        myobj = {'blobs':'\t'.join([str(blo[0])+':'+str(blo[1])  for blo in chunk]) ,
             'ID':ID+'-'+str(ii+1),
             'csrf':csrf
            }
        try:
            output = requests.post(url, data = myobj, timeout = 1)
        except Exception as e:
            if str(e).count('Read timed out.')==1:
                continue
            else:
                3
    outputfn=[ID+'-'+str(q+1)+'.txt' for q in range(chunks_n)]
    for q in range(150):
        time.sleep(2)
        fs=os.listdir(datapath+ID.split('-')[0])
        fs=[q for q in fs if q.count(ID+'-')==1]
        x=set(outputfn)-set(fs)
        if len(x)==0:
            fs=sorted(fs, key=lambda fn: int(fn.split('-')[1].split('.')[0]))
            entries=[]
            indice=0
            for fn in fs:
                List=[int(q) for q in open(datapath+ID.split('-')[0]+'/'+fn).readline().split('-')]
                List2=[q+indice for q in List]
                entries.extend(List2)
                os.remove(datapath+ID.split('-')[0]+'/'+fn)
                indice+=max(List)+1
            test=[str(q) for q in entries]
            X=len(set([str(q) for q in range(len(inlist ) ) ])-set(test))
            Y=len(set(test)-set([str(q) for q in range(len(inlist ) ) ]))
            if len(set(entries))==len(inlist) and X==Y==0:
                return entries
            else:
                continue
                
            


        


        
