export class DeliveryEstablecimiento {
    idsede: number;
    idorg: number;
    eslogan: string;
    ciudad: string;
    provincia: string;
    departamento: string;
    nombre: string;
    direccion: string;
    pwa_delivery_img: string;
    sub_categoria: string;
    latitude: number;
    longitude: number;
    codigo_postal: string;
    c_minimo: number; // costo minimo del servicio 1=costo_minimo
    c_km: number; // costo x km adicional > 1  = costo_minimo + (dif * c_km)
    c_servicio: number; // costo del servicio calculando la distancia
    distancia_km: string; // distancia en kilomentros
    tiempo_aprox_entrega: string;
    abre_en: string; // tiempo que falta para abrir
    hora_ini: string; // hora que abre
    cerrado: number; // 0 abierto 1 cerrado,
    pwa_delivery_servicio_propio: number; // delivery / el importe minimo por pedido
    pwa_delivery_importe_min: number; // cantidad de productos en el pedido // solo para delivery
}
