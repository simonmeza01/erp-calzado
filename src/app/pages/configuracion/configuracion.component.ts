import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';

@Component({
  selector: 'app-configuracion',
  template: `
    <div class="max-w-2xl space-y-4">

      <!-- Info empresa -->
      <div data-tour="configuracion-empresa" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <mat-icon>business</mat-icon> Empresa
        </h3>
        <div class="space-y-3 text-sm">
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="text-slate-500">Nombre</span>
            <span class="font-medium text-slate-800">Calzado Venezolano C.A.</span>
          </div>
          <div class="flex justify-between py-2 border-b border-slate-100">
            <span class="text-slate-500">RIF</span>
            <span class="font-medium text-slate-800">J-30000001-0</span>
          </div>
          <div class="flex justify-between py-2">
            <span class="text-slate-500">Módulo</span>
            <span class="font-medium text-slate-800">BootERP v1.0 (Demo)</span>
          </div>
        </div>
      </div>

      <!-- Tasa BCV -->
      <div data-tour="configuracion-bcv" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <mat-icon>currency_exchange</mat-icon> Tasa BCV
        </h3>
        @if (bcv.tasaActual(); as tasa) {
          <div class="space-y-3 text-sm">
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Tasa actual</span>
              <span class="font-bold text-slate-800">Bs. {{ tasa.promedio | number:'1.2-2' }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-500">Última actualización</span>
              <span class="text-slate-600">{{ bcv.ultimaActualizacion() }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Sesión -->
      <div data-tour="configuracion-usuario" class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <mat-icon>person</mat-icon> Usuario en sesión
        </h3>
        @if (auth.usuarioActual(); as u) {
          <div class="space-y-3 text-sm">
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Nombre</span>
              <span class="font-medium">{{ u.nombre }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-100">
              <span class="text-slate-500">Email</span>
              <span class="font-medium">{{ u.email }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-slate-500">Rol</span>
              <span class="capitalize font-medium">{{ u.rol }}</span>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  imports: [MatIconModule, DecimalPipe],
})
export class ConfiguracionComponent {
  readonly auth = inject(AuthMockService);
  readonly bcv  = inject(TasaBcvService);
}
