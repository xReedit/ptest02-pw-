import { TestBed } from '@angular/core/testing';

import { ComandAnalizerService } from './comand-analizer.service';

describe('ComandAnalizerService', () => {
  let service: ComandAnalizerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComandAnalizerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
