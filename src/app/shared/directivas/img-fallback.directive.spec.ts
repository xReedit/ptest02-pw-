import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IMG_FALLBACK, ImgFallbackDirective } from './img-fallback.directive';

@Component({
  template: `
    <img id="conFallback" appImgFallback [src]="src">
    <img id="oculta" appImgFallback="ocultar" [src]="src">
  `
})
class HostImgComponent {
  src = 'https://servidor.invalido.local/no-existe.png';
}

describe('ImgFallbackDirective', () => {
  let fixture: ComponentFixture<HostImgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImgFallbackDirective, HostImgComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostImgComponent);
    fixture.detectChanges();
  });

  function img(id: string): HTMLImageElement {
    return fixture.nativeElement.querySelector('#' + id) as HTMLImageElement;
  }

  it('cambia el src por la imagen por defecto cuando la carga falla', () => {
    const el = img('conFallback');
    el.dispatchEvent(new Event('error'));
    expect(el.getAttribute('src')).toContain(IMG_FALLBACK);
  });

  it('actua una sola vez: si el fallback tambien falla no vuelve a tocar el src', () => {
    const el = img('conFallback');
    el.dispatchEvent(new Event('error'));
    const srcTrasPrimerError = el.getAttribute('src');

    el.setAttribute('src', 'https://servidor.invalido.local/otra.png');
    el.dispatchEvent(new Event('error'));

    expect(el.getAttribute('src')).toBe('https://servidor.invalido.local/otra.png');
    expect(srcTrasPrimerError).toContain(IMG_FALLBACK);
  });

  it('esconde el elemento cuando el modo es ocultar y no toca el src', () => {
    const el = img('oculta');
    el.dispatchEvent(new Event('error'));
    expect(el.style.display).toBe('none');
    expect(el.getAttribute('src')).not.toContain(IMG_FALLBACK);
  });

  it('no hace nada mientras la imagen no dispare error', () => {
    const el = img('conFallback');
    expect(el.getAttribute('src')).toBe('https://servidor.invalido.local/no-existe.png');
    expect(el.style.display).toBe('');
  });
});
