import { TestBed } from '@angular/core/testing';

import { SedeDeliveryService } from './sede-delivery.service';

describe('SedeDeliveryService', () => {
  let service: SedeDeliveryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SedeDeliveryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
