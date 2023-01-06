import { TestBed } from '@angular/core/testing';

import { AuthNativeService } from './auth-native.service';

describe('AuthNativeService', () => {
  let service: AuthNativeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthNativeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
