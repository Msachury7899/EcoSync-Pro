import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { DashboardPageComponent } from './dashboard-page.component';
import { DashboardApiService } from './services/dashboard-api.service';
import { PlantSelectorService } from '../../core/services/plant-selector.service';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let httpMock: HttpTestingController;
  let apiService: DashboardApiService;

  const stubSummary = {
    plantId: '', month: '2024-06', totalTco2: 50, monthlyLimitTco2: 100,
    percentOfLimit: 50, totalRecords: 10, remainingDays: 15, status: 'ok' as const,
  };
  const stubCompliance = { plantId: '', plantName: '', monthlyLimitTco2: 100, months: [] };
  const stubTrend = { plantId: '', month: '2024-06', monthlyLimitTco2: 100, days: [] };
  const stubBreakdown = { plantId: '', month: '2024-06', totalTco2: 0, breakdown: [] };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        DashboardApiService,
        PlantSelectorService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(DashboardApiService);
    fixture.detectChanges();

    // Flush initial load (4 dashboard requests)
    const pending = httpMock.match(r => r.url.includes('/dashboard'));
    for (const req of pending) {
      if (req.request.url.includes('compliance')) req.flush(stubCompliance);
      else if (req.request.url.includes('trend')) req.flush(stubTrend);
      else if (req.request.url.includes('fuel-breakdown')) req.flush(stubBreakdown);
      else req.flush(stubSummary);
    }
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  it('renders page title', () => {
    expect(fixture.nativeElement.textContent).toContain('Dashboard de Cumplimiento');
  });

  it('renders 4 stat-card components', () => {
    const cards = fixture.nativeElement.querySelectorAll('eco-stat-card');
    expect(cards.length).toBe(4);
  });

  // F10-05-10: al cambiar el mes, se vuelven a llamar los servicios
  it('re-calls dashboard API methods when month input changes', () => {
    const spyCompliance = spyOn(apiService, 'getCompliance').and.returnValue(of(stubCompliance));
    const spyTrend = spyOn(apiService, 'getTrend').and.returnValue(of(stubTrend));
    const spyBreakdown = spyOn(apiService, 'getFuelBreakdown').and.returnValue(of(stubBreakdown));
    const spySummary = spyOn(apiService, 'getSummary').and.returnValue(of(stubSummary));

    const monthInput = fixture.nativeElement.querySelector('input[type="month"]');
    monthInput.value = '2024-05';
    monthInput.dispatchEvent(new Event('change'));

    expect(spyCompliance).toHaveBeenCalled();
    expect(spyTrend).toHaveBeenCalled();
    expect(spyBreakdown).toHaveBeenCalled();
    expect(spySummary).toHaveBeenCalled();
  });

  // F10-05-11: los stat-cards reciben valores correctos del summary
  it('passes summary values to stat-card components', () => {
    expect((component as any).summary()).toEqual(stubSummary);
  });
});
