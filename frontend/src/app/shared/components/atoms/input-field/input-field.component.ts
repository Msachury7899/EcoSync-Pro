import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export type InputType = 'text' | 'number' | 'date' | 'email' | 'month';

@Component({
  selector: 'eco-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputFieldComponent), multi: true }],
  template: `
    <input
      [type]="type"
      [placeholder]="placeholder"
      [disabled]="isDisabled"
      [value]="value"
      (input)="onInput($event)"
      (blur)="onTouched()"
      class="w-full rounded-lg border bg-white px-3 py-2 text-sm text-[var(--color-text-primary)]
             placeholder:text-slate-400 transition-all duration-150 ease-in-out
             focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
             disabled:opacity-50 disabled:cursor-not-allowed"
      [class.border-[var(--color-danger)]]="hasError"
      [class.border-[var(--color-border)]]="!hasError"/>
  `,
})
export class InputFieldComponent implements ControlValueAccessor {
  @Input() type: InputType = 'text';
  @Input() placeholder = '';
  @Input() hasError = false;

  value: string | number = '';
  isDisabled = false;

  private onChange: (v: unknown) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: unknown): void { this.value = val as string | number ?? ''; }
  registerOnChange(fn: (v: unknown) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(disabled: boolean): void { this.isDisabled = disabled; }

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.value = this.type === 'number' ? (raw === '' ? '' : Number(raw)) : raw;
    this.onChange(this.value);
  }
}
