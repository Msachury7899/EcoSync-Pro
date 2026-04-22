import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { FuelTypesApiService } from './fuel-types-api.service';
import { environment } from '../../../environments/environment';

describe('FuelTypesApiService', () => {
  let service: FuelTypesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FuelTypesApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(FuelTypesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getFuelTypes() calls GET /fuel-types', () => {
    const mockTypes = [{ id: 'f1', name: 'Diesel', description: null, units: ['kg'], createdAt: '2024-01-01' }];
    service.getFuelTypes().subscribe(types => {
      expect(types.length).toBe(1);
      expect(types[0].name).toBe('Diesel');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/fuel-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTypes);
  });

  it('getFuelTypes() returns empty array', () => {
    service.getFuelTypes().subscribe(types => {
      expect(types.length).toBe(0);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/fuel-types`);
    req.flush([]);
  });
});
