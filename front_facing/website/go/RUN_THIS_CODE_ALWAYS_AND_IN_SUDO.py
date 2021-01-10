import os, time

i=0
while True:
    os.system('find /home/ubuntu/efs/* -mmin +1440  -exec  rm -rf {} \; ')
    if i%24==0:
        os.system('sudo certbot renew')
    time.sleep(3600)
    i+=1
