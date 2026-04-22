import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmissionsApiService } from './emissions-api.service';
import { environment } from '../../../../environments/environment';
import { CreateEmissionRecordDto } from '../models/emission-record.model';

describe('EmissionsApiService', () => {
  let service: EmissionsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmissionsApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EmissionsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getFuelTypes() calls GET /fuel-types', () => {
    service.getFuelTypes().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/fuel-types`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getPlants() calls GET /plants', () => {
    service.getPlants().subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/plants`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createEmissionRecord() calls POST /emission-records', () => {
    const dto: CreateEmissionRecordDto = {
      plantId: 'p1', fuelTypeId: 'f1', recordedDate: '2024-06-01', quantity: 10, unit: 'L'
    };
    service.createEmissionRecord(dto).subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/emission-records`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ id: '1', ...dto, tco2Calculated: 0.025, status: 'pending', plantName: 'A', fuelTypeName: 'Diesel', createdAt: '' });
  });

  it('getEmissionRecords() maps paginated response to data array', () => {
    service.getEmissionRecords('p1', 5).subscribe(records => {
      expect(records.length).toBe(1);
    });
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    expect(req.request.params.get('limit')).toBe('5');
    req.flush({ data: [{ id: '1' }], pagination: { page: 1, limit: 5, totalCount: 1, totalPages: 1 } });
  });

  // F10-04-10: si el servidor responde 422, el observable emite el error (no lo traga)
  it('createEmissionRecord() propagates server error (422)', () => {
    let errorReceived = false;
    service.createEmissionRecord({
      plantId: 'p1', fuelTypeId: 'f1', recordedDate: '2024-06-01', quantity: 10, unit: 'L'
    }).subscribe({ error: () => { errorReceived = true; } });

    const req = httpMock.expectOne(`${environment.apiUrl}/emission-records`);
    req.flush({ message: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });
    expect(errorReceived).toBeTrue();
  });
});
