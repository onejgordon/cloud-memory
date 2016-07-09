from google.appengine.ext import db, deferred, blobstore
from google.appengine.api import mail, images, urlfetch, memcache
import os
from datetime import datetime,timedelta
import tools
import authorized
import logging
from models import Item
from constants import *
import handlers
import json
from apiclient import discovery
import httplib2
from oauth2client import client

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)



class ServiceError(Exception):
    def __init__(self, message, errors=None):
        super(ServiceError, self).__init__(message)

# Config functions

def config_g_tasks(user, http_auth):
    service = discovery.build('tasks', 'v1', http=http_auth)
    options =[]
    results = service.tasklists().list(
        maxResults=10).execute()
    logging.debug(results)
    if results:
        options = [{"value": r.get('id'), "label": r.get('title')} for r in results.get('items', [])]
    return {
        "input": "select",
        "multi": False,
        "prop": "taskList",
        "options": options
    }


# Fetch classes

class ServiceFetcher(object):

    def __init__(self, user=None, date_dt=None, next_date_dt=None, http_auth=None, limit=10):
        self.user = user
        self.date_dt = date_dt
        self.next_date_dt = next_date_dt
        self.http_auth = http_auth
        self.limit = limit
        self.service = None

    def build_service(self, api, version):
        logging.debug("Building service for %s (%s)" % (api, version))
        self.service = discovery.build(api, version, http=self.http_auth)

    def fetch(self):
        '''Override'''
        pass

class ServiceFetcher_g_calendar(ServiceFetcher):

    def __init__(self, **kwargs):
        super(ServiceFetcher_g_calendar, self).__init__(**kwargs)

    def fetch(self):
        GCAL_DATE_FMT = "%Y-%m-%dT%H:%M:%SZ"
        logging.debug("Fetching google calendar data")
        self.build_service('calendar', 'v3')
        timeMin = self.date_dt.isoformat() + 'Z'
        timeMax = self.next_date_dt.isoformat() + 'Z'
        results = self.service.events().list(calendarId='primary',
            maxResults=self.limit,
            timeMin=timeMin,
            timeMax=timeMax).execute()
        if results:
            items = [Item(svc=SERVICE.GCAL, title=r.get('summary'), details=r.get('description'), id=r.get('id'), type=SERVICE.EVENT).json() for r in results.get('items', [])]
            return items
        return []

class ServiceFetcher_g_tasks(ServiceFetcher):

    def __init__(self, **kwargs):
        super(ServiceFetcher_g_tasks, self).__init__(**kwargs)

    def fetch(self):
        self.build_service('tasks', 'v1')
        timeMin = self.date_dt.isoformat() + 'Z'
        timeMax = self.next_date_dt.isoformat() + 'Z'
        gt_settings = self.user.get_svc_settings('g_tasks')
        tasklist = gt_settings.get('taskList', {}).get("value")
        if tasklist:
            results = self.service.tasks().list(
                tasklist=tasklist,
                maxResults=self.limit,
                completedMin=timeMin,
                completedMax=timeMax).execute()
            if results:
                logging.debug(results)
                items = [Item(svc=SERVICE.GTASKS, title=r.get('title'), id=r.get('id'), type=SERVICE.TASK).json() for r in results.get('items', [])]
                return items
        else:
            raise ServiceError("No tasklist configured")
        return []

class ServiceFetcher_g_mail(ServiceFetcher):

    def __init__(self, **kwargs):
        super(ServiceFetcher_g_mail, self).__init__(**kwargs)
        self.items = []

    def _handle_gmail_message(self, request_id, response, exception):
        if exception is not None:
            logging.error(str(exception))
        else:
            if response:
                headers = response.get('payload').get('headers')
                subject = _from = _to = _date = None
                for h in headers:
                    if h.get('name') == 'Subject':
                        subject = h.get('value')
                    if h.get('name') == 'From':
                        _from = h.get('value')
                    if h.get('name') == 'To':
                        _to = h.get('value')
                    if h.get('name') == 'Date':
                        _date = h.get('value')
                if subject and _from:
                    self.items.append(Item(svc=SERVICE.GMAIL, title=subject, subhead=_from, id=response.get('id'), type=SERVICE.EMAIL).json())

    def fetch(self):
        BATCH_MESSAGES = True
        before_gdate = datetime.strftime(self.next_date_dt, "%Y/%m/%d")
        after_gdate = datetime.strftime(self.date_dt, "%Y/%m/%d")
        self.build_service('gmail', 'v1')
        query = 'before:%s after:%s' % (before_gdate, after_gdate)
        logging.debug(query)
        if BATCH_MESSAGES:
            # Fetch message IDs
            results = self.service.users().messages().list(userId='me', maxResults=self.limit, q=query).execute()
            if results:
                ids = [r.get('id') for r in results.get('messages', [])]
                if ids:
                    batch = self.service.new_batch_http_request(callback=self._handle_gmail_message)
                    for id in ids:
                        batch.add(self.service.users().messages().get(id=id, userId="me"), request_id=id)
                    batch.execute(http=self.http_auth) # Blocks, populates self.items
        else:
            # Only threads show snippets in Gmail API?
            results = self.service.users().threads().list(userId='me', maxResults=limit, fields='threads', q=query).execute()
            if results:
                self.items = [Item(svc=SERVICE.GMAIL, title=r.get('snippet'), id=r.get('id'), type=SERVICE.EMAIL).json() for r in results.get('threads', [])]
        return self.items


class ServiceFetcher_g_photo(ServiceFetcher):

    def __init__(self, **kwargs):
        super(ServiceFetcher_g_photo, self).__init__(**kwargs)

    def fetch(self):
        logging.debug("Fetching photo data")
        self.build_service('drive', 'v3')
        appfolder = self.service.files().get(fileId='appfolder').execute()
