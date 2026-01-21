import {Directive, Input, OnChanges, OnInit, SimpleChanges, NgZone} from '@angular/core';
import {GoogleMap} from '@angular/google-maps';

export interface ILatLng {
  latitude: number;
  longitude: number;
}

declare var google: any;

@Directive({
  selector: '[appDirectionsMapDirective]'
})
export class DirectionsMapDirectiveDirective implements OnInit, OnChanges {

  @Input() origin: ILatLng;
  @Input() destination: ILatLng;
  @Input() showDirection: boolean;
  @Input() map: GoogleMap;

  // We'll keep a single google maps directions renderer instance so we get to reuse it.
  // using a new renderer instance every time will leave the previous one still active and visible on the page
  private directionsRenderer: any;

  // We inject NgZone to handle async operations with Google Maps
  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.drawDirectionsRoute();
  }

  drawDirectionsRoute() {
    if (this.map && this.map.googleMap) {
      const googleMap = this.map.googleMap;
      
      this.ngZone.run(() => {
        if (!this.directionsRenderer) {
          // if you already have a marker at the coordinate location on the map, use suppressMarkers option
          // suppressMarkers prevents google maps from automatically adding a marker for you
          this.directionsRenderer = new google.maps.DirectionsRenderer({suppressMarkers: true});
        }
        const directionsRenderer = this.directionsRenderer;

        if (this.showDirection && this.destination) {
          const directionsService = new google.maps.DirectionsService;
          directionsRenderer.setMap(googleMap);
          directionsService.route({
            origin: {lat: this.origin.latitude, lng: this.origin.longitude},
            destination: {lat: this.destination.latitude, lng: this.destination.longitude},
            waypoints: [],
            optimizeWaypoints: true,
            travelMode: 'DRIVING'
          }, (response, status) => {
            if (status === 'OK') {
              directionsRenderer.setDirections(response);
              // If you'll like to display an info window along the route
              // middleStep is used to estimate the midpoint on the route where the info window will appear
              // const middleStep = (response.routes[0].legs[0].steps.length / 2).toFixed();
              // const infowindow2 = new google.maps.InfoWindow();
              // infowindow2.setContent(`${response.routes[0].legs[0].distance.text} <br> ${response.routes[0].legs[0].duration.text}  `);
              // infowindow2.setPosition(response.routes[0].legs[0].steps[middleStep].end_location);
              // infowindow2.open(map);
            } else {
              console.log('Directions request failed due to ' + status);
            }
          });
        }
      });
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.origin || changes.showDirection || changes.map) {
      // this checks if the show directions input changed, if so the directions are removed
      // else we redraw the directions
      if (changes.showDirection && !changes.showDirection.currentValue) {
        if (this.directionsRenderer !== undefined) { // check this value is not undefined
          this.directionsRenderer.setDirections({routes: []});
          return;
        }
      } else {
        this.drawDirectionsRoute();
      }
    }
  }
}
