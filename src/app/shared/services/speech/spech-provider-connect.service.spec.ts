import { TestBed } from '@angular/core/testing';

import { SpechProviderConnectService } from './spech-provider-connect.service';

describe('SpechProviderConnectService', () => {
  let service: SpechProviderConnectService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpechProviderConnectService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
