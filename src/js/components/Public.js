var React = require('react');
var Router = require('react-router');

var util = require('utils/util');

var bootstrap = require('bootstrap');
var toastr = require('toastr');
import history from 'config/history'
var $ = require('jquery');

var mui = require('material-ui'),
  FontIcon = mui.FontIcon,
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
    return (
      <div className="container">

          <div>
            { this.props.children }
          </div>
      </div>
    )
  }
};

module.exports = Public;
