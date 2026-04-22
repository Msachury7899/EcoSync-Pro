import { Injectable, signal, computed } from '@angular/core';

export interface Plant {
  id: string;
  name: string;
  monthlyLimitTco2: number;
  createdAt: string;
}

@Injectable()
export class PlantSelectorService {
  private readonly _activePlant = signal<Plant | null>(null);

  readonly activePlant = this._activePlant.asReadonly();

  readonly activePlantId = computed(() => this._activePlant()?.id ?? null);

  setPlant(plant: Plant | null): void {
    this._activePlant.set(plant);
  }
}
