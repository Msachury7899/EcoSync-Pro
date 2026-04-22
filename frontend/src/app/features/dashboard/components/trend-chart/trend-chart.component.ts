import { Component, Input, OnChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAxisChartSeries, ApexXAxis } from 'apexcharts';
import { SpinnerComponent } from '../../../../shared/components/atoms/spinner/spinner.component';
import { TrendData } from '../../models/dashboard-metrics.model';

@Component({
  selector: 'eco-trend-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgApexchartsModule, SpinnerComponent],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <h3 class="text-sm font-600 text-[var(--color-text-primary)] mb-4">Tendencia diaria</h3>
      @if (loading) {
        <div class="flex justify-center py-10"><eco-spinner/></div>
      } @else {
        <apx-chart
          [series]="series()"
          [chart]="chartOptions.chart"
          [xaxis]="xaxis()"
          [stroke]="chartOptions.stroke"
          [fill]="chartOptions.fill"
          [colors]="chartOptions.colors"
          [dataLabels]="chartOptions.dataLabels"
          [tooltip]="chartOptions.tooltip"/>
      }
    </div>
  `,
})
export class TrendChartComponent implements OnChanges {
  @Input() data: TrendData | null = null;
  @Input() loading = true;

  protected readonly series = signal<ApexAxisChartSeries>([]);
  protected readonly xaxis = signal<ApexXAxis>({});

  protected readonly chartOptions = {
    chart: { type: 'area' as const, height: 200, toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans, sans-serif', animations: { enabled: true, speed: 400 } },
    stroke: { curve: 'smooth' as const, width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 } },
    colors: ['#16A34A'],
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v: number) => `${v.toFixed(3)} tCO₂` } },
  };

  ngOnChanges(): void {
    if (!this.data) return;
    this.series.set([{ name: 'tCO₂', data: this.data.days.map(d => d.tco2) }]);
    this.xaxis.set({ categories: this.data.days.map(d => d.date.slice(8, 10)) });
  }
}
