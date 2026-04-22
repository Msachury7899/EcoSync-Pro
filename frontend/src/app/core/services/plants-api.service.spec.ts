import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlantsApiService } from './plants-api.service';
import { PlantSelectorService } from './plant-selector.service';
import { environment } from '../../../environments/environment';

describe('PlantsApiService', () => {
  let service: PlantsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlantsApiService, PlantSelectorService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PlantsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getPlants() calls GET /plants', () => {
    const mockPlants = [{ id: 'p1', name: 'Planta A', monthlyLimitTco2: 100, createdAt: '2024-01-01' }];
    service.getPlants().subscribe(plants => {
      expect(plants.length).toBe(1);
      expect(plants[0].name).toBe('Planta A');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/plants`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlants);
  });

  it('getPlants() returns empty array', () => {
    service.getPlants().subscribe(plants => {
      expect(plants.length).toBe(0);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/plants`);
    req.flush([]);
  });
});
