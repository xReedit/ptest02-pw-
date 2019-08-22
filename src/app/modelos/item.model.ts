import { ItemTipoConsumoModel } from './item.tipoconsumo.model';

export class ItemModel {
    iditem: number;
    idseccion: number;
    idcarta_lista: number;
    isalmacen: number;
    precio: string; // precio unitario
    precio_print = 0; // precio que se muestra
    precio_total_calc: number; // preciounitario * cantidad // para calular reglas carta
    precio_total = 0; // preciounitario * cantidad
    cantidad: number;
    cantidad_seleccionada: number; // total
    cantidad_seleccionada_x_tpc = 0; // cantidad seleccionada por tipo cosnumo
    cantidad_reset: number; // cuando caduca el tiempo y recupera stock
    cantidad_descontado = 0; // cantidad que se decuenta por reglas de carta
    des: string;
    detalles: string; // descripcion en detalle
    selected: boolean;
    itemtiposconsumo: ItemTipoConsumoModel[] = []; // para la vista -> listItemsPedido
}
