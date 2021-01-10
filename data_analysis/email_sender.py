import smtplib  ,os
import email.utils
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
  
def Email_send(RECIPIENT,addr,switch): 
    SENDER = 'macroms.server@gmail.com'  
    SENDERNAME = 'macroMS'
    x=open('email_credentials.csv')
    info=x.readlines()[1].split(',')
    x.close()
    USERNAME_SMTP = info[1] 
    PASSWORD_SMTP = info[2]
     
    HOST = "email-smtp.us-east-1.amazonaws.com"
    PORT = 587 
    SUBJECT = '[macroMS data report] ' 
    if switch==True:
        current_entry,original_img=addr.split('========splitter=========')
        fname, file_extension = os.path.splitext(original_img)

        BODY_TEXT = ('Data link: XXXXXXXXXXXXXXXXXXXXXX'+current_entry+'/'+fname+'.xlsx\n\nImage link: XXXXXXXXXXXXXXXXXXXXXXXXX'+current_entry+'\n\nData links expire in 3 days')
        SUBJECT+='input image: '+original_img
    if switch==False:
        BODY_TEXT = (addr)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = SUBJECT
    msg['From'] = email.utils.formataddr((SENDERNAME, SENDER))
    msg['To'] = RECIPIENT 
    part1 = MIMEText(BODY_TEXT, 'plain')  
    msg.attach(part1)  
    
    try:  
        server = smtplib.SMTP(HOST, PORT)
        server.ehlo()
        server.starttls() 
        server.ehlo()
        server.login(USERNAME_SMTP, PASSWORD_SMTP)
        server.sendmail(SENDER, RECIPIENT, msg.as_string())
        server.close() 
    except Exception as e:
        print ("Error: ", e)
    else:
        print ("Email sent!")
