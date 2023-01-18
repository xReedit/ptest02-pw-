import { DeliveryDireccionCliente } from './delivery.direccion.cliente.model';

export class SocketClientModel {
    idsocket_client: string; // obtiene cuando se conecta el socket
    idcliente: number; // cuando se loguea a un establecimiento
    idusuario: number;
    idorg: number; // cuando se loguea a un establecimiento
    idsede: number; // cuando se loguea a un establecimiento
    isCliente: boolean;
    isClienteTmp: boolean; /// sin login aun
    nombres: string;
    usuario: string;
    datalogin: any;
    numMesaLector: number; // numero de mesa del lector qr
    isQrSuccess: boolean; // si paso por el lector qr
    isLoginByDNI: boolean; // si el logue fue por dni
    isLoginByInvitado: boolean; // si el logue fue por invitado
    isLoginByTelefono: boolean; // si el logue fue por telefono
    isSoloLLevar: boolean; // si escanea codigo que sea solo para llevar
    isDelivery: boolean;
    isReserva: boolean; // si es reserva
    isRetiroCash: boolean;
    direccionEnvioSelected: DeliveryDireccionCliente;
    telefono: string;
    systemOS: string;
    linkRedirecLogin: string
}
