import {
  Component, OnInit, signal, inject, ChangeDetectionStrategy
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime } from 'rxjs/operators';
import { EmissionsApiService } from '../../services/emissions-api.service';
import { EmissionFormService } from '../../services/emission-form.service';
import { EmissionRecord, Plant } from '../../models/emission-record.model';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';
import { BadgeComponent } from '../../../../shared/components/atoms/badge/badge.component';
import { InputFieldComponent } from '../../../../shared/components/atoms/input-field/input-field.component';
import { SelectFieldComponent, SelectOption } from '../../../../shared/components/atoms/select-field/select-field.component';
import { FormControlComponent } from '../../../../shared/components/molecules/form-control/form-control.component';
import { FuelSelectorComponent, FuelSelection } from '../../../../shared/components/molecules/fuel-selector/fuel-selector.component';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'eco-emission-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, ReactiveFormsModule,
    ButtonComponent, BadgeComponent, InputFieldComponent,
    SelectFieldComponent, FormControlComponent, FuelSelectorComponent,
  ],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
      <h2 class="text-base font-600 text-[var(--color-text-primary)] mb-4">Nuevo Registro de Emisión</h2>

      <form [formGroup]="formSvc.form" (ngSubmit)="onSubmit()" class="space-y-4">

        <eco-form-control label="Planta" [required]="true" [control]="formSvc.form.get('plantId')">
          <eco-select formControlName="plantId" [options]="plantOptions()" placeholder="Seleccionar planta..."
            [hasError]="isInvalid('plantId')"/>
        </eco-form-control>

        <eco-form-control label="Fecha de registro" [required]="true" [control]="formSvc.form.get('recordedDate')">
          <eco-input type="date" formControlName="recordedDate"
            [hasError]="isInvalid('recordedDate')"/>
        </eco-form-control>

        <eco-fuel-selector (fuelSelected)="onFuelSelected($event)"/>

        <eco-form-control label="Cantidad" [required]="true" [control]="formSvc.form.get('quantity')">
          <eco-input type="number" placeholder="Ej: 250.5" formControlName="quantity"
            [hasError]="isInvalid('quantity')"/>
        </eco-form-control>

        <eco-form-control label="Notas" [control]="formSvc.form.get('notes')">
          <eco-input type="text" placeholder="Opcional..." formControlName="notes"/>
        </eco-form-control>

        <div class="flex items-center gap-3 pt-2">
          <eco-button type="submit" variant="primary" [loading]="submitState() === 'loading'"
            [disabled]="formSvc.form.invalid">
            Registrar emisión
          </eco-button>

          @if (submitState() === 'success') {
            <eco-badge variant="success">
              ✓ Registrado — {{ lastTco2() | number:'1.3-3' }} tCO₂
            </eco-badge>
          }
          @if (submitState() === 'error') {
            <eco-badge variant="danger">Error al registrar</eco-badge>
          }
        </div>
      </form>
    </div>
  `,
})
export class EmissionFormComponent implements OnInit {
  protected readonly formSvc = inject(EmissionFormService);
  private readonly api = inject(EmissionsApiService);

  protected readonly plantOptions = signal<SelectOption[]>([]);
  protected readonly submitState = signal<SubmitState>('idle');
  protected readonly lastTco2 = signal<number>(0);

  ngOnInit(): void {
    this.api.getPlants().subscribe(plants =>
      this.plantOptions.set(plants.map((p: Plant) => ({ value: p.id, label: p.name })))
    );

    this.formSvc.form.get('quantity')?.valueChanges
      .pipe(debounceTime(300))
      .subscribe(() => {});
  }

  onFuelSelected(sel: FuelSelection): void {
    this.formSvc.form.patchValue({ fuelTypeId: sel.fuelTypeId, unit: sel.unit });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.formSvc.form.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    if (this.formSvc.form.invalid) { this.formSvc.form.markAllAsTouched(); return; }
    this.submitState.set('loading');
    this.api.createEmissionRecord(this.formSvc.form.value).subscribe({
      next: (record: EmissionRecord) => {
        this.lastTco2.set(record.tco2Calculated);
        this.submitState.set('success');
        this.formSvc.resetForm();
        setTimeout(() => this.submitState.set('idle'), 4000);
      },
      error: () => {
        this.submitState.set('error');
        setTimeout(() => this.submitState.set('idle'), 4000);
      },
    });
  }
}
