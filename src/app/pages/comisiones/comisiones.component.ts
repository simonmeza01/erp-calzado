import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

@Component({
  selector: 'app-comisiones',
  template: `
    <div class="space-y-4">

      <!-- Resumen -->
      <div data-tour="comisiones-resumen" class="grid grid-cols-3 gap-3">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Total ganado</p>
          <p class="text-xl font-bold text-slate-800">{{ bcv.formatUsd(totalGanado()) }}</p>
          <p class="text-xs text-slate-400 mt-0.5">Todas las comisiones</p>
        </div>
        <div class="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4">
          <p class="text-xs text-emerald-600 uppercase font-semibold mb-1">Cobradas</p>
          <p class="text-xl font-bold text-emerald-700">{{ bcv.formatUsd(totalCobrado()) }}</p>
          <p class="text-xs text-emerald-500 mt-0.5">{{ countPagadas() }} comisiones</p>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4">
          <p class="text-xs text-amber-600 uppercase font-semibold mb-1">Por cobrar</p>
          <p class="text-xl font-bold text-amber-700">{{ bcv.formatUsd(totalPendiente()) }}</p>
          <p class="text-xs text-amber-500 mt-0.5">{{ countPendientes() }} pendientes</p>
        </div>
      </div>

      <!-- Filtros -->
      <div data-tour="comisiones-filtros" class="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
        <div class="flex flex-wrap gap-3 items-end">
          <mat-form-field appearance="outline" class="!w-40">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="filtroEstado">
              <mat-option value="">Todas</mat-option>
              <mat-option value="pendiente">Pendiente</mat-option>
              <mat-option value="pagada">Pagada</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="!w-44">
            <mat-label>Método de pago</mat-label>
            <mat-select [(ngModel)]="filtroMetodo">
              <mat-option value="">Todos</mat-option>
              <mat-option value="transferencia">Transferencia</mat-option>
              <mat-option value="efectivo_usd">Efectivo USD</mat-option>
              <mat-option value="efectivo_bs">Efectivo Bs.</mat-option>
              <mat-option value="retencion">Retención</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Lista -->
      <div data-tour="comisiones-lista" class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-700">Mis comisiones</h3>
          <span class="text-xs text-slate-400">{{ comisionesFiltradas().length }} resultado(s)</span>
        </div>

        @if (!comisiones().length) {
          <app-loading-skeleton [count]="4" class="p-5 block" />
        } @else if (!comisionesFiltradas().length) {
          <div class="py-12 text-center text-slate-400">
            <mat-icon class="!text-4xl mb-2 block mx-auto">percent</mat-icon>
            <p>No hay comisiones con estos filtros</p>
          </div>
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (c of comisionesFiltradas(); track c.id) {
              <li class="px-5 py-4 flex items-start gap-3">

                <!-- Ícono estado -->
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                            {{ c.pagada ? 'bg-emerald-100' : 'bg-amber-100' }}">
                  <mat-icon class="!text-base {{ c.pagada ? 'text-emerald-600' : 'text-amber-600' }}">
                    {{ c.pagada ? 'check_circle' : 'schedule' }}
                  </mat-icon>
                </div>

                <!-- Info pedido -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-sm font-semibold text-slate-800">
                      {{ c.pedido?.numero_pedido ?? c.pedido_id }}
                    </p>
                    @if (c.editado_por_admin) {
                      <span class="text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5 flex items-center gap-0.5">
                        <mat-icon class="!text-xs !w-3 !h-3">edit</mat-icon> Admin editó %
                      </span>
                    }
                  </div>
                  <p class="text-xs text-slate-500 mt-0.5">
                    {{ c.pedido?.cliente?.razon_social ?? '—' }}
                  </p>
                  <div class="flex items-center gap-3 mt-1 flex-wrap">
                    <span class="text-xs text-slate-400">
                      {{ c.porcentaje }}% de comisión
                      @if (c.porcentaje_original && c.porcentaje_original !== c.porcentaje) {
                        <span class="line-through text-slate-300 ml-1">{{ c.porcentaje_original }}%</span>
                      }
                    </span>
                    @if (c.metodo_pago) {
                      <span class="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5">
                        {{ labelMetodoPago(c.metodo_pago) }}
                      </span>
                    }
                    @if (c.tiene_descuento) {
                      <span class="text-xs bg-orange-50 text-orange-500 rounded-full px-2 py-0.5">
                        con descuento
                      </span>
                    }
                  </div>
                  @if (c.pagada && c.fecha_pago_comision) {
                    <p class="text-xs text-emerald-600 mt-1">
                      <mat-icon class="!text-xs !w-3 !h-3 align-middle">event</mat-icon>
                      Pagada el {{ c.fecha_pago_comision }}
                    </p>
                  }
                </div>

                <!-- Monto -->
                <div class="text-right flex-shrink-0">
                  <p class="text-sm font-bold text-slate-800">{{ bcv.formatUsd(c.monto_usd) }}</p>
                  <span class="text-xs font-medium {{ c.pagada ? 'text-emerald-600' : 'text-amber-600' }}">
                    {{ c.pagada ? 'Cobrada' : 'Pendiente' }}
                  </span>
                </div>

              </li>
            }
          </ul>
        }
      </div>

    </div>
  `,
  imports: [
    FormsModule,
    MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule,
    LoadingSkeletonComponent,
  ],
})
export class ComisionesComponent {
  private readonly svc  = inject(MockDataService);
  private readonly auth = inject(AuthMockService);
  readonly bcv          = inject(TasaBcvService);

  filtroEstado  = '';
  filtroMetodo  = '';

  readonly comisiones = toSignal(
    this.svc.getComisiones(this.auth.usuarioActual()?.id),
    { initialValue: [] },
  );

  readonly comisionesFiltradas = computed(() => {
    let lista = this.comisiones();
    if (this.filtroEstado === 'pagada')    lista = lista.filter(c =>  c.pagada);
    if (this.filtroEstado === 'pendiente') lista = lista.filter(c => !c.pagada);
    if (this.filtroMetodo) lista = lista.filter(c => c.metodo_pago === this.filtroMetodo);
    return lista;
  });

  readonly totalGanado   = computed(() => this.comisiones().reduce((s, c) => s + c.monto_usd, 0));
  readonly totalCobrado  = computed(() => this.comisiones().filter(c => c.pagada).reduce((s, c) => s + c.monto_usd, 0));
  readonly totalPendiente = computed(() => this.comisiones().filter(c => !c.pagada).reduce((s, c) => s + c.monto_usd, 0));
  readonly countPagadas  = computed(() => this.comisiones().filter(c => c.pagada).length);
  readonly countPendientes = computed(() => this.comisiones().filter(c => !c.pagada).length);

  labelMetodoPago(metodo: string): string {
    const map: Record<string, string> = {
      transferencia: 'Transferencia',
      efectivo_usd:  'Efectivo USD',
      efectivo_bs:   'Efectivo Bs.',
      retencion:     'Retención',
    };
    return map[metodo] ?? metodo;
  }
}
