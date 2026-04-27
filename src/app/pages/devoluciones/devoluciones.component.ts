import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { RecibirDevolucionDialogComponent, RecibirDevolucionDialogResult } from './recibir-devolucion-dialog.component';
import { ProcesarDevolucionDialogComponent, ProcesarDevolucionDialogResult } from './procesar-devolucion-dialog.component';
import { Devolucion } from '../../core/models';

type DevolucionStatus = 'todas' | 'pendiente' | 'mercancia_recibida' | 'procesada' | 'rechazada';

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pendiente:          { label: 'Pendiente',           classes: 'bg-yellow-100 text-yellow-700' },
  mercancia_recibida: { label: 'Mercancía recibida',  classes: 'bg-blue-100 text-blue-700' },
  procesada:          { label: 'Procesada',            classes: 'bg-emerald-100 text-emerald-700' },
  rechazada:          { label: 'Rechazada',            classes: 'bg-red-100 text-red-600' },
};

const FILTROS: { value: DevolucionStatus; label: string }[] = [
  { value: 'todas',              label: 'Todas' },
  { value: 'pendiente',          label: 'Pendientes' },
  { value: 'mercancia_recibida', label: 'Recibidas' },
  { value: 'procesada',          label: 'Procesadas' },
  { value: 'rechazada',          label: 'Rechazadas' },
];

@Component({
  selector: 'app-devoluciones',
  template: `
    <div class="space-y-4">

      <!-- KPIs -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 mb-1">Total</p>
          <p class="text-2xl font-bold text-slate-800">{{ todas().length }}</p>
        </div>
        <div class="bg-yellow-50 rounded-xl border border-yellow-200 shadow-sm p-4">
          <p class="text-xs text-yellow-600 mb-1">Pendientes recepción</p>
          <p class="text-2xl font-bold text-yellow-700">{{ pendientesCount() }}</p>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
          <p class="text-xs text-blue-600 mb-1">Por procesar</p>
          <p class="text-2xl font-bold text-blue-700">{{ recibidasCount() }}</p>
        </div>
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 mb-1">Créditos totales</p>
          <p class="text-lg font-bold text-primary">{{ bcv.formatUsd(creditoTotal()) }}</p>
        </div>
      </div>

      <!-- Filtros por status -->
      <div class="flex gap-2 flex-wrap">
        @for (f of filtros; track f.value) {
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer
                   {{ filtroActivo() === f.value
                     ? 'bg-primary text-white border-primary'
                     : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300' }}"
            (click)="filtroActivo.set(f.value)">
            {{ f.label }}
            @if (f.value !== 'todas') {
              <span class="ml-1 opacity-75">({{ contarPorStatus(f.value) }})</span>
            }
          </button>
        }
      </div>

      <!-- Lista de devoluciones -->
      <div data-tour="devoluciones-lista" class="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <mat-icon class="text-orange-500">assignment_return</mat-icon>
          <h3 class="font-semibold text-slate-800">Devoluciones</h3>
          <span class="ml-auto text-xs text-slate-400">{{ devolucionesFiltradas().length }} resultado(s)</span>
        </div>

        @if (cargando()) {
          <app-loading-skeleton [count]="3" class="p-5 block" />
        } @else if (!devolucionesFiltradas().length) {
          <app-empty-state
            titulo="Sin devoluciones"
            subtitulo="No hay devoluciones en este estado" />
        } @else {
          <ul class="divide-y divide-slate-100">
            @for (d of devolucionesFiltradas(); track d.id) {
              <li class="px-5 py-4">
                <div class="flex items-start justify-between gap-3 flex-wrap">

                  <!-- Info principal -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap mb-1">
                      <span class="text-sm font-bold text-slate-800">
                        {{ d.pedido?.numero_pedido ?? d.pedido_id }}
                      </span>
                      <span class="text-xs px-2 py-0.5 rounded-full font-semibold {{ cfg(d.status).classes }}">
                        {{ cfg(d.status).label }}
                      </span>
                    </div>

                    @if (d.pedido?.cliente) {
                      <p class="text-xs text-slate-500">
                        <mat-icon class="!text-xs align-middle">person</mat-icon>
                        {{ d.pedido!.cliente!.razon_social }}
                      </p>
                    }

                    <p class="text-xs text-slate-400 mt-0.5">
                      Registrada: {{ d.created_at | date:'dd/MM/yyyy' }}
                      @if (d.mercancia_recibida_at) {
                        · Recibida: {{ d.mercancia_recibida_at | date:'dd/MM/yyyy' }}
                      }
                      @if (d.procesada_at) {
                        · Procesada: {{ d.procesada_at | date:'dd/MM/yyyy' }}
                      }
                    </p>

                    <!-- Items -->
                    <div class="mt-2 space-y-0.5">
                      @for (item of d.items_devueltos; track item.producto_id) {
                        <p class="text-xs text-slate-500 pl-1">
                          · <span class="font-medium">{{ item.cantidad }}u</span> — {{ item.motivo }}
                        </p>
                      }
                    </div>

                    @if (d.notas) {
                      <p class="text-xs text-slate-400 mt-1 italic">{{ d.notas }}</p>
                    }

                    @if (d.status === 'procesada' && d.reintegrar_stock !== undefined) {
                      <p class="text-xs mt-1"
                         [class]="d.reintegrar_stock ? 'text-emerald-600' : 'text-amber-600'">
                        <mat-icon class="!text-xs align-middle">
                          {{ d.reintegrar_stock ? 'inventory_2' : 'block' }}
                        </mat-icon>
                        {{ d.reintegrar_stock ? 'Stock reintegrado' : 'Sin reintegro de stock' }}
                      </p>
                    }
                  </div>

                  <!-- Crédito -->
                  <div class="text-right flex-shrink-0">
                    @if (d.monto_credito_usd) {
                      <p class="text-xs text-slate-500">Crédito</p>
                      <p class="text-sm font-bold text-primary">{{ bcv.formatUsd(d.monto_credito_usd) }}</p>
                    }
                  </div>
                </div>

                <!-- Acciones contextuales -->
                @if (d.status === 'pendiente') {
                  <div class="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                    <button mat-stroked-button color="primary" [disabled]="procesando()"
                            (click)="abrirRecibirDevolucion(d)">
                      <mat-icon>local_shipping</mat-icon>
                      Registrar recepción
                    </button>
                    <button mat-stroked-button color="warn" [disabled]="procesando()"
                            (click)="rechazar(d)">
                      <mat-icon>block</mat-icon>
                      Rechazar
                    </button>
                  </div>
                }

                @if (d.status === 'mercancia_recibida') {
                  <div class="mt-3 pt-3 border-t border-slate-100 flex gap-2 flex-wrap">
                    <button mat-flat-button color="primary" [disabled]="procesando()"
                            (click)="abrirProcesarDevolucion(d)">
                      <mat-icon>task_alt</mat-icon>
                      Procesar devolución
                    </button>
                  </div>
                }
              </li>
            }
          </ul>
        }
      </div>
    </div>
  `,
  imports: [
    DatePipe,
    MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule,
    EmptyStateComponent, LoadingSkeletonComponent,
  ],
})
export class DevolucionesComponent {
  private readonly svc    = inject(MockDataService);
  readonly bcv            = inject(TasaBcvService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  readonly filtros = FILTROS;
  readonly filtroActivo = signal<DevolucionStatus>('todas');
  readonly procesando = signal(false);

  readonly todas = toSignal(this.svc.getDevoluciones(), { initialValue: [] });
  readonly cargando = computed(() => this.todas().length === 0);

  readonly devolucionesFiltradas = computed(() => {
    const f = this.filtroActivo();
    if (f === 'todas') return this.todas();
    return this.todas().filter(d => d.status === f);
  });

  readonly pendientesCount  = computed(() => this.todas().filter(d => d.status === 'pendiente').length);
  readonly recibidasCount   = computed(() => this.todas().filter(d => d.status === 'mercancia_recibida').length);
  readonly creditoTotal     = computed(() =>
    this.todas().reduce((sum, d) => sum + (d.monto_credito_usd ?? 0), 0)
  );

  cfg(status: string) {
    return STATUS_CONFIG[status] ?? STATUS_CONFIG['pendiente'];
  }

  contarPorStatus(status: string): number {
    return this.todas().filter(d => d.status === status).length;
  }

  abrirRecibirDevolucion(devolucion: Devolucion): void {
    const ref = this.dialog.open(RecibirDevolucionDialogComponent, {
      width: '480px',
      data: { devolucion },
    });
    ref.afterClosed().subscribe((result: RecibirDevolucionDialogResult | null) => {
      if (!result) return;
      this.procesando.set(true);
      this.svc.recibirDevolucion(devolucion.id, result.notas).subscribe({
        next: () => {
          this.procesando.set(false);
          this.snack.open('Recepción registrada. La devolución pasa a "Mercancía recibida".', 'OK', { duration: 4000 });
        },
        error: () => {
          this.procesando.set(false);
          this.snack.open('Error al registrar la recepción', 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  abrirProcesarDevolucion(devolucion: Devolucion): void {
    const ref = this.dialog.open(ProcesarDevolucionDialogComponent, {
      width: '540px',
      data: { devolucion },
    });
    ref.afterClosed().subscribe((result: ProcesarDevolucionDialogResult | null) => {
      if (!result) return;
      this.procesando.set(true);
      this.svc.procesarDevolucion(devolucion.id, result.reintegrarStock).subscribe({
        next: () => {
          this.procesando.set(false);
          const msg = result.reintegrarStock
            ? 'Devolución procesada. Stock reintegrado al inventario.'
            : 'Devolución procesada. Sin reintegro de stock.';
          this.snack.open(msg, 'OK', { duration: 4000 });
        },
        error: () => {
          this.procesando.set(false);
          this.snack.open('Error al procesar la devolución', 'Cerrar', { duration: 3000 });
        },
      });
    });
  }

  rechazar(devolucion: Devolucion): void {
    if (!confirm('¿Confirmar rechazo de esta devolución?')) return;
    this.procesando.set(true);
    this.svc.rechazarDevolucion(devolucion.id).subscribe({
      next: () => {
        this.procesando.set(false);
        this.snack.open('Devolución rechazada', 'OK', { duration: 3000 });
      },
      error: () => {
        this.procesando.set(false);
        this.snack.open('Error al rechazar la devolución', 'Cerrar', { duration: 3000 });
      },
    });
  }
}
