from celery import Celery
import os,sys
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

app = Celery('celery_worker', backend='rpc://', broker='pyamqp://')
@app.task
def run_cmd(cmd):
    output=os.popen('sudo -u www-data '+cmd).read()
    print('sudo -u www-data '+cmd)
    print(output)
    return True
