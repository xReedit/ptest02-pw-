import { TestBed } from '@angular/core/testing';

import { SpechTotextService } from './spech-totext.service';

describe('SpechTotextService', () => {
  let service: SpechTotextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpechTotextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
