import { TestBed } from '@angular/core/testing';

import { CocinarDescuentosPromoService } from './cocinar-descuentos-promo.service';

describe('CocinarDescuentosPromoService', () => {
  let service: CocinarDescuentosPromoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CocinarDescuentosPromoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
