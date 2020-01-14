export class SocketClientModel {
    idsocket_client: string; // obtiene cuando se conecta el socket
    idcliente: number; // cuando se loguea a un establecimiento
    idusuario: number;
    idorg: number; // cuando se loguea a un establecimiento
    idsede: number; // cuando se loguea a un establecimiento
    isCliente: boolean;
    nombres: string;
    usuario: string;
    datalogin: any;
    numMesaLector: number; // numero de mesa del lector qr
    isQrSuccess: boolean; // si paso por el lector qr
    isLoginByDNI: boolean; // si el logue fue por dni
}
