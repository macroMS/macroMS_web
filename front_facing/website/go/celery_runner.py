import sys,time
#sys.path.append("/home/ubuntu/website/go/celery")
from celery_worker import run_cmd

cmd=sys.argv[1] 
Q='TRUE' in sys.argv[2]

results=run_cmd.apply_async(args=[cmd], queue=['celery','feature_recognition'][Q])

for q in range(600):
    if results.ready()==True:
        results.get()
        break
    time.sleep(.5)
