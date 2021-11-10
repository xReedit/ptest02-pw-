import { ItemTipoConsumoModel } from './item.tipoconsumo.model';
import { SubItem } from './subitems.model';
import { SubItemsView } from './subitems.view.model';
import { SubItemContent } from './subitem.content.model';

export class ItemModel {
    iditem: number;
    idseccion: number;
    idcarta_lista: number;
    isalmacen: number;
    isporcion: string; // si es SP = porcion
    imprimir_comanda: number;
    procede: number; // tabla de donde descontar 0 = producto 1 = cartalista
    precio: string; // precio unitario
    precio_unitario: string; // para calculo del precio item + precio subitem
    precio_default: number;
    precio_print: number; // precio que se muestra
    precio_total_calc: number; // preciounitario * cantidad // para calular reglas carta
    precio_total = 0; // preciounitario * cantidad
    precio_antes = null; // precio antes del descuento
    cantidad: number;
    cantidad_seleccionada: number; // total
    cantidad_seleccionada_x_tpc = 0; // cantidad seleccionada por tipo cosnumo
    cantidad_reset: number; // cuando caduca el tiempo y recupera stock
    cantidad_descontado = 0; // cantidad que se decuenta por reglas de carta
    // cantidad_selected: number; // cantidad selecciona del control de add fast comp-ctl-add-fast
    des: string;
    indicaciones: string; // indicaciones del pedido
    detalles: string; // descripcion en detalle
    img: string; // imagen del item
    selected: boolean;
    itemtiposconsumo: ItemTipoConsumoModel[] = []; // para la vista -> listItemsPedido
    seccion: string;
    subitems: SubItemContent[];
    subitem_required_select: number;
    subitem_cant_select: number;
    subitems_selected: SubItem[] = []; // subitems seleccionados
    subitems_view: SubItemsView[] = []; // subitems vista y guardar pedido detalle
    count_subitems: number; // numero de subitems para saber si mostrar detalle en autopedido
    sumar: boolean; // si suma o resta en el back end -- el back envia las cantidadees
    iddescuento: number;
    is_visible_cliente: number; // 1 no visible para el cliente
    is_search_subitems: boolean; // si ya hizo la busqueda de sus subitems
    is_visible_control_last_add: boolean;
    ispromo: any;
    ispromo_aplica: boolean;
    is_recomendacion: string;
}
