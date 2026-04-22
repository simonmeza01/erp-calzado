import { Component, inject, Input, OnInit, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { toSignal } from '@angular/core/rxjs-interop';
import { switchMap, of } from 'rxjs';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { PedidoStatus } from '../../core/models';
import { EstadoPedidoBadgeComponent } from '../../shared/components/estado-pedido-badge/estado-pedido-badge.component';
import { AlertaVencimientoComponent } from '../../shared/components/alerta-vencimiento/alerta-vencimiento.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PagoRapidoDialogComponent } from './pago-rapido-dialog.component';
import { DevolucionDialogComponent } from './devolucion-dialog.component';

const TIMELINE: { status: PedidoStatus; label: string }[] = [
  { status: 'borrador',       label: 'Borrador' },
  { status: 'en_aprobacion',  label: 'En aprobación' },
  { status: 'aprobado',       label: 'Aprobado' },
  { status: 'en_preparacion', label: 'En preparación' },
  { status: 'en_transito',    label: 'En tránsito' },
  { status: 'entregado',      label: 'Entregado' },
];

const ORDEN_STATUS: Record<PedidoStatus, number> = {
  borrador: 0, en_aprobacion: 1, aprobado: 2,
  en_preparacion: 3, en_transito: 4, entregado: 5, cancelado: -1,
};

@Component({
  selector: 'app-pedido-detalle',
  template: `
    @if (cargando()) {
      <app-loading-skeleton [count]="8" class="block" />
    } @else if (pedido(); as p) {
      <div class="space-y-5">

        <!-- Header -->
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div class="flex items-center gap-3 flex-wrap">
              <h2 class="text-xl font-bold text-slate-800 font-mono">{{ p.numero_pedido }}</h2>
              <app-estado-pedido-badge [status]="p.status" />
              <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
            </div>
            <p class="text-slate-500 text-sm mt-0.5">
              {{ p.cliente?.razon_social }} · {{ p.created_at | date:'dd/MM/yyyy HH:mm' }}
            </p>
          </div>
          <div class="flex gap-2 flex-wrap">
            <a mat-stroked-button routerLink="/pedidos">
              <mat-icon class="!text-base mr-1">arrow_back</mat-icon>Volver
            </a>
            @if (auth.hasRole('admin', 'gerente') && p.status === 'en_aprobacion') {
              <button mat-flat-button color="primary" (click)="aprobar(p)">
                <mat-icon class="!text-base mr-1">check_circle</mat-icon>Aprobar
              </button>
              <button mat-stroked-button color="warn" (click)="rechazar(p.id)">
                <mat-icon class="!text-base mr-1">cancel</mat-icon>Rechazar
              </button>
            }
            @if (auth.hasRole('admin', 'gerente') && p.status === 'aprobado') {
              <button mat-stroked-button (click)="avanzarStatus(p.id, 'en_preparacion')">
                <mat-icon class="!text-base mr-1">inventory</mat-icon>Iniciar preparación
              </button>
            }
            @if (auth.hasRole('admin', 'gerente') && p.status === 'en_preparacion') {
              <button mat-stroked-button (click)="avanzarStatus(p.id, 'en_transito')">
                <mat-icon class="!text-base mr-1">local_shipping</mat-icon>Despachar
              </button>
            }
            @if (auth.hasRole('admin', 'gerente') && p.status === 'en_transito') {
              <button mat-flat-button color="primary" (click)="avanzarStatus(p.id, 'entregado')">
                <mat-icon class="!text-base mr-1">task_alt</mat-icon>Marcar entregado
              </button>
            }
          </div>
        </div>

        <!-- Timeline -->
        @if (p.status !== 'cancelado') {
          <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
            <div class="flex items-center min-w-max">
              @for (step of timeline; track step.status; let last = $last) {
                <div class="flex items-center">
                  <div class="flex flex-col items-center gap-1">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      {{ ordenActual(p.status) >= ordenStep(step.status)
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-400 border-2 border-slate-200' }}">
                      @if (ordenActual(p.status) > ordenStep(step.status)) {
                        <mat-icon class="!text-sm">check</mat-icon>
                      } @else {
                        {{ $index + 1 }}
                      }
                    </div>
                    <span class="text-xs whitespace-nowrap
                      {{ ordenActual(p.status) >= ordenStep(step.status) ? 'text-primary font-semibold' : 'text-slate-400' }}">
                      {{ step.label }}
                    </span>
                  </div>
                  @if (!last) {
                    <div class="w-12 h-0.5 mx-1 mb-5
                      {{ ordenActual(p.status) > ordenStep(step.status) ? 'bg-primary' : 'bg-slate-200' }}">
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <!-- Columna izquierda -->
          <div class="space-y-4">

            <!-- Info pedido -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 class="font-semibold text-slate-700 mb-3">Información del pedido</h3>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">Cliente</span>
                  <a [routerLink]="['/clientes', p.cliente_id]" class="text-primary hover:underline font-medium text-right max-w-40 truncate">
                    {{ p.cliente?.razon_social }}
                  </a>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500">Vendedor</span>
                  <span class="text-slate-700">{{ p.vendedor?.nombre }}</span>
                </div>
                @if (p.fecha_vencimiento) {
                  <div class="flex justify-between">
                    <span class="text-slate-500">Vence</span>
                    <span class="{{ (p.dias_para_vencer ?? 999) <= 3 ? 'text-red-600 font-semibold' : 'text-slate-700' }}">
                      {{ p.fecha_vencimiento | date:'dd/MM/yyyy' }}
                    </span>
                  </div>
                }
                @if (p.numero_guia) {
                  <div class="flex justify-between">
                    <span class="text-slate-500">Guía</span>
                    <span class="font-mono text-xs text-slate-700">{{ p.numero_guia }}</span>
                  </div>
                }
                @if (p.tiene_factura) {
                  <div class="flex justify-between">
                    <span class="text-slate-500">Factura</span>
                    <span class="font-mono text-xs text-slate-700">{{ p.numero_factura }}</span>
                  </div>
                }
                @if (p.descuento_porcentaje > 0) {
                  <div class="flex justify-between">
                    <span class="text-slate-500">Descuento</span>
                    <span class="text-amber-600 font-semibold">{{ p.descuento_porcentaje }}%</span>
                  </div>
                }
                @if (p.notas) {
                  <div class="pt-2 border-t border-slate-100">
                    <p class="text-xs text-slate-400">{{ p.notas }}</p>
                  </div>
                }
              </dl>
            </div>

            <!-- Totales -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 class="font-semibold text-slate-700 mb-3">Resumen financiero</h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-500">Total</span>
                  <span class="font-semibold text-slate-800">{{ bcv.formatUsd(p.total_usd) }}</span>
                </div>
                @if (bcv.tasaActual()) {
                  <div class="flex justify-between">
                    <span class="text-slate-500">En Bs.</span>
                    <span class="text-slate-500 text-xs">{{ bcv.formatBs(p.total_usd) }}</span>
                  </div>
                }
                <mat-divider />
                <div class="flex justify-between pt-1">
                  <span class="text-slate-500">Pagado</span>
                  <span class="font-semibold text-emerald-600">
                    {{ bcv.formatUsd(p.total_usd - (p.saldo_pendiente_usd ?? 0)) }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-500 font-medium">Saldo pendiente</span>
                  <span class="font-bold {{ (p.saldo_pendiente_usd ?? 0) > 0 ? 'text-red-600' : 'text-emerald-600' }}">
                    {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}
                  </span>
                </div>
              </div>

              @if ((p.saldo_pendiente_usd ?? 0) > 0) {
                <button mat-flat-button color="primary" class="w-full mt-4 !text-sm"
                        (click)="registrarPago(p)">
                  <mat-icon class="!text-base mr-1">payments</mat-icon>Registrar pago
                </button>
              }
            </div>

          </div>

          <!-- Columna derecha -->
          <div class="lg:col-span-2 space-y-4">

            <!-- Items -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100">
                <h3 class="font-semibold text-slate-700">
                  Productos ({{ (p.items ?? []).length }})
                </h3>
              </div>
              @if (!(p.items ?? []).length) {
                <p class="text-sm text-slate-400 text-center py-8">Sin productos registrados</p>
              } @else {
                <div class="overflow-x-auto">
                  <table class="w-full text-sm">
                    <thead class="bg-slate-50">
                      <tr>
                        <th class="text-left px-4 py-2 text-xs text-slate-500 font-semibold">SKU</th>
                        <th class="text-left px-4 py-2 text-xs text-slate-500 font-semibold">Producto</th>
                        <th class="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Cant.</th>
                        <th class="text-right px-4 py-2 text-xs text-slate-500 font-semibold">P. Unit.</th>
                        <th class="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Desc.</th>
                        <th class="text-right px-4 py-2 text-xs text-slate-500 font-semibold">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (item of p.items; track item.id) {
                        <tr>
                          <td class="px-4 py-2 font-mono text-xs text-slate-400">{{ item.producto?.sku }}</td>
                          <td class="px-4 py-2 text-slate-700">{{ item.producto?.nombre }}</td>
                          <td class="px-4 py-2 text-right text-slate-700">{{ item.cantidad }}</td>
                          <td class="px-4 py-2 text-right text-slate-600">{{ bcv.formatUsd(item.precio_unitario_usd) }}</td>
                          <td class="px-4 py-2 text-right text-amber-600">
                            {{ item.descuento > 0 ? item.descuento + '%' : '—' }}
                          </td>
                          <td class="px-4 py-2 text-right font-semibold text-slate-800">
                            {{ bcv.formatUsd(item.subtotal_usd ?? 0) }}
                          </td>
                        </tr>
                      }
                    </tbody>
                    <tfoot class="bg-slate-50 border-t border-slate-200">
                      <tr>
                        <td colspan="5" class="px-4 py-2 text-right text-sm font-semibold text-slate-600">Total</td>
                        <td class="px-4 py-2 text-right font-bold text-slate-800">{{ bcv.formatUsd(p.total_usd) }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              }
            </div>

            <!-- Pagos -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-semibold text-slate-700">
                  Pagos recibidos ({{ (p.pagos ?? []).length }})
                </h3>
                @if ((p.saldo_pendiente_usd ?? 0) > 0) {
                  <button mat-stroked-button class="!text-xs" (click)="registrarPago(p)">
                    <mat-icon class="!text-sm mr-1">add</mat-icon>Pago
                  </button>
                }
              </div>
              @if (!(p.pagos ?? []).length) {
                <p class="text-sm text-slate-400 text-center py-6">Sin pagos registrados</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (pago of p.pagos; track pago.id) {
                    <li class="px-5 py-3 flex items-center gap-3">
                      <mat-icon class="{{ pago.moneda === 'usd' ? 'text-emerald-500' : 'text-blue-500' }} !text-base">
                        {{ pago.moneda === 'usd' ? 'attach_money' : 'currency_exchange' }}
                      </mat-icon>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-slate-700">{{ pago.banco_destino }}</p>
                        <p class="text-xs text-slate-400">
                          {{ pago.fecha_pago | date:'dd/MM/yyyy' }} ·
                          {{ pago.tipo === 'completo' ? 'Pago completo' : 'Abono' }}
                        </p>
                      </div>
                      <div class="text-right">
                        @if (pago.moneda === 'usd') {
                          <p class="font-semibold text-slate-800">{{ bcv.formatUsd(pago.monto_usd ?? 0) }}</p>
                        } @else {
                          <p class="font-semibold text-slate-800">Bs. {{ (pago.monto_bs ?? 0).toFixed(2) }}</p>
                          <p class="text-xs text-slate-400">≈ {{ bcv.formatUsd((pago.monto_bs ?? 0) / (pago.tasa_cambio ?? 1)) }}</p>
                        }
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>

            <!-- Devoluciones -->
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 class="font-semibold text-slate-700">
                  Devoluciones ({{ devolucionesPedido().length }})
                </h3>
                @if (auth.hasRole('admin', 'gerente') && p.status === 'entregado') {
                  <button mat-stroked-button class="!text-xs" (click)="registrarDevolucion(p)">
                    <mat-icon class="!text-sm mr-1">assignment_return</mat-icon>Registrar
                  </button>
                }
              </div>
              @if (!devolucionesPedido().length) {
                <p class="text-sm text-slate-400 text-center py-6">Sin devoluciones</p>
              } @else {
                <ul class="divide-y divide-slate-100">
                  @for (dev of devolucionesPedido(); track dev.id) {
                    <li class="px-5 py-3 flex items-center gap-3">
                      <mat-icon class="text-amber-500 !text-base">assignment_return</mat-icon>
                      <div class="flex-1">
                        <p class="text-xs text-slate-400">{{ dev.created_at | date:'dd/MM/yyyy' }}</p>
                        @if (dev.notas) {
                          <p class="text-sm text-slate-600">{{ dev.notas }}</p>
                        }
                      </div>
                      <div class="text-right">
                        <span class="text-xs px-2 py-0.5 rounded-full capitalize
                          {{ dev.status === 'procesada' ? 'bg-emerald-100 text-emerald-700' :
                             dev.status === 'mercancia_recibida' ? 'bg-blue-100 text-blue-700' :
                             'bg-amber-100 text-amber-700' }}">
                          {{ dev.status }}
                        </span>
                        @if (dev.monto_credito_usd) {
                          <p class="text-sm font-semibold text-primary mt-1">
                            Crédito: {{ bcv.formatUsd(dev.monto_credito_usd) }}
                          </p>
                        }
                      </div>
                    </li>
                  }
                </ul>
              }
            </div>

          </div>
        </div>
      </div>
    } @else {
      <p class="text-slate-400 text-center py-16">Pedido no encontrado.</p>
    }
  `,
  imports: [
    RouterLink, DatePipe,
    MatIconModule, MatButtonModule, MatDividerModule,
    EstadoPedidoBadgeComponent, AlertaVencimientoComponent, LoadingSkeletonComponent,
  ],
})
export class PedidoDetalleComponent implements OnInit {
  @Input() id = '';

  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  readonly bcv            = inject(TasaBcvService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly timeline = TIMELINE;
  readonly cargando = signal(true);
  readonly pedido   = signal<any>(null);

  private readonly _devoluciones = toSignal(
    this.svc.getDevoluciones(),
    { initialValue: [] },
  );

  readonly devolucionesPedido = computed(() =>
    this._devoluciones().filter((d: any) => d.pedido_id === this.id),
  );

  ngOnInit(): void {
    this.svc.getPedido(this.id).subscribe({
      next: p => { this.pedido.set(p); this.cargando.set(false); },
      error: () => { this.pedido.set(null); this.cargando.set(false); },
    });

    // Re-subscribe to keep pagos/saldo reactive
    this.svc.getPedido(this.id).subscribe(p => this.pedido.set(p));
  }

  ordenActual(status: PedidoStatus): number { return ORDEN_STATUS[status]; }
  ordenStep(status: PedidoStatus): number { return ORDEN_STATUS[status]; }

  aprobar(p: any): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Aprobar pedido', mensaje: '¿Confirmar aprobación?', confirmar: 'Aprobar', color: 'primary' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.actualizarPedido(p.id, { status: 'aprobado' }).subscribe(actualizado => {
        this.pedido.set(actualizado);
        // Crear comisión automática: 8% sin descuento, 6% con descuento
        const porcentaje = p.descuento_porcentaje > 0 ? 6 : 8;
        this.svc.crearComision({
          pedido_id: p.id,
          vendedor_id: p.vendedor_id,
          porcentaje,
          monto_usd: parseFloat((p.total_usd * porcentaje / 100).toFixed(2)),
          pagada: false,
        }).subscribe();
        this.snack.open(`Pedido aprobado. Comisión ${porcentaje}% generada.`, 'OK', { duration: 4000 });
      });
    });
  }

  rechazar(id: string): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { titulo: 'Rechazar pedido', mensaje: '¿Confirmar rechazo y cancelación?', confirmar: 'Rechazar', color: 'warn' },
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.svc.actualizarPedido(id, { status: 'cancelado' }).subscribe(p => {
        this.pedido.set(p);
        this.snack.open('Pedido cancelado', 'OK', { duration: 3000 });
      });
    });
  }

  avanzarStatus(id: string, nuevoStatus: PedidoStatus): void {
    this.svc.actualizarPedido(id, { status: nuevoStatus }).subscribe(p => {
      this.pedido.set(p);
      this.snack.open('Estado actualizado', 'OK', { duration: 2500 });
    });
  }

  registrarPago(p: any): void {
    const ref = this.dialog.open(PagoRapidoDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      data: {
        pedidoId: p.id,
        numeroPedido: p.numero_pedido,
        clienteNombre: p.cliente?.razon_social ?? '',
        saldoPendienteUsd: p.saldo_pendiente_usd ?? 0,
      },
    });
    ref.afterClosed().subscribe(pago => {
      if (pago) {
        this.svc.getPedido(this.id).subscribe(actualizado => this.pedido.set(actualizado));
        this.snack.open('Pago registrado', 'OK', { duration: 3000 });
      }
    });
  }

  registrarDevolucion(p: any): void {
    const ref = this.dialog.open(DevolucionDialogComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: { pedido: p },
    });
    ref.afterClosed().subscribe(dev => {
      if (dev) {
        this.snack.open('Devolución registrada', 'OK', { duration: 3000 });
      }
    });
  }
}
