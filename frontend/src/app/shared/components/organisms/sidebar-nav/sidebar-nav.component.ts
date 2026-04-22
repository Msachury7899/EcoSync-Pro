import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, LucideIconData, BarChart2, Wind, ClipboardCheck, ChevronLeft, ChevronRight, Leaf } from 'lucide-angular';
import { PlantSelectorService } from '../../../../core/services/plant-selector.service';

interface NavLink { label: string; path: string; icon: LucideIconData; }

@Component({
  selector: 'eco-sidebar-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside
      class="flex flex-col h-full bg-[var(--color-bg-surface)] border-r border-[var(--color-border)]
             transition-all duration-300 ease-in-out shrink-0"
      [style.width]="isCollapsed() ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'">

      <!-- Logo -->
      <div class="flex items-center gap-2 px-4 border-b border-[var(--color-border)]"
           [style.height]="'var(--header-height)'" [style.minHeight]="'var(--header-height)'">
        <lucide-icon [img]="Leaf" class="text-[var(--color-primary)] shrink-0" [size]="20"/>
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
            <lucide-icon [img]="link.icon" class="shrink-0" [size]="18"/>
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
        <lucide-icon [img]="isCollapsed() ? ChevronRight : ChevronLeft" [size]="16"/>
      </button>
    </aside>
  `,
})
export class SidebarNavComponent {
  protected readonly plantSelector = inject(PlantSelectorService);
  protected readonly isCollapsed = signal(false);

  protected readonly Leaf = Leaf;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly ChevronRight = ChevronRight;

  protected readonly navLinks: NavLink[] = [
    { label: 'Dashboard',  path: '/dashboard', icon: BarChart2 },
    { label: 'Emisiones',  path: '/emissions',  icon: Wind },
    { label: 'Auditoría',  path: '/audit',       icon: ClipboardCheck },
  ];

  toggleCollapse(): void {
    this.isCollapsed.update(v => !v);
  }
}
