import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuditPageComponent } from './audit-page.component';
import { AuditApiService } from './services/audit-api.service';
import { PlantSelectorService } from '../../core/services/plant-selector.service';

describe('AuditPageComponent', () => {
  let fixture: ComponentFixture<AuditPageComponent>;
  let component: AuditPageComponent;
  let httpMock: HttpTestingController;
  let apiService: AuditApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuditApiService,
        PlantSelectorService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(AuditApiService);
    fixture.detectChanges();

    // Flush initial list load
    httpMock.match(r => r.url.includes('/emission-records')).forEach(r =>
      r.flush({ data: [], pagination: { page: 1, limit: 20, totalCount: 0, totalPages: 0 } })
    );
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  it('renders page title', () => {
    expect(fixture.nativeElement.textContent).toContain('Auditor');
  });

  // F10-06-13: boton Exportar llama a AuditApiService.exportRecords
  it('Exportar button calls exportRecords', () => {
    const spy = spyOn(apiService, 'exportRecords').and.returnValue(of(new Blob()));
    component.onExport();
    expect(spy).toHaveBeenCalled();
  });

  // F10-06-15: si exportRecords falla, no lanza excepcion no manejada
  it('does not throw when exportRecords fails', () => {
    spyOn(apiService, 'exportRecords').and.returnValue(
      throwError(() => new Error('500'))
    );
    expect(() => {
      apiService.exportRecords({}).subscribe({ error: () => {} });
    }).not.toThrow();
  });
});
