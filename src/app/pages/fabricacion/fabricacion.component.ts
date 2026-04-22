import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrearLoteDialogComponent } from './crear-lote-dialog.component';
import { LoteFabricacion } from '../../core/models';

const STATUS_CFG = {
  planificado:  { label: 'Planificado',  classes: 'bg-slate-100 text-slate-600' },
  en_proceso:   { label: 'En proceso',   classes: 'bg-blue-100 text-blue-700' },
  completado:   { label: 'Completado',   classes: 'bg-emerald-100 text-emerald-700' },
};

// Producto_id por defecto para asociar lote al completar (primero activo)
const PRODUCTO_DEFAULT = 'p1';

@Component({
  selector: 'app-fabricacion',
  template: `
    <div class="space-y-4">

      <!-- Card alerta stock de seguridad -->
      @if (productosEnRiesgo().length) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="flex items-center gap-2 mb-2">
            <mat-icon class="text-amber-600">warning_amber</mat-icon>
            <p class="font-semibold text-amber-800">{{ productosEnRiesgo().length }} producto(s) bajo stock mínimo</p>
          </div>
          <div class="flex flex-wrap gap-2">
            @for (p of productosEnRiesgo(); track p.id) {
              <a routerLink="/inventario"
                 class="text-xs px-2 py-1 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
                {{ p.sku }} — {{ p.stock_actual }}/{{ p.stock_minimo }}
              </a>
            }
          </div>
        </div>
      }

      <!-- Header con botón crear -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Lotes de fabricación</h2>
          <p class="text-xs text-slate-500">{{ lotes().length }} lotes registrados</p>
        </div>
        @if (auth.esAdmin()) {
          <button mat-flat-button color="primary" (click)="abrirCrearLote()">
            <mat-icon>add</mat-icon> Nuevo lote
          </button>
        }
      </div>

      <!-- Lista de lotes -->
      <div class="space-y-3">
        @if (!lotes().length) {
          <app-loading-skeleton [count]="3" class="block" />
        } @else {
          @for (l of lotes(); track l.id) {
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div class="flex items-start justify-between gap-4 flex-wrap">
                <!-- Info lote -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <span class="text-base font-bold text-slate-800 capitalize">
                      {{ l.tipo === 'botas' ? '🥾' : '🟡' }} Lote {{ l.tipo.toUpperCase() }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-semibold {{ cfg(l.status).classes }}">
                      {{ cfg(l.status).label }}
                    </span>
                  </div>

                  @if (l.fecha_inicio) {
                    <p class="text-xs text-slate-400">
                      {{ l.fecha_inicio | date:'dd/MM/yyyy' }}
                      @if (l.fecha_fin) { → {{ l.fecha_fin | date:'dd/MM/yyyy' }} }
                    </p>
                  }
                  @if (l.notas) {
                    <p class="text-xs text-slate-500 mt-1">{{ l.notas }}</p>
                  }
                </div>

                <!-- Progreso -->
                <div class="text-right flex-shrink-0 min-w-36">
                  <p class="text-lg font-bold text-slate-800">
                    {{ l.cantidad_producida }} <span class="text-sm font-normal text-slate-400">/ {{ l.cantidad_planificada }}</span>
                  </p>
                  <p class="text-xs text-slate-400 mb-1">producidas / planificadas</p>
                  <div class="w-full h-2 bg-slate-100 rounded-full">
                    <div class="h-2 rounded-full transition-all
                                {{ l.status === 'completado' ? 'bg-emerald-500' : 'bg-primary' }}"
                         [style.width.%]="l.cantidad_planificada ? (l.cantidad_producida / l.cantidad_planificada * 100) : 0">
                    </div>
                  </div>
                  <p class="text-xs text-slate-400 mt-0.5">
                    {{ l.cantidad_planificada ? ((l.cantidad_producida / l.cantidad_planificada * 100) | number:'1.0-0') : 0 }}%
                  </p>
                </div>
              </div>

              <!-- Acciones según status (solo admin) -->
              @if (auth.esAdmin() && l.status !== 'completado') {
                <div class="mt-4 pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                  @if (l.status === 'planificado') {
                    <button mat-flat-button color="primary" (click)="iniciarProduccion(l)">
                      <mat-icon>play_arrow</mat-icon> Iniciar producción
                    </button>
                  }

                  @if (l.status === 'en_proceso') {
                    <!-- Input cantidad producida -->
                    <div class="flex items-center gap-2">
                      <mat-form-field appearance="outline" class="!w-36">
                        <mat-label>Producidas</mat-label>
                        <input matInput type="number" min="0" [max]="l.cantidad_planificada"
                               [value]="cantidadProducidaInput[l.id] ?? l.cantidad_producida"
                               (change)="setCantidad(l.id, $event)" />
                      </mat-form-field>
                      <button mat-stroked-button (click)="actualizarCantidad(l)">
                        <mat-icon>update</mat-icon> Actualizar
                      </button>
                    </div>
                    <button mat-flat-button color="accent" class="!bg-emerald-500" (click)="completarLote(l)">
                      <mat-icon>check_circle</mat-icon> Completar lote
                    </button>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  imports: [
    DatePipe, DecimalPipe, FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatDialogModule, MatSnackBarModule,
    MatFormFieldModule, MatInputModule,
    LoadingSkeletonComponent,
  ],
})
export class FabricacionComponent {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  readonly lotes    = toSignal(this.svc.getLotesFabricacion(), { initialValue: [] });
  readonly productos = toSignal(this.svc.getProductos(), { initialValue: [] });

  readonly productosEnRiesgo = computed(() =>
    this.productos().filter(p => p.stock_actual > 0 && p.stock_actual <= p.stock_minimo)
  );

  // Track valores del input de cantidad producida por lote
  cantidadProducidaInput: Record<string, number | undefined> = {};

  cfg(s: string) { return STATUS_CFG[s as keyof typeof STATUS_CFG] ?? STATUS_CFG.planificado; }

  setCantidad(loteId: string, event: Event) {
    const val = parseInt((event.target as HTMLInputElement).value, 10);
    if (!isNaN(val)) this.cantidadProducidaInput[loteId] = val;
  }

  abrirCrearLote() {
    const ref = this.dialog.open(CrearLoteDialogComponent, { width: '480px' });
    ref.afterClosed().subscribe((data) => {
      if (!data) return;
      this.svc.crearLote(data).subscribe({
        next: () => this.snack.open('Lote creado exitosamente', 'OK', { duration: 3000 }),
        error: () => this.snack.open('Error al crear lote', 'Cerrar', { duration: 3000 }),
      });
    });
  }

  iniciarProduccion(lote: LoteFabricacion) {
    this.svc.actualizarLote(lote.id, { status: 'en_proceso' }).subscribe({
      next: () => this.snack.open('Producción iniciada', 'OK', { duration: 3000 }),
      error: () => this.snack.open('Error al actualizar lote', 'Cerrar', { duration: 3000 }),
    });
  }

  actualizarCantidad(lote: LoteFabricacion) {
    const cantidad = this.cantidadProducidaInput[lote.id] ?? lote.cantidad_producida;
    this.svc.actualizarLote(lote.id, { cantidad_producida: cantidad }).subscribe({
      next: () => this.snack.open(`Cantidad actualizada: ${cantidad} unidades`, 'OK', { duration: 3000 }),
      error: () => this.snack.open('Error al actualizar', 'Cerrar', { duration: 3000 }),
    });
  }

  completarLote(lote: LoteFabricacion) {
    const cantidad = this.cantidadProducidaInput[lote.id] ?? lote.cantidad_producida;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        titulo: '¿Completar lote?',
        mensaje: `Se registrarán ${cantidad} unidades al inventario del producto asociado a este lote.`,
        confirmar: 'Completar',
      },
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.svc.completarLote(lote.id, cantidad, PRODUCTO_DEFAULT).subscribe({
        next: () => this.snack.open(`Lote completado. +${cantidad} unidades al inventario.`, 'OK', { duration: 4000 }),
        error: () => this.snack.open('Error al completar lote', 'Cerrar', { duration: 3000 }),
      });
    });
  }
}
