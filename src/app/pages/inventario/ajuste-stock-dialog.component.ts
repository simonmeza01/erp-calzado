import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-ajuste-stock-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Ajuste manual de stock</h2>
    <mat-dialog-content class="!pt-2">
      <p class="text-sm text-slate-600 mb-4">
        <span class="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">{{ producto.sku }}</span>
        {{ producto.nombre }}
      </p>
      <p class="text-sm text-slate-500 mb-4">
        Stock actual: <strong class="text-slate-800">{{ producto.stock_actual }}</strong> unidades
      </p>

      <div class="flex gap-3 mb-4">
        <button class="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                       {{ tipo() === 'entrada' ? 'bg-emerald-500 text-white border-emerald-500' : 'text-slate-600 border-slate-300 hover:border-emerald-400' }}"
                (click)="tipo.set('entrada')">
          <mat-icon class="!text-sm mr-1 align-middle">add</mat-icon> Entrada
        </button>
        <button class="flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer
                       {{ tipo() === 'salida' ? 'bg-red-500 text-white border-red-500' : 'text-slate-600 border-slate-300 hover:border-red-400' }}"
                (click)="tipo.set('salida')">
          <mat-icon class="!text-sm mr-1 align-middle">remove</mat-icon> Salida
        </button>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Cantidad</mat-label>
        <input matInput type="number" min="1" [(ngModel)]="cantidad" placeholder="0" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full mt-2">
        <mat-label>Motivo / notas *</mat-label>
        <textarea matInput [(ngModel)]="notas" rows="2" placeholder="Ej: Producto dañado, conteo físico…"></textarea>
      </mat-form-field>

      <div class="mt-1 p-3 rounded-lg {{ tipo() === 'entrada' ? 'bg-emerald-50' : 'bg-red-50' }}">
        <p class="text-xs {{ tipo() === 'entrada' ? 'text-emerald-700' : 'text-red-700' }}">
          Nuevo stock: <strong>{{ nuevoStock() }}</strong> unidades
        </p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button [color]="tipo() === 'entrada' ? 'primary' : 'warn'"
              [disabled]="!cantidad || cantidad < 1 || !notas.trim()"
              [mat-dialog-close]="resultado()">
        Guardar ajuste
      </button>
    </mat-dialog-actions>
  `,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
})
export class AjusteStockDialogComponent {
  readonly producto = inject<Producto>(MAT_DIALOG_DATA);
  tipo    = signal<'entrada' | 'salida'>('entrada');
  cantidad = 0;
  notas    = '';

  readonly nuevoStock = computed(() => {
    const q = this.tipo() === 'entrada' ? this.cantidad : -this.cantidad;
    return Math.max(0, this.producto.stock_actual + (q || 0));
  });

  readonly resultado = computed(() => ({
    cantidad: this.tipo() === 'entrada' ? this.cantidad : -this.cantidad,
    notas: this.notas,
  }));
}
