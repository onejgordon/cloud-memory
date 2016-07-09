import django_version
import os
from google.appengine.api import users, images
from datetime import datetime, timedelta
from google.appengine.ext.webapp import blobstore_handlers
from models import *
from constants import *
import webapp2
import urllib
import tools
import authorized
import actions
import handlers
import logging
import jinja2

class MegaphoneApp(handlers.BaseRequestHandler):
    @authorized.role()
    def get(self, *args, **kwargs):
        gmods = {
          "modules" : [
            # {
            #   "name" : "visualization",
            #   "version" : "1",
            #   "language" : "en",
            #   "packages": ["table", "timeline"]
            # },
            # {
            #     "name": "maps",
            #     "version": "3",
            #     "language": "en"
            # }
          ]
        }
        d = kwargs.get('d')
        d['constants'] = {
            "ga_id": GA_ID
        }
        d['gautoload'] = urllib.quote_plus(json.dumps(gmods).replace(' ',''))
        self.render_template("index.html", **d)

class Login(handlers.BaseRequestHandler):
    @authorized.role()
    def get(self, d):
        d['loginPage'] = True
        d['signupOpen'] = self.request.get_range('signup') == 1
        d['dest'] = self.request.get('page', default_value='/')
        d['login_url'] = jinja2.Markup(users.create_login_url(dest_url=webapp2.uri_for('vGAELogin')))
        self.render_template("login.html", **d)

class Logs(handlers.BaseRequestHandler):
    @authorized.role('user')
    def get(self, d):
        d['processers'] = SensorProcessTask.Fetch(enterprise=d['enterprise'])
        d['alarms'] = Alarm.Fetch(enterprise=d['enterprise'])
        self.render_template('logs.html', **d)


class Profile(handlers.BaseRequestHandler):
    @authorized.role('user')
    def get(self, d):
        d['pg_title'] = "Profile"
        d['u'] = d['user']
        d['editable'] = True
        self.render_template('profile.html', **d)


class Invite(handlers.BaseRequestHandler):
    @authorized.role('user')
    def get(self, d):
        d['pg_title'] = "Invite"
        d['admin_email'] = ADMIN_EMAIL
        d['invites'] = d['user'].userinvite_set.fetch(100)
        d['n_invites'] = d['user'].invites_allowed - d['user'].countInvites()
        d['canInvite'] = d['n_invites'] > 0
        self.render_template('invite.html', **d)

class UserDetail(handlers.BaseRequestHandler):
    @authorized.role()
    def get(self, id, d):
        d['u'] = u = User.get_by_id(int(id))
        d['pg_title'] = str(u)
        d['editable'] = False
        d['pickupDays'] = [ {'label': x, 'value': i+1} for i, x in enumerate(DAYS) ]
        d['pickupTimes'] = [ {'label': PICKUP_TIME.LABELS.get(x), 'value': x} for x in PICKUP_TIME.ALL ]
        self.render_template("profile.html", **d)


def serveResource(self, bk, size=0):
    USE_SERVING_URL = True
    try:
        # Fix?
        if USE_SERVING_URL and not tools.on_dev_server():
            url = images.get_serving_url(bk)
            url += "=s%d" % size
            self.redirect(url)
        else:
            blob_info = blobstore.BlobInfo.get(bk)
            self.send_blob(blob_info, content_type="image/jpeg")
    except Exception, e:
        logging.error("Error in serveResource: %s" % e)
        self.error(404)

class ServeBlob(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, bk, ext=None):
        """
        Size: 0 = full, 100 = 100px wide
        """
        size = self.request.get_range('size', default=0)
        serveResource(self, bk, size=size)
