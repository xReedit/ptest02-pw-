import { TestBed } from '@angular/core/testing';

import { SpeechDataProviderService } from './speech-data-provider.service';

describe('SpeechDataProviderService', () => {
  let service: SpeechDataProviderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeechDataProviderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
