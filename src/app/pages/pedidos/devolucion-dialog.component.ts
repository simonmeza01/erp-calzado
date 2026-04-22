import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { signal } from '@angular/core';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { Pedido } from '../../core/models';

export interface DevolucionDialogData {
  pedido: Pedido & { items?: any[] };
}

@Component({
  selector: 'app-devolucion-dialog',
  template: `
    <h2 mat-dialog-title>Registrar devolución</h2>
    <p class="px-6 -mt-2 text-sm text-slate-500">{{ data.pedido.numero_pedido }}</p>

    <mat-dialog-content class="!pt-3 space-y-3">
      <form [formGroup]="form" class="space-y-3">

        <!-- Items devueltos (simplificado) -->
        <div>
          <p class="text-sm font-medium text-slate-600 mb-2">Productos a devolver</p>
          @for (item of data.pedido.items ?? []; track item.id) {
            <div class="flex items-center gap-3 py-2 border-b border-slate-100">
              <mat-checkbox [checked]="isSelected(item.producto_id)"
                            (change)="toggleItem(item.producto_id)">
              </mat-checkbox>
              <span class="flex-1 text-sm text-slate-700">{{ item.producto?.nombre }}</span>
              @if (isSelected(item.producto_id)) {
                <mat-form-field appearance="outline" class="w-24 !text-xs">
                  <mat-label>Cant.</mat-label>
                  <input matInput type="number" min="1" [max]="item.cantidad"
                         [(ngModel)]="cantidades[item.producto_id]"
                         [ngModelOptions]="{standalone: true}" />
                </mat-form-field>
              }
            </div>
          }
          @if (!(data.pedido.items ?? []).length) {
            <p class="text-sm text-slate-400 text-center py-4">Sin productos en este pedido</p>
          }
        </div>

        <!-- Motivo -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Motivo de devolución</mat-label>
          <textarea matInput formControlName="motivo" rows="2"
                    placeholder="Ej: Talla incorrecta, producto dañado…"></textarea>
        </mat-form-field>

        <!-- Crédito -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Monto crédito USD (opcional)</mat-label>
          <span matPrefix>$&nbsp;</span>
          <input matInput type="number" formControlName="monto_credito_usd" min="0" step="0.01" />
        </mat-form-field>

        <!-- Notas -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notas adicionales</mat-label>
          <textarea matInput formControlName="notas" rows="2"></textarea>
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="warn" (click)="guardar()" [disabled]="form.invalid || guardando()">
        {{ guardando() ? 'Guardando…' : 'Registrar devolución' }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    ReactiveFormsModule, FormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatCheckboxModule,
  ],
})
export class DevolucionDialogComponent {
  private readonly svc = inject(MockDataService);
  private readonly auth = inject(AuthMockService);
  private readonly ref  = inject(MatDialogRef<DevolucionDialogComponent>);
  readonly data = inject<DevolucionDialogData>(MAT_DIALOG_DATA);

  readonly guardando = signal(false);
  selectedItems = new Set<string>();
  cantidades: Record<string, number> = {};

  readonly form = inject(FormBuilder).nonNullable.group({
    motivo:           ['', Validators.required],
    monto_credito_usd: [0],
    notas:            [''],
  });

  isSelected(productoId: string): boolean { return this.selectedItems.has(productoId); }

  toggleItem(productoId: string): void {
    if (this.selectedItems.has(productoId)) {
      this.selectedItems.delete(productoId);
    } else {
      this.selectedItems.add(productoId);
      if (!this.cantidades[productoId]) this.cantidades[productoId] = 1;
    }
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    const items_devueltos = [...this.selectedItems].map(pid => ({
      producto_id: pid,
      cantidad: this.cantidades[pid] ?? 1,
      motivo: v.motivo,
    }));

    this.guardando.set(true);
    this.svc.crearDevolucion({
      pedido_id:       this.data.pedido.id,
      cliente_id:      this.data.pedido.cliente_id,
      items_devueltos,
      monto_credito_usd: v.monto_credito_usd || undefined,
      notas:           v.notas || undefined,
    }).subscribe(dev => {
      this.guardando.set(false);
      this.ref.close(dev);
    });
  }
}
