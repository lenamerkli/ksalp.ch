from os import environ
import gunicorn


environ['SMTP_SERVER'] = ''
environ['SMTP_PORT'] = ''
environ['SMTP_ADDRESS'] = ''
environ['SMTP_PASSWORD'] = ''
environ['IMPRINT_NAME'] = ''
environ['IMPRINT_ADDRESS'] = ''
environ['IMPRINT_CITY'] = ''
environ['IMPRINT_MAIL'] = ''
environ['HASH_PEPPER_1'] = ''
environ['HASH_PEPPER_2'] = ''
environ['HASH_ITERATIONS'] = ''
environ['KSALP_ADMINS'] = ''

gunicorn.SERVER = 'nginx/gunicorn (ksalp.ch)'
