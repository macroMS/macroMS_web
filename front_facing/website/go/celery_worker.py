from celery import Celery

import os,sys

from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

app = Celery('tasks', backend='amqp',broker='amqp://worker1:7684@172.31.19.15/macroMS_host')


@app.task

def run_cmd(cmd):

    output=os.popen(cmd).read()

    print(cmd)

    print(output)

    return True
