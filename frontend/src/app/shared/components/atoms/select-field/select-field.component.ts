import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'eco-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectFieldComponent), multi: true }],
  template: `
    <select
      [disabled]="isDisabled"
      (change)="onSelect($event)"
      (blur)="onTouched()"
      class="w-full rounded-lg border bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]
             cursor-pointer transition-all duration-150 ease-in-out
             focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
             disabled:opacity-50 disabled:cursor-not-allowed"
      [class.border-[var(--color-danger)]]="hasError"
      [class.border-[var(--color-border)]]="!hasError">
      @if (placeholder) {
        <option value="" disabled [selected]="!value">{{ placeholder }}</option>
      }
      @for (opt of options; track opt.value) {
        <option [value]="opt.value" [selected]="opt.value === value">{{ opt.label }}</option>
      }
    </select>
  `,
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() hasError = false;

  value = '';
  isDisabled = false;

  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string): void { this.value = val ?? ''; }
  registerOnChange(fn: (v: string) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled = disabled; }

  onSelect(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
    this.onChange(this.value);
  }
}
