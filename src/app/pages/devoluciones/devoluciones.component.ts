import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

const STATUS_CONFIG = {
  pendiente:          { label: 'Pendiente',           classes: 'bg-yellow-100 text-yellow-700' },
  mercancia_recibida: { label: 'Mercancía recibida',  classes: 'bg-blue-100 text-blue-700' },
  procesada:          { label: 'Procesada',            classes: 'bg-emerald-100 text-emerald-700' },
};

@Component({
  selector: 'app-devoluciones',
  template: `
    <div class="space-y-4">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <mat-icon class="text-orange-500">assignment_return</mat-icon>
          <h3 class="font-semibold text-slate-800">Devoluciones</h3>
        </div>

        @if (!devoluciones().length) {
          <app-loading-skeleton [count]="3" class="p-5 block" />
        } @else if (devoluciones().length === 0) {
          <app-empty-state titulo="Sin devoluciones" subtitulo="No hay devoluciones registradas" />
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (d of devoluciones(); track d.id) {
              <li class="px-5 py-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-bold text-slate-800">{{ d.pedido_id }}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full font-semibold {{ cfg(d.status).classes }}">
                        {{ cfg(d.status).label }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-400 mt-0.5">{{ d.created_at | date:'dd/MM/yyyy' }}</p>
                    <p class="text-sm text-slate-600 mt-1">
                      {{ d.items_devueltos.length }} ítem(s) devuelto(s)
                    </p>
                    @for (item of d.items_devueltos; track item.producto_id) {
                      <p class="text-xs text-slate-400 pl-2">· {{ item.cantidad }}u — {{ item.motivo }}</p>
                    }
                  </div>
                  @if (d.monto_credito_usd) {
                    <div class="text-right flex-shrink-0">
                      <p class="text-xs text-slate-500">Crédito</p>
                      <p class="text-sm font-bold text-primary">{{ bcv.formatUsd(d.monto_credito_usd) }}</p>
                    </div>
                  }
                </div>
                @if (d.notas) {
                  <p class="text-xs text-slate-400 mt-2 italic">{{ d.notas }}</p>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  imports: [MatIconModule, EmptyStateComponent, LoadingSkeletonComponent, DatePipe],
})
export class DevolucionesComponent {
  private readonly svc = inject(MockDataService);
  readonly bcv         = inject(TasaBcvService);

  readonly devoluciones = toSignal(this.svc.getDevoluciones(), { initialValue: [] });

  cfg(status: string) {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pendiente;
  }
}
