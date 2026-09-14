import { Component, Input } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ResumenPedidoComponent } from '../resumen-pedido.component';

// Pie con los botones del pedido (Borrar Lista / Continuar / Enviar).
// Vive FUERA de las pestañas de Material: dentro de una pestaña el transform del
// deslizamiento anula el position: fixed y se lleva el pie con la pestaña. Aqui
// se desliza de abajo hacia arriba al entrar a Mi Pedido y baja al salir.
@Component({
  selector: 'app-footer-pedido',
  templateUrl: './footer-pedido.component.html',
  styleUrls: ['./footer-pedido.component.css'],
  animations: [
    trigger('slideFooter', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        // espera 400ms abajo y recien sube; la salida no espera
        animate('240ms 400ms cubic-bezier(0.22, 1, 0.36, 1)', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.55, 0, 1, 0.45)', style({ transform: 'translateY(100%)' }))
      ])
    ])
  ]
})
export class FooterPedidoComponent {
  @Input() r: ResumenPedidoComponent; // el resumen que tiene el estado y las acciones
  @Input() activo = true; // en celular: si la pestaña Mi Pedido es la visible

  get visible(): boolean {
    const r = this.r;
    return !!r && this.activo && r.hayItems && !r.isHayCuentaBusqueda
      && !r.isShowOpcionesHolding && !r.isShowNotificacionPersonal
      && !r.isShowNiubizPayment && !r.isShowMensajeConfirmacionPago;
  }
}
