import { Component, Input, OnChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SpinnerComponent } from '../../../../shared/components/atoms/spinner/spinner.component';
import { FuelBreakdownData } from '../../models/dashboard-metrics.model';

@Component({
  selector: 'eco-fuel-breakdown-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgApexchartsModule, SpinnerComponent],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <h3 class="text-sm font-600 text-[var(--color-text-primary)] mb-4">Distribución por combustible</h3>
      @if (loading) {
        <div class="flex justify-center py-10"><eco-spinner/></div>
      } @else {
        <apx-chart
          [series]="series()"
          [chart]="chartOptions.chart"
          [labels]="labels()"
          [legend]="chartOptions.legend"
          [colors]="chartOptions.colors"
          [dataLabels]="chartOptions.dataLabels"
          [tooltip]="chartOptions.tooltip"
          [plotOptions]="chartOptions.plotOptions"/>
      }
    </div>
  `,
})
export class FuelBreakdownChartComponent implements OnChanges {
  @Input() data: FuelBreakdownData | null = null;
  @Input() loading = true;

  protected readonly series = signal<number[]>([]);
  protected readonly labels = signal<string[]>([]);

  protected readonly chartOptions = {
    chart: { type: 'donut' as const, height: 220, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    colors: ['#16A34A', '#0284C7', '#D97706', '#DC2626', '#8B5CF6'],
    legend: { position: 'bottom' as const, fontSize: '11px' },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: '65%' } } },
    tooltip: { y: { formatter: (v: number) => `${v.toFixed(3)} tCO₂` } },
  };

  ngOnChanges(): void {
    if (!this.data) return;
    this.series.set(this.data.breakdown.map(b => b.tco2));
    this.labels.set(this.data.breakdown.map(b => b.fuelTypeName));
  }
}
