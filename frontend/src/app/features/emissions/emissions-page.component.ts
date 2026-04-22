import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/organisms/page-header/page-header.component';
import { EmissionFormComponent } from './components/emission-form/emission-form.component';
import { EmissionListComponent } from './components/emission-list/emission-list.component';
import { EmissionsApiService } from './services/emissions-api.service';
import { EmissionsMockApiService } from './services/emissions-mock-api.service';
import { EmissionFormService } from './services/emission-form.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-emissions-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, EmissionFormComponent, EmissionListComponent],
  template: `
    <div class="p-4 md:p-6">
      <eco-page-header
        title="Registro de Emisiones"
        [breadcrumbs]="[{label:'EcoSync'},{label:'Emisiones'}]"/>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <eco-emission-form/>
        <eco-emission-list/>
      </div>
    </div>
  `,
  providers: [
    { provide: EmissionsApiService, useClass: environment.useMocks ? EmissionsMockApiService : EmissionsApiService },
    EmissionFormService,
    FormBuilder,
  ],
})
export class EmissionsPageComponent {}
