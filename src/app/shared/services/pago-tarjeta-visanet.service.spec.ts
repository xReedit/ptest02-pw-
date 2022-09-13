import { TestBed } from '@angular/core/testing';

import { PagoTarjetaVisanetService } from './pago-tarjeta-visanet.service';

describe('PagoTarjetaVisanetService', () => {
  let service: PagoTarjetaVisanetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PagoTarjetaVisanetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
