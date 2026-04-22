import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FuelSelectorComponent } from './fuel-selector.component';
import { environment } from '../../../../../environments/environment';

describe('FuelSelectorComponent', () => {
  let fixture: ComponentFixture<FuelSelectorComponent>;
  let component: FuelSelectorComponent;
  let httpMock: HttpTestingController;

  const mockFuelTypes = [
    { id: 'f1', name: 'Diesel', units: ['L', 'gal'] },
    { id: 'f2', name: 'Gas Natural', units: ['m3', 'ft3'] },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FuelSelectorComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(FuelSelectorComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  // F10-03-04: al inicializar llama a GET /fuel-types una sola vez
  it('calls GET /fuel-types exactly once on init', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/fuel-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockFuelTypes);
  });

  // F10-03-05: al seleccionar un fuel_type actualiza las opciones de unidad
  it('updates unit options when a fuel type is selected', () => {
    httpMock.expectOne(`${environment.apiUrl}/fuel-types`).flush(mockFuelTypes);
    fixture.detectChanges();

    // Simulate selecting fuel type f1 (Diesel)
    component.onFuelChange({ target: { value: 'f1' } } as unknown as Event);
    fixture.detectChanges();

    expect(component.unitOptions().length).toBe(2);
    expect(component.unitOptions()[0].value).toBe('L');
  });

  // F10-03-06: emite fuelSelected con fuelTypeId y unit al completar seleccion
  it('emits fuelSelected with fuelTypeId and unit when both are selected', () => {
    httpMock.expectOne(`${environment.apiUrl}/fuel-types`).flush(mockFuelTypes);
    fixture.detectChanges();

    const spy = jasmine.createSpy('fuelSelected');
    component.fuelSelected.subscribe(spy);

    component.onFuelChange({ target: { value: 'f1' } } as unknown as Event);
    component.onUnitChange({ target: { value: 'L' } } as unknown as Event);

    expect(spy).toHaveBeenCalledWith({ fuelTypeId: 'f1', unit: 'L' });
  });

  // F10-03-07: si la llamada HTTP falla, muestra select vacio sin excepcion
  it('shows empty fuel options when HTTP call fails without throwing', () => {
    const req = httpMock.expectOne(`${environment.apiUrl}/fuel-types`);
    req.error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(component.fuelOptions().length).toBe(0);
  });
});
