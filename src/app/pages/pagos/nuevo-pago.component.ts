import { Component, inject, signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { Pago } from '../../core/models';

const BANCOS = ['BDV', 'Banesco', 'Mercantil', 'Provincial', 'Bicentenario', 'BNC'];

@Component({
  selector: 'app-nuevo-pago',
  template: `
    <div class="max-w-lg mx-auto space-y-5">

      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 class="text-base font-semibold text-slate-800 mb-5">Registrar pago</h3>

        <form (ngSubmit)="registrar()" #f="ngForm" class="space-y-4">

          <!-- Pedido -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Pedido</mat-label>
            <mat-select [(ngModel)]="form.pedido_id" name="pedido" required>
              @for (p of pedidosActivos(); track p.id) {
                <mat-option [value]="p.id">
                  {{ p.numero_pedido }} — {{ p.cliente?.razon_social }}
                  (Saldo: {{ bcv.formatUsd(p.saldo_pendiente_usd ?? p.total_usd) }})
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Tipo de pago -->
          <div>
            <p class="text-sm font-medium text-slate-600 mb-2">Tipo de pago</p>
            <mat-radio-group [(ngModel)]="form.tipo" name="tipo" class="flex gap-4">
              <mat-radio-button value="abono">Abono</mat-radio-button>
              <mat-radio-button value="completo">Pago completo</mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Moneda -->
          <div>
            <p class="text-sm font-medium text-slate-600 mb-2">Moneda</p>
            <mat-radio-group [(ngModel)]="form.moneda" name="moneda" class="flex gap-4">
              <mat-radio-button value="usd">USD</mat-radio-button>
              <mat-radio-button value="bs">Bolívares</mat-radio-button>
            </mat-radio-group>
          </div>

          <!-- Monto -->
          @if (form.moneda === 'usd') {
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Monto (USD)</mat-label>
              <input matInput type="number" [(ngModel)]="form.monto_usd" name="monto_usd"
                     required min="0.01" step="0.01" />
              <span matPrefix class="mr-1">$&nbsp;</span>
            </mat-form-field>
          } @else {
            <div class="flex gap-3">
              <mat-form-field appearance="outline" class="flex-1">
                <mat-label>Monto (Bs.)</mat-label>
                <input matInput type="number" [(ngModel)]="form.monto_bs" name="monto_bs"
                       required min="1" />
                <span matPrefix class="mr-1">Bs.&nbsp;</span>
              </mat-form-field>
              <mat-form-field appearance="outline" class="w-36">
                <mat-label>Tasa BCV</mat-label>
                <input matInput type="number" [(ngModel)]="form.tasa_cambio" name="tasa" step="0.01" />
              </mat-form-field>
            </div>
            @if (form.monto_bs && form.tasa_cambio) {
              <p class="text-xs text-slate-400">
                ≈ {{ bcv.formatUsd(form.monto_bs / form.tasa_cambio) }}
              </p>
            }
          }

          <!-- Banco -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Banco destino</mat-label>
            <mat-select [(ngModel)]="form.banco_destino" name="banco">
              @for (b of bancos; track b) {
                <mat-option [value]="b">{{ b }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <!-- Notas -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Notas (opcional)</mat-label>
            <textarea matInput [(ngModel)]="form.notas" name="notas" rows="2"></textarea>
          </mat-form-field>

          @if (exito()) {
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700">
              ✓ Pago registrado exitosamente
            </div>
          }

          <button mat-flat-button type="submit"
                  [disabled]="guardando()"
                  class="w-full !bg-primary !text-white !py-3 !rounded-lg !font-semibold">
            {{ guardando() ? 'Guardando…' : 'Registrar Pago' }}
          </button>

        </form>
      </div>
    </div>
  `,
  imports: [
    FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatRadioModule, MatSnackBarModule,
  ],
})
export class NuevoPagoComponent {
  private readonly svc  = inject(MockDataService);
  private readonly auth = inject(AuthMockService);
  readonly bcv          = inject(TasaBcvService);

  readonly bancos   = BANCOS;
  readonly guardando = signal(false);
  readonly exito     = signal(false);

  form: Partial<Pago> = {
    tipo: 'abono',
    moneda: 'usd',
    tasa_cambio: this.bcv.tasaActual()?.promedio,
  };

  readonly pedidosTodos = toSignal(
    this.svc.getPedidos(
      this.auth.hasRole('vendedor') ? (this.auth.usuarioActual()?.id ?? undefined) : undefined,
    ),
    { initialValue: [] },
  );

  readonly pedidosActivos = computed(() =>
    this.pedidosTodos().filter(p => !['cancelado', 'borrador', 'entregado'].includes(p.status)),
  );

  registrar(): void {
    this.guardando.set(true);
    this.exito.set(false);
    this.svc.registrarPago({
      ...this.form,
      vendedor_id: this.auth.usuarioActual()?.id ?? '',
      fecha_pago: new Date().toISOString().slice(0, 10),
    }).subscribe(() => {
      this.guardando.set(false);
      this.exito.set(true);
      this.form = { tipo: 'abono', moneda: 'usd', tasa_cambio: this.bcv.tasaActual()?.promedio };
    });
  }
}
