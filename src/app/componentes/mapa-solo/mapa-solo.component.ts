import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';

export interface LatLng { latitude: number; longitude: number; }

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit, OnChanges {
  @Input() origin: LatLng;       // repartidor (o local mientras no hay repartidor)
  @Input() destination: LatLng;  // cliente

  mapsListo = false;
  zoom = 14;
  center: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 };
  options: google.maps.MapOptions = { disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy' };
  posCliente: google.maps.LatLngLiteral = null;
  posRepartidor: google.maps.LatLngLiteral = null;
  iconCliente: google.maps.Icon = { url: './assets/images/placeholder.png', scaledSize: { width: 30, height: 30 } as any };
  iconRepartidor: google.maps.Icon = { url: './assets/images/delivery-man.png', scaledSize: { width: 28, height: 28 } as any };

  constructor(private mapsLoader: GoogleMapsLoaderService) { }

  ngOnInit(): void {
    this.mapsLoader.load().then(() => { this.mapsListo = true; this.recalcular(); }).catch(() => { this.mapsListo = false; });
  }

  ngOnChanges(_: SimpleChanges): void { this.recalcular(); }

  private aLiteral(p: LatLng): google.maps.LatLngLiteral {
    const lat = Number(p?.latitude); const lng = Number(p?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  private recalcular(): void {
    this.posCliente = this.aLiteral(this.destination);
    this.posRepartidor = this.aLiteral(this.origin);
    const foco = this.posRepartidor || this.posCliente;
    if (foco) { this.center = foco; }
    // ponytail: centro en el repartidor; encuadrar ambos puntos con fitBounds cuando se pida
  }
}
