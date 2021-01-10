import sys,time
sys.path.append("/home/ubuntu/website/go/celery")
from celery_worker import run_cmd

cmd=sys.argv[1] 
 
results=run_cmd.apply_async(args=['ls'],queue='A')

for q in range(600):
    if results.ready()==True:
        results.get()
        break
    time.sleep(.5)
