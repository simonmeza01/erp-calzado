import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { AjusteStockDialogComponent } from './ajuste-stock-dialog.component';

@Component({
  selector: 'app-inventario',
  template: `
    <div class="space-y-4">

      <!-- Resumen alertas -->
      <div data-tour="inventario-alertas" class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-center">
          <p class="text-2xl font-bold text-slate-800">{{ productos().length }}</p>
          <p class="text-xs text-slate-500 mt-1">Total SKUs</p>
        </div>
        <div class="bg-red-50 rounded-xl border border-red-200 shadow-sm p-4 text-center cursor-pointer"
             (click)="filtroEstado.set('sin_stock')">
          <p class="text-2xl font-bold text-red-600">{{ sinStock().length }}</p>
          <p class="text-xs text-red-500 mt-1">Sin stock</p>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4 text-center cursor-pointer"
             (click)="filtroEstado.set('bajo_minimo')">
          <p class="text-2xl font-bold text-amber-600">{{ bajoMinimo().length }}</p>
          <p class="text-xs text-amber-500 mt-1">Bajo mínimo</p>
        </div>
      </div>

      <!-- Filtros y controles -->
      <div data-tour="inventario-filtros" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex gap-3 flex-wrap items-center">
          <mat-form-field appearance="outline" class="flex-1 min-w-40">
            <mat-label>Buscar producto…</mat-label>
            <input matInput [(ngModel)]="busqueda" placeholder="SKU, nombre o modelo" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="min-w-36">
            <mat-label>Talla</mat-label>
            <mat-select [(ngModel)]="filtroTalla">
              <mat-option value="">Todas</mat-option>
              @for (t of tallas(); track t) {
                <mat-option [value]="t">{{ t }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="min-w-36">
            <mat-label>Color</mat-label>
            <mat-select [(ngModel)]="filtroColor">
              <mat-option value="">Todos</mat-option>
              @for (c of colores(); track c) {
                <mat-option [value]="c">{{ c }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="min-w-36">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="filtroEstado">
              <mat-option value="">Todos</mat-option>
              <mat-option value="ok">OK</mat-option>
              <mat-option value="bajo_minimo">Bajo mínimo</mat-option>
              <mat-option value="sin_stock">Sin stock</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Toggle vista -->
          <div class="flex border border-slate-200 rounded-lg overflow-hidden self-center">
            <button class="px-3 py-2 text-sm transition-colors cursor-pointer
                           {{ vistaCards() ? 'bg-white text-slate-500' : 'bg-primary text-white' }}"
                    (click)="vistaCards.set(false)" title="Vista tabla">
              <mat-icon class="!text-base">table_rows</mat-icon>
            </button>
            <button class="px-3 py-2 text-sm transition-colors cursor-pointer
                           {{ vistaCards() ? 'bg-primary text-white' : 'bg-white text-slate-500' }}"
                    (click)="vistaCards.set(true)" title="Vista tarjetas">
              <mat-icon class="!text-base">grid_view</mat-icon>
            </button>
          </div>

          @if (filtrosActivos()) {
            <button mat-stroked-button (click)="limpiarFiltros()" class="self-center">
              <mat-icon>clear</mat-icon> Limpiar
            </button>
          }

          <a data-tour="inventario-movimientos-link" routerLink="/inventario/movimientos" mat-stroked-button class="self-center">
            <mat-icon>history</mat-icon> Movimientos
          </a>
        </div>
      </div>

      <div data-tour="inventario-productos">
      @if (!productos().length) {
        <app-loading-skeleton [count]="8" class="block" />
      } @else if (!filtrados().length) {
        <app-empty-state titulo="Sin resultados" subtitulo="Ajusta los filtros de búsqueda" />
      } @else if (vistaCards()) {
        <!-- Vista Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          @for (p of filtrados(); track p.id) {
            <div class="bg-white rounded-xl border shadow-sm p-4 flex flex-col gap-2
                        {{ p.stock_actual === 0 ? 'border-red-200' : p.stock_actual <= p.stock_minimo ? 'border-amber-200' : 'border-slate-200' }}">
              <p class="font-mono text-xs text-slate-400">{{ p.sku }}</p>
              <p class="text-sm font-semibold text-slate-800 leading-tight">{{ p.nombre }}</p>
              <div class="mt-auto pt-2 flex items-end justify-between">
                <div>
                  <p class="text-2xl font-bold {{ p.stock_actual === 0 ? 'text-red-600' : p.stock_actual <= p.stock_minimo ? 'text-amber-600' : 'text-emerald-600' }}">
                    {{ p.stock_actual }}
                  </p>
                  <p class="text-xs text-slate-400">mín. {{ p.stock_minimo }}</p>
                </div>
                @if (auth.esAdmin()) {
                  <button mat-icon-button class="!w-8 !h-8" (click)="abrirAjuste(p)"
                          title="Ajustar stock">
                    <mat-icon class="!text-base text-slate-500">tune</mat-icon>
                  </button>
                }
              </div>
              @if (p.stock_actual === 0) {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-center">Sin stock</span>
              } @else if (p.stock_actual <= p.stock_minimo) {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-center">Bajo mínimo</span>
              } @else {
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-center">OK</span>
              }
            </div>
          }
        </div>
      } @else {
        <!-- Vista Tabla -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU / Producto</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Talla</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Color</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Precio</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Costo</th>
                <th class="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                @if (auth.esAdmin()) {
                  <th class="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (p of filtrados(); track p.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-5 py-3">
                    <p class="font-mono text-xs text-slate-400">{{ p.sku }}</p>
                    <p class="font-medium text-slate-800">{{ p.nombre }}</p>
                  </td>
                  <td class="px-3 py-3 text-center text-slate-600 hidden sm:table-cell">{{ p.talla ?? '—' }}</td>
                  <td class="px-3 py-3 text-center text-slate-600 hidden md:table-cell">{{ p.color ?? '—' }}</td>
                  <td class="px-5 py-3 text-right">
                    <span class="font-bold {{ p.stock_actual === 0 ? 'text-red-600' : p.stock_actual <= p.stock_minimo ? 'text-amber-600' : 'text-slate-800' }}">
                      {{ p.stock_actual }}
                    </span>
                    <span class="text-xs text-slate-400"> / {{ p.stock_minimo }}</span>
                  </td>
                  <td class="px-5 py-3 text-right text-slate-600 hidden md:table-cell">
                    $ {{ p.precio_usd | number:'1.2-2' }}
                  </td>
                  <td class="px-5 py-3 text-right text-slate-500 hidden lg:table-cell">
                    @if (p.costo_usd) { $ {{ p.costo_usd | number:'1.2-2' }} } @else { — }
                  </td>
                  <td class="px-5 py-3 text-center">
                    @if (p.stock_actual === 0) {
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Sin stock</span>
                    } @else if (p.stock_actual <= p.stock_minimo) {
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Bajo ({{ p.stock_actual }})</span>
                    } @else {
                      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
                    }
                  </td>
                  @if (auth.esAdmin()) {
                    <td class="px-5 py-3 text-center">
                      <button mat-icon-button (click)="abrirAjuste(p)" title="Ajuste manual de stock">
                        <mat-icon class="!text-base text-slate-500">tune</mat-icon>
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      </div>
    </div>
  `,
  imports: [
    FormsModule, RouterLink,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatDialogModule, MatSnackBarModule,
    EmptyStateComponent, LoadingSkeletonComponent, DecimalPipe,
  ],
})
export class InventarioComponent {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  busqueda     = '';
  filtroTalla  = signal('');
  filtroColor  = signal('');
  filtroEstado = signal('');
  vistaCards   = signal(false);

  readonly productos  = toSignal(this.svc.getProductos(), { initialValue: [] });
  readonly sinStock   = computed(() => this.productos().filter(p => p.stock_actual === 0));
  readonly bajoMinimo = computed(() => this.productos().filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo));

  readonly tallas  = computed(() => [...new Set(this.productos().map(p => p.talla).filter(Boolean))].sort() as string[]);
  readonly colores = computed(() => [...new Set(this.productos().map(p => p.color).filter(Boolean))].sort() as string[]);

  readonly filtrosActivos = computed(() =>
    !!this.busqueda || !!this.filtroTalla() || !!this.filtroColor() || !!this.filtroEstado()
  );

  readonly filtrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    const talla = this.filtroTalla();
    const color = this.filtroColor();
    const estado = this.filtroEstado();

    return this.productos().filter(p => {
      if (talla && p.talla !== talla) return false;
      if (color && p.color !== color) return false;
      if (estado === 'sin_stock' && p.stock_actual !== 0) return false;
      if (estado === 'bajo_minimo' && !(p.stock_actual > 0 && p.stock_actual <= p.stock_minimo)) return false;
      if (estado === 'ok' && !(p.stock_actual > p.stock_minimo)) return false;
      if (q) {
        const match = p.sku.toLowerCase().includes(q) ||
          p.nombre.toLowerCase().includes(q) ||
          (p.modelo ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroTalla.set('');
    this.filtroColor.set('');
    this.filtroEstado.set('');
  }

  abrirAjuste(producto: any) {
    const ref = this.dialog.open(AjusteStockDialogComponent, {
      data: producto, width: '420px',
    });
    ref.afterClosed().subscribe((res: { cantidad: number; notas: string } | undefined) => {
      if (!res) return;
      this.svc.ajustarStock(producto.id, res.cantidad, res.notas).subscribe({
        next: () => {
          const signo = res.cantidad >= 0 ? '+' : '';
          this.snack.open(`Stock ajustado: ${signo}${res.cantidad} unidades`, 'OK', { duration: 3000 });
        },
        error: () => this.snack.open('Error al ajustar stock', 'Cerrar', { duration: 3000, panelClass: 'error-snack' }),
      });
    });
  }
}
