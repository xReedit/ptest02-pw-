import { AfterViewInit, ChangeDetectorRef, Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GoogleMapsLoaderService } from 'src/app/shared/services/google-maps-loader.service';

export interface LatLng { latitude: number; longitude: number; }

// ponytail: heurística de 6 s. Google no siempre invoca gm_authFailure (RefererNotAllowedMapError
// pinta su propio panel de error dentro del contenedor y no avisa), así que si el mapa no llega a
// dibujar en este plazo se le da por caído y se muestra el respaldo.
const MS_ESPERA_MAPA = 6000;

@Component({
  selector: 'app-mapa-solo',
  templateUrl: './mapa-solo.component.html',
  styleUrls: ['./mapa-solo.component.css']
})
export class MapaSoloComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() origin: LatLng;       // repartidor (o local mientras no hay repartidor)
  @Input() destination: LatLng;  // cliente

  private destroy$ = new Subject<void>();
  private temporizador: any = null;
  private destruido = false;

  mapsListo = false;
  vistaLista = false;   // el <google-map> no se crea hasta que la vista existe (evita observe() sobre un nodo suelto)
  mapaPintado = false;  // llegó mapInitialized/tilesloaded
  mapaCaido = false;    // venció la espera o Google avisó del fallo de autenticación
  zoom = 14;
  center: google.maps.LatLngLiteral = { lat: -12.0464, lng: -77.0428 };
  options: google.maps.MapOptions = { disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy' };
  posCliente: google.maps.LatLngLiteral = null;
  posRepartidor: google.maps.LatLngLiteral = null;
  iconCliente: google.maps.Icon = { url: './assets/images/placeholder.png', scaledSize: { width: 30, height: 30 } as any };
  iconRepartidor: google.maps.Icon = { url: './assets/images/delivery-man.png', scaledSize: { width: 28, height: 28 } as any };
  opcionesCliente: google.maps.MarkerOptions = { icon: this.iconCliente };
  opcionesRepartidor: google.maps.MarkerOptions = { icon: this.iconRepartidor };

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
  ) { }

  hayPosicion(): boolean { return !!(this.posCliente || this.posRepartidor); }

  /** Sólo se instancia el mapa cuando la vista existe, Maps responde y hay algo que pintar. */
  puedeMontarMapa(): boolean {
    return this.vistaLista && this.mapsListo && this.mapsLoader.isLoaded() && this.hayPosicion();
  }

  /** Cualquier señal de que Maps no sirve deja el respaldo a la vista, en cualquier momento. */
  mostrarRespaldo(): boolean {
    if (this.mapaPintado) { return false; }
    return this.mapaCaido || !this.mapsListo || !this.mapsLoader.isLoaded();
  }

  ngOnInit(): void {
    this.mapsLoader.load()
      .then(() => { this.mapsListo = true; this.recalcular(); this.armarEspera(); })
      .catch(() => { this.mapsListo = false; });

    // BehaviorSubject: si el fallo de autenticación ya ocurrió, la suscripción recibe el valor actual
    this.mapsLoader.authFallida$.pipe(takeUntil(this.destroy$)).subscribe((fallida) => {
      if (fallida) { this.mapsListo = false; this.mapaCaido = true; this.mapaPintado = false; }
    });
  }

  ngAfterViewInit(): void {
    // fuera del ciclo actual para no cambiar el binding *ngIf durante la misma detección
    Promise.resolve().then(() => {
      if (this.destruido) { return; }
      this.vistaLista = true;
      this.armarEspera();
      this.cd.detectChanges();
    });
  }

  ngOnChanges(_: SimpleChanges): void { this.recalcular(); }

  ngOnDestroy(): void {
    this.destruido = true;
    this.limpiarEspera();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * mapInitialized sólo dice que se instanció google.maps.Map: con la clave rechazada también se
   * dispara, así que no cuenta como éxito, únicamente arranca la espera desde el montaje real.
   */
  mapaMontado(): void { this.armarEspera(); }

  /** tilesloaded es la única señal de que el mapa llegó a dibujarse: cancela la espera. */
  mapaListo(): void {
    this.limpiarEspera();
    this.zone.run(() => { this.mapaPintado = true; this.mapaCaido = false; });
  }

  private armarEspera(): void {
    if (this.temporizador || this.mapaPintado || !this.puedeMontarMapa()) { return; }
    // fuera de Angular para no mantener vivo el ciclo de detección durante la espera
    this.zone.runOutsideAngular(() => {
      this.temporizador = setTimeout(() => {
        this.temporizador = null;
        if (this.mapaPintado || this.destruido) { return; }
        this.zone.run(() => { this.mapaCaido = true; this.cd.detectChanges(); });
      }, MS_ESPERA_MAPA);
    });
  }

  private limpiarEspera(): void {
    if (this.temporizador) { clearTimeout(this.temporizador); this.temporizador = null; }
  }

  private aLiteral(p: LatLng): google.maps.LatLngLiteral {
    const lat = Number(p?.latitude); const lng = Number(p?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }

  private recalcular(): void {
    this.posCliente = this.aLiteral(this.destination);
    this.posRepartidor = this.aLiteral(this.origin);
    const foco = this.posRepartidor || this.posCliente;
    if (foco) { this.center = foco; }
    this.armarEspera();
    // ponytail: centro en el repartidor; encuadrar ambos puntos con fitBounds cuando se pida
  }
}
