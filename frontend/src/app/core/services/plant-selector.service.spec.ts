import { TestBed } from '@angular/core/testing';
import { PlantSelectorService } from './plant-selector.service';

describe('PlantSelectorService', () => {
  let service: PlantSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [PlantSelectorService] });
    service = TestBed.inject(PlantSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('activePlant() starts as null', () => {
    expect(service.activePlant()).toBeNull();
  });

  it('setPlant() updates activePlant signal', () => {
    const plant = { id: 'p1', name: 'Planta A', monthlyLimitTco2: 100, createdAt: '2024-01-01' };
    service.setPlant(plant);
    expect(service.activePlant()).toEqual(plant);
  });

  it('activePlantId() returns id when plant is set', () => {
    service.setPlant({ id: 'p2', name: 'B', monthlyLimitTco2: 50, createdAt: '2024-01-01' });
    expect(service.activePlantId()).toBe('p2');
  });

  it('activePlantId() returns null when no plant is set', () => {
    expect(service.activePlantId()).toBeNull();
  });

  it('setPlant(null) clears the plant', () => {
    service.setPlant({ id: 'p1', name: 'A', monthlyLimitTco2: 100, createdAt: '2024-01-01' });
    service.setPlant(null);
    expect(service.activePlant()).toBeNull();
  });
});
