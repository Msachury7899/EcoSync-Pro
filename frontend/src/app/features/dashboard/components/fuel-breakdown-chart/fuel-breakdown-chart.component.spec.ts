import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FuelBreakdownChartComponent } from './fuel-breakdown-chart.component';
import { FuelBreakdownData } from '../../models/dashboard-metrics.model';

describe('FuelBreakdownChartComponent', () => {
  let fixture: ComponentFixture<FuelBreakdownChartComponent>;
  let component: FuelBreakdownChartComponent;

  const mockData: FuelBreakdownData = {
    plantId: 'p1', month: '2024-06', totalTco2: 50,
    breakdown: [
      { fuelTypeId: 'f1', fuelTypeName: 'Diesel', tco2: 30, percentage: 60 },
      { fuelTypeId: 'f2', fuelTypeName: 'Gas Natural', tco2: 20, percentage: 40 },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FuelBreakdownChartComponent] }).compileComponents();
    fixture = TestBed.createComponent(FuelBreakdownChartComponent);
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
    expect(fixture.nativeElement.textContent).toContain('Distribución por combustible');
  });

  it('hides spinner when loading is false and data is set', () => {
    component.loading = false;
    component.data = mockData;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('eco-spinner')).toBeNull();
  });
});
