var React = require('react');
var Router = require('react-router');

var util = require('utils/util');

var bootstrap = require('bootstrap');
var AppConstants = require('constants/AppConstants');
var toastr = require('toastr');
import history from 'config/history'
var $ = require('jquery');

var mui = require('material-ui'),
  FontIcon = mui.FontIcon,
  RaisedButton = mui.RaisedButton,
  FlatButton = mui.FlatButton;

var UserActions = require('actions/UserActions');
var UserStore = require('stores/UserStore');
var AppConstants = require('constants/AppConstants');

import connectToStores from 'alt-utils/lib/connectToStores';
import {changeHandler} from 'utils/component-utils';

@connectToStores
@changeHandler
class Public extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ln_open: false
    };
  }
  static getStores() {
    return [UserStore];
  }
  static getPropsFromStores() {
    return UserStore.getState();
  }

  componentDidMount() {
    $("body").addClass("public");
    // $('link[title=public_css]').prop('disabled',false);
  }

  componentWillUnmount() {
    $("body").removeClass("public");
    // $('link[title=public_css]').prop('disabled',true);
  }


  handle_toggle_leftnav = () => this.setState({ln_open: !this.state.ln_open});

  handle_leftnav_change = (open) => this.setState({ln_open: open});

  goto_page(link) {
    window.location = link;
  }

  navigate_to_page(page) {
    history.pushState(null, page);
  }

  render() {
    let btn_style = {
    }
    return (
      <div className="container">

          <div className="text-center">

            <FontIcon className="material-icons" style={{width: "400px", height: "200px", fontSize: "12em"}}>cloud_queue</FontIcon>

            <p className="lead" style={{fontSize: "3em"}}>{ AppConstants.DESCRIPTION }</p>

            <div style={{color: "gray", fontSize: "1.6em"}}>
              <p>Choose which services to connect (e.g. Gmail, Google Calendar, Drive, Tasks, 
                or public news sources), pick a date, and see a snapshot.</p>

              <p>Your data is yours. Cloudy Memory wont store any of your data, and is open source and free to tinker with.</p>

              <p>Sign in to try it.</p> 

            </div>

          </div>

          <div className="text-center" style={{marginTop: "15px"}}>

              <FlatButton style={btn_style} onClick={this.goto_page.bind(this, "https://github.com/onejgordon/cloud-memory")} icon={<i className="fa fa-github"/>} label="Contribute" />
              <RaisedButton style={btn_style} primary={true} label="Sign In" onClick={UserActions.login.bind(this)} />                

          </div>

      </div>
    )
  }
};

module.exports = Public;
