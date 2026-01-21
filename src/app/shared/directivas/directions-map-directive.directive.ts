import {Directive, Input, OnChanges, OnInit, SimpleChanges, NgZone} from '@angular/core';
// import {GoogleMap} from '@angular/google-maps';

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
  // @Input() map: GoogleMap;

  // We'll keep a single google maps directions renderer instance so we get to reuse it.
  // using a new renderer instance every time will leave the previous one still active and visible on the page
  private directionsRenderer: any;

  // We inject NgZone to handle async operations with Google Maps
  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.drawDirectionsRoute();
  }

  drawDirectionsRoute() {
    // Comentado temporalmente - requiere @angular/google-maps
    // TODO: Descomentar cuando se instale @angular/google-maps
  }

  ngOnChanges(changes: SimpleChanges) {
    // Comentado temporalmente - requiere @angular/google-maps
    // TODO: Descomentar cuando se instale @angular/google-maps
  }
}
