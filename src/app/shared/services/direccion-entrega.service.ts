import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DeliveryDireccionCliente } from 'src/app/modelos/delivery.direccion.cliente.model';
import { VerifyAuthClientService } from './verify-auth-client.service';

// El mismo dato vivia en tres sitios a la vez: la clave 'sys::dir_se', el
// 'direccionEnvioSelected' de dentro del modelo del cliente ('sys::tpm') y una copia
// suelta en cada pantalla. Nadie avisaba a nadie, asi que la cabecera y el cartel de
// "Indica direccion de entrega" se quedaban con lo de antes. Desde aqui la direccion
// tiene un solo dueño: este servicio la guarda, la lee al arrancar y avisa a quien
// mire. Los dos almacenes viejos se siguen escribiendo porque medio app los lee.
export const KEY_DIRECCION_ENTREGA = 'sys::dir_se';

@Injectable({ providedIn: 'root' })
export class DireccionEntregaService {

  private readonly fuente = new BehaviorSubject<DeliveryDireccionCliente>(null);

  /** La direccion escogida ahora mismo. Emite al suscribirse y en cada cambio. */
  readonly seleccionada$: Observable<DeliveryDireccionCliente> = this.fuente.asObservable();

  constructor(private verifyClientService: VerifyAuthClientService) {
    this.hidratar();
  }

  /** Lectura sincrona para el codigo que no puede suscribirse. null si no hay ninguna. */
  get seleccionada(): DeliveryDireccionCliente {
    return this.fuente.value;
  }

  /** true cuando hay una direccion utilizable (no basta con que el objeto exista). */
  hay(): boolean {
    const direccion = this.fuente.value;
    return !!(direccion && direccion.direccion);
  }

  /**
   * Unica puerta para escoger direccion: persiste en los dos almacenes y avisa.
   * Devuelve false si no hay direccion que establecer. Si es la misma que ya estaba
   * no vuelve a avisar, para que un aviso no dispare otro entre pantallas.
   */
  establecer(direccion: DeliveryDireccionCliente): boolean {
    if (!direccion || !direccion.direccion) { return false; }
    if (this.esLaMisma(direccion)) { return true; }

    this.persistir(direccion);
    this.fuente.next(direccion);
    return true;
  }

  /** Olvida la direccion en los dos almacenes y avisa que ya no hay ninguna. */
  limpiar(): void {
    try {
      localStorage.removeItem(KEY_DIRECCION_ENTREGA);
    } catch (error) {
      console.error('direccion-entrega limpiar storage', error);
    }

    this.escribirEnCliente(null);
    this.fuente.next(null);
  }

  /**
   * Recupera la direccion al arrancar, para que recargar la pagina no la pierda.
   * Manda el modelo del cliente; 'sys::dir_se' solo cubre el caso de que el modelo
   * no la tenga. Gane quien gane, se reescriben los dos para que queden iguales.
   */
  private hidratar(): void {
    const direccion = this.leerDelCliente() || this.leerDelStorage();
    if (!direccion) { return; }

    this.persistir(direccion);
    this.fuente.next(direccion);
  }

  private persistir(direccion: DeliveryDireccionCliente): void {
    try {
      localStorage.setItem(KEY_DIRECCION_ENTREGA, JSON.stringify(direccion));
    } catch (error) {
      // modo privado, cuota llena o storage bloqueado: la direccion sigue en memoria
      console.error('direccion-entrega guardar storage', error);
    }

    this.escribirEnCliente(direccion);
  }

  private escribirEnCliente(direccion: DeliveryDireccionCliente): void {
    try {
      // setDireccionDeliverySelected toca clientSocket directo: sin modelo cargado revienta
      if (!this.verifyClientService.getClientSocket()) {
        this.verifyClientService.getDataClient();
      }
      this.verifyClientService.setDireccionDeliverySelected(direccion);
    } catch (error) {
      console.error('direccion-entrega guardar cliente', error);
    }
  }

  private leerDelCliente(): DeliveryDireccionCliente {
    try {
      const cliente = this.verifyClientService.getDataClient();
      const direccion = cliente ? cliente.direccionEnvioSelected : null;
      return direccion && direccion.direccion ? direccion : null;
    } catch (error) {
      console.error('direccion-entrega leer cliente', error);
      return null;
    }
  }

  private leerDelStorage(): DeliveryDireccionCliente {
    try {
      const crudo = localStorage.getItem(KEY_DIRECCION_ENTREGA);
      if (!crudo) { return null; }

      const direccion = JSON.parse(crudo);
      return direccion && direccion.direccion ? direccion : null;
    } catch (error) {
      console.error('direccion-entrega leer storage', error);
      return null;
    }
  }

  private esLaMisma(direccion: DeliveryDireccionCliente): boolean {
    const actual = this.fuente.value;
    if (!actual) { return false; }
    if (actual === direccion) { return true; }

    try {
      return JSON.stringify(actual) === JSON.stringify(direccion);
    } catch (error) {
      return false;
    }
  }

}
