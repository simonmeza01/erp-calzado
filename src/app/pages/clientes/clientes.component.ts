import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { Cliente } from '../../core/models';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { DualCurrencyDisplayComponent } from '../../shared/components/dual-currency-display/dual-currency-display.component';
import { ClienteFormDialogComponent } from './cliente-form-dialog.component';
import { ESTADOS_LIST } from '../../core/data/venezuela-geo';

@Component({
  selector: 'app-clientes',
  template: `
    <div class="space-y-4">

      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3 justify-between">
        <h2 class="text-base font-semibold text-slate-700">
          {{ filtrados().length }} cliente(s)
        </h2>
        <button data-tour="clientes-nuevo" mat-flat-button (click)="abrirFormulario()"
                class="!bg-primary !text-white !rounded-lg">
          <mat-icon class="!text-base mr-1">add</mat-icon>
          Nuevo cliente
        </button>
      </div>

      <!-- Filtros -->
      <div data-tour="clientes-filtros" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex flex-wrap gap-3">

          <!-- Buscador -->
          <mat-form-field appearance="outline" class="flex-1 min-w-48">
            <mat-label>Buscar por nombre, código o RIF…</mat-label>
            <input matInput [(ngModel)]="busqueda" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <!-- Estado -->
          <mat-form-field appearance="outline" class="w-44">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="estadoFiltro">
              <mat-option value="">Todos</mat-option>
              @for (e of estados; track e) {
                <mat-option [value]="e">{{ e }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Vendedor (solo admin/gerente) -->
          @if (auth.hasRole('admin', 'gerente')) {
            <mat-form-field appearance="outline" class="w-44">
              <mat-label>Vendedor</mat-label>
              <mat-select [(ngModel)]="vendedorFiltro">
                <mat-option value="">Todos</mat-option>
                @for (v of vendedores(); track v.id) {
                  <mat-option [value]="v.id">{{ v.nombre }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          }

          <!-- Estado cuenta -->
          <mat-form-field appearance="outline" class="w-36">
            <mat-label>Estado cuenta</mat-label>
            <mat-select [(ngModel)]="estadoCuentaFiltro">
              <mat-option value="">Todos</mat-option>
              <mat-option value="deuda">Con deuda</mat-option>
              <mat-option value="aldia">Al día</mat-option>
            </mat-select>
          </mat-form-field>

        </div>
      </div>

      <!-- Tabla -->
      <div data-tour="clientes-tabla" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

        @if (!clientesTodos().length) {
          <app-loading-skeleton [count]="6" [showAvatar]="true" class="p-5 block" />
        } @else if (!filtrados().length) {
          <app-empty-state titulo="Sin clientes" subtitulo="Ajusta los filtros de búsqueda" />
        } @else {

          <!-- Desktop table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Razón social</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">RIF</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado / Ciudad</th>
                  @if (auth.hasRole('admin', 'gerente')) {
                    <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendedor</th>
                  }
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Teléfono</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deuda</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mora</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (c of filtrados(); track c.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3 font-mono text-xs text-primary font-semibold">{{ c.codigo_cliente }}</td>
                    <td class="px-4 py-3">
                      <a [routerLink]="['/clientes', c.id]"
                         class="font-medium text-primary hover:underline">
                        {{ c.razon_social }}
                      </a>
                      @if (!c.activo) {
                        <span class="ml-1 text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-400">Inactivo</span>
                      }
                    </td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-500">{{ c.rif }}</td>
                    <td class="px-4 py-3 text-slate-600 text-xs">{{ c.estado }}<br>{{ c.ciudad }}</td>
                    @if (auth.hasRole('admin', 'gerente')) {
                      <td class="px-4 py-3 text-slate-600 text-xs">{{ c.vendedor?.nombre ?? '—' }}</td>
                    }
                    <td class="px-4 py-3 text-slate-500 hidden lg:table-cell">{{ c.telefono ?? '—' }}</td>
                    <td class="px-4 py-3 text-right">
                      @if ((c.monto_total_adeudado ?? 0) > 0) {
                        <app-dual-currency [monto]="c.monto_total_adeudado ?? 0" />
                        @if ((c.conteo_pedidos_pendientes ?? 0) > 1) {
                          <p class="text-xs text-slate-400">{{ c.conteo_pedidos_pendientes }} pedidos</p>
                        }
                      } @else {
                        <span class="text-xs text-emerald-600 font-semibold">Al día</span>
                      }
                    </td>
                    <td class="px-4 py-3 text-center">
                      @if ((c.rango_maximo_dias_mora ?? 0) > 0) {
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-full
                                     {{ (c.rango_maximo_dias_mora ?? 0) > 30 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700' }}">
                          {{ c.rango_maximo_dias_mora }}d
                        </span>
                      } @else {
                        <span class="text-xs text-slate-300">—</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-center gap-1">
                        <a [routerLink]="['/clientes', c.id]" mat-icon-button aria-label="Ver detalle">
                          <mat-icon class="!text-base text-slate-400 hover:text-primary">visibility</mat-icon>
                        </a>
                        <a [routerLink]="['/pedidos/nuevo']" [queryParams]="{clienteId: c.id}" mat-icon-button aria-label="Nuevo pedido">
                          <mat-icon class="!text-base text-slate-400 hover:text-primary">add_shopping_cart</mat-icon>
                        </a>
                        <button mat-icon-button (click)="abrirFormulario(c)" aria-label="Editar">
                          <mat-icon class="!text-base text-slate-400 hover:text-primary">edit</mat-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <ul class="md:hidden divide-y divide-slate-100">
            @for (c of filtrados(); track c.id) {
              <li class="px-4 py-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center
                              text-sm font-bold text-white
                              {{ c.activo ? 'bg-primary' : 'bg-slate-300' }}">
                    {{ c.razon_social.slice(0,2).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <a [routerLink]="['/clientes', c.id]" class="text-sm font-semibold text-primary hover:underline block truncate">
                      {{ c.razon_social }}
                    </a>
                    <p class="text-xs text-slate-400">{{ c.codigo_cliente }} · {{ c.rif }}</p>
                    <p class="text-xs text-slate-400">{{ c.estado }}, {{ c.ciudad }}</p>
                  </div>
                  <div class="text-right">
                    @if ((c.monto_total_adeudado ?? 0) > 0) {
                      <p class="text-sm font-bold text-red-600">$ {{ c.monto_total_adeudado | number:'1.2-2' }}</p>
                      @if ((c.rango_maximo_dias_mora ?? 0) > 0) {
                        <p class="text-xs text-amber-600">{{ c.rango_maximo_dias_mora }}d mora</p>
                      }
                    } @else {
                      <span class="text-xs text-emerald-600 font-semibold">Al día</span>
                    }
                    <a [routerLink]="['/clientes', c.id]" class="text-xs text-primary underline block mt-1">Ver →</a>
                  </div>
                </div>
              </li>
            }
          </ul>

        }
      </div>
    </div>
  `,
  imports: [
    RouterLink, DecimalPipe, FormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    EmptyStateComponent, LoadingSkeletonComponent, DualCurrencyDisplayComponent,
  ],
})
export class ClientesComponent {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);
  readonly bcv            = inject(TasaBcvService);

  busqueda            = '';
  estadoFiltro        = '';
  vendedorFiltro      = '';
  estadoCuentaFiltro  = '';

  readonly estados    = ESTADOS_LIST;
  readonly vendedores = toSignal(this.svc.getVendedores(), { initialValue: [] });

  readonly clientesTodos = toSignal(
    this.svc.getClientes(
      this.auth.hasRole('vendedor') ? (this.auth.usuarioActual()?.id ?? undefined) : undefined,
    ),
    { initialValue: [] },
  );

  readonly filtrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    return this.clientesTodos().filter(c => {
      if (this.estadoFiltro && c.estado !== this.estadoFiltro) return false;
      if (this.vendedorFiltro && c.vendedor_id !== this.vendedorFiltro) return false;
      if (this.estadoCuentaFiltro === 'deuda' && !(c.monto_total_adeudado ?? 0)) return false;
      if (this.estadoCuentaFiltro === 'aldia' && (c.monto_total_adeudado ?? 0) > 0) return false;
      if (!q) return true;
      return (
        c.razon_social.toLowerCase().includes(q) ||
        c.rif.toLowerCase().includes(q) ||
        c.codigo_cliente.toLowerCase().includes(q) ||
        (c.telefono ?? '').includes(q)
      );
    });
  });

  abrirFormulario(cliente?: Cliente): void {
    const ref = this.dialog.open(ClienteFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { cliente },
    });
    ref.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.snack.open(
          cliente ? 'Cliente actualizado' : 'Cliente creado exitosamente',
          'OK',
          { duration: 3000 },
        );
      }
    });
  }
}
