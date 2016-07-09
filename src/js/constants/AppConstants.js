var AppConstants = {
  YEAR: "2016",
  SITENAME: "Cloud Memory",
  DESCRIPTION: "Explore day-long slices of your personal data.",
  COMPANY: "Shore East",
  BASE_URL: "http://silicon-dream.appspot.com",
  SERVICES: [
    { value: "g_mail", label: "Gmail", configurable: false },
    { value: "g_calendar", label: "Google Calendar", configurable: false },
    { value: "g_photo", label: "Google Photos", configurable: false },
    { value: "g_tasks", label: "Google Tasks", configurable: true }
  ],
  USER_READ: 1,
  USER_RW: 2,
  USER_ACCOUNT_ADMIN: 3,
  USER_ADMIN: 4,
  USER_LABELS: [ "Read", "Read-Write", "Account Admin", "Admin" ],
  // Load statuses
  ST_NOT_LOADED: 0,
  ST_LOADING: 1,
  ST_ERROR: 2,
  ST_LOADED: 3,
  STATUS_ICONS: {
    0: "fa fa-cancel",
    1: "fa fa-refresh fa-spin",
    2: "fa fa-danger",
    3: "fa fa-check"
  },
  SERVICE_TYPES: [
    { value: 1, label: "Email", icon: "email" },
    { value: 2, label: "Event", icon: "event" },
    { value: 3, label: "Photo", icon: "photo" },
    { value: 4, label: "Task", icon: "check_circle" }
  ],
  G_OAUTH_CLIENT_ID: "46232818432-jri64r1hike46om42c8mlv0gesa0e0r1.apps.googleusercontent.com",
  G_OAUTH_CLIENT_SECRET: "MeyftOf7T7DEU6mIffNosE04",
  USER_STORAGE_KEY: 'sdUser'
};

module.exports = AppConstants;