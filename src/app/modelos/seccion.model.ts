import { ItemModel } from './item.model';

export class SeccionModel {
    idseccion: number;
    idimpresora: number;
    idimpresora_otro: number;
    imprimir: number;
    sec_orden: number;
    count_items: number;
    ver_stock_cero: number;
    des: string;
    descuento = null;
    iddescuento: number;
    is_visible_cliente: number; // 1 no visible para el cliente
    items: ItemModel[] = [];
}
