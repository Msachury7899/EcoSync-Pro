import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuditApiService } from './audit-api.service';
import { environment } from '../../../../environments/environment';

describe('AuditApiService', () => {
  let service: AuditApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuditApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuditApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getAuditList() calls GET /emission-records with page and limit defaults', () => {
    service.getAuditList({}).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ data: [], pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 } });
  });

  it('getAuditList() includes status filter when provided', () => {
    service.getAuditList({ status: 'pending' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    expect(req.request.params.get('status')).toBe('pending');
    req.flush({ data: [], pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 } });
  });

  it('markAsAudited() calls PATCH /emission-records/:id/audit', () => {
    service.markAsAudited('abc123').subscribe();
    const req = httpMock.expectOne(`${environment.apiUrl}/emission-records/abc123/audit`);
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('exportRecords() calls GET /emission-records/export with responseType blob', () => {
    service.exportRecords({ plantId: 'p1' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/emission-records/export'));
    expect(req.request.method).toBe('GET');
    expect(req.request.responseType).toBe('blob');
    req.flush(new Blob());
  });
});
