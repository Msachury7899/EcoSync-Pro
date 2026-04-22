import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DashboardApiService } from './dashboard-api.service';
import { environment } from '../../../../environments/environment';

describe('DashboardApiService', () => {
  let service: DashboardApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DashboardApiService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('getCompliance() calls GET /dashboard/compliance with plantId + year', () => {
    service.getCompliance('p1', 2024).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/dashboard/compliance'));
    expect(req.request.params.get('plantId')).toBe('p1');
    expect(req.request.params.get('year')).toBe('2024');
    req.flush({ plantId: 'p1', plantName: 'A', monthlyLimitTco2: 100, months: [] });
  });

  it('getTrend() calls GET /dashboard/trend with plantId + month', () => {
    service.getTrend('p1', '2024-06').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/dashboard/trend'));
    expect(req.request.params.get('month')).toBe('2024-06');
    req.flush({ plantId: 'p1', month: '2024-06', monthlyLimitTco2: 100, days: [] });
  });

  it('getFuelBreakdown() calls GET /dashboard/fuel-breakdown', () => {
    service.getFuelBreakdown('p1', '2024-06').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/dashboard/fuel-breakdown'));
    expect(req.request.method).toBe('GET');
    req.flush({ plantId: 'p1', month: '2024-06', totalTco2: 0, breakdown: [] });
  });

  it('getSummary() calls GET /dashboard/summary', () => {
    service.getSummary('p1', '2024-06').subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/dashboard/summary'));
    expect(req.request.method).toBe('GET');
    req.flush({ plantId: 'p1', month: '2024-06', totalTco2: 10, monthlyLimitTco2: 100, percentOfLimit: 10, totalRecords: 5, remainingDays: 20, status: 'ok' });
  });
});
