import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarNavComponent } from './shared/components/organisms/sidebar-nav/sidebar-nav.component';
import { PlantSelectorComponent } from './shared/components/molecules/plant-selector/plant-selector.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarNavComponent, PlantSelectorComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
