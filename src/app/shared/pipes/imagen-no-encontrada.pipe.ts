import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'imagenNoEncontrada'
})
export class ImagenNoEncontradaPipe implements PipeTransform {
    transform(src: string, args?: any): string {
        const img = new Image();
        img.src = src;

        img.addEventListener('error', () => {
            console.log(`La imagen ${src} no se pudo cargar.`);
            const elementoImg = args;
            if (elementoImg) {
                elementoImg.style.display = 'none';
            }
        });

        return src;
    }
}
