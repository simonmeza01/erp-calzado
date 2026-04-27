import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { Devolucion } from '../../core/models';

export interface ProcesarDevolucionDialogData {
  devolucion: Devolucion;
}

export interface ProcesarDevolucionDialogResult {
  reintegrarStock: boolean;
}

@Component({
  selector: 'app-procesar-devolucion-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Procesar devolución</h2>
    <mat-dialog-content class="!pt-2 space-y-4">

      <!-- Resumen -->
      <div class="bg-slate-50 rounded-lg p-3 space-y-1">
        <p class="text-sm font-semibold text-slate-700">Devolución {{ data.devolucion.pedido_id }}</p>
        <p class="text-xs text-slate-500">
          Solicitud: {{ data.devolucion.created_at | date:'dd/MM/yyyy' }}
        </p>
        @if (data.devolucion.mercancia_recibida_at) {
          <p class="text-xs text-slate-500">
            Recepción: {{ data.devolucion.mercancia_recibida_at | date:'dd/MM/yyyy' }}
          </p>
        }
        @if (data.devolucion.monto_credito_usd) {
          <p class="text-xs text-slate-500">
            Crédito: <span class="font-medium text-slate-700">USD {{ data.devolucion.monto_credito_usd | number:'1.2-2' }}</span>
          </p>
        }
      </div>

      <!-- Opción de reintegro de stock -->
      <div class="border border-slate-200 rounded-lg p-3">
        <mat-checkbox [(ngModel)]="reintegrarStock" color="primary">
          <span class="text-sm font-medium text-slate-700">Reintegrar productos al inventario</span>
        </mat-checkbox>
        <p class="text-xs text-slate-400 mt-1 ml-6">
          Si los productos están en condición de ser revendidos, activa esta opción para que se sumen automáticamente al stock.
        </p>
      </div>

      <!-- Preview de impacto en inventario -->
      @if (reintegrarStock) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-2">
            <mat-icon class="text-emerald-600 !text-base">inventory_2</mat-icon>
            <p class="text-sm font-semibold text-emerald-800">Impacto en inventario</p>
          </div>
          <div class="space-y-1">
            @for (item of itemsConStock(); track item.productoId) {
              <div class="flex items-center justify-between text-xs">
                <span class="text-emerald-700">{{ item.sku }} — {{ item.nombre }}</span>
                <span class="font-semibold text-emerald-800">
                  {{ item.stockActual }} → {{ item.stockActual + item.cantidad }} u.
                  <span class="text-emerald-600">(+{{ item.cantidad }})</span>
                </span>
              </div>
            }
            @for (item of itemsSinProducto(); track item.productoId) {
              <div class="flex items-center justify-between text-xs">
                <span class="text-amber-600">{{ item.productoId }} (producto no encontrado)</span>
                <span class="text-amber-600">+{{ item.cantidad }} u. (no se aplicará)</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div class="flex items-center gap-2">
            <mat-icon class="text-amber-600 !text-base">warning_amber</mat-icon>
            <p class="text-sm text-amber-700">
              Los productos <strong>no se reintegrarán</strong> al inventario. Solo se registrará el crédito.
            </p>
          </div>
        </div>
      }

      <!-- Items devueltos -->
      <div class="space-y-1">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Ítems de la devolución</p>
        @for (item of data.devolucion.items_devueltos; track item.producto_id) {
          <div class="flex items-start gap-2 py-1.5 border-b border-slate-100">
            <mat-icon class="text-slate-400 !text-sm mt-0.5">inventory_2</mat-icon>
            <div class="flex-1">
              <p class="text-sm text-slate-700">{{ item.producto_id }}</p>
              <p class="text-xs text-slate-400">{{ item.motivo }}</p>
            </div>
            <span class="text-sm font-semibold text-slate-800">{{ item.cantidad }} u.</span>
          </div>
        }
      </div>

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()">
        <mat-icon>task_alt</mat-icon>
        Confirmar procesamiento
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    FormsModule, DatePipe, DecimalPipe, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatIconModule, MatCheckboxModule,
  ],
})
export class ProcesarDevolucionDialogComponent {
  readonly data = inject<ProcesarDevolucionDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ProcesarDevolucionDialogComponent>);
  private readonly svc = inject(MockDataService);

  readonly productos = toSignal(this.svc.getProductos(), { initialValue: [] });
  reintegrarStock = true;

  readonly itemsConStock = computed(() =>
    this.data.devolucion.items_devueltos
      .map(item => {
        const p = this.productos().find(x => x.id === item.producto_id);
        return p ? { productoId: item.producto_id, sku: p.sku, nombre: p.nombre, stockActual: p.stock_actual, cantidad: item.cantidad } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  );

  readonly itemsSinProducto = computed(() =>
    this.data.devolucion.items_devueltos
      .filter(item => !this.productos().find(x => x.id === item.producto_id))
      .map(item => ({ productoId: item.producto_id, cantidad: item.cantidad }))
  );

  confirmar(): void {
    this.ref.close({ reintegrarStock: this.reintegrarStock } satisfies ProcesarDevolucionDialogResult);
  }
}
