import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface Breadcrumb { label: string; link?: string; }

@Component({
  selector: 'eco-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-700 text-[var(--color-text-primary)]">{{ title }}</h1>
        @if (breadcrumbs.length) {
          <nav class="flex items-center gap-1 mt-1" aria-label="Breadcrumb">
            @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
              <span class="text-xs" [class.text-[var(--color-text-muted)]]="!last"
                    [class.text-[var(--color-text-secondary)]]="last">
                {{ crumb.label }}
              </span>
              @if (!last) { <span class="text-xs text-[var(--color-text-muted)]">/</span> }
            }
          </nav>
        }
      </div>
      <div class="flex items-center gap-2">
        <ng-content/>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() breadcrumbs: Breadcrumb[] = [];
}
