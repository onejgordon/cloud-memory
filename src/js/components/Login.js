'use strict';

var React = require('react');
var mui = require('material-ui'),
  RaisedButton = mui.RaisedButton,
  Paper = mui.Paper,
  Dialog = mui.Dialog,
  TextField = mui.TextField;

var util = require('utils/util');
var toastr = require('toastr');
var api = require('utils/api');
var bootstrap = require('bootstrap');
var UserActions = require('actions/UserActions');
var UserStore = require('stores/UserStore');
var AppConstants = require('constants/AppConstants');
var client_secrets = require('constants/client_secrets');
import GoogleLogin from 'react-google-login';

import connectToStores from 'alt-utils/lib/connectToStores';
import {changeHandler} from 'utils/component-utils';

@connectToStores
@changeHandler
class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginForm: {},
      forgotForm: {},
      forgot_dialog: false
    };
  }
  static getStores() {
    return [UserStore];
  }
  static getPropsFromStores() {
    return UserStore.getState();
  }

  login() {
    UserActions.login(this.state.loginForm)
  }

  toggle_forgot() {
    this.setState({forgot_dialog: !this.state.forgot_dialog});
  }

  googleCallback(gUser) {
    console.log(gUser);
    var profile = gUser.getBasicProfile();
    var id_token = gUser.getAuthResponse().id_token;
    var email = profile.getEmail()
    UserActions.login({idtoken: id_token});
  }

  googleOfflineCallback(authResult) {
    if (authResult['code']) {
      UserActions.offlineLogin(authResult['code']);
    }
  }

  forgot() {
    var that = this;
    var email = this.state.forgotForm.email;
    if (email) {
      api.post(`/api/public/forgot_password/${email}`, {}, function(res) {
        if (res.success) that.toggle_forgot();
      });
    }
  }

  render() {
    var scopes = "https://mail.google.com/ profile email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/tasks.readonly";
    return (
        <div className="row">
          <Paper className="col-sm-8 col-sm-offset-2" zDepth="3" style={{marginTop: "30px", padding: "20px"}} rounded={true}>

            <h1>Sign In</h1>
            <div className="alert alert-danger" hidden={!this.props.error}>{ this.props.error }</div>

            <p className="lead">You can sign in with Google...</p>
            <GoogleLogin
              scope={scopes}
              clientId={client_secrets.G_OAUTH_CLIENT_ID}
              buttonText="Google Sign In"
              offline={true}
              callback={this.googleOfflineCallback.bind(this)} />

          </Paper>

          <Dialog title="Forgot Password?" open={this.state.forgot_dialog} onRequestClose={this.toggle_forgot.bind(this)}>
            <TextField
                type='text'
                hintText="Enter Email"
                floatingLabelText="Email"
                value={this.state.forgotForm.email}
                onChange={this.changeHandler.bind(this, 'forgotForm', 'email')} />
            <RaisedButton onClick={this.forgot.bind(this)} label="Reset Password"
              secondary={true} />
          </Dialog>
        </div>

    )
  }
};

module.exports = Login;
