import { SubItem } from './subitems.model';

export class SubItemContent {
    iditem_subitem_content: number;
    iditem: number;
    des: string;
    subitem_required_select: number;
    subitem_cant_select: number;
    subitem_cant_select_ini: number; // como viene de bd
    show_cant_item: number;
    isSoloUno: boolean;
    isObligatorio: boolean;
    des_cant_select: string;
    opciones: SubItem[];
}
