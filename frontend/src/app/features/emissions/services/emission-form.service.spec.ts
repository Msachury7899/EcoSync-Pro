import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { EmissionFormService, maxDateToday } from './emission-form.service';
import { AbstractControl, FormControl } from '@angular/forms';

describe('maxDateToday validator', () => {
  it('returns null for a past date', () => {
    const ctrl = new FormControl('2020-01-01');
    expect(maxDateToday(ctrl)).toBeNull();
  });

  it('returns { maxDate: true } for a future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const ctrl = new FormControl(futureDate.toISOString().slice(0, 10));
    expect(maxDateToday(ctrl)).toEqual({ maxDate: true });
  });

  it('returns null for empty value', () => {
    const ctrl = new FormControl('');
    expect(maxDateToday(ctrl as AbstractControl)).toBeNull();
  });
});

describe('EmissionFormService', () => {
  let service: EmissionFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EmissionFormService, FormBuilder] });
    service = TestBed.inject(EmissionFormService);
  });

  it('should be created', () => expect(service).toBeTruthy());

  it('form starts invalid (required fields empty)', () => {
    expect(service.form.invalid).toBeTrue();
  });

  it('quantity requires min 0.01', () => {
    service.form.controls['quantity'].setValue(0);
    expect(service.form.controls['quantity'].errors?.['min']).toBeTruthy();
  });

  it('quantity requires max 999999', () => {
    service.form.controls['quantity'].setValue(1_000_000);
    expect(service.form.controls['quantity'].errors?.['max']).toBeTruthy();
  });

  it('resetForm() sets all controls back to initial values', () => {
    service.form.controls['plantId'].setValue('p1');
    service.resetForm();
    expect(service.form.controls['plantId'].value).toBe('');
  });
});
