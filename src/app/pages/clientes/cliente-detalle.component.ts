import { Component, inject, Input, computed, OnInit, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { EstadoPedidoBadgeComponent } from '../../shared/components/estado-pedido-badge/estado-pedido-badge.component';
import { AlertaVencimientoComponent } from '../../shared/components/alerta-vencimiento/alerta-vencimiento.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { ClienteFormDialogComponent } from './cliente-form-dialog.component';
import { MiniMapaClienteComponent } from '../../shared/components/mini-mapa/mini-mapa-cliente.component';

@Component({
  selector: 'app-cliente-detalle',
  template: `
    @if (cargando()) {
      <app-loading-skeleton [count]="8" [showAvatar]="true" class="block" />
    } @else if (cliente(); as c) {
      <div class="space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800">{{ c.razon_social }}</h2>
            <p class="text-slate-500 font-mono text-sm mt-0.5">{{ c.rif }}</p>
          </div>
          <div class="flex gap-2 flex-shrink-0">
            <button mat-stroked-button (click)="editar()">
              <mat-icon class="!text-base mr-1">edit</mat-icon>Editar
            </button>
            <a mat-flat-button [routerLink]="['/pedidos/nuevo']" [queryParams]="{clienteId: c.id}"
               class="!bg-primary !text-white">
              <mat-icon class="!text-base mr-1">add</mat-icon>Nuevo pedido
            </a>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- ── Columna izquierda: Info básica ────────────────────────────── -->
          <div class="space-y-4">

            <!-- Info card -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 class="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <mat-icon class="text-slate-400 !text-base">info</mat-icon> Información
              </h3>
              <dl class="space-y-2 text-sm">
                @if (c.telefono) {
                  <div class="flex gap-2">
                    <mat-icon class="!text-sm text-slate-400 flex-shrink-0 mt-0.5">phone</mat-icon>
                    <span class="text-slate-600">{{ c.telefono }}</span>
                  </div>
                }
                @if (c.direccion) {
                  <div class="flex gap-2">
                    <mat-icon class="!text-sm text-slate-400 flex-shrink-0 mt-0.5">location_on</mat-icon>
                    <span class="text-slate-600">{{ c.direccion }}</span>
                  </div>
                }
                <div class="flex gap-2">
                  <mat-icon class="!text-sm text-slate-400 flex-shrink-0 mt-0.5">map</mat-icon>
                  <span class="text-slate-600">Zona {{ c.zona?.nombre ?? 'Sin zona' }}</span>
                </div>
                <div class="flex gap-2">
                  <mat-icon class="!text-sm text-slate-400 flex-shrink-0 mt-0.5">person</mat-icon>
                  <span class="text-slate-600">{{ c.vendedor?.nombre ?? 'Sin vendedor' }}</span>
                </div>
                <div class="flex gap-2 items-center">
                  <mat-icon class="!text-sm text-slate-400 flex-shrink-0">event</mat-icon>
                  <span class="text-slate-500">Última visita: {{ c.ultima_visita | timeAgo }}</span>
                </div>
              </dl>
              <button mat-stroked-button class="w-full mt-4 !text-sm" (click)="registrarVisita()">
                <mat-icon class="!text-base mr-1">today</mat-icon>
                Registrar visita hoy
              </button>
            </div>

            <!-- Mini mapa -->
            @if (c.coordenadas) {
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-5 py-3 flex items-center justify-between border-b border-slate-100">
                  <h3 class="font-semibold text-slate-700 text-sm flex items-center gap-2">
                    <mat-icon class="text-slate-400 !text-base">map</mat-icon> Ubicación
                  </h3>
                  <a routerLink="/mapa" class="text-xs text-primary hover:underline">Ver en mapa</a>
                </div>
                <app-mini-mapa-cliente
                  [lat]="c.coordenadas.lat"
                  [lng]="c.coordenadas.lng"
                  [nombre]="c.razon_social" />
              </div>
            }

            <!-- Resumen financiero -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 class="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <mat-icon class="text-slate-400 !text-base">account_balance_wallet</mat-icon>
                Resumen financiero
              </h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                  <span class="text-xs text-slate-500 uppercase font-semibold">Total comprado</span>
                  <span class="font-semibold text-slate-800">{{ bcv.formatUsd(totalComprado()) }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-slate-100">
                  <span class="text-xs text-slate-500 uppercase font-semibold">Total pagado</span>
                  <span class="font-semibold text-emerald-600">{{ bcv.formatUsd(totalPagado()) }}</span>
                </div>
                <div class="py-2 border-b border-slate-100">
                  <div class="flex justify-between items-start">
                    <span class="text-xs text-slate-500 uppercase font-semibold">Saldo pendiente</span>
                  </div>
                  <p class="text-2xl font-bold text-red-600 mt-1">{{ bcv.formatUsd(c.saldo_pendiente_usd ?? 0) }}</p>
                  @if (bcv.tasaActual()) {
                    <p class="text-sm text-slate-400">{{ bcv.formatBs(c.saldo_pendiente_usd ?? 0) }}</p>
                  }
                </div>
                <div class="flex justify-between items-center py-2">
                  <span class="text-xs text-slate-500 uppercase font-semibold">Crédito disponible</span>
                  <span class="font-semibold {{ creditoDisponible() < 0 ? 'text-red-600' : 'text-slate-800' }}">
                    {{ bcv.formatUsd(creditoDisponible()) }}
                  </span>
                </div>
              </div>
            </div>

          </div>

          <!-- ── Columna derecha: Historial ────────────────────────────────── -->
          <div class="lg:col-span-2">
            <mat-tab-group>

              <!-- Pedidos -->
              <mat-tab label="Pedidos ({{ pedidos().length }})">
                <div class="mt-3">
                  @if (!pedidos().length) {
                    <p class="text-sm text-slate-400 text-center py-8">Sin pedidos registrados</p>
                  } @else {
                    <ul class="space-y-2">
                      @for (p of pedidos().slice(0, 10); track p.id) {
                        <li class="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3
                                   hover:border-primary/30 transition-colors cursor-pointer"
                            [routerLink]="['/pedidos', p.id]">
                          <div class="flex-1 min-w-0">
                            <div class="flex items-center gap-2 flex-wrap">
                              <span class="text-sm font-semibold text-slate-800">{{ p.numero_pedido }}</span>
                              <app-estado-pedido-badge [status]="p.status" />
                              <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
                            </div>
                            <p class="text-xs text-slate-400 mt-0.5">{{ p.created_at | date:'dd/MM/yyyy' }}</p>
                          </div>
                          <div class="text-right flex-shrink-0">
                            <p class="text-sm font-bold text-slate-800">{{ bcv.formatUsd(p.total_usd) }}</p>
                            @if ((p.saldo_pendiente_usd ?? 0) > 0) {
                              <p class="text-xs text-red-500">Saldo: {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}</p>
                            }
                          </div>
                          <mat-icon class="text-slate-300 flex-shrink-0">chevron_right</mat-icon>
                        </li>
                      }
                    </ul>
                  }
                </div>
              </mat-tab>

              <!-- Pagos -->
              <mat-tab label="Pagos ({{ pagos().length }})">
                <div class="mt-3">
                  @if (!pagos().length) {
                    <p class="text-sm text-slate-400 text-center py-8">Sin pagos registrados</p>
                  } @else {
                    <ul class="space-y-2">
                      @for (p of pagos().slice(0, 5); track p.id) {
                        <li class="bg-white rounded-lg border border-slate-200 px-4 py-3 flex items-center gap-3">
                          <mat-icon class="{{ p.moneda === 'usd' ? 'text-emerald-500' : 'text-blue-500' }}">
                            {{ p.moneda === 'usd' ? 'attach_money' : 'currency_exchange' }}
                          </mat-icon>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-700">{{ p.banco_destino ?? 'Sin banco' }}</p>
                            <p class="text-xs text-slate-400">{{ p.fecha_pago | date:'dd/MM/yyyy' }} · {{ p.tipo === 'completo' ? 'Pago completo' : 'Abono' }}</p>
                          </div>
                          <div class="text-right">
                            @if (p.moneda === 'usd') {
                              <p class="text-sm font-bold text-slate-800">{{ bcv.formatUsd(p.monto_usd ?? 0) }}</p>
                            } @else {
                              <p class="text-sm font-bold text-slate-800">Bs. {{ (p.monto_bs ?? 0) | number:'1.2-2' }}</p>
                              <p class="text-xs text-slate-400">≈ {{ bcv.formatUsd((p.monto_bs ?? 0) / (p.tasa_cambio ?? 1)) }}</p>
                            }
                          </div>
                        </li>
                      }
                    </ul>
                  }
                </div>
              </mat-tab>

              <!-- Devoluciones -->
              <mat-tab label="Devoluciones ({{ devoluciones().length }})">
                <div class="mt-3">
                  @if (!devoluciones().length) {
                    <p class="text-sm text-slate-400 text-center py-8">Sin devoluciones</p>
                  } @else {
                    <ul class="space-y-2">
                      @for (d of devoluciones(); track d.id) {
                        <li class="bg-white rounded-lg border border-amber-200 px-4 py-3">
                          <div class="flex items-center gap-2">
                            <mat-icon class="text-amber-500 !text-base">assignment_return</mat-icon>
                            <span class="text-sm font-medium text-slate-700">{{ d.pedido_id }}</span>
                            <span class="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 capitalize">{{ d.status }}</span>
                          </div>
                          @if (d.monto_credito_usd) {
                            <p class="text-sm font-semibold text-primary mt-1">Crédito: {{ bcv.formatUsd(d.monto_credito_usd) }}</p>
                          }
                        </li>
                      }
                    </ul>
                  }
                </div>
              </mat-tab>

            </mat-tab-group>
          </div>

        </div>
      </div>
    } @else {
      <p class="text-slate-400 text-center py-16">Cliente no encontrado.</p>
    }
  `,
  imports: [
    RouterLink, DatePipe, DecimalPipe,
    MatIconModule, MatButtonModule, MatTabsModule,
    EstadoPedidoBadgeComponent, AlertaVencimientoComponent,
    LoadingSkeletonComponent, TimeAgoPipe, MiniMapaClienteComponent,
  ],
})
export class ClienteDetalleComponent implements OnInit {
  @Input() id = '';

  private readonly svc    = inject(MockDataService);
  private readonly auth   = inject(AuthMockService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);
  readonly bcv            = inject(TasaBcvService);

  readonly cargando  = signal(true);
  readonly cliente   = signal<ReturnType<typeof this._emptyCliente> | null>(null);

  private _emptyCliente() { return {} as NonNullable<ReturnType<typeof Object.assign>>; }

  // Pedidos del cliente
  private readonly _pedidosSignal = signal<any[]>([]);
  readonly pedidos  = computed(() => this._pedidosSignal());

  private readonly _pagosSignal = signal<any[]>([]);
  readonly pagos    = computed(() => this._pagosSignal());

  private readonly _devolucionesSignal = signal<any[]>([]);
  readonly devoluciones = computed(() => this._devolucionesSignal());

  readonly totalComprado = computed(() =>
    this._pedidosSignal()
      .filter(p => p.status !== 'cancelado')
      .reduce((s: number, p: any) => s + p.total_usd, 0),
  );

  readonly totalPagado = computed(() =>
    this._pagosSignal().reduce((s: number, p: any) => {
      if (p.moneda === 'usd') return s + (p.monto_usd ?? 0);
      return s + (p.monto_bs ?? 0) / (p.tasa_cambio ?? 1);
    }, 0),
  );

  readonly creditoDisponible = computed(() => {
    const c = this.cliente() as any;
    return (c?.limite_credito_usd ?? 0) - (c?.saldo_pendiente_usd ?? 0);
  });

  ngOnInit(): void {
    this.svc.getCliente(this.id).subscribe(c => {
      this.cliente.set(c as any);
      this.cargando.set(false);
    });

    this.svc.getPedidos(undefined, undefined, this.id).subscribe(ps => {
      this._pedidosSignal.set(ps);
      // Extraer pagos de los pedidos
      const todosLosPagos = ps.flatMap((p: any) => p.pagos ?? []);
      this._pagosSignal.set(todosLosPagos);
    });

    this.svc.getDevoluciones(this.id).subscribe(ds => {
      this._devolucionesSignal.set(ds);
    });
  }

  editar(): void {
    const ref = this.dialog.open(ClienteFormDialogComponent, {
      width: '560px',
      maxWidth: '95vw',
      data: { cliente: this.cliente() },
    });
    ref.afterClosed().subscribe(resultado => {
      if (resultado) {
        this.svc.getCliente(this.id).subscribe(c => this.cliente.set(c as any));
        this.snack.open('Cliente actualizado', 'OK', { duration: 3000 });
      }
    });
  }

  registrarVisita(): void {
    const hoy = new Date().toISOString();
    this.svc.actualizarCliente(this.id, { ultima_visita: hoy }).subscribe(c => {
      this.cliente.set(c as any);
      this.snack.open('Visita registrada', 'OK', { duration: 2500 });
    });
  }
}
