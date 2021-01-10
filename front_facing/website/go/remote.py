from celery import Celery

app = Celery('tasks', backend='amqp',
broker='amqp://worker1:7684@172.31.36.167/macroMS_host')
@app.task
def add(x, y):
    print (x+y)
    return x + y

