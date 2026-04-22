import { Component, Input, OnChanges, signal, ChangeDetectionStrategy } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexAnnotations, ApexAxisChartSeries } from 'apexcharts';
import { SpinnerComponent } from '../../../../shared/components/atoms/spinner/spinner.component';
import { ComplianceData } from '../../models/dashboard-metrics.model';

@Component({
  selector: 'eco-compliance-chart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgApexchartsModule, SpinnerComponent],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)] p-4 shadow-sm">
      <h3 class="text-sm font-600 text-[var(--color-text-primary)] mb-4">Cumplimiento mensual</h3>
      @if (loading) {
        <div class="flex justify-center py-10"><eco-spinner/></div>
      } @else {
        <apx-chart
          [series]="series()"
          [chart]="chartOptions.chart"
          [xaxis]="chartOptions.xaxis"
          [yaxis]="chartOptions.yaxis"
          [colors]="barColors()"
          [annotations]="annotations()"
          [tooltip]="chartOptions.tooltip"
          [dataLabels]="chartOptions.dataLabels"
          [plotOptions]="chartOptions.plotOptions"/>
      }
    </div>
  `,
})
export class ComplianceChartComponent implements OnChanges {
  @Input() data: ComplianceData | null = null;
  @Input() loading = true;

  protected readonly series = signal<ApexAxisChartSeries>([]);
  protected readonly barColors = signal<string[]>([]);
  protected readonly annotations = signal<ApexAnnotations>({});

  protected readonly chartOptions = {
    chart: { type: 'bar' as const, height: 260, toolbar: { show: false }, fontFamily: 'Plus Jakarta Sans, sans-serif' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
    dataLabels: { enabled: false },
    xaxis: { categories: [] as string[] },
    yaxis: { labels: { formatter: (v: number) => `${v} t` } },
    tooltip: { y: { formatter: (v: number, opts: { dataPointIndex: number }) => {
      const month = this.data?.months[opts.dataPointIndex];
      return month ? `${v.toFixed(3)} tCO₂ (${month.percentOfLimit.toFixed(1)}% del límite)` : `${v} tCO₂`;
    }}},
  };

  ngOnChanges(): void {
    if (!this.data) return;

    const months = this.data.months;
    this.chartOptions.xaxis.categories = months.map(m => m.label);

    this.series.set([{ name: 'tCO₂ real', data: months.map(m => m.tco2Real) }]);
    this.barColors.set(months.map(m =>
      m.status === 'exceeded' ? '#DC2626' : m.status === 'warning' ? '#D97706' : '#16A34A'
    ));
    this.annotations.set({
      yaxis: [{
        y: this.data.monthlyLimitTco2,
        borderColor: '#94A3B8',
        borderWidth: 2,
        strokeDashArray: 5,
        label: { text: `Límite: ${this.data.monthlyLimitTco2} tCO₂`, style: { color: '#475569', fontSize: '11px' } },
      }],
    });
  }
}
