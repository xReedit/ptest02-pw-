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

@Component({
  template: `
    <img id="conFallbackVacio" appImgFallback [src]="src">
    <img id="ocultaVacio" appImgFallback="ocultar" [src]="src">
  `
})
class HostImgVacioComponent {
  src = '';
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

describe('ImgFallbackDirective con src vacio desde el inicio', () => {
  let fixture: ComponentFixture<HostImgVacioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ImgFallbackDirective, HostImgVacioComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostImgVacioComponent);
    fixture.detectChanges();
  });

  function img(id: string): HTMLImageElement {
    return fixture.nativeElement.querySelector('#' + id) as HTMLImageElement;
  }

  it('aplica el placeholder cuando el src ya nace vacio (pipe imgUrl sin nombre)', () => {
    const el = img('conFallbackVacio');
    expect(el.getAttribute('src')).toContain(IMG_FALLBACK);
  });

  it('esconde el elemento cuando el src ya nace vacio y el modo es ocultar', () => {
    const el = img('ocultaVacio');
    expect(el.style.display).toBe('none');
    expect(el.getAttribute('src')).not.toContain(IMG_FALLBACK);
  });
});
