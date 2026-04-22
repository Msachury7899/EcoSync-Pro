import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PlantSelectorComponent } from './plant-selector.component';
import { PlantSelectorService, Plant } from '../../../../core/services/plant-selector.service';
import { PlantsApiService } from '../../../../core/services/plants-api.service';
import { of, throwError } from 'rxjs';

describe('PlantSelectorComponent', () => {
  let fixture: ComponentFixture<PlantSelectorComponent>;
  let component: PlantSelectorComponent;
  let plantSelector: PlantSelectorService;
  let plantsApi: jasmine.SpyObj<PlantsApiService>;

  beforeEach(async () => {
    plantsApi = jasmine.createSpyObj('PlantsApiService', ['getPlants']);
    plantsApi.getPlants.and.returnValue(of([
      { id: 'p1', name: 'Planta A', monthlyLimitTco2: 100, createdAt: '2024-01-01' },
      { id: 'p2', name: 'Planta B', monthlyLimitTco2: 200, createdAt: '2024-01-01' },
    ]));

    await TestBed.configureTestingModule({
      imports: [PlantSelectorComponent],
      providers: [
        PlantSelectorService,
        { provide: PlantsApiService, useValue: plantsApi },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlantSelectorComponent);
    component = fixture.componentInstance;
    plantSelector = TestBed.inject(PlantSelectorService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load plants on init', () => {
    fixture.detectChanges();
    expect(plantsApi.getPlants).toHaveBeenCalled();
  });

  it('should handle API error gracefully', () => {
    plantsApi.getPlants.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    // Should not throw
    expect(component).toBeTruthy();
  });

  it('onSelect sets plant in service', () => {
    fixture.detectChanges();
    const event = { target: { value: 'p1' } } as unknown as Event;
    component.onSelect(event);
    expect(plantSelector.activePlantId()).toBe('p1');
  });

  it('onSelect with empty value clears plant', () => {
    fixture.detectChanges();
    const event = { target: { value: '' } } as unknown as Event;
    component.onSelect(event);
    expect(plantSelector.activePlant()).toBeNull();
  });
});
