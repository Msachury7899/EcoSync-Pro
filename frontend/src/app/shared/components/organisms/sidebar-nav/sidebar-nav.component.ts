import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

interface NavLink { label: string; path: string; icon: string; }

@Component({
  selector: 'eco-sidebar-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside
      class="flex flex-col h-full bg-[var(--color-bg-surface)] border-r border-[var(--color-border)]
             transition-all duration-300 ease-in-out shrink-0"
      [style.width]="isCollapsed() ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'">

      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 border-b border-[var(--color-border)]"
           [style.height]="'var(--header-height)'" [style.minHeight]="'var(--header-height)'">
        <span class="text-[var(--color-primary)] shrink-0" [innerHTML]="leafIcon"></span>
        @if (!isCollapsed()) {
          <span class="text-sm font-700 text-[var(--color-text-primary)] truncate">EcoSync</span>
        }
      </div>

      <!-- Nav links -->
      <nav class="flex-1 py-3 px-2 space-y-1">
        @for (link of navLinks; track link.path) {
          <a [routerLink]="link.path" routerLinkActive="bg-[var(--color-primary-light)] text-[var(--color-primary)]"
             class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                    text-[var(--color-text-secondary)] cursor-pointer
                    hover:bg-[var(--color-bg-elevated)] transition-colors duration-150
                    focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
             [class.justify-center]="isCollapsed()"
             [attr.title]="isCollapsed() ? link.label : null">
            <span class="shrink-0" [innerHTML]="link.icon"></span>
            @if (!isCollapsed()) {
              <span class="truncate">{{ link.label }}</span>
            }
          </a>
        }
      </nav>

      <!-- Plant info (footer) -->
      @if (!isCollapsed() && plantSelector.activePlant()) {
        <div class="px-4 py-3 border-t border-[var(--color-border)]">
          <p class="text-xs text-[var(--color-text-muted)]">Planta activa</p>
          <p class="text-xs font-medium text-[var(--color-text-primary)] truncate">
            {{ plantSelector.activePlant()!.name }}
          </p>
        </div>
      }

      <!-- Toggle -->
      <button
        (click)="toggleCollapse()"
        class="flex items-center justify-center h-10 border-t border-[var(--color-border)]
               text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]
               hover:bg-[var(--color-bg-elevated)] cursor-pointer transition-colors duration-150
               focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none"
        [attr.aria-label]="isCollapsed() ? 'Expandir sidebar' : 'Colapsar sidebar'">
        <span [innerHTML]="isCollapsed() ? chevronRightIcon : chevronLeftIcon"></span>
      </button>
    </aside>
  `,
})
export class SidebarNavComponent {
  protected readonly plantSelector = inject(PlantSelectorService);
  protected readonly isCollapsed = signal(false);

  // Inline SVG icons (Lucide-style, 18x18)
  protected readonly leafIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 20 1 20 1s.7 13.7-8 19"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>';
  protected readonly chevronLeftIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
  protected readonly chevronRightIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

  protected readonly navLinks: NavLink[] = [
    { label: 'Dashboard',  path: '/dashboard', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>' },
    { label: 'Emisiones',  path: '/emissions',  icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>' },
    { label: 'Auditoría',  path: '/audit',       icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>' },
  ];

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
}
