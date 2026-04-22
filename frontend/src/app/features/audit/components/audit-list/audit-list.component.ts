import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditApiService } from '../../services/audit-api.service';
import { AuditRecord } from '../../models/audit-record.model';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';
import { BadgeComponent, BadgeVariant } from '../../../../shared/components/atoms/badge/badge.component';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';
import { SpinnerComponent } from '../../../../shared/components/atoms/spinner/spinner.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/molecules/confirmation-dialog/confirmation-dialog.component';

interface Pagination { page: number; limit: number; totalCount: number; totalPages: number; }

@Component({
  selector: 'eco-audit-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, BadgeComponent, ButtonComponent, SpinnerComponent, ConfirmationDialogComponent],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">

      <!-- Filters -->
      <div class="flex flex-wrap gap-3 px-4 py-3 border-b border-[var(--color-border)]">
        <select (change)="onStatusFilter($event)"
          class="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5 cursor-pointer
                 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none">
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="audited">Auditado</option>
        </select>
        <input type="date" placeholder="Desde" (change)="onDateFilter('from', $event)"
          class="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5
                 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"/>
        <input type="date" placeholder="Hasta" (change)="onDateFilter('to', $event)"
          class="text-xs border border-[var(--color-border)] rounded-lg px-2 py-1.5
                 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"/>
      </div>

      @if (loading()) {
        <div class="flex justify-center py-12"><eco-spinner/></div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] uppercase tracking-wide">
              <tr>
                @for (col of columns; track col) {
                  <th class="px-3 py-2 text-left font-medium whitespace-nowrap">{{ col }}</th>
                }
                <th class="px-3 py-2 text-left font-medium">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--color-border)]">
              @for (r of records(); track r.id) {
                <tr class="hover:bg-[var(--color-bg-elevated)] transition-colors duration-150"
                    style="height: var(--table-row-height)">
                  <td class="px-3 py-2 text-[var(--color-text-muted)]">{{ r.recordedDate | date:'dd/MM/yy' }}</td>
                  <td class="px-3 py-2 font-medium text-[var(--color-text-primary)]">{{ r.plantName }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-secondary)]">{{ r.fuelTypeName }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-secondary)]">{{ r.quantity | number }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-muted)]">{{ r.unit }}</td>
                  <td class="px-3 py-2 font-medium">{{ r.tco2Calculated | number:'1.3-3' }}</td>
                  <td class="px-3 py-2">
                    <eco-badge [variant]="badgeVariant(r.status)">
                      {{ r.status === 'audited' ? 'Auditado' : 'Pendiente' }}
                    </eco-badge>
                  </td>
                  <td class="px-3 py-2 text-[var(--color-text-muted)]">{{ r.auditedBy ?? '—' }}</td>
                  <td class="px-3 py-2 text-[var(--color-text-muted)]">{{ r.auditedAt ? (r.auditedAt | date:'dd/MM/yy') : '—' }}</td>
                  <td class="px-3 py-2">
                    @if (r.status === 'pending') {
                      <eco-button variant="ghost" size="sm" (clicked)="openConfirm(r)">Auditar</eco-button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (pagination(); as pg) {
          <div class="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
            <span class="text-xs text-[var(--color-text-muted)]">
              {{ pg.totalCount }} registros · Página {{ pg.page }} de {{ pg.totalPages }}
            </span>
            <div class="flex gap-2">
              <eco-button variant="secondary" size="sm" [disabled]="pg.page === 1" (clicked)="changePage(pg.page - 1)">Anterior</eco-button>
              <eco-button variant="secondary" size="sm" [disabled]="pg.page === pg.totalPages" (clicked)="changePage(pg.page + 1)">Siguiente</eco-button>
            </div>
          </div>
        }
      }
    </div>

    <eco-confirmation-dialog
      [open]="dialogOpen()"
      title="Marcar como Auditado"
      message="Esta acción cambiará el estado del registro a 'Auditado'. No se puede deshacer."
      confirmLabel="Marcar como Auditado"
      (confirmed)="onConfirmAudit()"
      (cancelled)="dialogOpen.set(false)"/>
  `,
})
export class AuditListComponent implements OnInit {
  protected readonly api = inject(AuditApiService);
  private readonly plantSvc = inject(PlantSelectorService);

  protected readonly records = signal<AuditRecord[]>([]);
  protected readonly pagination = signal<Pagination | null>(null);
  protected readonly loading = signal(true);
  protected readonly dialogOpen = signal(false);
  private selectedRecord: AuditRecord | null = null;

  protected readonly columns = ['Fecha', 'Planta', 'Combustible', 'Cantidad', 'Unidad', 'tCO₂', 'Estado', 'Auditado por', 'Fecha auditoría'];

  private params = { page: 1, limit: 20, plantId: '', status: undefined as 'pending' | 'audited' | undefined, fromDate: '', toDate: '' };

  ngOnInit(): void { this.params.plantId = this.plantSvc.activePlantId() ?? ''; this.fetchRecords(); }

  onStatusFilter(e: Event): void {
    const val = (e.target as HTMLSelectElement).value as 'pending' | 'audited' | '';
    this.params.status = val || undefined; this.params.page = 1; this.fetchRecords();
  }

  onDateFilter(type: 'from' | 'to', e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    if (type === 'from') this.params.fromDate = val; else this.params.toDate = val;
    this.params.page = 1; this.fetchRecords();
  }

  changePage(page: number): void { this.params.page = page; this.fetchRecords(); }

  openConfirm(record: AuditRecord): void { this.selectedRecord = record; this.dialogOpen.set(true); }

  onConfirmAudit(): void {
    if (!this.selectedRecord) return;
    const id = this.selectedRecord.id;
    this.dialogOpen.set(false);
    this.api.markAsAudited(id).subscribe({
      next: updated => {
        this.records.update(list => list.map(r => r.id === id ? { ...r, ...updated } : r));
      },
    });
  }

  private fetchRecords(): void {
    this.loading.set(true);
    this.api.getAuditList(this.params).subscribe({
      next: res => { this.records.set(res.data); this.pagination.set(res.pagination); this.loading.set(false); },
      error: () => { this.records.set([]); this.loading.set(false); },
    });
  }

  badgeVariant(status: string): BadgeVariant { return status === 'audited' ? 'audited' : 'pending'; }
}
