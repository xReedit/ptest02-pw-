import { Injectable } from '@angular/core';
import { CrudHttpService } from './crud-http.service';

// Direccion escogida antes de que exista un cliente. Vive aparte de 'sys::dir_se'
// (la direccion de envio que consume la lista de comercios) porque son dos cosas
// distintas: 'sys::dir_se' es "donde quiero que me lleven el pedido ahora mismo" y
// esta es "esta direccion todavia le debe una fila al backend".
export const KEY_DIRECCION_PENDIENTE = 'sys::dir_pend';

@Injectable({ providedIn: 'root' })
export class DireccionPendienteService {

  constructor(private crudService: CrudHttpService) { }

  /** Guarda la direccion a la espera de un cliente. false si el storage no acepto nada. */
  guardar(direccion: any): boolean {
    if (!direccion || !direccion.direccion) { return false; }

    try {
      localStorage.setItem(KEY_DIRECCION_PENDIENTE, JSON.stringify(direccion));
      return true;
    } catch (error) {
      // modo privado, cuota llena o storage bloqueado: el visitante sigue navegando
      console.error('direccion-pendiente guardar', error);
      return false;
    }
  }

  /** La direccion pendiente, o null si no hay ninguna o lo guardado esta corrupto. */
  leer(): any {
    try {
      const crudo = localStorage.getItem(KEY_DIRECCION_PENDIENTE);
      if (!crudo) { return null; }
      return JSON.parse(crudo);
    } catch (error) {
      console.error('direccion-pendiente leer', error);
      return null;
    }
  }

  limpiar(): void {
    try {
      localStorage.removeItem(KEY_DIRECCION_PENDIENTE);
    } catch (error) {
      console.error('direccion-pendiente limpiar', error);
    }
  }

  /**
   * Cuelga la direccion pendiente del cliente recien conocido. Se llama en cuanto
   * aparece un idcliente real y nunca revienta en el llamador: si el POST falla la
   * direccion queda guardada y el siguiente intento la vuelve a mandar.
   */
  sincronizar(idcliente: any): void {
    const id = Number(idcliente);
    if (!Number.isFinite(id) || id <= 0) { return; }

    const direccion = this.leer();
    if (!direccion) { return; }

    const datos = Object.assign({}, direccion, { idcliente: id });

    try {
      this.crudService.postFree(datos, 'cliente', 'new-direccion', false)
        .subscribe(
          (res: any) => {
            // solo se da por colgada cuando el backend confirma la insercion;
            // con cualquier otra respuesta se conserva para reintentar
            if (res && res.success) { this.limpiar(); return; }
            console.error('direccion-pendiente sincronizar sin exito', res);
          },
          (error: any) => console.error('direccion-pendiente sincronizar', error)
        );
    } catch (error) {
      console.error('direccion-pendiente sincronizar', error);
    }
  }

}
