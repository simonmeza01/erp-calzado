import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Pedido } from '../../../core/models';

export interface BloqueoClienteData {
  clienteNombre: string;
  diasSinAbono: number;
  pedidosPendientes: Pedido[];
}

@Component({
  selector: 'app-bloqueo-cliente-dialog',
  template: `
    <div class="p-6 max-w-lg">

      <!-- Ícono y título -->
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <mat-icon class="text-red-600 !text-2xl">block</mat-icon>
        </div>
        <div>
          <h2 class="text-lg font-bold text-slate-800">Cliente con pagos vencidos</h2>
          <p class="text-sm text-slate-500">{{ data.clienteNombre }}</p>
        </div>
      </div>

      <!-- Alerta principal -->
      <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
        <p class="text-sm font-semibold text-red-700">
          Este cliente tiene <strong>{{ data.diasSinAbono }} días</strong> sin realizar un abono en cuentas pendientes.
        </p>
        <p class="text-xs text-red-500 mt-1">
          No se pueden registrar nuevos pedidos hasta que se regularice el pago.
        </p>
      </div>

      <!-- Pedidos con mora -->
      <div class="bg-white border border-slate-200 rounded-xl overflow-hidden mb-5">
        <div class="px-4 py-2 bg-slate-50 border-b border-slate-200">
          <p class="text-xs font-semibold text-slate-500 uppercase">Pedidos con deuda vencida (+60 días)</p>
        </div>
        <ul class="divide-y divide-slate-100">
          @for (p of data.pedidosPendientes; track p.id) {
            <li class="px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <p class="font-mono text-xs font-semibold text-slate-700">{{ p.numero_pedido }}</p>
                <p class="text-xs text-slate-400">Creado: {{ p.created_at | date:'dd/MM/yyyy' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-red-600">
                  USD {{ (p.saldo_pendiente_usd ?? 0).toFixed(2) }}
                </p>
                <p class="text-xs text-slate-400">pendiente</p>
              </div>
            </li>
          }
        </ul>
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3">
        <button mat-stroked-button color="warn" (click)="ref.close(false)">
          Cancelar pedido
        </button>
      </div>
    </div>
  `,
  imports: [DatePipe, MatDialogModule, MatButtonModule, MatIconModule],
})
export class BloqueoClienteDialogComponent {
  readonly data = inject<BloqueoClienteData>(MAT_DIALOG_DATA);
  readonly ref  = inject(MatDialogRef<BloqueoClienteDialogComponent>);
}
