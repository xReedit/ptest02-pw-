import { ItemTipoConsumoModel } from './item.tipoconsumo.model';

export class ItemModel {
    iditem: number;
    idseccion: number;
    idcarta_lista: number;
    isalmacen: number;
    isporcion: string; // si es SP = porcion
    imprimir_comanda: number;
    procede: number; // tabla de donde descontar 0 = producto 1 = cartalista
    precio: string; // precio unitario
    precio_print: number; // precio que se muestra
    precio_total_calc: number; // preciounitario * cantidad // para calular reglas carta
    precio_total = 0; // preciounitario * cantidad
    cantidad: number;
    cantidad_seleccionada: number; // total
    cantidad_seleccionada_x_tpc = 0; // cantidad seleccionada por tipo cosnumo
    cantidad_reset: number; // cuando caduca el tiempo y recupera stock
    cantidad_descontado = 0; // cantidad que se decuenta por reglas de carta
    des: string;
    indicaciones: string; // indicaciones del pedido
    detalles: string; // descripcion en detalle
    selected: boolean;
    itemtiposconsumo: ItemTipoConsumoModel[] = []; // para la vista -> listItemsPedido
    sumar: boolean; // si suma o resta en el back end -- el back envia las cantidadees
}
