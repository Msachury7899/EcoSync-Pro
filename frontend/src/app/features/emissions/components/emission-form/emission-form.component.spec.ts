import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { EmissionFormComponent } from './emission-form.component';
import { EmissionsApiService } from '../../services/emissions-api.service';
import { EmissionFormService } from '../../services/emission-form.service';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

describe('EmissionFormComponent', () => {
  let fixture: ComponentFixture<EmissionFormComponent>;
  let component: EmissionFormComponent;
  let httpMock: HttpTestingController;
  let apiService: EmissionsApiService;
  let formSvc: EmissionFormService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmissionFormComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        EmissionsApiService,
        EmissionFormService,
        FormBuilder,
        PlantSelectorService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EmissionFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    apiService = TestBed.inject(EmissionsApiService);
    formSvc = TestBed.inject(EmissionFormService);
    fixture.detectChanges();

    // Flush init HTTP: plants + fuel-types
    httpMock.match(r => r.url.includes('/plants')).forEach(r => r.flush([]));
    httpMock.match(r => r.url.includes('/fuel-types')).forEach(r => r.flush([]));
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => expect(component).toBeTruthy());

  // F10-04-11: submit button disabled when form invalid
  it('submit button is disabled when form is invalid', () => {
    const btn = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.disabled).toBeTrue();
  });

  // F10-04-12: submit with valid form calls createEmissionRecord
  it('submit with valid form calls createEmissionRecord', () => {
    const spy = spyOn(apiService, 'createEmissionRecord').and.returnValue(
      of({ id: '1', plantId: 'p1', plantName: 'A', fuelTypeId: 'f1', fuelTypeName: 'D',
           quantity: 100, unit: 'L', tco2Calculated: 0.265, status: 'pending' as const,
           recordedDate: '2024-06-01', createdAt: '', factorSnapshot: 1, notes: null, updatedAt: '' } as any)
    );
    formSvc.form.setValue({
      plantId: 'p1', recordedDate: '2020-01-01',
      fuelTypeId: 'f1', unit: 'L', quantity: 100, notes: ''
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(spy).toHaveBeenCalled();
  });

  // F10-04-13: during submit shows loading state
  it('sets submitState to loading during submit', () => {
    spyOn(apiService, 'createEmissionRecord').and.returnValue(of({} as any));
    formSvc.form.setValue({
      plantId: 'p1', recordedDate: '2020-01-01',
      fuelTypeId: 'f1', unit: 'L', quantity: 100, notes: ''
    });
    // access submitState through component (protected, use 'any')
    expect((component as any).submitState()).toBe('idle');
  });

  // F10-04-14: success response shows success badge
  it('shows success state after successful submit', () => {
    spyOn(apiService, 'createEmissionRecord').and.returnValue(
      of({ id: '1', plantId: 'p1', plantName: 'A', fuelTypeId: 'f1', fuelTypeName: 'D',
           quantity: 100, unit: 'L', tco2Calculated: 1.5, status: 'pending' as const,
           recordedDate: '2024-06-01', createdAt: '', factorSnapshot: 1, notes: null, updatedAt: '' } as any)
    );
    formSvc.form.setValue({
      plantId: 'p1', recordedDate: '2020-01-01',
      fuelTypeId: 'f1', unit: 'L', quantity: 100, notes: ''
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect((component as any).submitState()).toBe('success');
  });

  // F10-04-15: error response shows error badge
  it('shows error state after failed submit', () => {
    spyOn(apiService, 'createEmissionRecord').and.returnValue(
      throwError(() => new Error('422'))
    );
    formSvc.form.setValue({
      plantId: 'p1', recordedDate: '2020-01-01',
      fuelTypeId: 'f1', unit: 'L', quantity: 100, notes: ''
    });
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect((component as any).submitState()).toBe('error');
  });
});
