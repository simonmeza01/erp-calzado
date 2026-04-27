import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecimalPipe } from '@angular/common';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-costos',
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div>
        <h2 class="text-lg font-bold text-slate-800">Costos y Utilidad</h2>
        <p class="text-xs text-slate-500">Gestión de costos de fabricación y análisis de rentabilidad por pedido</p>
      </div>

      <!-- KPI Summary -->
      <div data-tour="costos-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Ventas totales</p>
          <p class="text-xl font-bold text-slate-800">{{ bcv.formatUsd(kpiVentas()) }}</p>
        </div>
        <div class="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4">
          <p class="text-xs text-emerald-600 uppercase font-semibold mb-1">Utilidad neta</p>
          <p class="text-xl font-bold text-emerald-700">{{ bcv.formatUsd(kpiUtilidad()) }}</p>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
          <p class="text-xs text-blue-600 uppercase font-semibold mb-1">Margen promedio</p>
          <p class="text-xl font-bold text-blue-700">{{ kpiMargen() | number:'1.1-1' }}%</p>
        </div>
        <div class="bg-slate-50 rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Costo total</p>
          <p class="text-xl font-bold text-slate-700">{{ bcv.formatUsd(kpiCostos()) }}</p>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group animationDuration="200ms" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        <!-- Tab 1: Utilidad por pedido -->
        <mat-tab label="Utilidad por pedido">
          <div data-tour="costos-tabla-utilidad" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Pedido</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">Precio venta</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden lg:table-cell">IVA</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden lg:table-cell">Costo fab.</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">Comisión</th>
                  <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Utilidad neta</th>
                  <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Margen</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (u of utilidades(); track u.pedido_id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <p class="font-semibold text-slate-800 text-xs">{{ u.numero_pedido }}</p>
                      <p class="text-xs text-slate-400">{{ u.cliente_nombre }}</p>
                    </td>
                    <td class="px-4 py-3 text-right hidden md:table-cell">
                      <span class="text-slate-700">{{ bcv.formatUsd(u.precio_venta_usd) }}</span>
                    </td>
                    <td class="px-4 py-3 text-right hidden lg:table-cell">
                      @if (u.monto_iva_usd > 0) {
                        <span class="text-orange-600">– {{ bcv.formatUsd(u.monto_iva_usd) }}</span>
                      } @else {
                        <span class="text-slate-300">—</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right hidden lg:table-cell">
                      @if (u.costo_fabricacion_usd > 0) {
                        <span class="text-red-500">– {{ bcv.formatUsd(u.costo_fabricacion_usd) }}</span>
                      } @else {
                        <span class="text-slate-300">—</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right hidden md:table-cell">
                      @if (u.comision_usd > 0) {
                        <span class="text-purple-600">– {{ bcv.formatUsd(u.comision_usd) }}</span>
                      } @else {
                        <span class="text-slate-300">—</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right">
                      <span class="font-bold {{ u.utilidad_neta_usd >= 0 ? 'text-emerald-700' : 'text-red-600' }}">
                        {{ bcv.formatUsd(u.utilidad_neta_usd) }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <span class="inline-block text-xs font-semibold rounded-full px-2 py-0.5
                                   {{ u.margen_porcentaje >= 30 ? 'bg-emerald-100 text-emerald-700'
                                    : u.margen_porcentaje >= 15 ? 'bg-blue-100 text-blue-700'
                                    : u.margen_porcentaje >= 0  ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700' }}">
                        {{ u.margen_porcentaje | number:'1.1-1' }}%
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-12 text-center text-slate-400">
                      <mat-icon class="!text-4xl mb-2 block mx-auto">bar_chart</mat-icon>
                      <p>No hay pedidos con datos de utilidad</p>
                    </td>
                  </tr>
                }
              </tbody>
              @if (utilidades().length > 0) {
                <tfoot class="border-t-2 border-slate-300 bg-slate-50">
                  <tr>
                    <td class="px-4 py-3 font-bold text-slate-700 text-sm">TOTALES</td>
                    <td class="px-4 py-3 text-right font-semibold text-slate-700 hidden md:table-cell">
                      {{ bcv.formatUsd(kpiVentas()) }}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-orange-600 hidden lg:table-cell">
                      – {{ bcv.formatUsd(kpiIva()) }}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-red-600 hidden lg:table-cell">
                      – {{ bcv.formatUsd(kpiCostos()) }}
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-purple-600 hidden md:table-cell">
                      – {{ bcv.formatUsd(kpiComisiones()) }}
                    </td>
                    <td class="px-4 py-3 text-right font-bold text-emerald-700 text-base">
                      {{ bcv.formatUsd(kpiUtilidad()) }}
                    </td>
                    <td class="px-4 py-3 text-center font-bold text-blue-700">
                      {{ kpiMargen() | number:'1.1-1' }}%
                    </td>
                  </tr>
                </tfoot>
              }
            </table>
          </div>
        </mat-tab>

        <!-- Tab 2: Editor de costos de producto -->
        <mat-tab label="Costos de productos">
          <div data-tour="costos-editor-productos" class="p-4">
            <div class="flex items-center justify-between mb-4">
              <p class="text-sm text-slate-500">
                Edita el costo de fabricación por unidad para cada producto.
                Los cambios aplican a futuros cálculos de utilidad.
              </p>
              <button mat-flat-button color="primary" (click)="guardarCostos()"
                      [disabled]="guardando() || !productosEditados().size">
                <mat-icon>save</mat-icon>
                {{ guardando() ? 'Guardando…' : 'Guardar cambios' }}
                @if (productosEditados().size > 0) {
                  <span class="ml-1 bg-white text-primary text-xs font-bold rounded-full w-4 h-4 inline-flex items-center justify-center">
                    {{ productosEditados().size }}
                  </span>
                }
              </button>
            </div>

            <div class="overflow-x-auto rounded-lg border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Producto</th>
                    <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">SKU</th>
                    <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Precio venta</th>
                    <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Costo USD</th>
                    <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden lg:table-cell">Margen bruto</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  @for (prod of productosLocales(); track prod.id; let i = $index) {
                    <tr class="{{ productosEditados().has(prod.id) ? 'bg-blue-50' : 'hover:bg-slate-50' }} transition-colors">
                      <td class="px-4 py-3">
                        <p class="font-medium text-slate-800">{{ prod.nombre }}</p>
                        <span class="text-xs {{ prod.activo ? 'text-emerald-600' : 'text-slate-400' }}">
                          {{ prod.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 hidden md:table-cell">
                        <span class="font-mono text-xs text-slate-500">{{ prod.sku }}</span>
                      </td>
                      <td class="px-4 py-3 text-right font-semibold text-slate-700">
                        {{ bcv.formatUsd(prod.precio_usd) }}
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div class="flex items-center justify-center gap-1">
                          <span class="text-slate-400 text-xs">$</span>
                          <input type="number" min="0" step="0.01"
                                 [value]="prod.costo_usd ?? 0"
                                 (change)="onCostoChange(prod, +$any($event.target).value)"
                                 class="w-20 text-center border rounded p-1 text-sm focus:outline-none focus:ring-1
                                        {{ productosEditados().has(prod.id)
                                           ? 'border-blue-400 focus:ring-blue-400'
                                           : 'border-slate-300 focus:ring-primary' }}" />
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center hidden lg:table-cell">
                        @if ((prod.costo_usd ?? 0) > 0 && prod.precio_usd > 0) {
                          <span class="text-xs font-semibold rounded-full px-2 py-0.5
                                       {{ margenBruto(prod) >= 30 ? 'bg-emerald-100 text-emerald-700'
                                        : margenBruto(prod) >= 15 ? 'bg-blue-100 text-blue-700'
                                        : 'bg-amber-100 text-amber-700' }}">
                            {{ margenBruto(prod) | number:'1.1-1' }}%
                          </span>
                        } @else {
                          <span class="text-slate-300 text-xs">— sin costo</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

      </mat-tab-group>

    </div>
  `,
  imports: [
    FormsModule, DecimalPipe,
    MatIconModule, MatButtonModule, MatTooltipModule, MatTabsModule,
  ],
})
export class CostosComponent {
  private readonly svc   = inject(MockDataService);
  private readonly snack = inject(MatSnackBar);
  readonly bcv           = inject(TasaBcvService);

  readonly utilidades    = toSignal(this.svc.calcularUtilidadPorPedido(), { initialValue: [] });
  private readonly _productos = toSignal(this.svc.getProductos(), { initialValue: [] });

  readonly productosLocales = signal<Producto[]>([]);
  readonly productosEditados = signal<Set<string>>(new Set());
  readonly guardando = signal(false);

  constructor() {
    this.svc.getProductos().subscribe(prods => {
      this.productosLocales.set(prods.map(p => ({ ...p })));
    });
  }

  // ─── KPIs ────────────────────────────────────────────────────────────────────

  readonly kpiVentas    = computed(() => this.utilidades().reduce((s, u) => s + u.precio_venta_usd, 0));
  readonly kpiIva       = computed(() => this.utilidades().reduce((s, u) => s + u.monto_iva_usd, 0));
  readonly kpiCostos    = computed(() => this.utilidades().reduce((s, u) => s + u.costo_fabricacion_usd, 0));
  readonly kpiComisiones = computed(() => this.utilidades().reduce((s, u) => s + u.comision_usd, 0));
  readonly kpiUtilidad  = computed(() => this.utilidades().reduce((s, u) => s + u.utilidad_neta_usd, 0));
  readonly kpiMargen    = computed(() => {
    const ventas = this.kpiVentas();
    return ventas > 0 ? Math.round((this.kpiUtilidad() / ventas) * 1000) / 10 : 0;
  });

  // ─── Costos editor ───────────────────────────────────────────────────────────

  margenBruto(prod: Producto): number {
    if (!prod.costo_usd || prod.precio_usd === 0) return 0;
    return Math.round(((prod.precio_usd - prod.costo_usd) / prod.precio_usd) * 1000) / 10;
  }

  onCostoChange(prod: Producto, nuevoCosto: number): void {
    this.productosLocales.update(lista =>
      lista.map(p => p.id === prod.id ? { ...p, costo_usd: nuevoCosto } : p),
    );
    this.productosEditados.update(set => {
      const next = new Set(set);
      next.add(prod.id);
      return next;
    });
  }

  guardarCostos(): void {
    const editados = this.productosEditados();
    if (!editados.size) return;
    this.guardando.set(true);

    const updates = this.productosLocales()
      .filter(p => editados.has(p.id))
      .map(p => this.svc.actualizarProducto(p.id, { costo_usd: p.costo_usd }));

    let done = 0;
    for (const obs of updates) {
      obs.subscribe(() => {
        done++;
        if (done === updates.length) {
          this.guardando.set(false);
          this.productosEditados.set(new Set());
          this.snack.open(`${done} producto(s) actualizados`, '', { duration: 3000 });
        }
      });
    }
  }
}
