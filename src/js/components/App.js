'use strict';

var React = require('react');
var Router = require('react-router');
var util = require('utils/util');
var $ = require('jquery');
var bootstrap = require('bootstrap');
var toastr = require('toastr');
import {
  blue400, blue700, blue900, blueA400,
  white
} from 'material-ui/styles/colors';

var mui = require('material-ui'),
  FlatButton = mui.FlatButton,
  IconButton = mui.IconButton,
  IconMenu = mui.IconMenu,
  Avatar = mui.Avatar,
  MenuItem = mui.MenuItem;

var AppConstants = require('constants/AppConstants');
var Link = Router.Link;
var RouteHandler = Router.RouteHandler;

var UserActions = require('actions/UserActions');
var UserStore = require('stores/UserStore');
import connectToStores from 'alt-utils/lib/connectToStores';
import {authDecorator} from 'utils/component-utils';
import { browserHistory } from 'react-router';

@connectToStores
@authDecorator
export default class App extends React.Component {

  static defaultProps = { enterprise: null };
  constructor(props) {
    super(props);
    this.state = {

    };
  }
  static getStores() {
    return [UserStore];
  }
  static getPropsFromStores() {
    var st = UserStore.getState();
    return st;
  }

  componentDidMount() {
    var tz = this.props.user ? this.props.user.timezone : "Africa/Nairobi";
    util.startAutomaticTimestamps(tz, 5);
    // $('link[title=app_css]').prop('disabled',false);
  }

  componentWillUnmount() {
    // $('link[title=app_css]').prop('disabled',true);
    // TODO: Remove automatic timestamps
  }

  toggle_search(open) {
    this.setState({search_open: open});
  }

  menuSelect(menu, e, value) {
    if (value == "logout" && menu == "user") UserActions.logout();
    else browserHistory.push(value);
  }

  render() {
    var user = this.props.user;
    var is_admin = user ? user.level == AppConstants.USER_ADMIN : false;
    var can_write = user ? user.level > AppConstants.USER_READ : false;
    var wide = this.props.wide;
    var YEAR = AppConstants.YEAR;
    var SITENAME = AppConstants.SITENAME;
    var _user_section;
    if (!user) {
      _user_section = (
        <div className="pull-right">
          <Link to="/app/login"><FlatButton label="Sign In" /></Link>
        </div>
        );
    } else {
      var user_string = user.name || user.email || "User";
      var loc = user.location_text || "Somewhere";
      var user_letter = user_string[0];
      var _avatar = (
        <Avatar
          color={white}
          backgroundColor={blue400}
          size={30} style={{cursor:'pointer'}}>{user_letter.toUpperCase()}</Avatar>
      );
      _user_section = (
        <div className="userSection col-sm-4 col-sm-offset-6">

          <div className="userAvatar row">
            <div className="col-sm-10">
              <span className="handle">{ user_string }</span>
            </div>
            <div className="col-sm-2">
              <IconMenu iconButtonElement={ _avatar } onChange={this.menuSelect.bind(this, 'user')}>
                <MenuItem value="/app/settings" primaryText="Settings" />
                <MenuItem value="logout" primaryText="Sign Out" />
              </IconMenu>
            </div>
          </div>
        </div>
        )
    }
    return (
      <div>

        <div id="container" className="container">
          <header className="topBar row">
            <div className="siteHeader col-sm-2">
              <Link to="/app"><h1 className="siteTitle">{ SITENAME }</h1></Link>
            </div>

            { _user_section }

          </header>
          <div className="app-content row">
            {this.props.children}
          </div>
        </div>

      </div>
    )
  }
}