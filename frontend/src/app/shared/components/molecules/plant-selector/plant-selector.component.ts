import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlantSelectorService, Plant } from '../../../../core/services/plant-selector.service';
import { PlantsApiService } from '../../../../core/services/plants-api.service';

@Component({
  selector: 'eco-plant-selector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <label class="text-xs font-medium text-[var(--color-text-muted)] shrink-0">Planta:</label>
      <select
        (change)="onSelect($event)"
        class="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1 bg-white
               text-[var(--color-text-primary)] cursor-pointer
               focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
               transition-all duration-150">
        <option value="">Todas las plantas</option>
        @for (plant of plants(); track plant.id) {
          <option [value]="plant.id" [selected]="plantSelector.activePlantId() === plant.id">
            {{ plant.name }}
          </option>
        }
      </select>
    </div>
  `,
})
export class PlantSelectorComponent implements OnInit {
  protected readonly plantSelector = inject(PlantSelectorService);
  private readonly plantsApi = inject(PlantsApiService);
  protected readonly plants = signal<Plant[]>([]);

  ngOnInit(): void {
    this.plantsApi.getPlants().subscribe({
      next: data => this.plants.set(data),
      error: () => this.plants.set([]),
    });
  }

  onSelect(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const plant = this.plants().find(p => p.id === id) ?? null;
    this.plantSelector.setPlant(plant);
  }
}
