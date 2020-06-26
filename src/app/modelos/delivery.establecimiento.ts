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
    hora_fin: string;
    cerrado: number; // 0 abierto 1 cerrado,
    dias_atienden: string;
    pwa_delivery_servicio_propio: number; // delivery / el importe minimo por pedido
    pwa_delivery_importe_min: number; // cantidad de productos en el pedido // solo para delivery
    idsede_categoria: number;
    idsede_subcategoria: string; // group concat id_subcategoria
    idsede_subcategoria_filtro: string; // group concat id_subcategoria
    visible: boolean;
    pwa_delivery_habilitar_recojo_local: number;
    pwa_delivery_acepta_yape: number;
    pwa_delivery_acepta_tarjeta: number;
    pwa_delivery_hablitar_calc_costo_servicio: number; // si el sistema calcula el servicio delivery segun distancia de los pedidos tomados por el comercio
    pwa_delivery_comercio_solidaridad: number; // si es comercio solidario, solo pago con tarjeta y parece campo de contacto
    pwa_delivery_comision_fija_no_afiliado: number; // comision fija comercio no afiliado (plaza vea cualquier pedido la comision es 2 para la platafoma)
    rulesSubTotales: any;
    pwa_delivery_comercio_paga_entrega: number; // si el comercio paga el costo del delivery al repartidor
    costo_total_servicio_delivery: number; // costo del servicio de entrega si pwa_delivery_comercio_paga_entrega
    pwa_delivery_habilitar_pedido_programado: number; // 1 acepta pedidos programados
}
