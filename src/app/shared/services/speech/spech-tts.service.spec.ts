import { TestBed } from '@angular/core/testing';

import { SpechTTSService } from './spech-tts.service';

describe('SpechTTSService', () => {
  let service: SpechTTSService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpechTTSService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
