/*
Author: Jeremy Gordon
Version: 0.1
Created: May 10, 2014
Updated: May 10, 2014
*/

var React = require('react');

var g = google.maps;
var util = require('utils/util');

var EntityMap = React.createClass({displayName: 'EntityMap',
  getDefaultProps: function() {
    return {
      defaultCenter: new g.LatLng(-1.274359, 36.813106),
      center: null,
      entities: [],
      visible: true,
      addClass: null,
      focusMarkerIcon: {
        url: "/images/map/pin_hl.png",
        size: new g.Size(128,128),
        origin: new g.Point(0,0),
        anchor: new g.Point(16, 32),
        scaledSize: new g.Size(32,32)
      },
      markerIcon: {
        url: "/images/map/pin.png",
        size: new g.Size(128,128),
        origin: new g.Point(0,0),
        anchor: new g.Point(16, 32),
        scaledSize: new g.Size(32,32)
      },
      // Each entity must be an object with properties [keyProp], and either lat, and lon or location ("lat,lon")
      keyProp: 'id',
      focusIds: [], // New way to focus (currently support both)
      defaultZoom: 10,
      handleEntityClick: null,
      handleEntityDoubleClick: null,
      markerClickInfoProp: null,
      labelAtt: 'label'
    };
  },
  getInitialState: function() {
    return {
      map: null,
      markers: []
    };
  },
  componentDidUpdate: function(prevProps, prevState) {
    var entitiesUpdated = prevProps.entities.length != this.props.entities.length;
    if (entitiesUpdated) {
      this.redrawPins();
    } else if (!util.arrEquals(prevProps.focusIds, this.props.focusIds)) {
      this.redrawFocus();
    } else if ((this.props.center != prevProps.center) && this.props.center) {
      this.moveCenter();
    }
  },
  getMap: function() {
    return this.state.map;
  },
  getMarkerIcon: function(e) {
    if (typeof(this.props.markerIcon) === "function") {
      return this.props.markerIcon(e);
    } else return this.props.markerIcon;
  },
  resize: function() {
    if (this.state.map) {
      g.event.trigger(this.state.map, 'resize');
      this.moveCenter(); // Recenter
    }
  },
  entityIsFocused: function(e) {
    var keyProp = this.props.keyProp;
    return (this.props.focusEntity && this.props.focusEntity[keyProp] == e[keyProp]) ||
      (this.props.focusIds.indexOf(e[keyProp]) > -1);
  },
  initMap: function() {
    var that = this;
    var mapDiv = this.refs.map;
    var myOptions = {
        scrollwheel: false,
        zoom: this.props.defaultZoom,
        center: this.props.center || this.props.defaultCenter,
        mapTypeControl: false,
        streetViewControl: false,
        disableDoubleClickZoom: false,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    }
    var map = new g.Map(mapDiv, myOptions);
    this.setState({map: map}, function() {
      if (that.props.entities.length > 0) that.redrawPins();
    });
  },
  setMapBounds: function(map, markers) {
    var latlngbounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
      latlngbounds.extend(markers[i].position);
    }
    map.fitBounds(latlngbounds);
  },
  updateBounds: function() {
    var markers = this.state.markers;
    if (!markers) {
      var markers = [];
      this.props.entities.forEach(function(e) {
        if (e.pin) markers.push(e.pin);
      });
    }
    if (markers.length > 1) this.setMapBounds(this.state.map, markers);
    else if (markers.length == 1) {
      this.moveCenter(markers[0].position);
      this.state.map.setZoom(this.props.defaultZoom);
    }
  },
  forAllEntities: function(fn, _entities) {
    var entities = _entities || this.props.entities;
    if (entities) {
      entities.forEach(function(e, i, arr) {
        if (e) fn(e);
      }, this);
    }
  },
  componentDidMount: function() {
    this.initMap();
  },
  getEntityById: function(_id) {
    var keyProp = this.props.keyProp;
    if (this.props.entities) {
      for (i=0; i<this.props.entities.length; i++) {
        var e = this.props.entities[i];
        if (e[keyProp] == _id) return e;
      }
    }
    return null;
  },
  redrawFocus: function() {
    var that = this;
    this.forAllEntities(function(e) {
      if (e.pin) {
        var focused = that.entityIsFocused(e);
        var icon = focused ? that.props.focusMarkerIcon : that.getMarkerIcon(e);
        e.pin.setIcon(icon);
      }
    });
  },
  entityLocation: function(e) {
    if (e.lat && e.lon) return new g.LatLng(e.lat, e.lon);
    else if (e.location != null) {
      var ll = e.location.split(',');
      if (ll.length == 2 && (ll[0] != 0 || ll[1] != 0)) return new g.LatLng(ll[0],ll[1]);
      else return null;
    }
    else return null;
  },
  updatePins: function(new_markers, cb) {
    // Clear existing pin
    this.state.markers.forEach(function(m) {
      m.setMap(null);
    });
    this.setState({markers: new_markers}, cb);
  },
  redrawPins: function() {
    var that = this;
    var markers = [];
    this.forAllEntities(function(e) { // For all now current entities
      var center = that.entityLocation(e);
      if (center != null) {
        // Is there a mem leak here?
        var focused = that.entityIsFocused(e);
        var icon = focused ? that.props.focusMarkerIcon : that.getMarkerIcon(e);
        var m = that.addPin(that.state.map, center, e[that.props.labelAtt], icon, false);
        markers.push(m);
        g.event.addListener(m, 'click', function() {
          if (that.props.handleEntityClick) that.props.handleEntityClick(e);
        });
        g.event.addListener(m, 'dblclick', function() {
          if (that.props.handleEntityDoubleClick) that.props.handleEntityDoubleClick(e);
        });
      }
    });
    this.updatePins(markers, () => {
      this.updateBounds();
    });
  },
  addPin: function(map, center, title, icon, draggable) {
    var marker = new g.Marker({
      map: map,
      position: center,
      title: title,
      icon: icon,
      draggable: draggable || false
    });
    return marker;
  },
  refreshMarkers: function() {
    this.redrawPins(this.props.entities);
  },
  moveCenter: function(loc) {
    var _loc = loc || this.props.center || this.props.defaultCenter;
    this.state.map.panTo(_loc);
  },
  render: function() {
    var classes = "";
    if (this.props.addClass) classes += this.props.addClass;
    return (
      <div ref="map" className={classes} hidden={!this.props.visible}>
      </div>
    );
  }
});

module.exports = EntityMap;