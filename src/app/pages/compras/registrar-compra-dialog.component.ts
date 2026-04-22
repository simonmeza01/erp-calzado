import { Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Material, Proveedor } from '../../core/models';

export interface RegistrarCompraDialogData {
  materiales: Material[];
  proveedores: Proveedor[];
  materialId?: string;
}

@Component({
  selector: 'app-registrar-compra-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Registrar compra de material</h2>
    <mat-dialog-content class="!pt-2 space-y-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Material *</mat-label>
        <mat-select [(ngModel)]="materialId">
          @for (m of data.materiales; track m.id) {
            <mat-option [value]="m.id">{{ m.nombre }} ({{ m.unidad }})</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Proveedor *</mat-label>
        <mat-select [(ngModel)]="proveedorId">
          @for (p of proveedoresActivos(); track p.id) {
            <mat-option [value]="p.id">{{ p.nombre }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Fecha</mat-label>
        <input matInput type="date" [(ngModel)]="fecha" />
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Cantidad *</mat-label>
          <input matInput type="number" min="0.01" step="0.01" [(ngModel)]="cantidad" />
          @if (materialSeleccionado()) {
            <span matSuffix class="text-slate-400 text-xs">{{ materialSeleccionado()!.unidad }}</span>
          }
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio total USD *</mat-label>
          <span matPrefix class="text-slate-400 mr-1">$</span>
          <input matInput type="number" min="0" step="0.01" [(ngModel)]="precioTotal" />
        </mat-form-field>
      </div>

      @if (cantidad > 0 && precioTotal > 0) {
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          Costo unitario: <strong>$ {{ (precioTotal / cantidad) | number:'1.2-2' }}</strong> / {{ materialSeleccionado()?.unidad ?? 'unid.' }}
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="!materialId || !proveedorId || !cantidad || !precioTotal"
              [mat-dialog-close]="{ materialId, proveedorId, cantidad, precioTotal, fecha }">
        Registrar compra
      </button>
    </mat-dialog-actions>
  `,
  imports: [DecimalPipe, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
})
export class RegistrarCompraDialogComponent {
  readonly data = inject<RegistrarCompraDialogData>(MAT_DIALOG_DATA);

  materialId  = this.data.materialId ?? '';
  proveedorId = '';
  cantidad    = 0;
  precioTotal = 0;
  fecha       = new Date().toISOString().slice(0, 10);

  readonly proveedoresActivos = computed(() => this.data.proveedores.filter(p => p.activo));
  readonly materialSeleccionado = computed(() => this.data.materiales.find(m => m.id === this.materialId));
}
