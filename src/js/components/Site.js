'use strict';

var React = require('react');
var Router = require('react-router');
var mui = require('material-ui');
var alt = require('config/alt');
var UserStore = require('stores/UserStore');
var UserActions = require('actions/UserActions');
var AppConstants = require('constants/AppConstants');
var toastr = require('toastr');
var RouteHandler = Router.RouteHandler;
import { supplyFluxContext } from 'alt-react'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import {fade} from 'material-ui/utils/colorManipulator';
import {
  blue400, blue700, blue900, blueA400,
  lightBlack, darkBlack,
  grey100, grey500, grey300,
  white
} from 'material-ui/styles/colors';

const muiTheme = getMuiTheme({
  fontFamily: 'Roboto, sans-serif',
  palette: {
    primary1Color: blue400,
    primary2Color: blue900,
    primary3Color: lightBlack,
    accent1Color: blueA400,
    accent2Color: grey100,
    accent3Color: grey500,
    textColor: darkBlack,
    alternateTextColor: white,
    canvasColor: white,
    borderColor: grey300,
    disabledColor: fade(darkBlack, 0.3)
  }
});

class Site extends React.Component {
  constructor(props) {
    super(props);
    UserActions.loadLocalUser();
  }

  componentDidMount() {
    toastr.options.closeButton = true;
    toastr.options.progressBar = true;
    toastr.options.positionClass = "toast-bottom-left";
  }

  render() {
    var YEAR = new Date().getFullYear();
    var copyright_years = AppConstants.YEAR;
    if (YEAR != AppConstants.YEAR) copyright_years = copyright_years + " - " + YEAR;
    return (
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
            <div>{this.props.children}</div>

            <div id="footer">
              &copy; { copyright_years } { AppConstants.COMPANY }<br/>
            </div>
          </div>
        </MuiThemeProvider>
    )
  }
};

// Important!
Site.childContextTypes = {
  muiTheme: React.PropTypes.object
};

var injectTapEventPlugin = require("react-tap-event-plugin");
//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
injectTapEventPlugin();

export default supplyFluxContext(alt)(Site)
