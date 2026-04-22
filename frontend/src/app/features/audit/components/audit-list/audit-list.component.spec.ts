import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { AuditListComponent } from './audit-list.component';
import { AuditApiService } from '../../services/audit-api.service';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

describe('AuditListComponent', () => {
  let fixture: ComponentFixture<AuditListComponent>;
  let component: AuditListComponent;
  let httpMock: HttpTestingController;

  const mockData = {
    data: [
      { id: '1', plantId: 'p1', plantName: 'Planta A', fuelTypeId: 'f1', fuelTypeName: 'Diesel',
        quantity: 100, unit: 'L', tco2Calculated: 0.265, status: 'pending',
        recordedDate: '2024-06-01', createdAt: '', auditedBy: null, auditedAt: null },
      { id: '2', plantId: 'p1', plantName: 'Planta A', fuelTypeId: 'f2', fuelTypeName: 'Gas',
        quantity: 50, unit: 'm3', tco2Calculated: 0.096, status: 'audited',
        recordedDate: '2024-06-02', createdAt: '', auditedBy: 'admin@eco.co', auditedAt: '2024-06-10' },
    ],
    pagination: { page: 1, limit: 20, totalCount: 2, totalPages: 1 },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditListComponent],
      providers: [
        AuditApiService,
        PlantSelectorService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  // F10-06-04: muestra skeleton en carga inicial
  it('shows spinner during initial load', () => {
    const spinner = fixture.debugElement.query(By.css('eco-spinner'));
    expect(spinner).toBeTruthy();
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush(mockData);
  });

  // F10-06-05: renderiza exactamente N filas
  it('renders exactly N rows matching the response data', () => {
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush(mockData);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    expect(rows.length).toBe(2);
  });

  // F10-06-06: registros audited NO muestran boton Auditar
  it('audited records do not show the Auditar button', () => {
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush(mockData);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    const auditedRow = rows[1]; // second record is audited
    expect(auditedRow.nativeElement.textContent).not.toContain('Auditar');
  });

  // F10-06-07: registros pending SI muestran boton Auditar
  it('pending records show the Auditar button', () => {
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush(mockData);
    fixture.detectChanges();
    const rows = fixture.debugElement.queryAll(By.css('tbody tr'));
    const pendingRow = rows[0]; // first record is pending
    expect(pendingRow.nativeElement.textContent).toContain('Auditar');
  });

  // F10-06-08: sin botones de editar ni eliminar (historial inmutable)
  it('does not contain edit or delete buttons', () => {
    httpMock.expectOne(r => r.url.includes('/emission-records')).flush(mockData);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('editar');
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('eliminar');
    expect(fixture.nativeElement.textContent.toLowerCase()).not.toContain('borrar');
  });
});
