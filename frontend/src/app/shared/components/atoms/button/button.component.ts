import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'eco-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      (click)="!loading && clicked.emit()"
      class="inline-flex items-center justify-center font-medium rounded-lg cursor-pointer
             transition-all duration-150 ease-in-out
             focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
             disabled:opacity-50 disabled:cursor-not-allowed"
      [class]="sizeClasses + ' ' + variantClasses">
      @if (loading) {
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      }
      <ng-content/>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() clicked = new EventEmitter<void>();

  get sizeClasses(): string {
    const map: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs gap-1',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-5 py-2.5 text-base gap-2',
    };
    return map[this.size];
  }

  get variantClasses(): string {
    const map: Record<ButtonVariant, string> = {
      primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] shadow-sm',
      secondary: 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]',
      danger: 'bg-[var(--color-danger)] text-white hover:bg-red-700 shadow-sm',
      ghost: 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)]',
    };
    return map[this.variant];
  }
}
