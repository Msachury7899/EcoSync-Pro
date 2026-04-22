import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendChartComponent } from './trend-chart.component';
import { TrendData } from '../../models/dashboard-metrics.model';

describe('TrendChartComponent', () => {
  let fixture: ComponentFixture<TrendChartComponent>;
  let component: TrendChartComponent;

  const mockData: TrendData = {
    plantId: 'p1', month: '2024-06', monthlyLimitTco2: 100,
    days: [
      { date: '2024-06-01', tco2: 3.5 },
      { date: '2024-06-02', tco2: 4.1 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TrendChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(TrendChartComponent);
    component = fixture.componentInstance;
  });

  it('should be created', () => expect(component).toBeTruthy());

  it('shows spinner while loading', () => {
    component.loading = true;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('eco-spinner')).toBeTruthy();
  });

  it('renders title text', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tendencia diaria');
  });

  it('hides spinner when loading is false and data is set', () => {
    component.loading = false;
    component.data = mockData;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('eco-spinner')).toBeNull();
  });
});
