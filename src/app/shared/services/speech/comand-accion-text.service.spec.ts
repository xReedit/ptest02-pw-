import { TestBed } from '@angular/core/testing';

import { ComandAccionTextService } from './comand-accion-text.service';

describe('ComandAccionTextService', () => {
  let service: ComandAccionTextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComandAccionTextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
