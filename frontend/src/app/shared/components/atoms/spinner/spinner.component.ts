import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type SpinnerSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'eco-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="animate-spin text-[var(--color-primary)]"
      [class]="sizeClass"
      fill="none" viewBox="0 0 24 24"
      aria-label="Cargando">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  `,
})
export class SpinnerComponent {
  @Input() size: SpinnerSize = 'md';

  get sizeClass(): string {
    const map: Record<SpinnerSize, string> = {
      sm: 'h-4 w-4',
      md: 'h-6 w-6',
      lg: 'h-8 w-8',
    };
    return map[this.size];
  }
}
