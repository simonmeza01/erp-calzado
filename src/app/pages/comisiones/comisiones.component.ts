import { Component, inject, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-comisiones',
  template: `
    <div class="space-y-4">

      <!-- Resumen -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Total ganado</p>
          <p class="text-2xl font-bold text-slate-800">{{ bcv.formatUsd(totalGanado()) }}</p>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4">
          <p class="text-xs text-amber-600 uppercase font-semibold mb-1">Pendiente de cobro</p>
          <p class="text-2xl font-bold text-amber-700">{{ bcv.formatUsd(totalPendiente()) }}</p>
        </div>
      </div>

      <!-- Lista -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="px-5 py-3 border-b border-slate-100">
          <h3 class="font-semibold text-slate-700">Mis comisiones</h3>
        </div>
        @if (!comisiones().length) {
          <app-loading-skeleton [count]="4" class="p-5 block" />
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (c of comisiones(); track c.id) {
              <li class="px-5 py-4 flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                            {{ c.pagada ? 'bg-emerald-100' : 'bg-amber-100' }}">
                  <mat-icon class="!text-base {{ c.pagada ? 'text-emerald-600' : 'text-amber-600' }}">
                    {{ c.pagada ? 'check_circle' : 'schedule' }}
                  </mat-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-slate-800">{{ c.pedido_id }}</p>
                  <p class="text-xs text-slate-400">{{ c.porcentaje }}% de comisión</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold text-slate-800">{{ bcv.formatUsd(c.monto_usd) }}</p>
                  <span class="text-xs {{ c.pagada ? 'text-emerald-600' : 'text-amber-600' }}">
                    {{ c.pagada ? 'Pagada' : 'Pendiente' }}
                  </span>
                </div>
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  imports: [MatIconModule, LoadingSkeletonComponent],
})
export class ComisionesComponent {
  private readonly svc  = inject(MockDataService);
  private readonly auth = inject(AuthMockService);
  readonly bcv          = inject(TasaBcvService);

  readonly comisiones = toSignal(
    this.svc.getComisiones(this.auth.usuarioActual()?.id),
    { initialValue: [] },
  );

  readonly totalGanado    = computed(() => this.comisiones().reduce((s, c) => s + c.monto_usd, 0));
  readonly totalPendiente = computed(() =>
    this.comisiones().filter(c => !c.pagada).reduce((s, c) => s + c.monto_usd, 0),
  );
}
