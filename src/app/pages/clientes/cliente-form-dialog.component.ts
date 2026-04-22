import { Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { toSignal } from '@angular/core/rxjs-interop';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { Cliente } from '../../core/models';

export interface ClienteFormData {
  cliente?: Cliente;  // si existe → modo edición
}

function rifValidator(c: AbstractControl): ValidationErrors | null {
  const v = (c.value as string) ?? '';
  if (!v) return null;
  return /^[JVEGjveg]-\d{8}-\d$/.test(v) ? null : { rifFormat: true };
}

@Component({
  selector: 'app-cliente-form-dialog',
  template: `
    <h2 mat-dialog-title>{{ esEdicion ? 'Editar cliente' : 'Nuevo cliente' }}</h2>

    <mat-dialog-content class="!pt-2">
      <form [formGroup]="form" class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">

        <!-- Razón social -->
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Razón social *</mat-label>
          <input matInput formControlName="razon_social" placeholder="Empresa C.A." />
          @if (form.get('razon_social')?.hasError('required') && form.get('razon_social')?.touched) {
            <mat-error>La razón social es obligatoria</mat-error>
          }
        </mat-form-field>

        <!-- RIF -->
        <mat-form-field appearance="outline">
          <mat-label>RIF *</mat-label>
          <input matInput formControlName="rif" placeholder="J-12345678-9" />
          @if (form.get('rif')?.hasError('required') && form.get('rif')?.touched) {
            <mat-error>El RIF es obligatorio</mat-error>
          }
          @if (form.get('rif')?.hasError('rifFormat') && form.get('rif')?.touched) {
            <mat-error>Formato: J-XXXXXXXX-X</mat-error>
          }
        </mat-form-field>

        <!-- Teléfono -->
        <mat-form-field appearance="outline">
          <mat-label>Teléfono</mat-label>
          <input matInput formControlName="telefono" placeholder="0412-1234567" />
        </mat-form-field>

        <!-- Dirección -->
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Dirección</mat-label>
          <textarea matInput formControlName="direccion" rows="2" placeholder="Av. Principal..."></textarea>
        </mat-form-field>

        <!-- Zona -->
        <mat-form-field appearance="outline">
          <mat-label>Zona</mat-label>
          <mat-select formControlName="zona_id">
            <mat-option value="">Sin zona</mat-option>
            @for (z of zonas(); track z.id) {
              <mat-option [value]="z.id">{{ z.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <!-- Vendedor (solo admin/gerente) -->
        @if (auth.hasRole('admin', 'gerente')) {
          <mat-form-field appearance="outline">
            <mat-label>Vendedor asignado *</mat-label>
            <mat-select formControlName="vendedor_id">
              @for (v of vendedores(); track v.id) {
                <mat-option [value]="v.id">{{ v.nombre }}</mat-option>
              }
            </mat-select>
            @if (form.get('vendedor_id')?.hasError('required') && form.get('vendedor_id')?.touched) {
              <mat-error>Seleccione un vendedor</mat-error>
            }
          </mat-form-field>
        }

        <!-- Límite crédito -->
        <mat-form-field appearance="outline">
          <mat-label>Límite de crédito (USD)</mat-label>
          <input matInput type="number" formControlName="limite_credito_usd" min="0" step="100" />
          <span matPrefix class="mr-1">$&nbsp;</span>
          @if (form.get('limite_credito_usd')?.hasError('min') && form.get('limite_credito_usd')?.touched) {
            <mat-error>Mínimo $0</mat-error>
          }
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-button [mat-dialog-close]="null">Cancelar</button>
      <button mat-flat-button color="primary" (click)="guardar()"
              [disabled]="form.invalid || guardando()">
        {{ guardando() ? 'Guardando…' : (esEdicion ? 'Guardar cambios' : 'Crear cliente') }}
      </button>
    </mat-dialog-actions>
  `,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatSlideToggleModule,
  ],
})
export class ClienteFormDialogComponent implements OnInit {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  private readonly ref    = inject(MatDialogRef<ClienteFormDialogComponent>);
  readonly data           = inject<ClienteFormData>(MAT_DIALOG_DATA);

  readonly zonas     = toSignal(this.svc.getZonas(), { initialValue: [] });
  readonly vendedores = toSignal(this.svc.getVendedores(), { initialValue: [] });
  readonly guardando  = signal(false);

  readonly esEdicion = !!this.data?.cliente;

  readonly form = inject(FormBuilder).nonNullable.group({
    razon_social:       ['', Validators.required],
    rif:                ['', [Validators.required, rifValidator]],
    telefono:           [''],
    direccion:          [''],
    zona_id:            [''],
    vendedor_id:        ['', this.auth.hasRole('admin', 'gerente') ? Validators.required : []],
    limite_credito_usd: [0, Validators.min(0)],
  });

  ngOnInit(): void {
    const c = this.data?.cliente;
    if (c) {
      this.form.patchValue({
        razon_social:       c.razon_social,
        rif:                c.rif,
        telefono:           c.telefono ?? '',
        direccion:          c.direccion ?? '',
        zona_id:            c.zona_id ?? '',
        vendedor_id:        c.vendedor_id,
        limite_credito_usd: c.limite_credito_usd,
      });
    } else if (!this.auth.hasRole('admin', 'gerente')) {
      // Auto-asignar vendedor actual
      this.form.patchValue({ vendedor_id: this.auth.usuarioActual()?.id ?? '' });
    }
  }

  guardar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.guardando.set(true);
    const v = this.form.getRawValue();
    const obs = this.esEdicion
      ? this.svc.actualizarCliente(this.data.cliente!.id, v)
      : this.svc.crearCliente(v);
    obs.subscribe(cliente => {
      this.guardando.set(false);
      this.ref.close(cliente);
    });
  }
}
