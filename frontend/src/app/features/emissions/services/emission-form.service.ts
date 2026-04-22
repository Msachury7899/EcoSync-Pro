import { Injectable } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

export function maxDateToday(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const today = new Date(); today.setHours(23, 59, 59, 999);
  return new Date(control.value) > today ? { maxDate: true } : null;
}

@Injectable()
export class EmissionFormService {
  readonly form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      plantId:     ['', Validators.required],
      recordedDate:['', [Validators.required, maxDateToday]],
      fuelTypeId:  ['', Validators.required],
      unit:        ['', Validators.required],
      quantity:    [null, [Validators.required, Validators.min(0.01), Validators.max(999999)]],
      notes:       [''],
    });
  }

  resetForm(): void {
    this.form.reset({ plantId: '', recordedDate: '', fuelTypeId: '', unit: '', quantity: null, notes: '' });
  }
}
