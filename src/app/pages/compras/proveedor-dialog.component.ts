import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Proveedor } from '../../core/models';

@Component({
  selector: 'app-proveedor-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">{{ data?.id ? 'Editar' : 'Nuevo' }} proveedor</h2>
    <mat-dialog-content class="!pt-2 space-y-3">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Nombre *</mat-label>
        <input matInput [(ngModel)]="nombre" placeholder="Ej: Curtiembre El Rodeo C.A." />
      </mat-form-field>
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>RIF</mat-label>
        <input matInput [(ngModel)]="rif" placeholder="J-20123456-1" />
      </mat-form-field>
      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput [(ngModel)]="telefono" placeholder="0241-8123456" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput [(ngModel)]="email" type="email" />
        </mat-form-field>
      </div>
      <div class="flex items-center gap-3">
        <mat-slide-toggle [(ngModel)]="activo" color="primary">Proveedor activo</mat-slide-toggle>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="!nombre.trim()"
              [mat-dialog-close]="{ nombre, rif, telefono, email, activo }">
        {{ data?.id ? 'Guardar' : 'Crear' }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule],
})
export class ProveedorDialogComponent {
  readonly data = inject<Partial<Proveedor> | null>(MAT_DIALOG_DATA);
  nombre   = this.data?.nombre   ?? '';
  rif      = this.data?.rif      ?? '';
  telefono = this.data?.telefono ?? '';
  email    = this.data?.email    ?? '';
  activo   = this.data?.activo   ?? true;
}
