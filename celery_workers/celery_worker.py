
from celery import Celery

import os,sys

from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

app = Celery('XXXXXX', backend='XXXX',broker='XXXXXXX://XXXXXXXXXXXXXXXXXXXXXXXXX')


@app.task

def run_cmd(cmd):

    output=os.popen(cmd).read()

    print(cmd)

    print(output)

    return True
