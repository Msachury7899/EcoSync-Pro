import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'eco-confirmation-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" (click)="cancelled.emit()"></div>
        <!-- Dialog -->
        <div class="relative bg-white rounded-xl shadow-xl border border-[var(--color-border)]
                    p-6 w-full max-w-sm mx-4 z-10">
          <h3 class="text-base font-600 text-[var(--color-text-primary)] mb-2">{{ title }}</h3>
          <p class="text-sm text-[var(--color-text-secondary)] mb-6">{{ message }}</p>
          <div class="flex gap-3 justify-end">
            <eco-button variant="secondary" (clicked)="cancelled.emit()">Cancelar</eco-button>
            <eco-button variant="primary" (clicked)="confirmed.emit()">{{ confirmLabel }}</eco-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmationDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmar acción';
  @Input() message = '¿Estás seguro de continuar?';
  @Input() confirmLabel = 'Confirmar';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
