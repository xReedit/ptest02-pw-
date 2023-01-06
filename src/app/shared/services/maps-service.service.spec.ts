import { TestBed } from '@angular/core/testing';

import { MapsServiceService } from './maps-service.service';

describe('MapsServiceService', () => {
  let service: MapsServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapsServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
