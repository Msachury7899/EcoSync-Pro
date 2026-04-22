import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'eco-form-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="flex flex-col gap-1">
      <label class="text-xs font-medium text-[var(--color-text-secondary)]">
        {{ label }}
        @if (required) { <span class="text-[var(--color-danger)]">*</span> }
      </label>
      <ng-content/>
      @if (showError) {
        <p class="text-xs text-[var(--color-danger)]">{{ errorMessage }}</p>
      }
    </div>
  `,
})
export class FormControlComponent {
  @Input() label = '';
  @Input() required = false;
  @Input() control: AbstractControl | null = null;

  get showError(): boolean {
    return !!this.control && this.control.invalid && this.control.touched;
  }

  get errorMessage(): string {
    if (!this.control?.errors) return '';
    if (this.control.errors['required']) return 'Este campo es requerido';
    if (this.control.errors['min']) return `Debe ser mayor a ${this.control.errors['min'].min}`;
    if (this.control.errors['max']) return `Debe ser menor a ${this.control.errors['max'].max}`;
    if (this.control.errors['maxDate']) return 'No puede ser una fecha futura';
    return 'Valor inválido';
  }
}
