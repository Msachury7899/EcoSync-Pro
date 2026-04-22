import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { EmissionListComponent } from './emission-list.component';
import { EmissionsApiService } from '../../services/emissions-api.service';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

describe('EmissionListComponent', () => {
  let fixture: ComponentFixture<EmissionListComponent>;
  let component: EmissionListComponent;
  let httpMock: HttpTestingController;

  const mockRecords = [
    { id: '1', plantId: 'p1', plantName: 'Planta A', fuelTypeId: 'f1', fuelTypeName: 'Diesel',
      quantity: 100, unit: 'L', tco2Calculated: 0.265, status: 'pending' as const,
      recordedDate: '2024-06-01', createdAt: '' },
    { id: '2', plantId: 'p1', plantName: 'Planta A', fuelTypeId: 'f2', fuelTypeName: 'Gas',
      quantity: 50, unit: 'm3', tco2Calculated: 0.096, status: 'audited' as const,
      recordedDate: '2024-06-02', createdAt: '' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmissionListComponent],
      providers: [
        EmissionsApiService,
        PlantSelectorService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmissionListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  // F10-04-16: muestra skeleton mientras carga
  it('shows spinner while loading', () => {
    const spinner = fixture.debugElement.query(By.css('eco-spinner'));
    expect(spinner).toBeTruthy();
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush({
      data: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0 }
    });
  });

  // F10-04-17: renderiza una fila por cada EmissionRecord
  it('renders one row per EmissionRecord', () => {
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    req.flush({ data: mockRecords, pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1 } });
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);
  });

  // F10-04-18: cada fila muestra el badge de estado correcto
  it('renders correct status badge for each record', () => {
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    req.flush({ data: mockRecords, pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Pendiente');
    expect(fixture.nativeElement.textContent).toContain('Auditado');
  });

  it('shows empty state when no records', () => {
    const req = httpMock.expectOne(r => r.url.includes('/emission-records'));
    req.flush({ data: [], pagination: { page: 1, limit: 10, totalCount: 0, totalPages: 0 } });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Sin registros');
  });
});
