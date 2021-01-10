
import matplotlib as mpl

class blob(object):
    """
    Representation of a target point
    """
    def __init__(self, x = float(0), y = float(0), 
                  radius = float(8), 
                 circularity = float(1), group = None):#radius = float(GUIConstants.DEFAULT_BLOB_RADIUS), 
        '''
        Initialize a new blob with the specified position, shape and group
        x: x coordinate, default 0.0
        y: y coordinate, default 0.0
        radius: effective radius of the blob, default to value specified in GUIConstants
        circularity: 0 < circ < 1, default value is 1 (perfect circle)
        '''
        self.X = x
        self.Y = y
        self.radius = float(radius)
        #keep circularity in bounds
        self.circularity = 1 if circularity > 1 else \
            (0 if circularity < 0 else circularity)
        self.group = group

    @staticmethod
    def getXYList(blobs):
        '''
        Method to convert a list of blobs to their x,y coordinates
        blobs: list of blobs
        returns a list of (x,y) tuples of each blob in order
        '''
        if blobs is None:
            return None
        return list(map(lambda b: (b.X, b.Y), blobs))

    @staticmethod
    def blobFromSplitString(instrings):
        '''
        Tries to parse all information from a split string to make a new blob
        instrings: list of strings, produced from spliting a blob.toString()
        returns a new blob with the indicated x,y,r and circularity
        '''
        result = blob()

        if instrings is None:
            return result
        
        if (len(instrings) == 3 or len(instrings) == 4):
            result.X = float(instrings[0])
            result.Y = float(instrings[1])
            result.radius = float(instrings[2])
        if len(instrings) == 4:
            result.circularity = float(instrings[3])
            
        return result  

    def toString(self):
        '''
        Generates a tab delinated string with the x, y, radius and circularity of the blob
        '''
        return "{0:.3f}\t{1:.3f}\t{2:.3f}\t{3:.3f}".format(self.X, self.Y, 
                                                           self.radius, self.circularity)
    def toString2(self):
        '''
        Generates a tab delinated string with the x, y, radius and circularity of the blob
        '''
        return "{0:.3f}\t{1:.3f}\t{2:.3f}\t{3:.3f}".format(self.X, self.Y,
                                                           self.radius, self.circularity)+'\t'+str(self.group)