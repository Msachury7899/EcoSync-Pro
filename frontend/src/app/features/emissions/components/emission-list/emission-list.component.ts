import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmissionsApiService } from '../../services/emissions-api.service';
import { EmissionRecord } from '../../models/emission-record.model';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/atoms/badge/badge.component';
import { SpinnerComponent } from '../../../../shared/components/atoms/spinner/spinner.component';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

@Component({
  selector: 'eco-emission-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BadgeComponent, SpinnerComponent],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-[var(--color-border)]">
        <h3 class="text-sm font-600 text-[var(--color-text-primary)]">Registros recientes</h3>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-10"><eco-spinner size="md"/></div>
      } @else if (records().length === 0) {
        <p class="text-sm text-[var(--color-text-muted)] text-center py-10">Sin registros aún</p>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] uppercase tracking-wide">
              <tr>
                @for (col of columns; track col) {
                  <th class="px-3 py-2 text-left font-medium">{{ col }}</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              @for (r of records(); track r.id) {
                <tr class="hover:bg-[var(--color-bg-elevated)] transition-colors duration-150"
                    style="height: var(--table-row-height)">
                  <td class="px-3 py-2 text-[var(--color-text-secondary)]">{{ r.recordedDate | date:'dd/MM/yy' }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-primary)] font-medium">{{ r.fuelTypeName }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-secondary)]">{{ r.quantity | number }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-muted)]">{{ r.unit }}</td>
                  <td class="px-3 py-2 font-medium text-[var(--color-text-primary)]">{{ r.tco2Calculated | number:'1.3-3' }}</td>
                  <td class="px-3 py-2">
                    <eco-badge [variant]="badgeVariant(r.status)">
                      {{ r.status === 'audited' ? 'Auditado' : 'Pendiente' }}
                    </eco-badge>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class EmissionListComponent implements OnInit {
  private readonly api = inject(EmissionsApiService);
  private readonly plantSvc = inject(PlantSelectorService);

  protected readonly records = signal<EmissionRecord[]>([]);
  protected readonly loading = signal(true);
  protected readonly columns = ['Fecha', 'Combustible', 'Cantidad', 'Unidad', 'tCO₂', 'Estado'];

  ngOnInit(): void {
    const plantId = this.plantSvc.activePlantId() ?? '';
    this.api.getEmissionRecords(plantId, 10).subscribe({
      next: data => { this.records.set(data); this.loading.set(false); },
      error: () => { this.records.set([]); this.loading.set(false); },
    });
  }

  badgeVariant(status: string): BadgeVariant {
    return status === 'audited' ? 'audited' : 'pending';
  }
}
