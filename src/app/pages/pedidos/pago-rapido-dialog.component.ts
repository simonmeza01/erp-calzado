import { Component, inject, signal, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { PagoTipo, PagoMoneda } from '../../core/models';

export interface PagoDialogData {
  pedidoId: string;
  numeroPedido: string;
  clienteNombre: string;
  saldoPendienteUsd: number;
}

@Component({
  selector: 'app-pago-rapido-dialog',
  template: `
    <h2 mat-dialog-title>Registrar pago — {{ data.numeroPedido }}</h2>
    <p class="px-6 -mt-2 text-sm text-slate-500">{{ data.clienteNombre }}</p>

    <mat-dialog-content class="!pt-3 space-y-3">

      <!-- Saldo -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex justify-between items-center">
        <span class="text-sm text-amber-700 font-medium">Saldo pendiente</span>
        <span class="text-lg font-bold text-amber-800">{{ bcv.formatUsd(data.saldoPendienteUsd) }}</span>
      </div>

      <form [formGroup]="form" class="space-y-3">

        <!-- Tipo -->
        <div>
          <p class="text-sm font-medium text-slate-600 mb-1">Tipo de pago</p>
          <mat-radio-group formControlName="tipo" class="flex gap-4">
            <mat-radio-button value="abono">Abono</mat-radio-button>
            <mat-radio-button value="completo">Pago completo</mat-radio-button>
          </mat-radio-group>
        </div>

        <!-- Moneda -->
        <div>
          <p class="text-sm font-medium text-slate-600 mb-1">Moneda</p>
          <mat-radio-group formControlName="moneda" class="flex gap-4">
            <mat-radio-button value="usd">USD</mat-radio-button>
            <mat-radio-button value="bs">Bolívares</mat-radio-button>
          </mat-radio-group>
        </div>

        <!-- Fecha -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Fecha del pago</mat-label>
          <input matInput type="date" formControlName="fecha_pago" />
        </mat-form-field>

        <!-- Monto -->
        @if (form.get('moneda')?.value === 'usd') {
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Monto USD</mat-label>
            <input matInput type="number" formControlName="monto_usd" min="0.01" step="0.01" />
            <span matPrefix class="mr-1">$&nbsp;</span>
          </mat-form-field>
        } @else {
          <div class="flex gap-3">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>Monto Bs.</mat-label>
              <input matInput type="number" formControlName="monto_bs" min="1" />
              <span matPrefix class="mr-1">Bs.&nbsp;</span>
            </mat-form-field>
            <mat-form-field appearance="outline" class="w-32">
              <mat-label>Tasa</mat-label>
              <input matInput type="number" formControlName="tasa_cambio" step="0.01" />
            </mat-form-field>
          </div>
          @if (form.get('monto_bs')?.value && form.get('tasa_cambio')?.value) {
            <p class="text-xs text-slate-400 -mt-2">
              ≈ {{ bcv.formatUsd(form.get('monto_bs')!.value / form.get('tasa_cambio')!.value) }}
            </p>
          }
        }

        <!-- Cuenta bancaria -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Cuenta bancaria destino *</mat-label>
          <mat-select formControlName="cuenta_bancaria_id">
            <!-- Juridicas (Empresa) -->
            @for (cb of cuentasJuridicas(); track cb.id) {
              <mat-option [value]="cb.id">
                <span class="text-xs text-blue-600 font-semibold">[Empresa]</span>
                {{ cb.banco }} — {{ cb.titular }}
              </mat-option>
            }
            <!-- Personales -->
            @for (cb of cuentasPersonales(); track cb.id) {
              <mat-option [value]="cb.id">
                <span class="text-xs text-purple-600 font-semibold">[Personal]</span>
                {{ cb.banco }} — {{ cb.titular }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Notas -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Notas (opcional)</mat-label>
          <textarea matInput formControlName="notas" rows="2"></textarea>
        </mat-form-field>

        <!-- Preview -->
        @if (montoUsdPreview() > 0) {
          <div class="bg-slate-50 rounded-lg p-3 text-sm border border-slate-200">
            <p class="text-slate-500 text-xs mb-1">Se registrará:</p>
            <p class="font-semibold text-slate-800">
              {{ bcv.formatUsd(montoUsdPreview()) }}
              @if (form.get('moneda')?.value === 'bs' && form.get('tasa_cambio')?.value) {
                ({{ bcv.formatBs(montoUsdPreview(), form.get('tasa_cambio')!.value) }} a tasa Bs.{{ form.get('tasa_cambio')!.value }})
              }
            </p>
          </div>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()" [disabled]="form.invalid || guardando()">
        {{ guardando() ? 'Guardando…' : 'Registrar pago' }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatRadioModule,
  ],
})
export class PagoRapidoDialogComponent {
  private readonly svc  = inject(MockDataService);
  private readonly auth = inject(AuthMockService);
  readonly bcv          = inject(TasaBcvService);
  readonly data         = inject<PagoDialogData>(MAT_DIALOG_DATA);
  private readonly ref  = inject(MatDialogRef<PagoRapidoDialogComponent>);

  readonly guardando = signal(false);

  private readonly cuentasTodas = toSignal(this.svc.getCuentasBancarias(), { initialValue: [] });
  readonly cuentasJuridicas  = computed(() => this.cuentasTodas().filter(c => c.activo && c.tipo === 'juridica'));
  readonly cuentasPersonales = computed(() => this.cuentasTodas().filter(c => c.activo && c.tipo === 'personal'));

  readonly form = inject(FormBuilder).nonNullable.group({
    tipo:               ['abono'],
    moneda:             ['usd'],
    fecha_pago:         [new Date().toISOString().slice(0, 10), Validators.required],
    monto_usd:          [this.data.saldoPendienteUsd],
    monto_bs:           [0],
    tasa_cambio:        [this.bcv.tasaActual()?.promedio ?? 41.5],
    cuenta_bancaria_id: ['', Validators.required],
    notas:              [''],
  });

  readonly montoUsdPreview = () => {
    const moneda = this.form.get('moneda')?.value;
    if (moneda === 'usd') return this.form.get('monto_usd')?.value ?? 0;
    const bs = this.form.get('monto_bs')?.value ?? 0;
    const tasa = this.form.get('tasa_cambio')?.value ?? 1;
    return tasa ? bs / tasa : 0;
  };

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    this.svc.registrarPago({
      pedido_id:          this.data.pedidoId,
      vendedor_id:        this.auth.usuarioActual()?.id ?? '',
      tipo:               v.tipo as PagoTipo,
      moneda:             v.moneda as PagoMoneda,
      fecha_pago:         v.fecha_pago,
      cuenta_bancaria_id: v.cuenta_bancaria_id,
      notas:              v.notas || undefined,
      monto_usd:          v.moneda === 'usd' ? v.monto_usd : undefined,
      monto_bs:           v.moneda === 'bs' ? v.monto_bs : undefined,
      tasa_cambio:        v.moneda === 'bs' ? v.tasa_cambio : undefined,
    }).subscribe(pago => {
      this.guardando.set(false);
      this.ref.close(pago);
    });
  }
}
