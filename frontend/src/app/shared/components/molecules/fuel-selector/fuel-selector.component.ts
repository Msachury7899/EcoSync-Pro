import {
  Component, Output, EventEmitter, OnInit, signal, computed, ChangeDetectionStrategy, inject
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SelectFieldComponent, SelectOption } from '../../atoms/select-field/select-field.component';
import { FormControlComponent } from '../form-control/form-control.component';
import { environment } from '../../../../../environments/environment';

export interface FuelType { id: string; name: string; units: string[]; }
export interface FuelSelection { fuelTypeId: string; unit: string; }

@Component({
  selector: 'eco-fuel-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SelectFieldComponent, FormControlComponent],
  template: `
    <div class="grid grid-cols-2 gap-3">
      <eco-form-control label="Tipo de combustible" [required]="true">
        <eco-select
          [options]="fuelOptions()"
          placeholder="Seleccionar..."
          (change)="onFuelChange($event)"
          [hasError]="false"/>
      </eco-form-control>

      <eco-form-control label="Unidad" [required]="true">
        <eco-select
          [options]="unitOptions()"
          placeholder="Seleccionar..."
          [hasError]="false"
          (change)="onUnitChange($event)"/>
      </eco-form-control>
    </div>
  `,
})
export class FuelSelectorComponent implements OnInit {
  @Output() fuelSelected = new EventEmitter<FuelSelection>();

  private readonly http = inject(HttpClient);

  private readonly fuelTypes = signal<FuelType[]>([]);
  private readonly selectedFuelId = signal<string>('');
  private readonly selectedUnit = signal<string>('');

  readonly fuelOptions = computed<SelectOption[]>(() =>
    this.fuelTypes().map(f => ({ value: f.id, label: f.name }))
  );

  readonly unitOptions = computed<SelectOption[]>(() => {
    const fuel = this.fuelTypes().find(f => f.id === this.selectedFuelId());
    return (fuel?.units ?? []).map(u => ({ value: u, label: u }));
  });

  ngOnInit(): void {
    this.http.get<FuelType[]>(`${environment.apiUrl}/fuel-types`).subscribe({
      next: data => this.fuelTypes.set(data),
      error: () => this.fuelTypes.set([]),
    });
  }

  onFuelChange(event: Event): void {
    this.selectedFuelId.set((event.target as HTMLSelectElement).value);
    this.selectedUnit.set('');
  }

  onUnitChange(event: Event): void {
    this.selectedUnit.set((event.target as HTMLSelectElement).value);
    if (this.selectedFuelId() && this.selectedUnit()) {
      this.fuelSelected.emit({ fuelTypeId: this.selectedFuelId(), unit: this.selectedUnit() });
    }
  }
}
