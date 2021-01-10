import json
import base64
from urllib.parse import urlparse, parse_qs
import boto3
 
## Lambda setting:
 
##Memory (MB) 128

##Timeout 0min 10sec

## Runtime Python 3.8

## API Gateway used to invoke the function 
 
def lambda_handler(event, context):
    
    filename=event['Records'][0]['s3']['object']['key'].split('_')[0]
    ec2 = boto3.resource('ec2') ## add EC2_describe policy to user/role
    instances = ec2.instances.filter(Filters=[{'Name': 'instance-state-name', 'Values': ['pending','running','shutting-down']}])
    running_instances=[q.id for q in instances]
    if len(running_instances)>40:
        sqs = boto3.resource('sqs')
        queue = sqs.get_queue_by_name(QueueName='XXXXXXXXXXXXXXXXXX.fifo')
        response = queue.send_message(MessageGroupId='1',MessageBody=filename)
        return {'statusCode': 200,'body': json.dumps('Hello from Lambda!')}


    cmds= "#!/bin/bash \n cd /home/ubuntu \n python main_code.py "+filename +" > asd.txt "
    ec2.create_instances(
     ImageId='XXXXXXXXXXXXXXXXXXXXXXX',
     MinCount=1, 
     MaxCount=1,
     InstanceType='t2.nano',
     InstanceInitiatedShutdownBehavior='terminate',
     CreditSpecification = {'CpuCredits': 'unlimited'},
     UserData=cmds,
     IamInstanceProfile={'Name': 'test'}
     )

    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
