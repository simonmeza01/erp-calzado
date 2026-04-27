import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { LoteFabricacion } from '../../core/models';

export interface CompletarLoteDialogData {
  lote: LoteFabricacion;
}

export interface CompletarLoteDialogResult {
  productoId: string;
  cantidadProducida: number;
}

@Component({
  selector: 'app-completar-lote-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Completar lote de fabricación</h2>
    <mat-dialog-content class="!pt-2 space-y-4">

      <div class="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
        <p class="font-medium text-slate-700 capitalize">
          Lote {{ data.lote.tipo.toUpperCase() }} — {{ data.lote.cantidad_planificada }} unidades planificadas
        </p>
        <p class="text-xs text-slate-400 mt-0.5">
          Al completar, las unidades producidas se cargarán automáticamente al inventario del producto seleccionado.
        </p>
      </div>

      <!-- Selector de producto destino -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Producto destino *</mat-label>
        <mat-select [(ngModel)]="productoId">
          @for (p of productosActivos(); track p.id) {
            <mat-option [value]="p.id">
              <span class="font-medium">{{ p.sku }}</span>
              <span class="text-slate-500 text-xs ml-2">{{ p.nombre }}</span>
              <span class="text-slate-400 text-xs ml-1">(stock actual: {{ p.stock_actual }})</span>
            </mat-option>
          }
        </mat-select>
      </mat-form-field>

      <!-- Cantidad producida -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Cantidad producida *</mat-label>
        <input matInput type="number" min="1" [max]="data.lote.cantidad_planificada"
               [(ngModel)]="cantidadProducida" />
        <mat-hint>Máximo: {{ data.lote.cantidad_planificada }} unidades planificadas</mat-hint>
      </mat-form-field>

      <!-- Preview del resultado -->
      @if (productoSeleccionado()) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-1">
            <mat-icon class="text-emerald-600 !text-base">inventory_2</mat-icon>
            <p class="text-sm font-semibold text-emerald-800">Impacto en inventario</p>
          </div>
          <p class="text-sm text-emerald-700">
            <span class="font-medium">{{ productoSeleccionado()!.sku }}</span>:
            {{ productoSeleccionado()!.stock_actual }} → {{ productoSeleccionado()!.stock_actual + (cantidadProducida || 0) }} unidades
          </p>
          <p class="text-xs text-emerald-600 mt-0.5">
            +{{ cantidadProducida || 0 }} unidades se agregarán al inventario
          </p>
        </div>
      }

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="!productoId || !cantidadProducida || cantidadProducida < 1"
              (click)="confirmar()">
        <mat-icon>check_circle</mat-icon>
        Completar lote
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule,
  ],
})
export class CompletarLoteDialogComponent {
  readonly data = inject<CompletarLoteDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<CompletarLoteDialogComponent>);
  private readonly svc = inject(MockDataService);

  readonly productos = toSignal(this.svc.getProductos(), { initialValue: [] });
  readonly productosActivos = computed(() => this.productos().filter(p => p.activo));

  productoId = this.data.lote.producto_id ?? '';
  cantidadProducida = this.data.lote.cantidad_producida || this.data.lote.cantidad_planificada;

  readonly productoSeleccionado = computed(() =>
    this.productosActivos().find(p => p.id === this.productoId) ?? null
  );

  confirmar(): void {
    if (!this.productoId || !this.cantidadProducida || this.cantidadProducida < 1) return;
    this.ref.close({ productoId: this.productoId, cantidadProducida: this.cantidadProducida } satisfies CompletarLoteDialogResult);
  }
}
