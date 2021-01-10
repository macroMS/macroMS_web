import json
import requests
from scipy.spatial.distance import pdist
import numpy as np
import time
import random
import base64
from urllib.parse import urlparse, parse_qs

## Lambda setting:
 
##Memory (MB) 1024

##Timeout 10min 3sec

## Runtime Python 3.6

## API Gateway used to invoke the function

def lambda_handler(event, context):
    subblocks = None
    overlap = 250
    line=parse_qs(base64.b64decode(event['body']).decode('ascii'))
    blobs=[[float(qq) for qq in q.split(':')] for q in line['blobs'][0].split('\t')] 
    print(len(blobs))
    ID=line['ID'][0]
    blobs_X=[q[0] for q in blobs]
    blobs_Y=[q[1] for q in blobs]        
    #initialize result
    result = [float("inf")] * len(blobs)
    #determine subblocks size
    if subblocks is None:
        subblocks = int(np.ceil(np.sqrt(len(blobs)/100)))
        subblocks = min(subblocks, 5)

    subLocs = _groupBlobs(overlap, subblocks,blobs)

    #for each sub region list
    for i in range(subblocks+1):
        for j in range(subblocks+1):
            #number of points
            n = len(subLocs[i][j])
            #initialize temporary list of points
            locs = np.zeros((n,2))
            #add points into locs
            for ii,v in enumerate(subLocs[i][j]):
                locs[ii,0] = blobs_X[v]
                locs[ii,1] = blobs_Y[v]
            #calculate distances
            dists = _minDists(locs)
            #recorde minimum of the reported distance and previous value
            for k, d in enumerate(dists):
                result[subLocs[i][j][k]] = min(result[subLocs[i][j][k]], d)
        
    temp = np.array(result)
    maxVal = max(temp[temp != float("inf")])
    maxVal = max(maxVal, overlap)
    for i, r in enumerate(result):
        if r == float("inf"):
            result[i] = maxVal 
    url = 'XXXXXXXXXXXXXXXX'
    myobj = {'distances':'-'.join([str(q) for q in result]) ,
             'ID': str(ID)
            }
    output = requests.post(url, data = myobj )
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    
    } 
def _minDists(locs):
    '''
    A helper function to calculate the closest neighbor of each blob
    returns a list of floats with result[i] indicating there exists another neighbor
        that distance away.
    locs: an np array of the x,y coordinates
    '''
    #get number of points
    n = len(locs)
    #lambda function to convert index in square and row form
    q = lambda i,j,n: int(n*j - j*(j+1)/2+i-1-j)
    #initialize result
    result = [float("inf")] * n
    #calculate euclidean distance between each point
    dists = pdist(locs)
    #for each x,y pair
    for i in range(1,n):
        for j in range(i):
            #record the minimum of the current distance an the previous value
            result[i] = min(result[i], dists[q(i,j,n)])
            result[j] = min(result[j], dists[q(i,j,n)])
    return result

def _groupBlobs(overlap, subblocks,blobs):
    '''
    A helper function for grouping blobs into subregions defined by the number of subblocks
    return a 2d list of indices split by the blob x and y coordinates
    overlap: amount of overlap for adding duplicate blobs
    subblocks: number of subdivisions in x and y
    '''
    #find min and max limits of x and y
    blobs_X=[q[0] for q in blobs]
    blobs_Y=[q[1] for q in blobs]
    lowX = min(blobs_X)
    highX = max(blobs_X)
    lowY = min(blobs_Y)
    highY = max(blobs_Y)
    #find subblock size of x and y
    subX =  (highX - lowX)/ subblocks
    subY = (highY - lowY)/subblocks
    #initialize a 2d array of empty lists to hold each point
    result = [[[] for x in range(subblocks+1)] for y in range(subblocks+1)]
      
    #place indices of points into subLocs list
    for i,v in enumerate(blobs):
        #get divisor and remainder
        (xd, xm) = (0,0) if subX == 0 else divmod(blobs_X[i]-lowX, subX)
        (yd, ym) = (0,0) if subY == 0 else divmod(blobs_Y[i]-lowY, subY)
        xd, yd = int(xd), int(yd)
        #put into 'normal block'
        result[xd][yd].append(i)
        #place into overlap region
        #in the top left corner
        if (xm <=2*overlap and ym <= 2*overlap) and (xd-1 >=0 and yd -1 >=0):
            result[xd-1][yd-1].append(i) 
        #in the left margin
        if xm <= 2*overlap and xd-1 >= 0:
            result[xd-1][yd].append(i)
        #in the top margin
        if ym <= 2*overlap and yd -1 >= 0:
            result[xd][yd-1].append(i)
    return result

