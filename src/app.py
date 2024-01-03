#!/usr/bin/env python3

########################################################################################################################
# IMPORTS
########################################################################################################################


from sqlite3 import connect as sqlite_connect, Connection as SQLite_Connection
from flask import Flask, g
from os.path import join, exists
from os import urandom, environ
from datetime import timedelta, datetime
from logging import FileHandler as LogFileHandler, StreamHandler as LogStreamHandler, log as logging_log
from logging import basicConfig as log_basicConfig, getLogger as GetLogger, Formatter as LogFormatter
from logging import INFO as LOG_INFO
from base64 import urlsafe_b64encode, urlsafe_b64decode
from hashlib import pbkdf2_hmac

from resources import *

########################################################################################################################
# GENERAL SETUP
########################################################################################################################


app = Flask(__name__)

if not exists(join(app.root_path, 'resources', 'key.bin')):
    with open(join(app.root_path, 'resources', 'key.bin'), 'wb') as _f:
        _f.write(urandom(64))
with open(join(app.root_path, 'resources', 'key.bin'), 'rb') as _f:
    _secret_key = _f.read()
app.secret_key = _secret_key

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
    stream_handler = LogStreamHandler()
    stream_handler.setFormatter(formatter)
    logger.setLevel(LOG_INFO)
    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)


log_basicConfig(filename='main.log', format='%(asctime)s\t%(message)s', datefmt='%Y-%m-%d_%H-%M-%S', level=LOG_INFO)

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
        db = g._database = sqlite_connect('database.db')
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
# HASHING
########################################################################################################################


def hash_password(password: str, salt: bytes):
    return pbkdf2_hmac(
        hash_name='sha3_512',
        password=urlsafe_b64decode(environ['HASH_PEPPER_1']) + password.encode() + urlsafe_b64decode(environ['HASH_PEPPER_2']),
        salt=salt,
        iterations=int(environ['HASH_ITERATIONS']),
    )


########################################################################################################################
# CLASSES
########################################################################################################################


class User:

    def __init__(self, id_: str = None, name: str = '', mail: str = '', salt: bytes = b'', hash_: bytes = b'',
                 newsletter: int = 0, created: datetime = None, theme: str = '', iframe: int = 0, payment: datetime = None,
                 banned: list = None, search: str = 'startpage', classes: list = None, grade: str = '') -> None:
        self._id = ''
        self._name = ''
        self._mail = ''
        self._salt = ''
        self._hash = ''
        self._newsletter = 0
        self._created = ''
        self._theme = ''
        self._iframe = 0
        self._payment = ''
        self._banned = ''
        self._search = 'startpage'
        self._classes = ''
        self._grade = ''
        if id_ is None:
            id_ = rand_base64(8)
        if created is None:
            created = datetime.now()
        if payment is None:
            payment = datetime.strptime('2000-00-00', '%Y-%m-%d')
        if banned is None:
            banned = []
        if classes is None:
            classes = None
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
        self.banned = banned
        self.search = search
        self.classes = classes
        self.grade = grade

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
            'banned': self.banned,
            'search': self.search,
            'classes': self.classes,
            'grade': self.grade,
        }

    @staticmethod
    def create_table() -> None:
        """
        Creates the necessary SQL table
        :return:
        """
        query_db('CREATE TABLE IF NOT EXISTS users ('
                 'id TEXT PRIMARY KEY, '
                 'name TEXT NOT NULL, '
                 'mail TEXT NOT NULL, '
                 'salt TEXT NOT NULL, '
                 'hash TEXT NOT NULL, '
                 'newsletter INTEGER NOT NULL, '
                 'created TEXT NOT NULL, '
                 'theme TEXT NOT NULL, '
                 'iframe INTEGER NOT NULL, '
                 'payment TEXT NOT NULL, '
                 'banned TEXT NOT NULL, '
                 'search TEXT NOT NULL, '
                 'class TEXT NOT NULL, '
                 'grade TEXT NOT NULL)')

    def save(self) -> None:
        """
        Saves the user in the database.
        :return: None
        """
        if self._id is None:
            raise ValueError('No user id')
        if not query_db('SELECT id FROM users WHERE id=?', (self._id,), True):
            query_db('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', (
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
                self._banned,
                self._search,
                self._classes,
                self._grade,
            ))
        else:
            query_db('UPDATE users SET name=?, mail=?, salt=?, hash=?, newsletter=?, created=?, theme=?, iframe=?, payment=?, '
                     'banned=?, search=?, class=?, grade=? WHERE id=?', (
                         self._name,
                         self._mail,
                         self._salt,
                         self._hash,
                         self._newsletter,
                         self._created,
                         self._theme,
                         self._iframe,
                         self._payment,
                         self._banned,
                         self._search,
                         self._classes,
                         self._grade,
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
        return User(*result)

    @property
    def id_(self) -> str:
        return self._id

    @id_.setter
    def id_(self, _: str = None) -> None:
        raise ValueError(f"Cannot change id of user")

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
        return urlsafe_b64decode(self._salt)

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
        if v not in GRADES.keys():
            raise ValueError(f"{v} is not a valid search engine")
        self._grade = v

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
        return (self.payment - datetime.now()).seconds > 0


if __name__ == '__main__':
    app.run()
