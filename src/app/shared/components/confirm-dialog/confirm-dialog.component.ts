import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  titulo: string;
  mensaje: string;
  confirmar?: string;
  color?: 'primary' | 'warn' | 'accent';
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">{{ data.titulo }}</h2>
    <mat-dialog-content class="!text-slate-600">{{ data.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button [color]="data.color ?? 'primary'" [mat-dialog-close]="true">
        {{ data.confirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [MatDialogModule, MatButtonModule],
})
export class ConfirmDialogComponent {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
