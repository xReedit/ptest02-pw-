export class SubItem {
    iditem_subitem: number;
    iditem: number;
    des: string;
    indicaciones: string;
    cantidad: string;
    cantidad_seleccionada: number;
    precio: number;
    precio_visible: boolean;
    cantidad_visible: boolean;
    selected: boolean;
    idproducto: string;
    idporcion: string;
    idtipo_consumo: number; // para que no sume de mas o de otro tpc
}
