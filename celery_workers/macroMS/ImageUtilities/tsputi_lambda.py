import requests
  
import base64,sys
import urllib.parse

def TSPRoute(inlist, ID):
    url = ' XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    myobj = {'blobs':'\t'.join([str(blob[0])+':'+str(blob[1])  for blob in inlist]) ,
             'ID':ID 
            }
    output = requests.post(url, data = myobj, timeout = 200 )
    print(output.text,file=sys.stderr)   
    try:
        soln=[int(q) for q in output.text.split(',')]
        return soln
    
    except:
        42
