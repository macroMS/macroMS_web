import os,sys
import copy,math,cv2
import numpy as np
from scipy.ndimage import uniform_filter
######## requires the fiducial number to be 4!!! 

inputdir=sys.argv[1]
outputdir=sys.argv[2]
RowN=int(sys.argv[3])
ColN=int(sys.argv[4])
Array_register_mode=sys.argv[5]
imagingtype_switch=sys.argv[6]

F=open(inputdir)
Cornerblobs= F.readline().replace('\n','').split(',')
cornerblobs=[q.split('and') for q in Cornerblobs]
cornerblobs=[[float(q[0])+float(q[2])/2,float(q[1])+float(q[2])/2] for q in cornerblobs]
 

#################### Get corner fiducial blobs #######################
sortedbyHeight=sorted(cornerblobs, key=lambda a: a[1])
top1,top2=sortedbyHeight[2:]
top_left,top_right=sorted([top1,top2], key=lambda a: a[0])
bottom1,bottom2=sortedbyHeight[:2]
bottom_left,bottom_right=sorted([bottom1,bottom2], key=lambda a: a[0])

################### Transform blob array from image into perfect square that is not tilted ####################################

new_width=math.sqrt((bottom_right[0]-bottom_left[0])**2+(bottom_right[1]-bottom_left[1])**2)
new_height=new_width 

points1= np.float32([bottom_left,bottom_right,top_left,top_right])               ##### The location of 4 corner blob is crucial. This step is possible because we are using distortion target that has precise positions of spots
points2= np.float32([bottom_left,[bottom_left[0]+new_width,bottom_left[1]],[bottom_left[0],bottom_left[1]+new_height],[bottom_left[0]+new_width,bottom_left[1]+new_height]])

################# Create the artificial blobs in perfect array, to compare against  #############################################     

ideal_blobs=[[[ii+1,i+1] for ii in range(ColN)] for i in range(RowN)]
points3= np.float32([ideal_blobs[0][0],ideal_blobs[0][-1],ideal_blobs[-1][0],ideal_blobs[-1][-1]])
if imagingtype_switch=='scanner':
     transform_matrx = cv2.getPerspectiveTransform(points3,points2) #### use square
else:
     transform_matrx = cv2.getPerspectiveTransform(points3,points1) #### use the corner of the original matrix

ideal_blobs=[[np.dot(transform_matrx,np.array([qq[0],qq[1],1])) for qq in q] for q in ideal_blobs]   
ideal_blobs=[[[qq[0]/qq[2],qq[1]/qq[2]] for qq in q] for q in ideal_blobs] 
ideal_blobs_x=np.matrix([[qq[0] for qq in q] for q in ideal_blobs]) 
ideal_blobs_y=np.matrix([[qq[1] for qq in q] for q in ideal_blobs]) 

if Array_register_mode=='Addition':
    graphout=open(os.path.dirname(outputdir)+'/array_register_output.txt','w')
    for rowN,q in enumerate(ideal_blobs):
        line=[]
        for colN,qq in enumerate(q):
            blob=[str(qq[0]-10/2),str(qq[1]-10/2),'10','10','1','0','B',str(rowN+1)+'-'+str(colN+1)]
            line.append('and'.join(blob))
        graphout.write('\t'.join(line)+'\n')
    graphout.write('=')
    graphout.write('null')
    graphout.write('=')
    graphout.write('null')
    graphout.close()
    F.close()
    sys.exit()

################ points2 are corner blobs for the perfect square

Blobs= F.readline().replace('\n','').split(',')
blobs=[q.split('and') for q in Blobs]
blobs=[[float(q[0])+float(q[2])/2,float(q[1])+float(q[2])/2] for q in blobs] 
F.close()
    
transform_matrx = cv2.getPerspectiveTransform(points1, points2)
all_blobs=blobs+cornerblobs
All_blobs=Blobs+Cornerblobs

transformed_coords_arrays=[[np.dot(transform_matrx,np.array([q[0],q[1],1])),i] for i,q in enumerate(all_blobs)] ### adding index for finding column number and row number in the array
transformed_coords_arrays=[[q[0][0]/q[0][2],q[0][1]/q[0][2],q[1]] for q in transformed_coords_arrays]
################ Get the row and column information for each blob within the squared array ########################################################


transformed_coords_arrays=sorted(transformed_coords_arrays, key=lambda a: a[1])  
 
sorted_transformed_arrays=[]
for i in range(RowN):
     row=transformed_coords_arrays[i*ColN:(i+1)*ColN]
     sorted_row=sorted(row, key=lambda a: a[0])
     sorted_transformed_arrays.append(sorted_row)


################# Get the difference between perfect array and the measured array to get the correction factor #####################
original_array_x=[[all_blobs[sorted_transformed_arrays[ii][i][2]][0] for i,qq in enumerate(q)] for ii,q in enumerate(ideal_blobs)]
original_array_y=[[all_blobs[sorted_transformed_arrays[ii][i][2]][1] for i,qq in enumerate(q)] for ii,q in enumerate(ideal_blobs)]
diff_x_matrix=np.matrix(ideal_blobs_x)-np.matrix(original_array_x)
diff_y_matrix=np.matrix(ideal_blobs_y)-np.matrix(original_array_y)

if Array_register_mode=='False':
    diff_x_matrix=uniform_filter(diff_x_matrix, size=3,  mode='reflect')
    diff_y_matrix=uniform_filter(diff_y_matrix, size=3,  mode='reflect')

if Array_register_mode=='True':
    graphout=open(os.path.dirname(outputdir)+'/array_register_output.txt','w')
    for rowN,q in enumerate(sorted_transformed_arrays):
        line=[]
        for colN,qq in enumerate(q):
            blobn=All_blobs[qq[2]].split('and')
            blobn[-1]=str(rowN+1)+'-'+str(colN+1)
            line.append('and'.join(blobn))
        graphout.write('\t'.join(line)+'\n')
    graphout.write('=')
    [graphout.write('\t'.join([str(q) for q in qq])+'\n') for qq in diff_x_matrix.tolist()]
    graphout.write('=')
    [graphout.write('\t'.join([str(q) for q in qq])+'\n') for qq in diff_y_matrix.tolist()]
    graphout.close()
    sys.exit()
             
            
 
graphout=open(os.path.dirname(outputdir)+'/distortion_graph.txt','w')
[graphout.write('\t'.join([str(q) for q in qq])+'\n') for qq in diff_x_matrix.tolist()]
graphout.write('=')
[graphout.write('\t'.join([str(q) for q in qq])+'\n') for qq in diff_y_matrix.tolist()]
graphout.close()
 
 
out=open(outputdir,'w')   
out_matrix=[[out.write(str(original_array_x[ii][i])+'\t'+str(original_array_y[ii][i])+'\t'+str(diff_x_matrix.tolist()[ii][i])+'\t'+str(q)+'\n') for i,q in enumerate(qq)] for ii,qq in enumerate(diff_y_matrix.tolist())]     
out.close()

corner_out=open(os.path.dirname(outputdir)+'/coner_points','w')
[corner_out.write('\t'.join([str(q[0]),str(q[1])])+'\n') for q in points1.tolist()]
corner_out.close()
