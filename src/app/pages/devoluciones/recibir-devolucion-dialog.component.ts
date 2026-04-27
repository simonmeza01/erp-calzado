import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { Devolucion } from '../../core/models';

export interface RecibirDevolucionDialogData {
  devolucion: Devolucion;
}

export interface RecibirDevolucionDialogResult {
  notas?: string;
}

@Component({
  selector: 'app-recibir-devolucion-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Registrar recepción de mercancía</h2>
    <mat-dialog-content class="!pt-2 space-y-4">

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex items-center gap-2 mb-1">
          <mat-icon class="text-blue-600 !text-base">assignment_return</mat-icon>
          <p class="text-sm font-semibold text-blue-800">Devolución {{ data.devolucion.pedido_id }}</p>
        </div>
        <p class="text-xs text-blue-600">
          Solicitud registrada el {{ data.devolucion.created_at | date:'dd/MM/yyyy' }}
        </p>
        <p class="text-xs text-blue-600 mt-0.5">
          {{ data.devolucion.items_devueltos.length }} ítem(s) a recibir
        </p>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">Ítems devueltos</p>
        @for (item of data.devolucion.items_devueltos; track item.producto_id) {
          <div class="flex items-center gap-2 py-1.5 border-b border-slate-100">
            <mat-icon class="text-slate-400 !text-sm">inventory_2</mat-icon>
            <span class="text-sm text-slate-700 flex-1">{{ item.producto_id }}</span>
            <span class="text-sm font-semibold text-slate-800">{{ item.cantidad }} u.</span>
          </div>
        }
      </div>

      <div class="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
        <mat-icon class="!text-xs align-middle text-slate-400">calendar_today</mat-icon>
        Fecha de recepción: <span class="font-medium text-slate-700">{{ hoy }}</span>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Notas sobre el estado de la mercancía</mat-label>
        <textarea matInput [(ngModel)]="notas" rows="3"
                  placeholder="Ej: Mercancía en buen estado, empaque dañado…"></textarea>
      </mat-form-field>

    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="confirmar()">
        <mat-icon>check</mat-icon>
        Confirmar recepción
      </button>
    </mat-dialog-actions>
  `,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, DatePipe],
})
export class RecibirDevolucionDialogComponent {
  readonly data = inject<RecibirDevolucionDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<RecibirDevolucionDialogComponent>);

  notas = '';
  readonly hoy = new Date().toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  confirmar(): void {
    this.ref.close({ notas: this.notas || undefined } satisfies RecibirDevolucionDialogResult);
  }
}
