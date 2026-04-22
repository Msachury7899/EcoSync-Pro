import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eco-stat-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="bg-[var(--color-bg-surface)] rounded-xl border border-[var(--color-border)]
                p-[var(--card-padding)] shadow-sm flex flex-col gap-1">
      @if (loading) {
        <div class="animate-pulse space-y-2">
          <div class="h-3 bg-slate-200 rounded w-2/3"></div>
          <div class="h-7 bg-slate-200 rounded w-1/2"></div>
          <div class="h-3 bg-slate-200 rounded w-1/3"></div>
        </div>
      } @else {
        <p class="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{{ title }}</p>
        <div class="flex items-baseline gap-1">
          <span class="text-2xl font-700 text-[var(--color-text-primary)]">{{ value }}</span>
          @if (unit) {
            <span class="text-xs text-[var(--color-text-muted)]">{{ unit }}</span>
          }
        </div>
        @if (trend !== null && trend !== undefined) {
          <p class="text-xs font-medium" [class.text-[var(--color-primary)]]="trend >= 0"
             [class.text-[var(--color-danger)]]="trend < 0">
            {{ trend >= 0 ? '↑' : '↓' }} {{ trend | number:'1.1-1' }}%
          </p>
        }
      }
    </div>
  `,
})
export class StatCardComponent {
  @Input() title = '';
  @Input() value: string | number = '';
  @Input() unit = '';
  @Input() trend: number | null = null;
  @Input() loading = false;
}
