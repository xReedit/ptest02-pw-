import { DeliveryDireccionCliente } from './delivery.direccion.cliente.model';
import { MetodoPagoModel } from './metodo.pago.model';
import { TipoComprobanteModel } from './tipo.comprobante.model';
import { PropinaModel } from './propina.model';
import { TiempoEntregaModel } from './tiempo.entrega.model';

export class UsuarioTokenModel {
    acc: string;
    cargo: string;
    estadistica: number;
    estado: number;
    idalmacen: number;
    idorg: number;
    idsede: number;
    idusuario: number;
    nombres: string;
    nuevo: number;
    pass: string;
    per: string;
    rol: number;
    super: number;
    usuario: string;
    idcliente: number;
    isCliente: boolean;
    isUsuarioAutorizado: boolean;
    isHayDescuento: boolean;
    email: string;
    numMesaLector: number; // numero de mesa del lector qr
    ipCliente: string; // ip del cliente api autorizacion
    isSoloLLevar: boolean; // si escanea qr solo para llevar
    isDelivery: boolean; // si es delivery
    isReserva: boolean; // si es delivery
    isRetiroCash: boolean; // si es delivery
    isPuntoAutoPedido: boolean; // si es punto de autopedido
    isTomaPedidoRapido: boolean; // si es se toma pedido rapido se muestra como punto de autopedido
    isPuntoTomaPedidos: boolean; // si es punto de toma de pedidos
    direccionEnvioSelected: DeliveryDireccionCliente;
    tiempoEntrega: TiempoEntregaModel;
    telefono: string;
    orderDelivery: string; // pedido pendiente de confirmacion
    importeDelivery: string; // importe pendiente de confirmacion
    isPagoSuccess: boolean; // si ya pago, si es que actualiza cuando ya pago
    metodoPago: MetodoPagoModel; // metodo pago seleccionado
    metodoPagoSelected: MetodoPagoModel; // metodo pago seleccionado
    tipoComprobante: TipoComprobanteModel; // tipo comprobante en delivery
    propina: PropinaModel; // propina para el repartidor delivery
    socketId: string;
    otro: any;
    pasoRecoger: boolean; // si el cliente pasa a recoger
    isActiveMozoVoz: boolean;
    isUsLoggedIn: boolean; // si viene a loguearse es decir si viene de login fb gmail telefono dni
}
