import { Directive, ElementRef, HostListener, Input } from '@angular/core';

export const IMG_FALLBACK = 'assets/images/icon-app/img-null.png';

export type ModoImgFallback = 'placeholder' | 'ocultar' | '';

@Directive({
  selector: 'img[appImgFallback]'
})
export class ImgFallbackDirective {

  // '' o 'placeholder': cambia el src por img-null.png. 'ocultar': esconde el <img>.
  @Input() appImgFallback: ModoImgFallback = '';

  private yaFallo = false;

  constructor(private el: ElementRef<HTMLImageElement>) { }

  @HostListener('error')
  onError(): void {
    // Guarda: si el propio fallback no carga, no entramos en bucle de errores.
    if (this.yaFallo) { return; }
    this.yaFallo = true;

    const imagen = this.el.nativeElement;

    if (this.appImgFallback === 'ocultar') {
      imagen.style.display = 'none';
      return;
    }

    imagen.src = IMG_FALLBACK;
  }
}
