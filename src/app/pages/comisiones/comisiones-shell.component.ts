import { Component, inject } from '@angular/core';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { ComisionesComponent } from './comisiones.component';
import { ComisionesAdminComponent } from './comisiones-admin.component';

@Component({
  selector: 'app-comisiones-shell',
  template: `
    @if (auth.hasRole('vendedor')) {
      <app-comisiones />
    } @else {
      <app-comisiones-admin />
    }
  `,
  imports: [ComisionesComponent, ComisionesAdminComponent],
})
export class ComisionesShellComponent {
  readonly auth = inject(AuthMockService);
}
