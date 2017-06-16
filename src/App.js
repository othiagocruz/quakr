import React, { Component } from 'react';
import { withGoogleMap, GoogleMap, InfoWindow, Marker } from 'react-google-maps';
import MarkerClusterer from 'react-google-maps/lib/addons/MarkerClusterer';
import fetch from 'isomorphic-fetch';
import moment from 'moment';

import './App.css';

const QuakrMap = withGoogleMap(props => (
  <GoogleMap
    defaultZoom={2}
    center={props.center}>
    <MarkerClusterer
      averageCenter
      enableRetinaIcons
      gridSize={60}>
      {props.markers.map((marker, index) => (
        <Marker
          key={index}
          position={marker.position}
          onClick={() => props.onMarkerClick(marker)}>
          {marker.showInfo && (
            <InfoWindow onCloseClick={() => props.onMarkerClose(marker)}>
              {marker.infoContent}
            </InfoWindow>
          )}
        </Marker>
      ))}
    </MarkerClusterer>
  </GoogleMap>
))

class App extends Component {

  state = {
    center: {
      lat: 0,
      lng: 0
    },
    source: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp',
    markers: []
  }

  pooling = () => {
    fetch(this.state.source)
      .then(response => response.text())
      .then(this.parseJson)
      .catch(ex => console.error('fetch failed', ex))
  }

  parseJson = response => {
    const stringObj = response.replace('eqfeed_callback(', '').replace(');', '');
    const obj = JSON.parse(stringObj);

    let markers = obj.features.map(f => (
        {
          position: new window.google.maps.LatLng(f.geometry.coordinates[1], f.geometry.coordinates[0]),
          showInfo: false,
          infoContent: (
            <div>
              <h1>{f.properties.title}</h1>
              <p><strong>Place</strong>: {f.properties.place}</p>
              <p><strong>Magnitude</strong>: {f.properties.mag}</p>
              <p><strong>Time</strong>: {moment(f.properties.time).format('MM/DD/YYYY [at] HH:mm')}</p>
              <p><strong>Type</strong>: {f.properties.type}</p>
            </div>
          )
        }
      )
    );

    this.setState({markers})
  }

  handleMarkerToggle = targetMarker => {
    this.setState({
      markers: this.state.markers.map(marker => {
        if (marker === targetMarker) {
          return {
            ...marker,
            showInfo: !marker.showInfo,
          };
        }
        return marker;
      }),
    });
  }

  handleSource = e => {
    this.setState({source: e.target.value}, this.pooling)
  }

  componentDidMount() {
    this.pooling()
    this.timeout = setInterval(this.pooling, 100000)
  }

  componentWillUnmount() {
    clearInterval(this.timeout)
  }

  render() {
    const { center, markers, source } = this.state

    return (
      <div className="app">
        <div className="box">
          <h1>Quakr</h1>
          <p>Visualization of the latest earthquakes around the globe. Click on the markers for more information.</p>
          <label>View: </label>
          <select value={source} onChange={this.handleSource}>
            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojsonp">
              Last hour
            </option>
            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp">
              Today
            </option>
            <option value="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojsonp">
              Last week
            </option>
          </select>
        </div>
        <QuakrMap
          containerElement={<div style={{ height: `100%` }} />}
          mapElement={<div style={{ height: `100%` }} />}
          onMarkerClose={this.handleMarkerToggle}
          onMarkerClick={this.handleMarkerToggle}
          center={center}
          markers={markers} />
      </div>
    );
  }
}

export default App;
