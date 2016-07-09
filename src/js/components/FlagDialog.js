var React = require('react');
var Router = require('react-router');
var $ = require('jquery');
var LoadStatus = require('components/LoadStatus');
var AppConstants = require('constants/AppConstants');
var mui = require('material-ui');
var IconButton = mui.IconButton;
var FontIcon = mui.FontIcon;
var RadioButtonGroup = mui.RadioButtonGroup;
var RadioButton = mui.RadioButton;
var Dialog = mui.Dialog;
var FlatButton = mui.FlatButton;
var util = require('utils/util');
var toastr = require('toastr');
var bootbox = require('bootbox');
var api = require('utils/api');
var MessageActions = require('actions/MessageActions');
var MessageStore = require('stores/MessageStore');
import history from 'config/history'
import {changeHandler} from 'utils/component-utils';
var Link = Router.Link;
import connectToStores from 'alt-utils/lib/connectToStores';

@connectToStores
@changeHandler
export default class FlagDialog extends React.Component {
  static defaultProps = {
    type: AppConstants.FLAG_TYPES.MESSAGE,
    id: null
  };
  constructor(props) {
    super(props);
    this.state = {
      flag: null,
      form: {
        reason: null
      }
    };
  }
  static getStores() {
    return [MessageStore];
  }
  static getPropsFromStores() {
    var st = MessageStore.getState();
    return st;
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.id != this.props.id && nextProps.id) {
      // Target change
      this.get_flag(nextProps.id, nextProps.type);
    }
  }

  componentDidUpdate(prevProps, prevState) {
  }

  componentDidMount() {
  }

  get_flag(id, type) {
    var that = this;
    var uri_component = AppConstants.FLAG_TYPE_NAME[type];
    api.get(`/api/${uri_component}/${id}/flag`, {}, function(res) {
      if (res.success) {
        that.setState({flag: res.data.flag});
      }
    }, null, {no_toast: true});
  }

  submit_flag() {
    var that = this;
    var id = this.props.id;
    var form = this.state.form;
    var type_name = AppConstants.FLAG_TYPE_NAME[this.props.type];
    if (id && form.reason != null) {
      MessageActions.doFlag(id, type_name, form.reason);
      that.props.onRequestClose();
    }
  }

  render() {
    var _existing_flag, _reason;
    var form = this.state.form;
    var existing_flag = this.state.flag;
    var target_name = AppConstants.FLAG_TYPE_NAME[this.props.type];
    if (existing_flag) _existing_flag = (
      <div className="alert alert-info">
        You flagged this <b>{ target_name }</b> on { util.printDate(existing_flag.ts) }
      </div>
      )

    var reasons = AppConstants.REASONS.filter(function(r) {
      return (this.props.type == 1) ? r.for_message : r.for_transcription;
    }, this);
    var _buttons = reasons.map(function(r) {
      return <RadioButton value={r.value} label={r.label} />
    });
    var form_reason = form.reason ? parseInt(form.reason) : null;
    var cta = existing_flag ? "You may update the reason below." : "Are you sure you want to flag this item for review? If so, please choose the reason below.";
    _reason = (
      <div>
        <p className="lead">{ cta }</p>
        <RadioButtonGroup name="reason" valueSelected={form_reason} onChange={this.changeHandler.bind(this, 'form', 'reason')}>
          { _buttons }
        </RadioButtonGroup>
      </div>
    );
    var title = "Flag " + target_name;
    var actions = [
      <FlatButton label="Cancel" onClick={this.props.onRequestClose.bind(this)} />,
      <FlatButton label="Flag" onClick={this.submit_flag.bind(this)} primary={true} />
    ];
    return (
      <Dialog title={title} open={this.props.id != null} onRequestClose={this.props.onRequestClose.bind(this)} actions={actions}>
        { _existing_flag }
        { _reason }
      </Dialog>
      );
  }
}
