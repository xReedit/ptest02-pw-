import { AfterViewInit, Directive, ElementRef, HostListener, Input } from '@angular/core';

export const IMG_FALLBACK = 'assets/images/icon-app/img-null.png';

export type ModoImgFallback = 'placeholder' | 'ocultar' | '';

@Directive({
  selector: 'img[appImgFallback]'
})
export class ImgFallbackDirective implements AfterViewInit {

  // '' o 'placeholder': cambia el src por img-null.png. 'ocultar': esconde el <img>.
  @Input() appImgFallback: ModoImgFallback = '';

  private yaFallo = false;

  constructor(private el: ElementRef<HTMLImageElement>) { }

  // Chromium no dispara 'error' cuando src="" (caso mas comun: el pipe imgUrl
  // devuelve '' si la BD no trae nombre de archivo). Se cubre revisando el
  // atributo tras el primer render.
  // ponytail: solo cubre el estado inicial; si el src se vacia despues de
  // ngAfterViewInit (por un cambio posterior del binding) no se detecta aqui.
  ngAfterViewInit(): void {
    const srcInicial = this.el.nativeElement.getAttribute('src');
    if (srcInicial === null || srcInicial.trim() === '') {
      this.aplicarFallback();
    }
  }

  @HostListener('error')
  onError(): void {
    this.aplicarFallback();
  }

  private aplicarFallback(): void {
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
