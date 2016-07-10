var React = require('react');

var SimpleAdmin = require('components/SimpleAdmin');
var LoadStatus = require('components/LoadStatus');
var AppConstants = require('constants/AppConstants');
var util = require('utils/util');
var FetchedList = require('components/FetchedList');
var api = require('utils/api');
var bootbox = require('bootbox');
import {merge} from 'lodash';
var UserActions = require('actions/UserActions');
var UserStore = require('stores/UserStore');
var DataActions = require('actions/DataActions');
var DataStore = require('stores/DataStore');
var ReactTooltip = require('react-tooltip');
var Select = require('react-select');
var mui = require('material-ui'),
  List = mui.List,
  ListItem = mui.ListItem,
  TextField = mui.TextField,
  FontIcon = mui.FontIcon,
  Tabs = mui.Tabs,
  Tab = mui.Tab,
  GridTile = mui.GridTile,
  GridList = mui.GridList,
  FontIcon = mui.FontIcon,
  IconButton = mui.IconButton,
  DatePicker = mui.DatePicker,
  Toolbar = mui.Toolbar,
  ToolbarGroup = mui.ToolbarGroup,
  ToolbarTitle = mui.ToolbarTitle,
  IconMenu = mui.IconMenu,
  MenuItem = mui.MenuItem,
  RaisedButton = mui.RaisedButton;
import {changeHandler} from 'utils/component-utils';
import connectToStores from 'alt-utils/lib/connectToStores';

@connectToStores
@changeHandler
export default class Main extends React.Component {
    static defaultProps = {}
    constructor(props) {
        super(props);
        this.state = {
          form: {
            date: new Date(),
            limit: 10
          },
          loading: false
        };
    }

    static getStores() {
        return [UserStore, DataStore];
    }

    static getPropsFromStores() {
        var st = UserStore.getState();
        merge(st, DataStore.getState());
        return st;
    }

    componentDidMount() {
      DataActions.get_recent_stars();
    }

    get_service_data(svc) {
      var date = this.state.form.date;
      var mckey = DataStore.mckey(svc, date);
      var svc_data = this.props.data[mckey];
      return svc_data;
    }

    get_day() {
        var date = this.state.form.date;
        var u = this.props.user;
        if (date != null) {
          this.setState({loading: true});
          var limit = this.state.form.limit;
          var mckeys = this.unfetched_mckeys();
          if (mckeys.length > 0) {
            DataActions.get_day_data(mckeys, date, limit);
            window.setTimeout(this.get_day.bind(this), 1000*5);
          } else {
            this.setState({loading: false});
          }
        }
    }

    change_date(null_e, date_obj) {
      var form = this.state.form;
      form.date = date_obj;
      this.setState({form: form});
    }

    get_items(type_filter) {
      var u = this.props.user;
      var items =[];
      u.services_enabled.forEach((svc) => {
        var svc_data = this.get_service_data(svc);
        if (svc_data && svc_data.items) {
          var new_items = svc_data.items;
          if (type_filter != null) new_items = new_items.filter((i) => {
            return i.type == type_filter;
          });
         items = items.concat(new_items);
        }
      });
      return items;
    }

    render_load_statuses() {
      var els = [];
      var u = this.props.user;
      u.services_enabled.forEach((svc_key, i) => {
        var svc_data = this.get_service_data(svc_key);
        var svc = util.findItemById(AppConstants.SERVICES, svc_key, 'value');
        if (svc != null) {
          var status_int = svc_data != null ? svc_data.status : AppConstants.ST_NOT_LOADED;
          var icon = AppConstants.STATUS_ICONS[status_int];
          var color = AppConstants.STATUS_COLORS[status_int];
          var message = "";
          if (svc_data != null) message = svc_data.issue || "";
          var last = i == u.services_enabled.length - 1;
          els.push(<span><b>{svc.label}</b> <i className={icon} style={{color: color}} data-tip={message} /></span>)
          if (!last) els.push(<span>&middot;</span>)
        }
      });
      return els;
    }

    any_load_errors() {
      var u = this.props.user;
      var services_enabled = this.enabled_services();
      for (var i=0; i<services_enabled.length; i++) {
        var svc_key = services_enabled[i];
        var svc_data = this.get_service_data(svc_key);
        if (svc_data != null) {
          if (svc_data.status == AppConstants.ST_ERROR) {
            console.log("Load error")
            console.log(svc_data);
            return true;
          }
        }
      }
      return false;
    }

    enabled_services() {
      var u = this.props.user;
      var svcs = [];
      AppConstants.SERVICES.forEach((svc) => {
        if (u.services_enabled.indexOf(svc.value) > -1) {
          svcs.push(svc.value);
        }
      });
      return svcs;
    }

    unfetched_mckeys() {
      var u = this.props.user;
      var date = this.state.form.date;
      var keys = [];
      if (date != null) {
        this.enabled_services().forEach((svc) => {
          var svc_data = this.get_service_data(svc);
          if (svc_data == null ||
            (svc_data.status == AppConstants.ST_NOT_LOADED ||
              svc_data.status == AppConstants.ST_LOADING)) {
            keys.push(DataStore.mckey(svc, date));
          }
        });
      }
      return keys;
    }

    render_item(type, item) {
      console.log(item);
      var icon = <FontIcon className="material-icons">{ type.icon }</FontIcon>
      var svc = util.findItemById(AppConstants.SERVICES, item.svc, 'value');
      var label = type.label + " | " + svc.label;
      if (item.subhead != null) label += " | " + item.subhead;
      return <ListItem key={item.id} leftIcon={icon} primaryText={ item.title } secondaryText={ label } />
    }

    render_grid_item(type, item) {
      return (
        <GridTile
          key={item.id}
          title={item.title}
          subtitle={item.subhead}>
            <img src={item.image} />
          </GridTile>
        );
    }

    render_items_by_type(svc_type) {
      var items = this.get_items(svc_type.value);
      if (items.length == 0) return null;
      var content;
      if (svc_type.multimedia) {
        content = (
          <GridList style={{marginTop: "10px"}}>
            { items.map((item) => {
              return this.render_grid_item(svc_type, item);
            }) }
          </GridList>
        )
      } else {
        content = (
          <List>
            { items.map((item) => {
              return this.render_item(svc_type, item);
            }) }
          </List>
        )
      }
      return <Tab label={svc_type.label}>{content}</Tab>
    }

    star_date() {
      if (this.state.form.date != null) {
        var date_str = util.printDateObj(this.state.form.date);
        DataActions.starDate(date_str, 1);
      }
    }

    unstar_date() {
      if (this.state.form.date != null) {
        var date_str = util.printDateObj(this.state.form.date);
        DataActions.starDate(date_str, 0);
      }
    }

    handle_star_menu_change(opening) {
      if (opening) {
        DataActions.get_recent_stars();
      }
    }

    render() {
      var _statuses;
      var _viz = [];
      var u = this.props.user;
      var {loading, form} = this.state;
      var date_string = util.printDateObj(form.date);
      if (!u) return <LoadStatus loading={true} />
      _statuses = this.render_load_statuses();
      var items = this.get_items();
      var n_total_items = 0;
      AppConstants.ITEM_TYPES.forEach((item_type) => {
        var el = this.render_items_by_type(item_type);
        if (el != null) _viz.push(el);
      });
      var starred_dates = this.props.starred_dates || [];
      var menu_items = starred_dates.map((date_str) => {
        var date_obj = new Date(Date.parse(date_str));
        return <MenuItem
          key={date_str}
          leftIcon={<FontIcon className="material-icons">star</FontIcon>}
          onClick={this.change_date.bind(this, null, date_obj)}
          primaryText={date_str} />
      });
      var search_starred = starred_dates.indexOf(date_string) > -1;
      var star_label = search_starred ? "Unstar this Date" : "Star this Date";
      var bound_star_handler = search_starred ? this.unstar_date.bind(this) : this.star_date.bind(this);
      var show_statuses = loading || this.any_load_errors();
      var toolbar_label = "Choose Date";
      if (date_string != null) toolbar_label = "Showing items for " + date_string;
      return (
        <div>

            <Toolbar>
              <ToolbarGroup key={0} firstChild={true}>
                <ToolbarTitle text={toolbar_label} style={{marginLeft: "20px"}}/>
              </ToolbarGroup>
              <ToolbarGroup key={1} lastChild={true}>

                <DatePicker onChange={this.change_date.bind(this)}
                  value={this.state.form.date} autoOk={true}
                  disabled={loading}
                  maxDate={new Date()}
                  mode="landscape"
                  fullWidth={true} />

                <RaisedButton label="Go" onClick={this.get_day.bind(this)} primary={true} disabled={loading} />

                <IconButton iconClassName="material-icons" onClick={bound_star_handler} tooltip={star_label}>{ search_starred ? 'star' : 'star_border' }</IconButton>

                <IconMenu
                  onRequestChange={this.handle_star_menu_change.bind(this)}
                  iconButtonElement={<IconButton iconClassName="material-icons">expand_more</IconButton>}>
                  { menu_items }
                </IconMenu>

              </ToolbarGroup>
            </Toolbar>

            <div className="loadStatuses" hidden={!show_statuses}>
              { _statuses }
            </div>

            <div hidden={_viz.length==0}>
              <Tabs>
                { _viz }
              </Tabs>
            </div>

            <ReactTooltip place="top" effect="solid" />

        </div>
      );
    }
}
