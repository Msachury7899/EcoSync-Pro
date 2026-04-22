import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ComplianceChartComponent } from './compliance-chart.component';
import { ComplianceData } from '../../models/dashboard-metrics.model';

describe('ComplianceChartComponent', () => {
  let fixture: ComponentFixture<ComplianceChartComponent>;
  let component: ComplianceChartComponent;

  const makeData = (status: 'ok' | 'warning' | 'exceeded', pct: number): ComplianceData => ({
    plantId: 'p1', plantName: 'Planta A', monthlyLimitTco2: 100,
    months: [{ month: 1, label: 'Ene', tco2Real: pct, percentOfLimit: pct, status }],
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ComplianceChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(ComplianceChartComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('renders title text', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cumplimiento mensual');
  });

  // F10-05-05: muestra spinner mientras loading es true
  it('shows spinner while loading is true', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('eco-spinner')).toBeTruthy();
  });

  it('does not show spinner when loading is false', () => {
    component.loading = false;
    component.data = makeData('ok', 60);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('eco-spinner')).toBeNull();
  });

  // F10-05-06: tCO2 < 80% -> color verde
  it('bar color is green for status ok (< 80%)', () => {
    component.data = makeData('ok', 60);
    component.loading = false;
    component.ngOnChanges();
    const colors = (component as any).barColors();
    expect(colors[0]).toBe('#16A34A');
  });

  // F10-05-07: 80-99% -> color ambar
  it('bar color is amber for status warning (80-99%)', () => {
    component.data = makeData('warning', 85);
    component.loading = false;
    component.ngOnChanges();
    const colors = (component as any).barColors();
    expect(colors[0]).toBe('#D97706');
  });

  // F10-05-08: >= 100% -> color rojo
  it('bar color is red for status exceeded (>= 100%)', () => {
    component.data = makeData('exceeded', 110);
    component.loading = false;
    component.ngOnChanges();
    const colors = (component as any).barColors();
    expect(colors[0]).toBe('#DC2626');
  });

  // F10-05-09: el componente apx-chart esta en el DOM cuando no loading
  it('renders apx-chart component when not loading', () => {
    component.loading = false;
    component.data = makeData('ok', 50);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('apx-chart')).toBeTruthy();
  });
});
