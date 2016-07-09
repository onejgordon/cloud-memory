import logging
from datetime import datetime, timedelta
import webapp2
from google.appengine.ext import ndb, deferred, blobstore
from google.appengine.api import memcache, mail, images, taskqueue, search
import json
from markupsafe import Markup
from constants import *
from decorators import auto_cache
import tools
from oauth2client import client
import httplib2

class User(ndb.Model):
    """
    Users can record audio messages, as well as upvote and translate audio
    Key - ID
    """
    pw_sha = ndb.StringProperty(indexed=False)
    pw_salt = ndb.StringProperty(indexed=False)
    name = ndb.StringProperty(indexed=False)
    email = ndb.StringProperty()
    phone = ndb.StringProperty()  # Standard international
    dt_created = ndb.DateTimeProperty(auto_now_add=True)
    dt_last_login = ndb.DateTimeProperty(auto_now_add=True)
    level = ndb.IntegerProperty(default=USER.USER)
    location_text = ndb.StringProperty(indexed=False)
    currency = ndb.TextProperty(default="USD") # 3-letter e.g. USD
    credentials = ndb.TextProperty() # JSON credentials from oauth2client.client.Credentials
    # Service setup
    services_enabled = ndb.StringProperty(repeated=True, indexed=False)
    service_settings = ndb.TextProperty() # JSON ( service_key -> settings object )

    def __str__(self):
        return self.name if self.name else "User"

    def json(self):
        data = {
            'id': self.key.id(),
            'level':self.level,
            'level_name':self.print_level(),
            'name': self.name,
            'email':self.email,
            'phone': self.phone,
            'location_text': self.location_text,
            'ts_created': tools.unixtime(self.dt_created),
            'services_enabled': self.services_enabled,
            'service_settings': tools.getJson(self.service_settings)
        }
        return data

    @staticmethod
    def FuzzyGet(login):
        is_email = tools.is_valid_email(login)
        if is_email:
            return User.GetByEmail(login)
        else:
            phone = tools.standardize_phone(login)
            if phone:
                return User.GetByPhone(phone)
        return None


    @staticmethod
    def GetByEmail(email):
        u = User.query().filter(User.email == email.lower()).get()
        return u

    @staticmethod
    def Create(email=None, phone=None, name=None, level=None, notify=True, credentials=None):
        if (email or phone):
            u = User(email=email.lower() if email else None, phone=tools.standardize_phone(phone), name=name)
            if credentials:
                u.credentials = json.dumps(credentials)
            if email and email.lower() == ADMIN_EMAIL:
                u.level = USER.ADMIN
            elif notify:
                label = email if email else phone
                deferred.defer(mail.send_mail, SENDER_EMAIL, NOTIF_EMAILS, EMAIL_PREFIX + " New User: %s" % label, "That is all")
            u.services_enabled = SERVICE.DEFAULT
            return u
        return None

    def Update(self, **params):
        if 'name' in params:
            self.name = params['name']
        if 'email' in params:
            self.email = params['email']
        if 'phone' in params:
            self.phone = params['phone']
        if 'level' in params:
            self.level = params['level']
        if 'location_text' in params:
            self.location_text = params['location_text']
        if 'password' in params:
            if params['password']:
                self.setPass(params['password'])
        if 'services_enabled' in params:
            self.services_enabled = params['services_enabled']
        if 'service_settings' in params:
            self.service_settings = json.dumps(params['service_settings'])

    def get_svc_settings(self, svc_key):
        svc_settings = tools.getJson(self.service_settings)
        return svc_settings.get(svc_key, {})

    def get_credentials(self):
        if self.credentials:
            return client.Credentials.new_from_json(json.loads(self.credentials))
        return None

    def get_http_auth(self):
        cr = self.get_credentials()
        if cr:
            http_auth = cr.authorize(httplib2.Http())
            return http_auth
        return None

    def print_level(self):
        return USER.LABELS.get(self.level)

    def is_admin(self):
        return self.level == USER.ADMIN

    def is_account_admin(self):
        return self.level == USER.ACCOUNT_ADMIN

    def clean_delete(self):
        self.key.delete()

    def getTimezone(self):
        if self.timezone:
            return pytz.timezone(self.timezone)
        return self.enterprise.get_timezone()

    def validatePassword(self, user_password):
        salt, pw_sha = tools.getSHA(user_password, self.pw_salt)
        pw_valid = self.pw_sha == pw_sha
        return pw_valid

    def setPass(self, pw=None):
        if not pw:
            pw = tools.GenPasswd(length=6)
        self.pw_salt, self.pw_sha = tools.getSHA(pw)
        return pw

    @staticmethod
    def ValidateLogin(user, password):
        pw_valid = False
        login_attempts = None
        if user and password:
            pw_valid, login_attempts = user.validatePassword(password)
        return pw_valid, login_attempts

    def avatar_serving_url(self, size=500):
        if self.av_data_key:
            gskey = blobstore.create_gs_key(filename=self.av_data_key)
            return images.get_serving_url(gskey, size=size)
        else:
            return "/images/user.png"

    def has_avatar(self):
        return self.av_data_key is not None

    def get_groups(self):
        if self.group_ids:
            return SensorGroup.get_by_id(self.group_ids)
        else:
            return []

class DaySearch(ndb.Model):
    '''
    Parent - User
    Key - date_iso
    '''
    user = ndb.KeyProperty(User)
    date = ndb.StringProperty() # ISO
    count = ndb.IntegerProperty(indexed=False)
    starred = ndb.BooleanProperty(default=False)

    def json(self):
        return {
            'id': self.key.id(),
            'date': self.date,
            'user_id': self.user.id(),
            'count': self.count,
            'starred': self.starred
        }

    @staticmethod
    def Star(user=None, date=None, do_star=True):
        if user and date:
            ds = DaySearch.get_by_id(date)
            if ds:
                ds.starred = do_star
            else:
                ds = DaySearch(id=date, user=user.key, date=date, count=0, starred=do_star, parent=user.key)
            ds.put()
            return (True, ds)
        return (False, None)


    @staticmethod
    def Increment(user=None, date=None):
        if user and date:
            ds = DaySearch.get_by_id(date)
            if ds:
                ds.count += 1
            else:
                ds = DaySearch(id=date, user=user.key, date=date, count=1, parent=user.key)
            ds.put()

    @staticmethod
    def Starred(user=None, _max=20):
        q = DaySearch.query().filter(DaySearch.user == user.key).filter(DaySearch.starred == True)
        return q.fetch(_max)

class APILog(ndb.Model):
    """
    Key - ID
    """
    user = ndb.KeyProperty(User)
    # Request
    host = ndb.TextProperty()
    path = ndb.TextProperty()
    status = ndb.IntegerProperty(indexed=False)
    request = ndb.TextProperty() # With authentication params stripped
    method = ndb.TextProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)
    # Response
    success = ndb.BooleanProperty(indexed=False)
    message = ndb.TextProperty()

    def json(self):
        return {
            'id': self.key.id(),
            'ts': tools.unixtime(self.date),
            'host': self.host,
            'path': self.path,
            'method': self.method,
            'status': self.status,
            'request': self.request,
            'success': self.success,
            'message': self.message
        }

    @staticmethod
    def Create(request, user=None, enterprise=None, status=200, success=None, message=None):
        try:
            path = request.path
            host = request.host
            method = request.method
            AUTH_PARAMS = ['auth', 'password']  # To not be included in log
            req = {}
            for arg in request.arguments():
                if arg not in AUTH_PARAMS:
                    try:
                        req[arg] = request.get(arg)
                    except Exception, ex:
                        logging.warning("Unable to log arg: %s (%s)" % (arg, ex))
            if path and (user or enterprise):
                if not enterprise:
                    enterprise = user.enterprise
                al = APILog(path=path, user=user, enterprise=enterprise, parent=enterprise, status=status, method=method, host=host, request=json.dumps(req), message=message)
                if success is not None:
                    al.success = success
                if al:
                    al.put()
                return al
            return None
        except Exception, e:
            logging.error("Error creating APILog: %s" % e)
            return None

    @staticmethod
    def Recent(_max=20):
        q = APILog.query().order(-APILog.date)
        return q.fetch(_max)

class Item(object):

    def __init__(self, id=None, svc=None, title=None, subhead=None, details=None, link=None, type=None):
        self.id = id
        self.svc = svc
        self.title = title
        self.subhead = subhead
        self.details = details
        self.link = link
        self.type = type


    def json(self):
        return {
            'id': self.id,
            'svc': self.svc,
            'title': self.title,
            'subhead': self.subhead,
            'details': self.details,
            'link': self.link,
            'type': self.type
        }