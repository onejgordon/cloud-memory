var alt = require('config/alt');
var DataActions = require('actions/DataActions');
import {findItemById, findIndexById} from 'utils/store-utils';
import {isEmpty} from 'lodash';
import router from 'config/router';
var toastr = require('toastr');
var AppConstants = require('constants/AppConstants');
var util = require('utils/util');

class DataStore {
    constructor() {
        this.bindActions(DataActions);

        // Store
        this.data = {}; // mckey (date and svc) -> day data object { results (arry), status (int), issue (str) }

        this.exportPublicMethods({
            mckey: this.mckey
        });

    }

    onFetchDayData(data) {
        if (data != null) {
            for (var mckey in data) {
                if (data.hasOwnProperty(mckey)) {
                    this.data[mckey] = data[mckey];
                    console.log("Got data for " + mckey);
                }
            }
        }
    }

    // Public

    mckey(svc, date) {
        // Sync with api.py
        return svc+":"+util.printDateObj(date);
    }

	// Automatic

    get_day_data(args) {
        let [mckeys, date, limit] = args;
        var date_str = util.printDateObj(date);
        var day_data = this.data[date_str];
        if (day_data == null) {
            DataActions.fetchDayData(mckeys, date_str, limit)
            return {};
        } else {
            // We have data for this date & service
            return day_data;
        }
    }


}

module.exports = alt.createStore(DataStore, 'DataStore');