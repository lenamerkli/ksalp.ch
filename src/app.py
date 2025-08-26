#!/usr/bin/env python3

########################################################################################################################
# IMPORTS
########################################################################################################################


from base64 import urlsafe_b64encode, urlsafe_b64decode
from datetime import timedelta, datetime
from dotenv import load_dotenv
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Flask, g, session, request, Response, send_from_directory, make_response, render_template
from hashlib import pbkdf2_hmac, sha3_512
from ipaddress import ip_address, IPv4Address, IPv6Address
from json import loads, dumps
from logging import FileHandler as LogFileHandler
from logging import INFO as LOG_INFO, exception as log_exception
from logging import basicConfig as log_basicConfig, getLogger as GetLogger, Formatter as LogFormatter
from os import urandom, environ, listdir
from os.path import join, exists, dirname, getsize
from pathlib import Path
from random import uniform as rand_uniform
from requests import request as requests_send
from smtplib import SMTP
from sqlite3 import connect as sqlite_connect, Connection as SQLite_Connection
from ssl import create_default_context
from time import sleep
from urllib.parse import urlparse
from werkzeug.utils import secure_filename
import typing as t
import qrbill

from resources import *

########################################################################################################################
# GENERAL SETUP
########################################################################################################################

load_dotenv()

DEVELOPMENT = environ.get('ENVIRONMENT', '') == 'dev'
app = Flask(__name__)

if not exists(join(app.root_path, 'resources', 'key.bin')):
    with open(join(app.root_path, 'resources', 'key.bin'), 'wb') as _f:
        _f.write(urandom(64))
with open(join(app.root_path, 'resources', 'key.bin'), 'rb') as _f:
    _secret_key = _f.read()
app.secret_key = _secret_key

if DEVELOPMENT:
    app.config.update(
        SESSION_COOKIE_NAME='session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=False,
        SESSION_COOKIE_SAMESITE='Strict',
        PERMANENT_SESSION_LIFETIME=timedelta(days=128),
    )
else:
    app.config.update(
        SESSION_COOKIE_NAME='__Host-session',
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SECURE=True,
        SESSION_COOKIE_SAMESITE='Strict',
        PERMANENT_SESSION_LIFETIME=timedelta(days=128),
    )


########################################################################################################################
# LOGGING
########################################################################################################################


def setup_logger(name, file):
    """
    Creates a new logging instance
    :param name: the name
    :param file: path to the file to which the contents will be written
    :return:
    """
    logger = GetLogger(name)
    formatter = LogFormatter('%(asctime)s\t%(message)s', datefmt='%Y-%m-%d_%H-%M-%S')
    file_handler = LogFileHandler(file, mode='a')
    file_handler.setFormatter(formatter)
    logger.setLevel(LOG_INFO)
    logger.addHandler(file_handler)
    logger.propagate = False


log_basicConfig(filename='main.log', format='%(asctime)s\t%(message)s', datefmt=DATE_FORMAT, level=LOG_INFO)

setup_logger('access', join(app.root_path, 'logs', 'access.log'))
access_log = GetLogger('access')


########################################################################################################################
# DATABASE SETUP
########################################################################################################################


def get_db() -> SQLite_Connection:
    """
    Gets the database instance
    :return: a pointer to the database
    """
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite_connect('database.sqlite')
    return db


@app.teardown_appcontext
def close_connection(exception=None) -> None:  # noqa
    """
    destroys the database point
    :param exception: unused
    :return:
    """
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False) -> list | tuple:
    """
    Runs a SQL query
    :param query: the query as a SQL statement
    :param args: arguments to be inserted into the query
    :param one: if this function should only return one result
    :return: the data from the database
    """
    conn = get_db()
    cur = conn.execute(query, args)
    result = cur.fetchall()
    conn.commit()
    cur.close()
    return (result[0] if result else None) if one else result


def relative_path(path: str) -> str:
    return str(join(dirname(__file__), path))


with app.app_context():
    with open(relative_path('resources/create_database.sql'), 'r') as f:
        _create_db = f.read()
    _conn = get_db()
    _conn.executescript(_create_db)
    _conn.commit()
    _conn.close()


########################################################################################################################
# DATES
########################################################################################################################


def get_current_time() -> str:
    """
    Returns the current date and time in the following format: '%Y-%m-%d_%H-%M-%S'
    :return: current datetime
    """
    return datetime.now().strftime('%Y-%m-%d_%H-%M-%S')


########################################################################################################################
# RANDOM
########################################################################################################################


def rand_base64(digits: int) -> str:
    """
    Generates a new string of random base64 characters
    :param digits: the length of the string to be generated
    :return: a random string of base64 characters
    """
    while True:
        n = urlsafe_b64encode(urandom(digits)).decode()[:digits]
        result = query_db('SELECT * FROM used_ids WHERE id=?', (n,), True)
        if not result:
            query_db('INSERT INTO used_ids VALUES (?, ?)', (n, get_current_time()))
            return n


def rand_base16(digits: int) -> str:
    """
    Generates a new string of random base16 characters
    :param digits: the length of the string to be generated
    :return: a random string of base16 characters
    """
    while True:
        n = urandom(digits).hex()[:digits]
        result = query_db('SELECT * FROM used_ids WHERE id=?', (n,), True)
        if not result:
            query_db('INSERT INTO used_ids VALUES (?, ?)', (n, get_current_time()))
            return n


def rand_salt() -> str:
    """
    Generates a random salt
    :return: a random salt
    """
    return urlsafe_b64encode(urandom(32)).decode()


########################################################################################################################
# E-MAIL
#######################################################################################################################


def send_mail(address: str, subject: str, message_plain: str, message: str) -> t.Union[Exception, None]:
    """
    Sends an e-mail to the specified address
    :param address: e-mail address
    :param subject: subject line
    :param message_plain: plain text message
    :param message: html message
    :return: None if successful, Exception if not
    """
    smtp_server = environ['SMTP_SERVER']
    smtp_port = int(environ['SMTP_PORT'])
    sender_email = environ['SMTP_ADDRESS']
    context = create_default_context()
    server = None
    m = MIMEMultipart('alternative')
    m['Subject'] = subject
    m['From'] = sender_email
    m['To'] = address
    part1 = MIMEText(message_plain, 'plain')
    part2 = MIMEText(message, 'html')
    m.attach(part1)
    m.attach(part2)
    try:
        server = SMTP(smtp_server, smtp_port)
        server.starttls(context=context)
        server.login(sender_email, environ['SMTP_PASSWORD'])
        server.sendmail(sender_email, address, m.as_string())
    except Exception as error:
        log_exception('An error occurred while sending e-mail')
        return error
    finally:
        server.quit()
    return None


########################################################################################################################
# HASHING
########################################################################################################################


def hash_password(password: str, salt: bytes):
    return pbkdf2_hmac(
        hash_name='sha3_512',
        password=urlsafe_b64decode(environ['HASH_PEPPER_1']) + password.encode() + urlsafe_b64decode(
            environ['HASH_PEPPER_2']),
        salt=salt,
        iterations=int(environ['HASH_ITERATIONS']),
    )


def hash_ip(ip):
    try:
        ip_obj = ip_address(ip)
        if isinstance(ip_obj, IPv4Address):
            hashed = sha3_512(ip_obj.packed).digest()
        elif isinstance(ip_obj, IPv6Address):
            hashed = sha3_512(ip_obj.packed).digest()
        else:
            raise ValueError("Invalid IP address")
    except ValueError:
        raise ValueError("Invalid IP address")

    return urlsafe_b64encode(hashed).decode()


def extract_browser(agent):
    return f"{agent.platform}-{agent.browser}"


########################################################################################################################
# IMPORTING
########################################################################################################################


def import_learnset(file: str, seperator: str = '; ') -> list[dict]:
    file_type = 'text'
    data: list[dict] = []
    if file.startswith('{'):
        file_type = 'jsonl'
        data: list[dict] = [loads(i) for i in file.splitlines() if i.startswith('{') and i.endswith('}')]
    elif file.startswith('['):
        file_type = 'json'
        data: list[dict] = loads(file)
    output: list[dict] = []
    if file_type.startswith('json'):
        for element in data:
            accept = True
            keys = ['question', 'answer']
            if not all(i in element for i in keys):
                accept = False
            if not all(isinstance(element[i], str) for i in keys):
                accept = False
            if 'answers' in element:
                keys.append('answers')
                if not isinstance(element['answers'], list):
                    accept = False
                elif not all(isinstance(element['answers'][i], str) for i in range(len(element['answers']))):
                    accept = False
            if 'frequency' in element:
                keys.append('frequency')
                if isinstance(element['frequency'], int):
                    element['frequency'] = float(element['frequency'])
                elif not isinstance(element['frequency'], float):
                    accept = False
            if 'auto_check' in element:
                keys.append('auto_check')
                if not isinstance(element['auto_check'], int):
                    accept = False
            if accept:
                parsed_element = {k: element[k] for k in keys}
                output.append(parsed_element)
    elif file_type == 'text':
        for line in file.splitlines():
            if line.count(seperator) > 0:
                question = line.split(seperator)[0]
                answer_string = line.split(seperator, 1)[1]
                if answer_string.count(seperator) > 0:
                    answers = answer_string.split(seperator)
                    answer = answers[0]
                else:
                    answers = [answer_string]
                    answer = answer_string
                parsed_element = {'question': question, 'answer': answer, 'answers': answers,
                                  'frequency': 1.0, 'auto_check': 1}
                output.append(parsed_element)
    return output


########################################################################################################################
# SECURITY
########################################################################################################################


def is_signed_in():
    if 'account' in session:
        try:
            login = Login.load(session['account'])
        except Exception as error:
            log_exception('An error occurred while loading the account data' + 0 * str(error))
            return False
        if login.valid > datetime.now() and extract_browser(request.user_agent) == login.browser:
            return True
    return False


def scan_request():
    ip = request.access_route[-1]
    user_agent = request.user_agent.string
    path = repr(request.full_path)[1:-1]
    score = query_db('SELECT score, ip FROM ips WHERE ip = ?', (ip,), True)
    if not score:
        score = 2
        query_db('INSERT INTO ips VALUES (?, ?, ?)', (ip, 2, 'unknown'))
    else:
        score = score[0]
    before = score

    if before != score:
        query_db('UPDATE ips SET score = ? WHERE ip = ?', (score, ip))

    headers = dict(request.headers)
    headers_to_remove = []
    for key in headers:
        if key not in ['Host', 'Accept', 'Accept-Language', 'Accept-Encoding', 'Content-Type']:
            headers_to_remove.append(key)
    for key in headers_to_remove:
        try:
            del headers[key]
        except KeyError:
            pass
    headers = repr(str(headers))[1:-1]
    user_agent = repr(user_agent)[1:-1]
    content_length = request.content_length if request.content_length else 0

    if content_length > pow(2, 10 * 3) * 2:
        raise OverflowError('Content too large')

    # if 0 < content_length <= 1024:
    #     content = request.get_data()
    #     if isinstance(content, bytes):
    #         content = content.decode()
    # elif content_length > 1024:
    #     hash_obj = sha3_512()
    #     while True:
    #         chunk = request.stream.read(pow(2, 10 * 2))
    #         if not chunk:
    #             break
    #         hash_obj.update(chunk)
    #     content = f"sha3_512:{urlsafe_b64encode(hash_obj.digest()).decode()}"
    # else:
    #     content = ''
    #
    # passwords = []
    # if request.is_json:
    #     data = request.json
    #     for key in ['password', 'oldPassword', 'newPassword']:
    #         if key in data:
    #             if isinstance(data[key], str) and len(data[key]) > 4:
    #                 passwords.append(data[key])
    # for password in passwords:
    #     content = content.replace(password, '\\PASSWORD\\')

    access_log.info(f"{hash_ip(ip)}\t{score}\t{int(is_signed_in())}\t{request.method}\t{path}\t{user_agent}\t"
                    f"{headers}\t{content_length}\t\\UNAVAILABLE")
    return score


########################################################################################################################
# CLASSES
########################################################################################################################


class User:

    def __init__(self, id_: str = None, name: str = '', mail: str = '', salt: bytes = b'', hash_: bytes = b'',
                 newsletter: int = 0, created: datetime = None, theme: str = 'light', iframe: int = 0,
                 payment: datetime = None, payment_lite: datetime = None, banned: list = None,
                 search: str = 'Startpage', classes: list = None, grade: str = '-', favorites: list = None) -> None:
        self._id = ''
        self._name = ''
        self._mail = ''
        self._salt = ''
        self._hash = ''
        self._newsletter = 0
        self._created = ''
        self._theme = 'light'
        self._iframe = 0
        self._payment = ''
        self._payment_lite = ''
        self._banned = ''
        self._search = 'Startpage'
        self._classes = ''
        self._grade = ''
        self._favorites = ''
        if id_ is None:
            id_ = rand_base64(8)
        if created is None:
            created = datetime.now()
        if payment is None:
            payment = datetime.strptime('2000-01-01', '%Y-%m-%d')
        if payment_lite is None:
            payment_lite = datetime.strptime('2000-01-01', '%Y-%m-%d')
        if banned is None:
            banned = []
        if classes is None:
            classes = ['-']
        if favorites is None:
            favorites = [
                'https://schulnetz.lu.ch/ksalp | Schulnetz',
                'https://outlook.office.com/mail/ | @sluz Mail',
                'https://microsoft365.com/ | Microsoft 365',
                'https://ksalpenquai.lu.ch/ | Kantonsschule Alpenquai Luzern',
                'https://ksalpenquai.lu.ch/service/so | Schüler*innen-organisation (SO)',
                'https://duden.de/ | Duden',
                'https://mentor.duden.de/ | Duden Mentor',
                'https://deepl.com/translator | DeepL Übersetzer',
                'https://www.wolframalpha.com/ | WolframAlpha Rechner',
                'https://www.geo.lu.ch/map/basisplan | Karte Luzern',
                'https://openstreetmap.org | Karte International',
            ]
        self.id_ = id_
        self.name = name
        self.mail = mail
        self.salt = salt
        self.hash_ = hash_
        self.newsletter = newsletter
        self.created = created
        self.theme = theme
        self.iframe = iframe
        self.payment = payment
        self.payment_lite = payment_lite
        self.banned = banned
        self.search = search
        self.classes = classes
        self.grade = grade
        self.favorites = favorites

    def __str__(self) -> str:
        return f"User #{self._id}"

    def __dict__(self):
        return {
            'id_': self.id_,
            'name': self.name,
            'mail': self.mail,
            'salt': self.salt,
            'hash_': self.hash_,
            'newsletter': self.newsletter,
            'created': self.created,
            'theme': self.theme,
            'iframe': self.iframe,
            'payment': self.payment,
            'payment_lite': self.payment_lite,
            'banned': self.banned,
            'search': self.search,
            'classes': self.classes,
            'grade': self.grade,
            'favorites': self.favorites,
        }

    @property
    def json(self) -> dict:
        return {
            'id_': self.id_,
            'name': self.name,
            'mail': self.mail,
            'salt': urlsafe_b64encode(self.salt).decode(),
            'hash_': urlsafe_b64encode(self.hash_).decode(),
            'newsletter': self.newsletter,
            'created': self.created.isoformat(),
            'theme': self.theme,
            'iframe': self.iframe,
            'payment': self.payment,
            'payment_lite': self.payment_lite,
            'banned': self.banned,
            'search': self.search,
            'classes': self.classes,
            'grade': self.grade,
            'favorites': self.favorites,
        }

    def save(self) -> None:
        """
        Saves the user in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No user id')
        if not query_db('SELECT id FROM users WHERE id=?', (self._id,), True):
            query_db('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
                self._id,
                self._name,
                self._mail,
                self._salt,
                self._hash,
                self._newsletter,
                self._created,
                self._theme,
                self._iframe,
                self._payment,
                self._payment_lite,
                self._banned,
                self._search,
                self._classes,
                self._grade,
                self._favorites,
            ))
        else:
            query_db('UPDATE users SET name=?, mail=?, salt=?, hash=?, newsletter=?, created=?, theme=?, iframe=?, '
                     'payment=?, payment_lite=?, banned=?, search=?, class=?, grade=?, favorites=? WHERE id=?', (
                         self._name,
                         self._mail,
                         self._salt,
                         self._hash,
                         self._newsletter,
                         self._created,
                         self._theme,
                         self._iframe,
                         self._payment,
                         self._payment_lite,
                         self._banned,
                         self._search,
                         self._classes,
                         self._grade,
                         self._favorites,
                         self._id
                     ))

    @staticmethod
    def load(user_id):
        """
        loads a user from the database
        :return: a new user instance
        """
        result = query_db('SELECT * FROM users WHERE id=?', (user_id,), True)
        if not result:
            raise KeyError(f"No user with the id #{user_id} has been found")
        user = User(id_=result[0])
        user._name = result[1]
        user._mail = result[2]
        user._salt = result[3]
        user._hash = result[4]
        user._newsletter = result[5]
        user._created = result[6]
        user._theme = result[7]
        user._iframe = result[8]
        user._payment = result[9]
        user._payment_lite = result[10]
        user._banned = result[11]
        user._search = result[12]
        user._classes = result[13]
        user._grade = result[14]
        user._favorites = result[15]
        return user

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, v: str) -> None:
        self._name = v

    @property
    def mail(self) -> str:
        return self._mail

    @mail.setter
    def mail(self, v: str) -> None:
        self._mail = v

    @property
    def salt(self) -> bytes:
        return urlsafe_b64decode(self._salt)

    @salt.setter
    def salt(self, v: bytes) -> None:
        self._salt = urlsafe_b64encode(v).decode()

    @property
    def hash_(self) -> bytes:
        return urlsafe_b64decode(self._hash)

    @hash_.setter
    def hash_(self, v: bytes) -> None:
        self._hash = urlsafe_b64encode(v).decode()

    @property
    def newsletter(self) -> bool:
        return self._newsletter == 1

    @newsletter.setter
    def newsletter(self, v: bool) -> None:
        self._newsletter = int(v)

    @property
    def created(self) -> datetime:
        return datetime.strptime(self._created, '%Y-%m-%d_%H-%M-%S')

    @created.setter
    def created(self, v: datetime) -> None:
        self._created = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def theme(self) -> str:
        return self._theme

    @theme.setter
    def theme(self, v: str) -> None:
        if v not in THEMES.keys():
            raise ValueError(f"{v} is not a valid theme")
        self._theme = v

    @property
    def iframe(self) -> bool:
        return self._iframe == 1

    @iframe.setter
    def iframe(self, v: bool) -> None:
        self._iframe = int(v)

    @property
    def payment(self) -> datetime:
        return datetime.strptime(self._payment, '%Y-%m-%d')

    @payment.setter
    def payment(self, v: datetime) -> None:
        self._payment = v.strftime('%Y-%m-%d')

    @property
    def payment_lite(self) -> datetime:
        return datetime.strptime(self._payment_lite, '%Y-%m-%d')

    @payment_lite.setter
    def payment_lite(self, v: datetime) -> None:
        self._payment_lite = v.strftime('%Y-%m-%d')

    @property
    def banned(self) -> list:
        return self._banned.split(', ')

    @banned.setter
    def banned(self, v: list) -> None:
        self._banned = ', '.join(v)

    @property
    def search(self) -> str:
        return self._search

    @search.setter
    def search(self, v: str) -> None:
        if v not in SEARCH_ENGINES.keys():
            raise ValueError(f"{v} is not a valid search engine")
        self._search = v

    @property
    def classes(self) -> list:
        return self._classes.split(', ')

    @classes.setter
    def classes(self, v: list) -> None:
        for i in v:
            if ', ' in i:
                raise ValueError(f"A class may not contain ', '")
        self._classes = ', '.join(v)

    @property
    def grade(self) -> str:
        return self._grade

    @grade.setter
    def grade(self, v: str) -> None:
        if v not in GRADES:
            raise ValueError(f"{v} is not a valid grade")
        self._grade = v

    @property
    def favorites(self) -> list:
        return self._favorites.split('\n')

    @favorites.setter
    def favorites(self, v: list) -> None:
        self._favorites = '\n'.join(v)

    def is_banned(self, checks: list) -> bool:
        """
        Check if a user is banned
        :param checks: list of possible violations
        :return: boolean if user is banned
        """
        return any(i in self.banned for i in checks)

    def check_password(self, password) -> bool:
        """
        Check is the password is correct
        :param password:
        :return: boolean if password is correct
        """
        return hash_password(password, self.salt) == self.hash_

    def valid_payment(self) -> bool:
        """
        Check is the user has premium
        :return: boolean if the user has premium
        """
        return self.payment > datetime.now()

    def valid_payment_lite(self) -> bool:
        """
        Check if the user has premium lite
        :return: boolean if the user has premium lite
        """
        return self.payment_lite > datetime.now()


class Comment:

    def __init__(self, id_: str = None, content: str = '', author: str = '', subject: str = '',
                 posted: datetime = None) -> None:
        self._id = ''
        self._content = ''
        self._author = ''
        self._subject = ''
        self._posted = ''
        if id_ is None:
            id_ = rand_base64(11)
        if posted is None:
            posted = datetime.now()
        self.id_ = id_
        self.content = content
        self.author = author
        self.subject = subject
        self.posted = posted

    def __str__(self) -> str:
        return f"Comment #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'content': self.content,
            'author': self.author,
            'subject': self.subject,
            'posted': self.posted,
        }

    def save(self) -> None:
        """
        Saves the comment in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No comment id')
        if not query_db('SELECT * FROM comments WHERE id=?', (self._id,), True):
            query_db('INSERT INTO comments VALUES (?, ?, ?, ?, ?)', (
                self._id,
                self._content,
                self._author,
                self._subject,
                self._posted,
            ))
        else:
            query_db('UPDATE comments SET content=?, author=?, subject=?, posted=? WHERE id=?', (
                self._content,
                self._author,
                self._subject,
                self._posted,
                self._id,
            ))

    @staticmethod
    def load(comment_id):
        """
        loads a comment from the database
        :return: a new comment instance
        """
        result = query_db('SELECT * FROM comments WHERE id=?', (comment_id,), True)
        if not result:
            raise KeyError(f"No comment with the id #{comment_id} has been found")
        return Comment(*result)

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def content(self) -> str:
        return self._content

    @content.setter
    def content(self, v: str) -> None:
        self._content = v

    @property
    def author(self) -> str:
        return self._author

    @author.setter
    def author(self, v: str) -> None:
        self._author = v

    @property
    def subject(self) -> str:
        return self._subject

    @subject.setter
    def subject(self, v: str) -> None:
        self._subject = v

    @property
    def posted(self) -> datetime:
        return datetime.strptime(self._posted, '%Y-%m-%d_%H-%M-%S')

    @posted.setter
    def posted(self, v: datetime) -> None:
        self._posted = v.strftime('%Y-%m-%d_%H-%M-%S')


class Document:

    def __init__(self, id_: str = None, title: str = '', subject: str = '-', description: str = '', class_: str = '',
                 grade: str = '-', language: str = '-', owner: str = '', edited: datetime = None,
                 created: datetime = None,
                 extension: str = '', mimetype: str = '', size: int = 0) -> None:
        self._id = ''
        self._title = ''
        self._subject = ''
        self._description = ''
        self._class = ''
        self._grade = ''
        self._language = ''
        self._owner = ''
        self._edited = ''
        self._created = ''
        self._extension = ''
        self._mimetype = ''
        self._size = 0
        if id_ is None:
            id_ = rand_base64(8)
        if created is None:
            created = datetime.now()
        if edited is None:
            edited = datetime.now()
        self.id_ = id_
        self.title = title
        self.subject = subject
        self.description = description
        self.class_ = class_
        self.grade = grade
        self.language = language
        self.owner = owner
        self.edited = edited
        self.created = created
        self.extension = extension
        self.mimetype = mimetype
        self.size = size

    def __str__(self) -> str:
        return f"Document #{self._id}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'title': self.title,
            'subject': self.subject,
            'description': self.description,
            'class_': self.class_,
            'grade': self.grade,
            'language': self.language,
            'owner': self.owner,
            'edited': self.edited,
            'created': self.created,
            'extension': self.extension,
            'mimetype': self.mimetype,
            'size': self.size,
            'formated_size': self.format_size(use_1024=True),
            'owner_name': query_db('SELECT name FROM users WHERE id=?', (self.owner,), True)[0]
        }

    def save(self) -> None:
        """
        Saves the document in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No document id')
        if not query_db('SELECT id FROM documents WHERE id=?', (self._id,), True):
            query_db('INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
                self._id,
                self._title,
                self._subject,
                self._description,
                self._class,
                self._grade,
                self._language,
                self._owner,
                self._edited,
                self._created,
                self._extension,
                self._mimetype,
                self._size,
            ))
        else:
            query_db(
                'UPDATE documents SET title=?, subject=?, description=?, class=?, grade=?, language=?, owner=?, edited=?, '
                'created=?, extension=?, mimetype=?, size=? WHERE id=?', (
                    self._title,
                    self._subject,
                    self._description,
                    self._class,
                    self._grade,
                    self._language,
                    self._owner,
                    self._edited,
                    self._created,
                    self._extension,
                    self._mimetype,
                    self._size,
                    self._id,
                ))

    @staticmethod
    def load(document_id):
        """
        loads a document from the database
        :return: a new document instance
        """
        result = query_db('SELECT * FROM documents WHERE id=?', (document_id,), True)
        if not result:
            raise KeyError(f"No document with the id #{document_id} has been found")
        document = Document(id_=result[0])
        document._title = result[1]
        document._subject = result[2]
        document._description = result[3]
        document._class = result[4]
        document._grade = result[5]
        document._language = result[6]
        document._owner = result[7]
        document._edited = result[8]
        document._created = result[9]
        document._extension = result[10]
        document._mimetype = result[11]
        document._size = result[12]
        return document

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def title(self) -> str:
        return self._title

    @title.setter
    def title(self, v: str) -> None:
        self._title = v

    @property
    def subject(self) -> str:
        return self._subject

    @subject.setter
    def subject(self, v: str) -> None:
        self._subject = v

    @property
    def description(self) -> str:
        return self._description

    @description.setter
    def description(self, v: str) -> None:
        self._description = v

    @property
    def class_(self) -> str:
        return self._class

    @class_.setter
    def class_(self, v: str) -> None:
        self._class = v

    @property
    def grade(self) -> str:
        return self._grade

    @grade.setter
    def grade(self, v: str) -> None:
        if v not in GRADES:
            raise ValueError(f"{v} is not a valid grade")
        self._grade = v

    @property
    def language(self) -> str:
        return self._language

    @language.setter
    def language(self, v: str) -> None:
        if v not in LANGUAGES:
            raise ValueError(f"{v} is not a valid language")
        self._language = v

    @property
    def owner(self) -> str:
        return self._owner

    @owner.setter
    def owner(self, v: str) -> None:
        if not query_db('SELECT id FROM users WHERE id=?', (v,), True) and v != '':
            raise ValueError(f"No user with id #{v} exists")
        self._owner = v

    @property
    def edited(self) -> datetime:
        return datetime.strptime(self._edited, '%Y-%m-%d_%H-%M-%S')

    @edited.setter
    def edited(self, v: datetime) -> None:
        self._edited = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def created(self) -> datetime:
        return datetime.strptime(self._created, '%Y-%m-%d_%H-%M-%S')

    @created.setter
    def created(self, v: datetime) -> None:
        self._created = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def extension(self) -> str:
        return self._extension

    @extension.setter
    def extension(self, v: str) -> None:
        self._extension = v.lower()

    @property
    def mimetype(self) -> str:
        return self._mimetype

    @mimetype.setter
    def mimetype(self, v: str) -> None:
        self._mimetype = v

    @property
    def size(self) -> int:
        return self._size

    @size.setter
    def size(self, v: int) -> None:
        self._size = v

    def format_size(self, use_1024: bool = False) -> str:
        """
        Formats the file size in a user readable format
        :param use_1024: use 1024 steps instead of 1000
        :return: human-readable file size
        """
        units = ' KMGT'  # noqa
        if use_1024:
            n = 1024
        else:
            n = 1000
        for i, v in enumerate(units):
            x = self.size / pow(n, i)
            if (x < n) or (v == len(units) - 1):
                if i == 0:
                    return f"{x} Bytes"
                else:
                    return f"{x:3.1f} {v}{'i' if use_1024 else ''}B"
        return f"{self.size} Bytes"

    def get_owner(self) -> User:
        """
        Get the owner as a User class
        :return: instance of User
        """
        return User.load(self.owner)

    def filename(self, lower: bool = False):
        """
        Create a save filename from the title and extension
        :param lower: if it should be all lowercase
        :return: save filename
        """
        x = secure_filename(f"{self._title}.{self.extension}")
        if lower:
            x = x.lower()
        return x


class LearnSet:

    def __init__(self, id_: str = None, title: str = '', subject: str = '', description: str = '', class_: str = '',
                 grade: str = '-', language: str = '-', owner: str = '', edited: datetime = None,
                 created: datetime = None) -> None:
        self._id = ''
        self._title = ''
        self._subject = ''
        self._description = ''
        self._class = ''
        self._grade = ''
        self._language = ''
        self._owner = ''
        self._edited = ''
        self._created = ''
        if id_ is None:
            id_ = rand_base64(8)
        if created is None:
            created = datetime.now()
        if edited is None:
            edited = datetime.now()
        self.id_ = id_
        self.title = title
        self.subject = subject
        self.description = description
        self.class_ = class_
        self.grade = grade
        self.language = language
        self.owner = owner
        self.edited = edited
        self.created = created

    def __str__(self) -> str:
        return f"LearnSet #{self._id}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'title': self.title,
            'subject': self.subject,
            'description': self.description,
            'class_': self.class_,
            'grade': self.grade,
            'language': self.language,
            'owner': self.owner,
            'edited': self.edited,
            'created': self.created,
            'owner_name': query_db('SELECT name FROM users WHERE id=?', (self.owner,), True)[0],
            'size': query_db('SELECT COUNT(*) FROM learn_exercises WHERE set_id=?', (self.id_,), True)[0],
        }

    def save(self) -> None:
        """
        Saves the LearnSet in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No LearnSet id')
        if not query_db('SELECT id FROM learn_sets WHERE id=?', (self._id,), True):
            query_db('INSERT INTO learn_sets VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
                self._id,
                self._title,
                self._subject,
                self._description,
                self._class,
                self._grade,
                self._language,
                self._owner,
                self._edited,
                self._created,
            ))
        else:
            query_db('UPDATE learn_sets SET title=?, subject=?, description=?, class=?, grade=?, language=?, owner=?, '
                     'edited=?, created=? WHERE id=?', (
                         self._title,
                         self._subject,
                         self._description,
                         self._class,
                         self._grade,
                         self._language,
                         self._owner,
                         self._edited,
                         self._created,
                         self._id,
                     ))

    @staticmethod
    def load(learn_set_id):
        """
        loads a LearnSet from the database
        :return: a new LearnSet instance
        """
        result = query_db('SELECT * FROM learn_sets WHERE id=?', (learn_set_id,), True)
        if not result:
            raise KeyError(f"No LearnSet with the id #{learn_set_id} has been found")
        learnset = LearnSet(result[0])
        learnset._title = result[1]
        learnset._subject = result[2]
        learnset._description = result[3]
        learnset._class = result[4]
        learnset._grade = result[5]
        learnset._language = result[6]
        learnset._owner = result[7]
        learnset._edited = result[8]
        learnset._created = result[9]
        return learnset

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def title(self) -> str:
        return self._title

    @title.setter
    def title(self, v: str) -> None:
        self._title = v

    @property
    def subject(self) -> str:
        return self._subject

    @subject.setter
    def subject(self, v: str) -> None:
        self._subject = v

    @property
    def description(self) -> str:
        return self._description

    @description.setter
    def description(self, v: str) -> None:
        self._description = v

    @property
    def class_(self) -> str:
        return self._class

    @class_.setter
    def class_(self, v: str) -> None:
        self._class = v

    @property
    def grade(self) -> str:
        return self._grade

    @grade.setter
    def grade(self, v: str) -> None:
        if v not in GRADES:
            raise ValueError(f"{v} is not a valid grade")
        self._grade = v

    @property
    def language(self) -> str:
        return self._language

    @language.setter
    def language(self, v: str) -> None:
        if v not in LANGUAGES:
            raise ValueError(f"{v} is not a valid language")
        self._language = v

    @property
    def owner(self) -> str:
        return self._owner

    @owner.setter
    def owner(self, v: str) -> None:
        if not query_db('SELECT id FROM users WHERE id=?', (v,), True) and v != '':
            raise ValueError(f"No user with id #{v} exists")
        self._owner = v

    @property
    def edited(self) -> datetime:
        return datetime.strptime(self._edited, '%Y-%m-%d_%H-%M-%S')

    @edited.setter
    def edited(self, v: datetime) -> None:
        self._edited = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def created(self) -> datetime:
        return datetime.strptime(self._created, '%Y-%m-%d_%H-%M-%S')

    @created.setter
    def created(self, v: datetime) -> None:
        self._created = v.strftime('%Y-%m-%d_%H-%M-%S')

    def get_owner(self) -> User:
        """
        Get the owner as a User class
        :return: instance of User
        """
        return User.load(self.owner)

    def get_exercises(self) -> list:
        """
        Get all LearnExercises corresponding to this set from the database.
        :return: a list of LearnExercise
        """
        result = query_db('SELECT * FROM learn_exercises WHERE set_id=?', (self.id_,), False)
        return [LearnExercise(*i) for i in result]


class LearnExercise:

    def __init__(self, id_: str = None, set_id: str = '', question: str = '', answer: str = '', answers: list = None,
                 frequency: float = 1.0, auto_check: int = 0):
        self._id = ''
        self._set_id = ''
        self._question = ''
        self._answer = ''
        self._answers = ''
        self._frequency = 1.0
        self._auto_check = 0
        if id_ is None:
            id_ = rand_base64(8)
        if answers is None:
            answers = []
        self.id_ = id_
        self.set_id = set_id
        self.question = question
        self.answer = answer
        self.answers = answers
        self.frequency = frequency
        self.auto_check = auto_check

    def __str__(self) -> str:
        return f"LearnExercise #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'set_id': self.set_id,
            'question': self.question,
            'answer': self.answer,
            'answers': self.answers,
            'frequency': self.frequency,
            'auto_check': self.auto_check,
        }

    def save(self) -> None:
        """
        Saves the LearnExercise in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No LearnExercise id')
        if not query_db('SELECT id FROM learn_exercises WHERE id=?', (self._id,), True):
            query_db('INSERT INTO learn_exercises VALUES (?, ?, ?, ?, ?, ?, ?)', (
                self._id,
                self._set_id,
                self._question,
                self._answer,
                self._answers,
                self._frequency,
                self._auto_check,
            ))
        else:
            query_db(
                'UPDATE learn_exercises SET id=?, set_id=?, question=?, answer=?, answers=?, frequency=?, auto_check=? '
                'WHERE id=?', (
                    self._set_id,
                    self._question,
                    self._answer,
                    self._answers,
                    self._frequency,
                    self._auto_check,
                    self._id,
                ))

    @staticmethod
    def load(learn_exercise_id):
        """
        loads a LearnExercise from the database
        :return: a new LearnExercise instance
        """
        result = query_db('SELECT * FROM learn_exercises WHERE id=?', (learn_exercise_id,), True)
        if not result:
            raise KeyError(f"No LearnExercise with the id #{learn_exercise_id} has been found")
        exercise = LearnExercise(result[0])
        exercise._set_id = result[1]
        exercise._question = result[2]
        exercise._answer = result[3]
        exercise._answers = result[4]
        exercise._frequency = result[5]
        exercise._auto_check = result[6]
        return exercise

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def set_id(self) -> str:
        return self._set_id

    @set_id.setter
    def set_id(self, v: str) -> None:
        self._set_id = v

    @property
    def question(self) -> str:
        return self._question

    @question.setter
    def question(self, v: str) -> None:
        self._question = v

    @property
    def answer(self) -> str:
        return self._answer

    @answer.setter
    def answer(self, v: str) -> None:
        self._answer = v

    @property
    def answers(self) -> list:
        return self._answers.split(', ')

    @answers.setter
    def answers(self, v: list) -> None:
        for i in v:
            if '£' in i:
                raise ValueError(f"An answer may not contain '£'")
        self._answers = ', '.join(v)

    @property
    def frequency(self) -> float:
        return self._frequency

    @frequency.setter
    def frequency(self, v: float) -> None:
        self._frequency = v

    @property
    def auto_check(self) -> int:
        return self._auto_check

    @auto_check.setter
    def auto_check(self, v: int) -> None:
        self._auto_check = v

    def get_set(self) -> LearnSet:
        return LearnSet.load(self.set_id)


class LearnStat:

    def __init__(self, id_: str = None, exercise_id: str = '', owner: str = '', correct: int = 0, wrong: int = 0):
        self._id = ''
        self._exercise_id = ''
        self._owner = ''
        self._correct = 0
        self._wrong = 0
        if id_ is None:
            id_ = rand_base64(12)
        self.id_ = id_
        self.exercise_id = exercise_id
        self.owner = owner
        self.correct = correct
        self.wrong = wrong

    def __str__(self) -> str:
        return f"LearnStat #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'exercise_id': self.exercise_id,
            'owner': self.owner,
            'correct': self.correct,
            'wrong': self.wrong,
        }

    def save(self) -> None:
        """
        Saves the LearnStat in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No LearnStat id')
        if not query_db('SELECT id FROM learn_stats WHERE id=?', (self._id,), True):
            query_db('INSERT INTO learn_stats VALUES (?, ?, ?, ?, ?)', (
                self._id,
                self._exercise_id,
                self._owner,
                self._correct,
                self._wrong,
            ))
        else:
            query_db('UPDATE learn_stats SET exercise_id=?, owner=?, correct=?, wrong=? WHERE id=?', (
                self._exercise_id,
                self._owner,
                self._correct,
                self._wrong,
                self._id,
            ))

    @staticmethod
    def load(learn_stat_id):
        """
        loads a LearnStat from the database
        :return: a new LearnStat instance
        """
        result = query_db('SELECT * FROM learn_stats WHERE id=?', (learn_stat_id,), True)
        if not result:
            raise KeyError(f"No LearnStat with the id #{learn_stat_id} has been found")
        return LearnStat(*result)

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def exercise_id(self) -> str:
        return self._exercise_id

    @exercise_id.setter
    def exercise_id(self, v: str) -> None:
        self._exercise_id = v

    @property
    def owner(self) -> str:
        return self._owner

    @owner.setter
    def owner(self, v: str) -> None:
        self._owner = v

    @property
    def correct(self) -> int:
        return self._correct

    @correct.setter
    def correct(self, v: int) -> None:
        self._correct = v

    @property
    def wrong(self) -> int:
        return self._wrong

    @wrong.setter
    def wrong(self, v: int) -> None:
        self._wrong = v

    def get_owner(self) -> User:
        """
        Get the owner as a User class
        :return: instance of User
        """
        return User.load(self.owner)

    def get_exercise(self) -> LearnExercise:
        """
        Get the exercise as a LearnExercise class
        :return: instance of LearnExercise
        """
        return LearnExercise.load(self.exercise_id)


class MailCheck:

    def __init__(self, id_: str = None, account: dict = None, valid: datetime = None, code: str = None):
        self._id = ''
        self._account = ''
        self._valid = ''
        self._code = ''
        if id_ is None:
            id_ = rand_base64(12)
        if account is None:
            account = {}
        if valid is None:
            valid = datetime.now() + timedelta(minutes=15)
        if code is None:
            code = rand_base64(16)
        self.id_ = id_
        self.account = account
        self.valid = valid
        self.code = code

    def __str__(self) -> str:
        return f"MailCheck #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'account': self.account,
            'valid': self.valid,
            'code': self.code,
        }

    def save(self) -> None:
        """
        Saves the MailCheck in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No MailCheck id')
        if not query_db('SELECT id FROM mail_check WHERE id=?', (self._id,), True):
            query_db('INSERT INTO mail_check VALUES (?, ?, ?, ?)', (
                self._id,
                self._account,
                self._valid,
                self._code,
            ))
        else:
            query_db('UPDATE mail_check SET account=?, valid=?, code=? WHERE id=?', (
                self._account,
                self._valid,
                self._code,
                self._id,
            ))

    @staticmethod
    def load(mail_check_id):
        """
        loads a MailCheck from the database
        :return: a new MailCheck instance
        """
        result = query_db('SELECT * FROM mail_check WHERE id=?', (mail_check_id,), True)
        if not result:
            raise KeyError(f"No MailCheck with the id #{mail_check_id} has been found")
        mail_check = MailCheck(id_=result[0])
        mail_check._account = result[1]
        mail_check._valid = result[2]
        mail_check._code = result[3]
        return mail_check

    @staticmethod
    def load_by_code(mail_check_code: str):
        """
        loads a MailCheck from the database
        :return: a new MailCheck instance
        """
        result = query_db('SELECT * FROM mail_check WHERE code=?', (mail_check_code,), True)
        if not result:
            raise KeyError(f"No MailCheck with the code #{mail_check_code} has been found")
        mail_check = MailCheck(id_=result[0])
        mail_check._account = result[1]
        mail_check._valid = result[2]
        mail_check._code = result[3]
        return mail_check

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def account(self) -> dict:
        return loads(self._account)

    @account.setter
    def account(self, v: dict) -> None:
        self._account = dumps(v)

    @property
    def valid(self) -> datetime:
        return datetime.strptime(self._valid, '%Y-%m-%d_%H-%M-%S')

    @valid.setter
    def valid(self, v: datetime) -> None:
        self._valid = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def code(self) -> str:
        return self._code

    @code.setter
    def code(self, v: str) -> None:
        self._code = v


class Login:

    def __init__(self, id_: str = None, account: str = '', valid: datetime = None, browser: str = '') -> None:
        self._id = ''
        self._account = ''
        self._valid = ''
        self._browser = ''
        if id_ is None:
            id_ = rand_base64(64)
        if valid is None:
            valid = datetime.now() + timedelta(days=100)
        self.id_ = id_
        self.account = account
        self.valid = valid
        self.browser = browser

    def __str__(self) -> str:
        return f"Login #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'account': self.account,
            'valid': self.valid,
            'browser': self.browser,
        }

    def save(self) -> None:
        """
        Saves the Login in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No Login id')
        if not query_db('SELECT id FROM login WHERE id=?', (self._id,), True):
            query_db('INSERT INTO login VALUES (?, ?, ?, ?)', (
                self._id,
                self._account,
                self._valid,
                self._browser,
            ))
        else:
            query_db('UPDATE login SET account=?, valid=?, browser=? WHERE id=?', (
                self._account,
                self._valid,
                self._browser,
                self._id,
            ))

    @staticmethod
    def load(login_id):
        """
        loads a Login from the database
        :return: a new Login instance
        """
        result = query_db('SELECT * FROM login WHERE id=?', (login_id,), True)
        if not result:
            raise KeyError(f"No Login with the id #{login_id} has been found")
        login = Login(id_=result[0])
        login._account = result[1]
        login._valid = result[2]
        login._browser = result[3]
        return login

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def account(self) -> str:
        return self._account

    @account.setter
    def account(self, v: str) -> None:
        self._account = v

    @property
    def valid(self) -> datetime:
        return datetime.strptime(self._valid, '%Y-%m-%d_%H-%M-%S')

    @valid.setter
    def valid(self, v: datetime) -> None:
        self._valid = v.strftime('%Y-%m-%d_%H-%M-%S')

    @property
    def browser(self) -> str:
        return self._browser

    @browser.setter
    def browser(self, v: str) -> None:
        self._browser = v

    def get_account(self):
        return User.load(self._account)


class Calendar:

    def __init__(self, id_: str = None, owner: str = '', access: str = '', name: str = '', color: str = ''):
        self._id = ''
        self._owner = ''
        self._access = ''
        self._name = ''
        self._color = ''
        if id_ is None:
            id_ = rand_base64(9)
        self.id_ = id_
        self.owner = owner
        self.access = access
        self.name = name
        self.color = color

    def __str__(self) -> str:
        return f"Calendar #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'owner': self.owner,
            'access': self.access,
            'name': self.name,
            'color': self.color,
            'ownerName': query_db('SELECT name FROM users WHERE id=?', (self.owner,), True)[0]
        }

    def save(self) -> None:
        """
        Saves the Calendar in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No Calendar id')
        if not query_db('SELECT id FROM calendars WHERE id=?', (self._id,), True):
            query_db('INSERT INTO calendars VALUES (?, ?, ?, ?, ?)', (
                self._id,
                self._owner,
                self._access,
                self._name,
                self._color,
            ))
        else:
            query_db('UPDATE calendars SET owner=?, access=?, name=?, color=? WHERE id=?', (
                self._owner,
                self._access,
                self._name,
                self._color,
            ))

    @staticmethod
    def load(calendar_id):
        """
        loads a Calendar from the database
        :param calendar_id: calendar id
        :return: a new Calendar instance
        """
        result = query_db('SELECT * FROM calendars WHERE id=?', (calendar_id,), True)
        if not result:
            raise KeyError(f"No Calendar with the id #{calendar_id} has been found")
        calendar = Calendar(id_=result[0])
        calendar._owner = result[1]
        calendar._access = result[2]
        calendar._name = result[3]
        calendar._color = result[4]
        return calendar

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def owner(self) -> str:
        return self._owner

    @owner.setter
    def owner(self, v: str) -> None:
        if not query_db('SELECT id FROM users WHERE id=?', (self.owner,), True) and v != '':
            raise ValueError(f"No user with id #{v} has been found")
        self._owner = v

    @property
    def access(self) -> str:
        return self._access

    @access.setter
    def access(self, v: str) -> None:
        self._access = v

    @property
    def name(self) -> str:
        return self._name

    @name.setter
    def name(self, v: str) -> None:
        self._name = v

    @property
    def color(self) -> str:
        return self._color

    @color.setter
    def color(self, v: str) -> None:
        self._color = v


def check_calendar_access(access: str, account: User, write: bool = False) -> bool:
    user_strings = list([f"%{i}" for i in account.classes])
    if write:
        if '|' in access:
            access_list = access.split('|')[1].strip().split(' ')
        else:
            access_list = []
    else:
        access_list = access.replace('|', '').split(' ')
        user_strings.append('*')
    return any(i in access_list for i in user_strings)


class CalendarEvent:

    def __init__(self, id_: str = None, calendar: str = '', title: str = '', description: str = '',
                 start: datetime = None, end: datetime = None, color: str = '', schulnetz: str = ''):
        self._id = ''
        self._calendar = ''
        self._title = ''
        self._description = ''
        self._start = ''
        self._end = ''
        self._color = ''
        self._schulnetz = ''
        if id_ is None:
            id_ = rand_base64(14)
        if start is None:
            start = datetime.now()
        if end is None:
            end = datetime.now()
        self.id_ = id_
        self.calendar = calendar
        self.title = title
        self.description = description
        self.start = start
        self.end = end
        self.color = color
        self.schulnetz = schulnetz

    def __str__(self) -> str:
        return f"CalendarEvent #{self.id_}"

    def __dict__(self) -> dict:
        return {
            'id_': self.id_,
            'calendar': self.calendar,
            'title': self.title,
            'description': self.description,
            'start': self.start,
            'end': self.end,
            'color': self.color,
            'schulnetz': self.schulnetz,
        }

    def save(self) -> None:
        """
        Saves the CalendarEvent in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No CalendarEvent id')
        if not query_db('SELECT id FROM calendar_events WHERE id=?', (self._id,), True):
            query_db('INSERT INTO calendar_events VALUES (?, ?, ?, ?, ?, ?, ?, ?)', (
                self._id,
                self._calendar,
                self._title,
                self._description,
                self._start,
                self._end,
                self._color,
                self._schulnetz,
            ))
        else:
            query_db('UPDATE calendar_events SET calendar=?, title=?, description=?, start=?, end=?, color=?,'
                     ' schulnetz=? WHERE id=?', (
                         self._calendar,
                         self._title,
                         self._description,
                         self._start,
                         self._end,
                         self._color,
                         self._schulnetz,
                         self._id,
                     ))

    @staticmethod
    def load(calendar_event_id):
        """
        loads a CalendarEvent from the database
        :param calendar_event_id: a CalendarEvent id
        :return: a new CalendarEvent instance
        """
        result = query_db('SELECT * FROM calendar_events WHERE id=?', (calendar_event_id,), True)
        if not result:
            raise KeyError(f"No CalendarEvent with id #{calendar_event_id} has been found")
        calendar_event = CalendarEvent(id_=result[0])
        calendar_event._calendar = result[1]
        calendar_event._title = result[2]
        calendar_event._description = result[3]
        calendar_event._start = result[4]
        calendar_event._end = result[5]
        calendar_event._color = result[6]
        calendar_event._schulnetz = result[7]
        return calendar_event

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, v: str) -> None:
        self._id = v

    @property
    def calendar(self) -> str:
        return self._calendar

    @calendar.setter
    def calendar(self, v: str) -> None:
        if not query_db('SELECT id FROM calendars WHERE id=?', (self._id,), True):
            raise ValueError(f"No Calendar with the id #{v} has been found")
        self._calendar = v

    @property
    def title(self) -> str:
        return self._title

    @title.setter
    def title(self, v: str) -> None:
        self._title = v

    @property
    def description(self) -> str:
        return self._description

    @description.setter
    def description(self, v: str) -> None:
        self._description = v

    @property
    def start(self) -> datetime:
        return datetime.strptime(self._start, DATE_FORMAT)

    @start.setter
    def start(self, v: datetime) -> None:
        self._start = v.strftime(DATE_FORMAT)

    @property
    def end(self) -> datetime:
        return datetime.strptime(self._end, DATE_FORMAT)

    @end.setter
    def end(self, v: datetime) -> None:
        self._end = v.strftime(DATE_FORMAT)

    @property
    def color(self) -> str:
        return self._color

    @color.setter
    def color(self, v: str) -> None:
        self._color = v

    @property
    def schulnetz(self) -> str:
        return self._schulnetz

    @schulnetz.setter
    def schulnetz(self, v: str) -> None:
        self._schulnetz = v


########################################################################################################################
# DECORATORS
########################################################################################################################


def login_required(func):
    def wrapper(*args, **kwargs):
        r = {'error': 'account required'}, 401
        if is_signed_in():
            return func(*args, **kwargs)
        return r

    wrapper.__name__ = func.__name__
    return wrapper


def premium_required(func):
    def wrapper(*args, **kwargs):
        r = {
            'error': 'premium required',
            'message': 'Premium subscription or above is required.',
        }, 401
        if 'account' in session:
            try:
                user: User = Login.load(session['account']).get_account()
            except Exception as error:
                log_exception('An error occurred while loading the account data' + 0 * str(error))
                return r
            if user.valid_payment():
                return func(*args, **kwargs)
        return r

    wrapper.__name__ = func.__name__
    return wrapper


def premium_lite_required(func):
    def wrapper(*args, **kwargs):
        r = {
            'error': 'premium lite required',
            'message': 'Premium Lite subscription or above is required.',
        }, 401
        if 'account' in session:
            try:
                user: User = Login.load(session['account']).get_account()
            except Exception as error:
                log_exception('An error occurred while loading the account data' + 0 * str(error))
                return r
            if user.valid_payment() or user.valid_payment_lite():
                return func(*args, **kwargs)
        return r

    wrapper.__name__ = func.__name__
    return wrapper


########################################################################################################################
# ROUTES
########################################################################################################################


@app.before_request
def before_request():
    session.permanent = True
    app.permanent_session_lifetime = timedelta(days=92)
    score = scan_request()
    if score == 0:
        return render_template('_banned.html', ip=request.access_route[-1]), 403


@app.route('/static/<path:file>', methods=['GET'])
def route_static(file):
    resp = send_from_directory(join(app.root_path, 'src'), file)
    resp.mimetype = FILE_TYPES.get(file, 'text/plain')
    return resp


@app.route('/dateien/dokumente/<string:id_>/<string:name>', methods=['GET'])
def r_dateien_dokumente(id_: str, name: str):
    try:
        result = Document.load(id_)
    except Exception as error:
        log_exception('The requested document could not be retrieved' + 0 * str(error))
        return 'Dokument konnte nicht gefunden werden', 404
    if not result:
        return 'Dokument konnte nicht gefunden werden', 404
    resp = make_response(send_from_directory(join(app.root_path, 'files'), f"{id_}.{result.extension}"))
    resp.headers['Content-Disposition'] = f"inline; filename={name}"
    resp.mimetype = result.mimetype
    return resp


@app.route('/dateien/lernsets/<string:id_>/<string:name>', methods=['GET'])
def r_dateien_lernsets(id_: str, name: str):
    db_result = query_db('SELECT * FROM learn_exercises WHERE set_id=?', (id_,))
    result = []
    for i in db_result:
        result.append(LearnExercise.load(i[0]).__dict__())
    resp = make_response(dumps(result))
    resp.headers['Content-Disposition'] = f"inline; filename={name}"
    resp.mimetype = 'application/json'
    return resp


@app.route('/api/v1/account', methods=['GET'])
def r_api_v1_account():
    r = {'valid': False, 'paid': False, 'paidLite': False, 'info': None}
    try:
        login = Login.load(session['account'])
        if login.valid > datetime.now() and extract_browser(request.user_agent) == login.browser:
            user = User.load(login.account)
            paid = user.valid_payment()
            paid_lite = user.valid_payment_lite()
            r = {'valid': True, 'paid': paid, 'paidLite': paid_lite, 'info': user.json}
    except Exception as error:
        log_exception('An error occurred while loading the account data' + 0 * str(error))
    return r


@app.route('/api/v1/favicon/<path:path>')
@login_required
def r_api_v1_favicon(path: str):
    if not path.startswith('http'):
        path = f"http://{path}"  # noqa
    if path.count('/') < 3:
        path += '/'
    path = path.lower()
    parsed_uri = urlparse(path)
    website = parsed_uri.netloc
    for file in listdir(relative_path('favicons/')):
        if file.rsplit('.', 1)[0].lower() == website.lower():
            resp = send_from_directory(relative_path('favicons'), file)
            extension = file.split('.')[-1]
            if extension in EXTENSIONS_REVERSE:
                resp.mimetype = EXTENSIONS_REVERSE[extension.upper()]
            return resp
    if website:
        response = requests_send('GET', f"{environ['FAVICON_API']}{website}?s=256")
        mimetype = response.headers.get('Content-Type', 'image/x-icon')
        content = response.content
        if response.status_code == 200:
            with open(relative_path(f"favicons/{website}.{EXTENSIONS.get(mimetype, 'ICO').lower()}"), 'wb') as new_file:
                new_file.write(content)
            resp = Response(content, 200)
            resp.mimetype = mimetype
            return resp
    resp = send_from_directory(relative_path('favicons'), '_empty.png')
    resp.mimetype = EXTENSIONS_REVERSE['PNG']
    return resp


@app.route('/api/v1/qrbill/<product>', methods=['GET'])
@login_required
def r_api_v1_qrbill(product: str):
    if (product not in PRICES.keys()) or (product not in PRODUCTS.keys()):
        return {
            'error': 'not found',
            'message': 'The product was not found.',
        }, 404
    account = Login.load(session['account']).get_account()
    bill = qrbill.QRBill(
        account=environ['BILLING_ACCOUNT'].replace(' ', ''),
        creditor={
            'name': environ['BILLING_NAME'],
            'line1': environ['BILLING_POSTCODE'],
            'line2': environ['BILLING_CITY'],
            'country': 'CH',
        },
        amount=PRICES[product],
        additional_information=f"{PRODUCTS[product]} für {account.mail}",
        language='de',
    )
    temp_id = rand_base64(21)
    bill.as_svg(relative_path(f"temp/qrbills/{temp_id}.svg"))
    resp = make_response(send_from_directory(relative_path('temp/qrbills'), f"{temp_id}.svg"))
    resp.mimetype = 'image/svg+xml'
    return resp


@app.route('/api/v1/account/signin', methods=['POST'])
def r_api_v1_account_signin():
    data = request.get_json(force=True, silent=True)
    sleep(rand_uniform(0.1, 0.4))
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'email',
        'password',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `email`, `password`',
        }, 415
    try:
        user_id = query_db('SELECT id FROM users WHERE mail=?', (data['email'],), True)[0]
        if not user_id:
            raise KeyError
        user = User.load(user_id)
    except (KeyError, TypeError) as error:
        log_exception('Email does not exist in users' + 0 * str(error))
        return {
            'error': 'sign-in failed',
            'message': 'The combination of password and email does not exist.'
        }, 401
    if not user.check_password(data['password']):
        return {
            'error': 'sign-in failed',
            'message': 'The combination of password and email does not exist.'
        }, 401
    login = Login(account=user.id_, browser=extract_browser(request.user_agent))
    login.save()
    session['account'] = login.id_
    return {
        'status': 'success',
        'message': 'You are now signed-in with cookies.'
    }, 200


@app.route('/api/v1/account/register', methods=['POST'])
def r_api_v1_account_register():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'name',
        'class_',
        'grade',
        'email',
        'password',
        'newsletter',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: '
                       '`name`, `class_`, `grade`, `email`, `password`, `newsletter`',
        }, 415
    if not (data['email'].endswith('@sluz.ch') or data['email'].endswith('@ksalp.ch')):
        return {
            'error': 'invalid email provider',
            'message': 'Please use an email from sluz.ch or ksalp.ch.',
        }, 400
    db_result = query_db('SELECT * FROM users WHERE mail=?', (data['email'],), True)
    if db_result:
        return {
            'error': 'email already in use',
            'message': 'An account with this email address already exists.',
        }, 400
    salt = rand_salt()
    account = {'name': data['name'], 'classes': data['class_'].split(' '), 'grade': data['grade'],
               'mail': data['email'],
               'newsletter': data['newsletter'], 'salt': salt,
               'hash_': urlsafe_b64encode(hash_password(data['password'], urlsafe_b64decode(salt))).decode()}
    mail = MailCheck(account=account, valid=datetime.now() + timedelta(minutes=15))
    mail.save()
    mail_plain = f"""Guten Tag, {data['name']}

    Um die Registrierung bei ksalp.ch abzuschliessen, klicken Sie bitte auf den folgenden Link:

    https://ksalp.ch/registrieren/mail/{mail.code}

    Der Link ist für 15 Minuten gültig. Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.

    Das ksalp.ch Team wünscht Ihnen viel Erfolg beim Lernen.
    """
    mail_html = f"""<p>Guten Tag, {data['name']}</p>
    <p>Um die Registrierung bei ksalp.ch abzuschliessen, klicken Sie bitte auf den folgenden Link:</p>
    <p><b><a href="https://ksalp.ch/registrieren/mail/{mail.code}">https://ksalp.ch/registrieren/mail/{mail.code}</a></b></p>
    <p>Der Link ist für 15 Minuten gültig. Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.</p>
    <p>Das ksalp.ch Team wünscht Ihnen viel Erfolg beim Lernen.</p>
    """
    result = send_mail(address=data['email'], subject='Registrierung bei ksalp.ch', message_plain=mail_plain,
                       message=mail_html)
    if result is not None:
        return {
            'error': 'exception during email delivery',
            'message': 'An error occurred while sending the e-mail. Please try again later or contact us.',
        }, 500
    return {
        'status': 'success',
        'message': 'An email has been sent to your inbox.'
    }, 200


@app.route('/api/v1/account/register/continue', methods=['POST'])
def r_api_v1_account_register_continue():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'code',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `code`',
        }, 415
    mail = MailCheck.load_by_code(mail_check_code=data['code'])
    if mail is None:
        return {
            'error': 'invalid code',
            'message': 'The code could not be found.',
        }, 400
    if mail.valid < datetime.now():
        return {
            'error': 'expired code',
            'message': 'The code has expired.',
        }, 400
    account_data = mail.account
    account_data['salt'] = urlsafe_b64decode(account_data['salt'])
    account_data['hash_'] = urlsafe_b64decode(account_data['hash_'])
    account_data['theme'] = 'light'
    account_data['iframe'] = 1
    account = User(**account_data)
    account.save()
    return {
        'status': 'success',
        'message': 'Account created successfully.'
    }, 200


@app.route('/api/v1/account/logout', methods=['POST'])
def r_api_v1_account_logout():
    try:
        login = Login.load(session['account'])
    except Exception as error:
        log_exception('An error occurred while loading the account data' + 0 * str(error))
        return {
            'error': 'invalid account login',
            'message': 'The account login could not be found.',
        }
    login.valid = datetime.now()
    login.save()
    session['account'] = ''
    return {
        'status': 'success',
        'message': 'Account logged out successfully.'
    }, 200


@app.route('/api/v1/constants', methods=['GET'])
def r_api_v1_constants():
    return {
        'extensions': EXTENSIONS,
        'extensionsReverse': EXTENSIONS_REVERSE,
        'fileTypes': FILE_TYPES,
        'grades': GRADES,
        'languages': LANGUAGES,
        'searchEngines': SEARCH_ENGINES,
        'sizeUnits': SIZE_UNITS,
        'subjects': SUBJECTS,
        'themes': THEMES,
        'imprint': {
            'name': environ.get('IMPRINT_NAME', 'Ein Fehler ist aufgetreten.'),
            'address': environ.get('IMPRINT_ADDRESS', 'Ein Fehler ist aufgetreten.'),
            'city': environ.get('IMPRINT_CITY', 'Ein Fehler ist aufgetreten.'),
            'mail': environ.get('IMPRINT_MAIL', 'Ein Fehler ist aufgetreten.'),
        },
    }, 200


@app.route('/api/v1/account/settings/theme', methods=['POST'])
@login_required
@premium_lite_required
def r_api_v1_account_settings_theme():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'theme',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `theme`',
        }, 415
    if data['theme'] not in THEMES:
        return {
            'error': 'invalid theme',
            'message': 'The theme could not be found.',
        }, 400
    account = Login.load(session['account']).get_account()
    account.theme = data['theme']
    account.save()
    return {
        'status': 'success',
        'message': 'Theme updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/class_', methods=['POST'])
@login_required
def r_api_v1_account_settings_class_():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'class_',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `class_`',
        }, 415
    account = Login.load(session['account']).get_account()
    account.classes = data['class_'].split(' ')
    account.save()
    return {
        'status': 'success',
        'message': 'Class updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/grade', methods=['POST'])
@login_required
def r_api_v1_account_settings_grade():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'grade',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `grade`',
        }, 415
    if data['grade'] not in GRADES:
        return {
            'error': 'invalid grade',
            'message': 'The grade could not be found.',
        }, 400
    account = Login.load(session['account']).get_account()
    account.grade = data['grade']
    account.save()
    return {
        'status': 'success',
        'message': 'Grade updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/search', methods=['POST'])
@login_required
def r_api_v1_account_settings_search():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'search',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `search`',
        }, 415
    if data['search'] not in SEARCH_ENGINES:
        return {
            'error': 'invalid search engine',
            'message': 'The search engine could not be found.',
        }, 400
    account = Login.load(session['account']).get_account()
    account.search = data['search']
    account.save()
    return {
        'status': 'success',
        'message': 'Search engine updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/iframe', methods=['POST'])
@login_required
def r_api_v1_account_settings_iframe():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'iframe',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `iframe`',
        }, 415
    account = Login.load(session['account']).get_account()
    account.iframe = data['iframe']
    account.save()
    return {
        'status': 'success',
        'message': 'Iframe settings updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/password', methods=['POST'])
@login_required
def r_api_v1_account_settings_password():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'oldPassword',
        'password',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `oldPassword`, `password`',
        }, 415
    account = Login.load(session['account']).get_account()
    if not account.check_password(data['oldPassword']):
        return {
            'error': 'invalid password',
            'message': 'The old password is invalid.',
        }, 400
    account.salt = rand_salt()
    account.hash_ = hash_password(data['password'], account.salt)
    account.save()
    return {
        'status': 'success',
        'message': 'Password updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/newsletter', methods=['POST'])
@login_required
def r_api_v1_account_settings_newsletter():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'newsletter',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `newsletter`',
        }, 415
    account = Login.load(session['account']).get_account()
    account.newsletter = data['newsletter']
    account.save()
    return {
        'status': 'success',
        'message': 'Newsletter settings updated successfully.',
    }, 200


@app.route('/api/v1/account/settings/favorites', methods=['POST'])
@login_required
def r_api_v1_account_settings_favorites():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'favorites',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `favorites`',
        }, 415
    account = Login.load(session['account']).get_account()
    account.favorites = [i.strip() for i in data['favorites'].split('\n') if ' | ' in i.strip()]
    account.save()
    return {
        'status': 'success',
        'message': 'Favorites settings updated successfully.',
    }, 200


@app.route('/api/v1/documents/list', methods=['GET'])
def r_api_v1_documents_list():
    documents = []
    result = query_db('SELECT id FROM documents')
    for i in result:
        document = Document.load(i[0]).__dict__()
        document['created'] = document['created'].strftime(DATE_FORMAT)
        document['edited'] = document['edited'].strftime(DATE_FORMAT)
        documents.append(document)
    return {
        'status': 'success',
        'message': 'Documents retrieved successfully.',
        'documents': documents,
    }, 200


@app.route('/api/v1/documents/new/form', methods=['POST'])
@login_required
def r_api_v1_documents_new_form():
    form = dict(request.form)
    if 'file' not in request.files:
        return {
            'error': 'missing file',
            'message': 'No file was uploaded.',
        }, 415
    file = request.files['file']
    if not all(form.get(i, '') for i in [
        'title',
        'subject',
        'description',
        'class',
        'grade',
        'language',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `title`, `subject`, `class`, '
                       '`grade`, `language`',
        }, 415
    account = Login.load(session['account']).get_account()
    extension = file.filename.split('.')[-1]
    document = Document(
        id_=None,
        title=form['title'],
        subject=form['subject'],
        description=form['description'],
        class_=form['class'],
        grade=form['grade'],
        language=form['language'],
        owner=account.id_,
        created=datetime.now(),
        edited=datetime.now(),
        extension=extension,
        mimetype=EXTENSIONS_REVERSE.get(extension.upper(), 'application/octet-stream'),
        size=0,
    )
    file_path = join(app.root_path, 'files', document.id_ + '.' + extension)
    file.save(file_path)
    document.size = getsize(file_path)
    document.save()
    return {
        'status': 'success',
        'message': 'Document created successfully.',
        'id': document.id_,
    }, 200


@app.route('/api/v1/documents/edit/form', methods=['POST'])
@login_required
def r_api_v1_documents_edit_form():
    form = dict(request.form)
    if 'file' not in request.files:
        return {
            'error': 'missing file',
            'message': 'No file was uploaded.',
        }, 415
    file = request.files['file']
    if not all(form.get(i, '') for i in [
        'title',
        'subject',
        'description',
        'class',
        'grade',
        'language',
        'id',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `title`, `subject`, `class`, '
                       '`grade`, `language`, `id`',
        }, 415
    account = Login.load(session['account']).get_account()
    extension = file.filename.split('.')[-1]
    try:
        document = Document.load(form['id'])
    except Exception as error:
        log_exception('An error occurred while loading the requested document' + 0 * str(error))
        return {
            'error': 'document not found',
            'message': 'The requested document could not be found.',
        }
    if document.owner != account.id_:
        return {
            'error': 'permission denied',
            'message': 'You do not have permission to edit this document.',
        }
    document.title = form['title']
    document.subject = form['subject']
    document.description = form['description']
    document.class_ = form['class']
    document.grade = form['grade']
    document.language = form['language']
    document.owner = account.id_
    document.edited = datetime.now()
    document.extension = extension
    document.mimetype = EXTENSIONS_REVERSE.get(extension.upper(), 'application/octet-stream')
    file_path = join(app.root_path, 'files', document.id_ + '.' + extension)
    file.save(file_path)
    document.size = getsize(file_path)
    document.save()
    return {
        'status': 'success',
        'message': 'Document created successfully.',
    }, 200


@app.route('/api/v1/documents/data/<document_id>', methods=['GET'])
def r_api_v1_documents_data(document_id):
    try:
        document = Document.load(document_id).__dict__()
    except Exception as error:
        log_exception('An error occurred while loading the requested document' + 0 * str(error))
        return {
            'error': 'document not found',
            'message': 'The requested document could not be found.',
        }, 404
    document['created'] = document['created'].strftime(DATE_FORMAT)
    document['edited'] = document['edited'].strftime(DATE_FORMAT)
    return {
        'status': 'success',
        'message': 'Document retrieved successfully.',
        'document': document,
    }, 200


@app.route('/api/v1/learnsets/list', methods=['GET'])
def r_api_v1_learnsets_list():
    learnsets = []
    result = query_db('SELECT id FROM learn_sets')
    for i in result:
        learnset = LearnSet.load(i[0]).__dict__()
        learnset['created'] = learnset['created'].strftime(DATE_FORMAT)
        learnset['edited'] = learnset['edited'].strftime(DATE_FORMAT)
        learnsets.append(learnset)
    return {
        'status': 'success',
        'message': 'learnsets retrieved successfully.',
        'learnsets': learnsets,
    }, 200


@app.route('/api/v1/learnsets/new/form', methods=['POST'])
@login_required
def r_api_v1_learnsets_new_form():
    form = dict(request.form)
    if 'file' not in request.files:
        return {
            'error': 'missing file',
            'message': 'No file was uploaded.',
        }, 415
    file = request.files['file']
    if not all(form.get(i, '') for i in [
        'title',
        'subject',
        'description',
        'class',
        'grade',
        'language',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `title`, `subject`, `class`, '
                       '`grade`, `language`',
        }, 415
    account = Login.load(session['account']).get_account()
    file_stream = file.stream
    file_contents = file_stream.read().decode('utf-8')
    file_stream.close()
    try:
        learnset_contents = import_learnset(file_contents)
    except Exception as error:
        log_exception('An error occurred while importing the learnset contents' + 0 * str(error))
        return {
            'error': 'invalid file',
            'message': 'An error occurred while parsing the file.',
        }, 415
    if not learnset_contents:
        return {
            'error': 'invalid file',
            'message': 'The file could not be parsed.',
        }, 415
    learnset = LearnSet(
        title=form['title'],
        subject=form['subject'],
        description=form['description'],
        class_=form['class'],
        grade=form['grade'],
        language=form['language'],
        owner=account.id_,
        created=datetime.now(),
        edited=datetime.now(),
    )
    learnset.save()
    for element in learnset_contents:
        exercise = LearnExercise(
            set_id=learnset.id_,
            question=element['question'],
            answer=element['answer'],
            answers=element['answers'],
            frequency=element['frequency'],
            auto_check=element['auto_check'],
        )
        exercise.save()
    return {
        'status': 'success',
        'message': 'Learnset created successfully.',
        'id': learnset.id_,
    }, 200


@app.route('/api/v1/learnsets/edit/form', methods=['POST'])
@login_required
def r_api_v1_learnsets_edit_form():
    form = dict(request.form)
    if 'file' not in request.files:
        return {
            'error': 'missing file',
            'message': 'No file was uploaded.',
        }, 415
    file = request.files['file']
    if not all(form.get(i, '') for i in [
        'title',
        'subject',
        'description',
        'class',
        'grade',
        'language',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `title`, `subject`, `class`, '
                       '`grade`, `language`',
        }, 415
    account = Login.load(session['account']).get_account()
    try:
        learnset = LearnSet.load(form['id'])
    except Exception as error:
        log_exception('An error occurred while loading the requested learnset' + 0 * str(error))
        return {
            'error': 'learnset not found',
            'message': 'The requested learnset could not be found.',
        }
    if learnset.owner != account.id_:
        return {
            'error': 'permission denied',
            'message': 'You do not have permission to edit this learnset.',
        }
    file_stream = file.stream
    file_contents = file_stream.read().decode('utf-8')
    file_stream.close()
    try:
        learnset_contents = import_learnset(file_contents)
    except Exception as error:
        log_exception('An error occurred while importing the learnset contents' + 0 * str(error))
        return {
            'error': 'invalid file',
            'message': 'An error occurred while parsing the file.',
        }, 415
    if not learnset_contents:
        return {
            'error': 'invalid file',
            'message': 'The file could not be parsed.',
        }, 415
    learnset.title = form['title']
    learnset.subject = form['subject']
    learnset.description = form['description']
    learnset.class_ = form['class']
    learnset.grade = form['grade']
    learnset.language = form['language']
    learnset.edited = datetime.now()
    learnset.save()
    result1 = query_db('SELECT id FROM learn_exercises WHERE set_id=?', (learnset.id_,))
    existing_exercises = [i[0] for i in result1]
    for element in learnset_contents:
        existing_id = query_db('SELECT id FROM learn_exercises WHERE set_id=? AND question=?',
                               (learnset.id_, element['question']), True)
        if existing_id and len(existing_id) > 0 and isinstance(existing_id[0], int):
            exercise = LearnExercise.load(existing_id[0])
            exercise.answer = element['answer']
            exercise.answers = element['answers']
            exercise.frequency = element['frequency']
            exercise.auto_check = element['auto_check']
            exercise.save()
            while existing_id[0] in existing_exercises:
                existing_exercises.remove(existing_id[0])
        else:
            exercise = LearnExercise(
                set_id=learnset.id_,
                question=element['question'],
                answer=element['answer'],
                answers=element['answers'],
                frequency=element['frequency'],
                auto_check=element['auto_check'],
            )
            exercise.save()
    for element in existing_exercises:
        try:
            query_db('DELETE FROM learn_exercises WHERE id=? AND set_id=?', (element, learnset.id_))
        except Exception as error:
            log_exception('An error occurred while updating the learnset exercises' + 0 * str(error))
    return {
        'status': 'success',
        'message': 'Learnset edited successfully.',
    }


@app.route('/api/v1/learnsets/data/<learnset_id>', methods=['GET'])
def r_api_v1_learnsets_data(learnset_id):
    try:
        learnset = LearnSet.load(learnset_id).__dict__()
    except Exception as error:
        log_exception('An error occurred while loading the requested learnset' + 0 * str(error))
        return {
            'error': 'learnset not found',
            'message': 'The requested learnset could not be found.',
        }, 404
    learnset['created'] = learnset['created'].strftime(DATE_FORMAT)
    learnset['edited'] = learnset['edited'].strftime(DATE_FORMAT)
    exercises = []
    for element in query_db('SELECT id FROM learn_exercises WHERE set_id=?', (learnset_id,)):
        exercise = LearnExercise.load(element[0]).__dict__()
        exercises.append(exercise)
    return {
        'status': 'success',
        'message': 'learnset retrieved successfully.',
        'learnset': learnset,
        'exercises': exercises,
    }, 200


@app.route('/api/v1/learnsets/bulk/<learnset_ids>', methods=['GET'])
def r_api_v1_learnsets_bulk(learnset_ids):
    ids = learnset_ids.split('.')
    learnsets = []
    try:
        for element in ids:
            learnset = LearnSet.load(element).__dict__()
            learnset['created'] = learnset['created'].strftime(DATE_FORMAT)
            learnset['edited'] = learnset['edited'].strftime(DATE_FORMAT)
            learnsets.append(learnset)
    except Exception as error:
        log_exception('An error occurred while loading the requested learnsets' + 0 * str(error))
        return {
            'error': 'learnsets not found',
            'message': 'The requested learnsets could not be found.',
        }, 404
    exercises = []
    for element_id in ids:
        for element in query_db('SELECT id FROM learn_exercises WHERE set_id=?', (element_id,)):
            exercise = LearnExercise.load(element[0]).__dict__()
            exercises.append(exercise)
    stats = {}
    try:
        try:
            account = Login.load(session['account']).get_account()
            for exercise in exercises:
                result = query_db('SELECT id FROM learn_stats WHERE exercise_id=? AND owner=?',
                                  (exercise['id_'], account.id_), True)
                if result:
                    stats[exercise['id_']] = LearnStat.load(result[0]).__dict__()
        except KeyError:
            pass
    except Exception as error:
        log_exception('An error occurred while loading the learnset statistics' + 0 * str(error))
    return {
        'status': 'success',
        'message': 'learnsets retrieved successfully.',
        'learnsets': learnsets,
        'exercises': exercises,
        'stats': stats,
    }


@app.route('/api/v1/learnsets/answer/<exercise_id>', methods=['POST'])
@login_required
def r_api_v1_learnsets_answer(exercise_id: str):
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if (('answer' not in data) or ('value' not in data)
            or (not isinstance(data['answer'], str)) or (not isinstance(data['value'], bool))):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `answer`, `value`',
        }, 415
    account = Login.load(session['account']).get_account()
    result = query_db('SELECT id FROM learn_stats WHERE exercise_id=? AND owner=?', (exercise_id, account.id_), True)
    if result:
        learn_stat = LearnStat.load(result[0])
    else:
        learn_stat = LearnStat(
            exercise_id=exercise_id,
            owner=account.id_,
        )
    if data['value']:
        learn_stat.correct += 1
    else:
        learn_stat.wrong += 1
    learn_stat.save()
    return {
        'status': 'success',
        'message': 'The statistics have been updated.',
    }


@app.route('/api/v1/calendars/list', methods=['GET'])
@login_required
def r_api_v1_calendars_list():
    account = Login.load(session['account']).get_account()
    result = query_db('SELECT id, access FROM calendars')
    accessible = [i[0] for i in result if check_calendar_access(i[1], account)]
    calendars = []
    for element in accessible:
        try:
            calendars.append(Calendar.load(element[0]).__dict__())
        except Exception as error:
            log_exception('An error occurred while loading the requested calendar' + 0 * str(error))
    events = []
    for calendar in calendars:
        for event in query_db('SELECT id FROM calendar_events WHERE calendar=?', (calendar['id_'],)):
            try:
                events.append(CalendarEvent.load(event[0]).__dict__())
            except Exception as error:
                log_exception('An error occurred while loading the requested calendar' + 0 * str(error))
    return {
        'status': 'success',
        'message': 'Calendar events have been retrieved.',
        'calendars': calendars,
        'events': events,
    }, 200


@app.route('/api/v1/calendars/selection', methods=['GET'])
@login_required
def r_api_v1_calendars_selection():
    account = Login.load(session['account']).get_account()
    result = query_db('SELECT calendar FROM calendar_selections WHERE owner=?', (account.id_,))
    selection = [str(i[0]) for i in result]
    return {
        'status': 'success',
        'message': 'Calendar selections have been retrieved.',
        'selection': selection,
    }, 200


@app.route('/api/v1/calendars/selection/update', methods=['POST'])
@login_required
def r_api_v1_calendars_selection_update():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if ('value' not in data) or (not isinstance(data['value'], list)):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `value`',
        }, 415
    account = Login.load(session['account']).get_account()
    query_db('DELETE FROM calendar_selections WHERE owner=?', (account.id_,))
    for element in data['value']:
        element_id = rand_base64(19)
        query_db('INSERT INTO calendar_selections VALUES (?, ?, ?)', (element_id, account.id_, str(element)))
    return {
        'status': 'success',
        'message': 'Calendar selections have been updated.',
    }

@app.route('/api/v1/authorize', methods=['POST'])
@login_required
def r_api_v1_authorize():
    data = request.get_json(force=True, silent=True)
    if (data is None) or (not isinstance(data, dict)):
        return {
            'error': 'json parse error',
            'message': 'JSON object could not be parsed.',
        }, 415
    if not all(data.get(i, '') for i in [
        'url',
        'token',
    ]):
        return {
            'error': 'missing fields',
            'message': 'At least one of the following required fields is missing: `url`, `token`',
        }, 415
    account = Login.load(session['account']).get_account()
    req = requests_send(
        method='POST',
        url=data['url'],
        headers={
            'Content-Type': 'application/json',
        },
        data=dumps({
            'mail': account.mail,
            'token': data['token'],
        }),
    )
    if req.status_code != 200:
        return {
            'error': 'request error',
            'message': 'Request failed.',
        }, 500
    return {
        'status': 'success',
        'message': 'Successfully authorized.',
    }


@app.route('/api/v1/news/<file_name>', methods=['GET'])
def r_api_v1_news_list(file_name):
    if DEVELOPMENT:
        return {
            'content': '<p>Entwicklermodus ist aktiv</p>',
            'status': 'success',
            'message': 'news article found',
        }
    not_found = {
        'content': '<p>Artikel wurde nicht gefunden</p>',
        'error': 'not found',
        'message': 'news article not found',
    }, 400
    for i in "\n\\./":
        if i in file_name:
            return not_found
    full_path = join('/var/www/ksalp-ch-news/', file_name + '.html')
    if not exists(full_path):
        return not_found
    with open(full_path, 'r') as file:
        content = file.read()
    return {
        'content': content,
        'status': 'success',
        'message': 'news article found',
    }


@app.errorhandler(404)
def error_handler_404(*_, **__):
    if DEVELOPMENT:
        res = requests_send(
            method=request.method,
            url='http://' + request.url.replace(request.host_url, f'localhost:4200/'),  # noqa
            headers={k: v for k, v in request.headers if k.lower() != 'host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=True,
        )
        excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding',
                            'connection']
        headers = [
            (k, v) for k, v in res.raw.headers.items()
            if k.lower() not in excluded_headers
        ]
        response = Response(res.content, res.status_code, headers)  # noqa
        return response
    else:
        path = request.path
        if path and path.startswith('/'):
            path = path[1:]
        if path != '' and exists(relative_path(join('build', path))):
            return send_from_directory(relative_path('build'), path), 200
        else:
            return send_from_directory(relative_path('build'), 'index.html'), 200


if __name__ == '__main__':
    app.run('0.0.0.0', port=5000, debug=False)
