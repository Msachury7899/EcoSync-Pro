import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardApiService } from './services/dashboard-api.service';
import { DashboardMockApiService } from './services/dashboard-mock-api.service';
import { environment } from '../../../environments/environment';
import { PlantSelectorService } from '../../core/services/plant-selector.service';
import { ComplianceData, TrendData, FuelBreakdownData, DashboardSummary } from './models/dashboard-metrics.model';
import { PageHeaderComponent } from '../../shared/components/organisms/page-header/page-header.component';
import { StatCardComponent } from '../../shared/components/atoms/stat-card/stat-card.component';
import { ComplianceChartComponent } from './components/compliance-chart/compliance-chart.component';
import { TrendChartComponent } from './components/trend-chart/trend-chart.component';
import { FuelBreakdownChartComponent } from './components/fuel-breakdown-chart/fuel-breakdown-chart.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, PageHeaderComponent, StatCardComponent,
    ComplianceChartComponent, TrendChartComponent, FuelBreakdownChartComponent,
  ],
  template: `
    <div class="p-4 md:p-6">
      <eco-page-header
        title="Dashboard de Cumplimiento"
        [breadcrumbs]="[{label:'EcoSync'},{label:'Dashboard'}]">
        <div class="flex items-center gap-2">
          <label class="text-xs text-[var(--color-text-muted)]">Mes:</label>
          <input type="month" [value]="selectedMonth()"
            (change)="onMonthChange($event)"
            class="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1
                   focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"/>
        </div>
      </eco-page-header>

      <!-- KPIs -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <eco-stat-card title="Total tCO₂" [value]="totalTco2Display()" unit="t" [loading]="loadingSummary()"/>
        <eco-stat-card title="% del límite" [value]="percentDisplay()" unit="%" [loading]="loadingSummary()"/>
        <eco-stat-card title="Registros" [value]="summary()?.totalRecords ?? 0" [loading]="loadingSummary()"/>
        <eco-stat-card title="Días restantes" [value]="summary()?.remainingDays ?? 0" [loading]="loadingSummary()"/>
      </div>

      <!-- Charts grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <eco-compliance-chart [data]="complianceData()" [loading]="loadingCompliance()"/>
        <eco-trend-chart [data]="trendData()" [loading]="loadingTrend()"/>
      </div>
      <eco-fuel-breakdown-chart [data]="breakdownData()" [loading]="loadingBreakdown()"/>
    </div>
  `,
  providers: [
    { provide: DashboardApiService, useClass: environment.useMocks ? DashboardMockApiService : DashboardApiService },
  ],
})
export class DashboardPageComponent implements OnInit {
  private readonly api = inject(DashboardApiService);
  private readonly plantSvc = inject(PlantSelectorService);

  protected readonly selectedMonth = signal(new Date().toISOString().slice(0, 7));
  protected readonly complianceData = signal<ComplianceData | null>(null);
  protected readonly trendData = signal<TrendData | null>(null);
  protected readonly breakdownData = signal<FuelBreakdownData | null>(null);
  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loadingCompliance = signal(true);
  protected readonly loadingTrend = signal(true);
  protected readonly loadingBreakdown = signal(true);
  protected readonly loadingSummary = signal(true);

  protected readonly totalTco2Display = computed(() => {
    const v = this.summary()?.totalTco2;
    return v != null ? v.toFixed(2) : '—';
  });
  protected readonly percentDisplay = computed(() => {
    const v = this.summary()?.percentOfLimit;
    return v != null ? v.toFixed(1) : '—';
  });

  ngOnInit(): void { this.load(); }

  onMonthChange(event: Event): void {
    this.selectedMonth.set((event.target as HTMLInputElement).value);
    this.load();
  }

  private load(): void {
    const plantId = this.plantSvc.activePlantId() ?? '';
    const month = this.selectedMonth();
    const year = parseInt(month.slice(0, 4), 10);

    this.loadingCompliance.set(true);
    this.loadingTrend.set(true);
    this.loadingBreakdown.set(true);
    this.loadingSummary.set(true);

    this.api.getCompliance(plantId, year).subscribe({ next: (d: ComplianceData) => { this.complianceData.set(d); this.loadingCompliance.set(false); }, error: () => this.loadingCompliance.set(false) });
    this.api.getTrend(plantId, month).subscribe({ next: (d: TrendData) => { this.trendData.set(d); this.loadingTrend.set(false); }, error: () => this.loadingTrend.set(false) });
    this.api.getFuelBreakdown(plantId, month).subscribe({ next: (d: FuelBreakdownData) => { this.breakdownData.set(d); this.loadingBreakdown.set(false); }, error: () => this.loadingBreakdown.set(false) });
    this.api.getSummary(plantId, month).subscribe({ next: (d: DashboardSummary) => { this.summary.set(d); this.loadingSummary.set(false); }, error: () => this.loadingSummary.set(false) });
  }
}
