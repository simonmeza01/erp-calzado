import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';

const TIPO_CFG = {
  entrada_fabricacion: { label: 'Entrada fabricación', classes: 'bg-emerald-100 text-emerald-700', sign: '+' },
  salida_pedido:       { label: 'Salida pedido',        classes: 'bg-red-100 text-red-700',         sign: '−' },
  devolucion:          { label: 'Devolución',            classes: 'bg-blue-100 text-blue-700',        sign: '+' },
  ajuste:              { label: 'Ajuste',                classes: 'bg-slate-100 text-slate-600',      sign: '±' },
};

@Component({
  selector: 'app-inventario-movimientos',
  template: `
    <div class="space-y-4">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <a routerLink="/inventario" mat-icon-button>
          <mat-icon>arrow_back</mat-icon>
        </a>
        <div>
          <h2 class="text-lg font-bold text-slate-800">Historial de movimientos</h2>
          <p class="text-xs text-slate-500">Registro completo de entradas y salidas de inventario</p>
        </div>
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3 flex-wrap">
        <mat-form-field appearance="outline" class="flex-1 min-w-40">
          <mat-label>Buscar producto…</mat-label>
          <input matInput [(ngModel)]="busqueda" placeholder="SKU o nombre" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="min-w-44">
          <mat-label>Tipo</mat-label>
          <mat-select [(ngModel)]="filtroTipo">
            <mat-option value="">Todos</mat-option>
            <mat-option value="entrada_fabricacion">Entrada fabricación</mat-option>
            <mat-option value="salida_pedido">Salida pedido</mat-option>
            <mat-option value="devolucion">Devolución</mat-option>
            <mat-option value="ajuste">Ajuste</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        @if (!movimientos().length) {
          <app-loading-skeleton [count]="8" class="p-5 block" />
        } @else if (!filtrados().length) {
          <app-empty-state titulo="Sin resultados" />
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Referencia / Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (m of filtrados(); track m.id) {
                @let cfg = tipoCfg(m.tipo);
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">
                    {{ m.created_at | date:'dd/MM/yy HH:mm' }}
                  </td>
                  <td class="px-5 py-3">
                    @if (m.producto) {
                      <p class="font-mono text-xs text-slate-400">{{ m.producto.sku }}</p>
                      <p class="text-slate-800">{{ m.producto.nombre }}</p>
                    } @else {
                      <p class="text-slate-400 text-xs">ID: {{ m.producto_id }}</p>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full {{ cfg.classes }}">
                      {{ cfg.label }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <span class="font-bold {{ m.cantidad >= 0 ? 'text-emerald-600' : 'text-red-600' }}">
                      {{ m.cantidad >= 0 ? '+' : '' }}{{ m.cantidad }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">
                    @if (m.referencia_id) {
                      <span class="font-mono bg-slate-100 px-1 rounded">{{ m.referencia_id }}</span>
                    }
                    @if (m.notas) { {{ m.notas }} }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  imports: [
    DatePipe, FormsModule, RouterLink,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    EmptyStateComponent, LoadingSkeletonComponent,
  ],
})
export class InventarioMovimientosComponent {
  private readonly svc = inject(MockDataService);

  busqueda   = '';
  filtroTipo = '';

  readonly movimientos = toSignal(this.svc.getInventarioMovimientos(), { initialValue: [] });

  readonly filtrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    const tipo = this.filtroTipo;
    return this.movimientos().filter(m => {
      if (tipo && m.tipo !== tipo) return false;
      if (q) {
        const match =
          (m.producto?.sku ?? '').toLowerCase().includes(q) ||
          (m.producto?.nombre ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  tipoCfg(tipo: string) {
    return TIPO_CFG[tipo as keyof typeof TIPO_CFG] ?? TIPO_CFG.ajuste;
  }
}
