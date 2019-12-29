export class EstadoPedidoModel {
    estado: number; // 0: espera 1: despachado 2: pagado 3: anulado
    importe: number; // importe a pagar
    isTiempoAproxCumplido: boolean; // si el tiempo aproximado esta cumplido
    horaInt: string; // hora init conteo
    numMinAprox: number; // numero de minutos aproximadamente
}
