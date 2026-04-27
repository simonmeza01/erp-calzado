import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { PedidoStatus } from '../../core/models';
import { EstadoPedidoBadgeComponent } from '../../shared/components/estado-pedido-badge/estado-pedido-badge.component';
import { AlertaVencimientoComponent } from '../../shared/components/alerta-vencimiento/alerta-vencimiento.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

const ESTADOS: { value: PedidoStatus | ''; label: string }[] = [
  { value: '',               label: 'Todos los estados' },
  { value: 'borrador',       label: 'Borrador' },
  { value: 'en_aprobacion',  label: 'En aprobación' },
  { value: 'aprobado',       label: 'Aprobado' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'en_transito',    label: 'En tránsito' },
  { value: 'entregado',      label: 'Entregado' },
  { value: 'cancelado',      label: 'Cancelado' },
];

@Component({
  selector: 'app-pedidos',
  template: `
    <div class="space-y-4">

      <!-- Toolbar -->
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-slate-700">
          {{ filtrados().length }} pedido(s) — {{ bcv.formatUsd(totalMonto()) }}
        </h2>
        <a data-tour="pedidos-nuevo" mat-flat-button routerLink="/pedidos/nuevo" class="!bg-primary !text-white !rounded-lg">
          <mat-icon class="!text-base mr-1">add</mat-icon>Nuevo pedido
        </a>
      </div>

      <!-- Filtros -->
      <div data-tour="pedidos-filtros" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex flex-wrap gap-3">
          <mat-form-field appearance="outline" class="flex-1 min-w-48">
            <mat-label>Buscar por N° o cliente…</mat-label>
            <input matInput [(ngModel)]="busqueda" />
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-44">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="estadoFiltro">
              @for (e of estados; track e.value) {
                <mat-option [value]="e.value">{{ e.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

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

          <mat-form-field appearance="outline" class="w-36">
            <mat-label>Desde</mat-label>
            <input matInput type="date" [(ngModel)]="fechaDesde" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-36">
            <mat-label>Hasta</mat-label>
            <input matInput type="date" [(ngModel)]="fechaHasta" />
          </mat-form-field>

          @if (auth.hasRole('admin', 'gerente')) {
            <button (click)="soloMios.set(!soloMios())"
                    class="self-center text-xs px-3 py-2 rounded-lg border transition-colors cursor-pointer
                           {{ soloMios() ? 'bg-primary text-white border-primary' : 'text-slate-500 border-slate-300 hover:border-primary' }}">
              Solo los míos
            </button>
          }
        </div>
      </div>

      <!-- Lista -->
      <div data-tour="pedidos-lista" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        @if (!pedidosTodos().length) {
          <app-loading-skeleton [count]="6" class="p-5 block" />
        } @else if (!filtrados().length) {
          <app-empty-state titulo="Sin pedidos" subtitulo="Ajusta los filtros" />
        } @else {

          <!-- Desktop -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">N° Pedido</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cliente</th>
                  @if (auth.hasRole('admin', 'gerente')) {
                    <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Vendedor</th>
                  }
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden xl:table-cell">Fecha</th>
                  <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total USD</th>
                  <th class="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (p of filtrados(); track p.id) {
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <a [routerLink]="['/pedidos', p.id]" class="font-mono font-semibold text-primary hover:underline text-xs">
                        {{ p.numero_pedido }}
                      </a>
                    </td>
                    <td class="px-4 py-3 text-slate-700 max-w-32 truncate">{{ p.cliente?.razon_social }}</td>
                    @if (auth.hasRole('admin', 'gerente')) {
                      <td class="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{{ p.vendedor?.nombre }}</td>
                    }
                    <td class="px-4 py-3 text-slate-400 text-xs hidden xl:table-cell">{{ p.created_at | date:'dd/MM/yy' }}</td>
                    <td class="px-4 py-3 text-right">
                      <p class="font-semibold text-slate-800">{{ bcv.formatUsd(p.total_usd) }}</p>
                      @if ((p.saldo_pendiente_usd ?? 0) > 0) {
                        <p class="text-xs text-red-500">Saldo: {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}</p>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-1 flex-wrap">
                        <app-estado-pedido-badge [status]="p.status" />
                        <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-center gap-1">
                        <a [routerLink]="['/pedidos', p.id]" mat-icon-button aria-label="Ver detalle">
                          <mat-icon class="!text-base text-slate-400 hover:text-primary">visibility</mat-icon>
                        </a>
                        @if (auth.hasRole('admin', 'gerente') && p.status === 'en_aprobacion') {
                          <button mat-icon-button (click)="aprobar(p.id)" aria-label="Aprobar">
                            <mat-icon class="!text-base text-emerald-500 hover:text-emerald-700">check_circle</mat-icon>
                          </button>
                          <button mat-icon-button (click)="rechazar(p.id)" aria-label="Rechazar">
                            <mat-icon class="!text-base text-red-400 hover:text-red-600">cancel</mat-icon>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <ul class="md:hidden divide-y divide-slate-100">
            @for (p of filtrados(); track p.id) {
              <li class="px-4 py-4">
                <div class="flex items-start gap-3">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a [routerLink]="['/pedidos', p.id]" class="font-mono text-xs font-bold text-primary hover:underline">{{ p.numero_pedido }}</a>
                      <app-estado-pedido-badge [status]="p.status" />
                      <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
                    </div>
                    <p class="text-xs text-slate-500 mt-0.5 truncate">{{ p.cliente?.razon_social }}</p>
                    <p class="text-xs text-slate-400">{{ p.created_at | date:'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <p class="text-sm font-bold text-slate-800">{{ bcv.formatUsd(p.total_usd) }}</p>
                    @if ((p.saldo_pendiente_usd ?? 0) > 0) {
                      <p class="text-xs text-red-500">Saldo: {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}</p>
                    }
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
    RouterLink, DatePipe, FormsModule,
    MatIconModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    EstadoPedidoBadgeComponent, AlertaVencimientoComponent,
    EmptyStateComponent, LoadingSkeletonComponent,
  ],
})
export class PedidosComponent {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  readonly bcv            = inject(TasaBcvService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  readonly estados    = ESTADOS;
  busqueda            = '';
  estadoFiltro: PedidoStatus | '' = '';
  vendedorFiltro      = '';
  fechaDesde          = '';
  fechaHasta          = '';
  soloMios            = signal(false);

  readonly vendedores = toSignal(this.svc.getVendedores(), { initialValue: [] });

  readonly pedidosTodos = toSignal(
    this.svc.getPedidos(
      this.auth.hasRole('vendedor') ? (this.auth.usuarioActual()?.id ?? undefined) : undefined,
    ),
    { initialValue: [] },
  );

  readonly filtrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    const uid = this.auth.usuarioActual()?.id;
    return this.pedidosTodos().filter(p => {
      if (this.estadoFiltro && p.status !== this.estadoFiltro) return false;
      if (this.vendedorFiltro && p.vendedor_id !== this.vendedorFiltro) return false;
      if (this.soloMios() && p.vendedor_id !== uid) return false;
      if (this.fechaDesde && p.created_at < this.fechaDesde) return false;
      if (this.fechaHasta && p.created_at > this.fechaHasta + 'T23:59:59') return false;
      if (!q) return true;
      return (
        p.numero_pedido.toLowerCase().includes(q) ||
        (p.cliente?.razon_social ?? '').toLowerCase().includes(q)
      );
    });
  });

  readonly totalMonto = computed(() => this.filtrados().reduce((s, p) => s + p.total_usd, 0));

  aprobar(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Aprobar pedido', mensaje: '¿Confirmar aprobación de este pedido?', confirmar: 'Aprobar', color: 'primary' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      try {
        this.svc.cambiarStatusPedido(id, 'aprobado', this.auth.usuarioActual()!.rol).subscribe(() => {
          this.snack.open('Pedido aprobado', 'OK', { duration: 3000 });
        });
      } catch (e: any) {
        this.snack.open(e.message ?? 'Error al aprobar', 'OK', { duration: 4000 });
      }
    });
  }

  rechazar(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Rechazar pedido', mensaje: '¿Confirmar el rechazo y cancelación?', confirmar: 'Rechazar', color: 'warn' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      try {
        this.svc.cambiarStatusPedido(id, 'cancelado', this.auth.usuarioActual()!.rol).subscribe(() => {
          this.snack.open('Pedido cancelado', 'OK', { duration: 3000 });
        });
      } catch (e: any) {
        this.snack.open(e.message ?? 'Error al cancelar', 'OK', { duration: 4000 });
      }
    });
  }
}
