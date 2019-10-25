import { SubItem } from './subitems.model';

export class SubItemsView {
    id: number;
    des: string;
    cantidad: string;
    indicaciones: string;
    cantidad_seleccionada: number;
    precio: number;
    subitems: SubItem[];
}
