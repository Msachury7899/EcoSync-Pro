import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'audited' | 'pending';

@Component({
  selector: 'eco-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" [class]="variantClasses">
      <ng-content/>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'info';

  get variantClasses(): string {
    const map: Record<BadgeVariant, string> = {
      success: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
      warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
      danger:  'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
      info:    'bg-slate-100 text-slate-600',
      audited: 'bg-[var(--color-audited-light)] text-[var(--color-audited)]',
      pending: 'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
    };
    return map[this.variant];
  }
}
