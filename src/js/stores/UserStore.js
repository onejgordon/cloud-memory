var alt = require('config/alt');
var UserActions = require('actions/UserActions');
import {findItemById, findIndexById} from 'utils/store-utils';
import router from 'config/router';
var toastr = require('toastr');
import { browserHistory } from 'react-router';
import {defer} from 'lodash';
var AppConstants = require('constants/AppConstants');

class UserStore {
    constructor() {
        this.bindActions(UserActions);
        this.user = null;
        this.error = null;

        this.exportPublicMethods({
            get_user: this.get_user
        });
    }

    storeUser(user) {
        this.user = user;
        this.error = null;
        console.log("Stored user "+user.email);
        // api.updateToken(user.token);
        localStorage.setItem(AppConstants.USER_STORAGE_KEY, JSON.stringify(user));
    }

    loadLocalUser() {
        var user;
        try {
            user = JSON.parse(localStorage.getItem(AppConstants.USER_STORAGE_KEY));
        } finally {
            if (user) {
                console.log("Successfully loaded user " + user.email);
                this.storeUser(user);
            }
        }
    }

    clearUser() {
        this.user = null;
        // api.updateToken(null);
        localStorage.removeItem(AppConstants.USER_STORAGE_KEY);
    }

    onLogin(data) {
        if (data.ok) {
            this.storeUser(data.user);
            defer(browserHistory.push.bind(this, `/app`));
        } else {
            this.clearUser();
            this.error = data.error;
        }
    }

    onOfflineLogin(data) {
        if (data.ok) {
            this.storeUser(data.user);
            defer(browserHistory.push.bind(this, `/app`));
        } else {
            this.clearUser();
            this.error = data.error;
        }
    }

    onLogout(data) {
        if (data.success) {
            this.clearUser();
            this.error = null;
            toastr.success("You're logged out!");
            history.replaceState(null, '/');
        }
    }

    onUpdate(data) {
        this.storeUser(data.user);
    }

    manualUpdate(user) {
        this.storeUser(user);
    }

    // Automatic

    get_user(uid) {
        var u = this.getState().users[uid];
        return u;
    }
}

module.exports = alt.createStore(UserStore, 'UserStore');