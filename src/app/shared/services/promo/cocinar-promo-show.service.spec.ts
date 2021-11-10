import { TestBed } from '@angular/core/testing';

import { CocinarPromoShowService } from './cocinar-promo-show.service';

describe('CocinarPromoShowService', () => {
  let service: CocinarPromoShowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CocinarPromoShowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
