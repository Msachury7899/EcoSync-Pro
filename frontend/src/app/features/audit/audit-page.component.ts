import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuditApiService } from './services/audit-api.service';
import { AuditMockApiService } from './services/audit-mock-api.service';
import { environment } from '../../../environments/environment';
import { PlantSelectorService } from '../../core/services/plant-selector.service';
import { PageHeaderComponent } from '../../shared/components/organisms/page-header/page-header.component';
import { ButtonComponent } from '../../shared/components/atoms/button/button.component';
import { AuditListComponent } from './components/audit-list/audit-list.component';

@Component({
  selector: 'app-audit-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, ButtonComponent, AuditListComponent],
  template: `
    <div class="p-4 md:p-6">
      <eco-page-header
        title="Registro de Auditoría"
        [breadcrumbs]="[{label:'EcoSync'},{label:'Auditoría'}]">
        <eco-button variant="secondary" size="sm" (clicked)="onExport()">Exportar</eco-button>
      </eco-page-header>
      <eco-audit-list/>
    </div>
  `,
  providers: [
    { provide: AuditApiService, useClass: environment.useMocks ? AuditMockApiService : AuditApiService },
  ],
})
export class AuditPageComponent {
  private readonly api = inject(AuditApiService);
  private readonly plantSvc = inject(PlantSelectorService);

  onExport(): void {
    const plantId = this.plantSvc.activePlantId() ?? '';
    this.api.exportRecords({ plantId }).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click(); URL.revokeObjectURL(url);
    });
  }
}
