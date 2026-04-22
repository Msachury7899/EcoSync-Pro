import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { EmissionsPageComponent } from './emissions-page.component';
import { EmissionsApiService } from './services/emissions-api.service';
import { EmissionFormService } from './services/emission-form.service';
import { PlantSelectorService } from '../../core/services/plant-selector.service';
import { PlantsApiService } from '../../core/services/plants-api.service';
import { of } from 'rxjs';

describe('EmissionsPageComponent', () => {
  let fixture: ComponentFixture<EmissionsPageComponent>;
  let component: EmissionsPageComponent;

  beforeEach(async () => {
    const mockApi = {
      getFuelTypes: () => of([]),
      getPlants: () => of([]),
      createEmissionRecord: () => of({}),
      getEmissionRecords: () => of([]),
    };

    const mockPlantsApi = { getPlants: () => of([]) };

    await TestBed.configureTestingModule({
      imports: [EmissionsPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        PlantSelectorService,
        { provide: PlantsApiService, useValue: mockPlantsApi },
      ],
    })
    .overrideComponent(EmissionsPageComponent, {
      set: {
        providers: [
          { provide: EmissionsApiService, useValue: mockApi },
          EmissionFormService,
          FormBuilder,
        ],
      },
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmissionsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render page header', () => {
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('eco-page-header');
    expect(header).toBeTruthy();
  });
});
