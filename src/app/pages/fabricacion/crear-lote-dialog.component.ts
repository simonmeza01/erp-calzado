import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';

@Component({
  selector: 'app-crear-lote-dialog',
  template: `
    <h2 mat-dialog-title class="!text-slate-800">Crear lote de fabricación</h2>
    <mat-dialog-content class="!pt-2 space-y-3">

      <div class="flex gap-3">
        <button class="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors cursor-pointer
                       {{ tipo() === 'botas' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-500' }}"
                (click)="tipo.set('botas')">
          🥾 Botas
        </button>
        <button class="flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-colors cursor-pointer
                       {{ tipo() === 'pvc' ? 'border-primary bg-blue-50 text-primary' : 'border-slate-200 text-slate-500' }}"
                (click)="tipo.set('pvc')">
          🟡 PVC
        </button>
      </div>

      <!-- Producto destino (opcional al crear, requerido al completar) -->
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Producto destino (opcional)</mat-label>
        <mat-select [(ngModel)]="productoId">
          <mat-option value="">Sin asignar</mat-option>
          @for (p of productosActivos(); track p.id) {
            <mat-option [value]="p.id">
              <span class="font-medium">{{ p.sku }}</span>
              <span class="text-slate-500 text-xs ml-2">{{ p.nombre }}</span>
            </mat-option>
          }
        </mat-select>
        <mat-hint>Puede asignarse al completar el lote</mat-hint>
      </mat-form-field>

      <div class="grid grid-cols-2 gap-3">
        <mat-form-field appearance="outline">
          <mat-label>Fecha inicio</mat-label>
          <input matInput type="date" [(ngModel)]="fechaInicio" [max]="fechaFin || ''" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Fecha fin</mat-label>
          <input matInput type="date" [(ngModel)]="fechaFin" [min]="fechaInicio || ''" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Cantidad planificada *</mat-label>
        <input matInput type="number" min="1" [(ngModel)]="cantidad" placeholder="Ej: 400" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Notas</mat-label>
        <textarea matInput [(ngModel)]="notas" rows="2" placeholder="Descripción del lote…"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary"
              [disabled]="!cantidad || cantidad < 1"
              (click)="confirmar()">
        Crear lote
      </button>
    </mat-dialog-actions>
  `,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
})
export class CrearLoteDialogComponent {
  private readonly ref = inject(MatDialogRef<CrearLoteDialogComponent>);
  private readonly svc = inject(MockDataService);

  readonly productos = toSignal(this.svc.getProductos(), { initialValue: [] });
  readonly productosActivos = computed(() => this.productos().filter(p => p.activo));

  tipo       = signal<'botas' | 'pvc'>('botas');
  productoId = '';
  fechaInicio = '';
  fechaFin    = '';
  cantidad    = 0;
  notas       = '';

  confirmar(): void {
    if (!this.cantidad || this.cantidad < 1) return;
    this.ref.close({
      tipo: this.tipo(),
      producto_id: this.productoId || undefined,
      fecha_inicio: this.fechaInicio || undefined,
      fecha_fin: this.fechaFin || undefined,
      cantidad_planificada: this.cantidad,
      notas: this.notas || undefined,
    });
  }
}
