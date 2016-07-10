var AppConstants = {
  YEAR: "2016",
  SITENAME: "Cloud Memory",
  DESCRIPTION: "Explore day-long slices of your personal data.",
  COMPANY: "Shore East",
  BASE_URL: "http://cloudmemory-app.appspot.com",
  PERSISTENCE: "bootstrap",
  SERVICES: [
    { value: "g_mail", label: "Gmail", configurable: false, personal: true, scopes: ["https://mail.google.com/"] },
    { value: "g_calendar", label: "Google Calendar", configurable: false, personal: true, scopes: ["https://www.googleapis.com/auth/calendar.readonly"] },
    // { value: "g_photo", label: "Google Photos", configurable: false },
    { value: "g_tasks", label: "Google Tasks", configurable: true, personal: true, scopes: ["https://www.googleapis.com/auth/tasks.readonly"] },
    { value: "g_drive", label: "Google Drive", personal: true, scopes: ["https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.readonly","https://www.googleapis.com/auth/drive.photos.readonly"] },
    { value: "nyt_news", label: "NYT News", personal: false }
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
    0: "fa fa-cog fa-spin",
    1: "fa fa-refresh fa-spin",
    2: "fa fa-warning",
    3: "fa fa-check"
  },
  STATUS_COLORS: {
    0: "black",
    1: "black",
    2: "red",
    3: "green"
  },
  ITEM_TYPES: [
    { value: 1, label: "Email", icon: "email" },
    { value: 2, label: "Event", icon: "event" },
    { value: 3, label: "Photo", icon: "photo", multimedia: true },
    { value: 4, label: "Task", icon: "check_circle" },
    { value: 5, label: "Document", icon: "insert_drive_file" },
    { value: 6, label: "News", icon: "radio", multimedia: true }
  ],
  USER_STORAGE_KEY: 'sdUser'
};

module.exports = AppConstants;