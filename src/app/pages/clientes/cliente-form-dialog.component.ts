import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { Cliente } from '../../core/models';
import { ESTADOS_LIST, getCiudadesPorEstado } from '../../core/data/venezuela-geo';
import { toSignal } from '@angular/core/rxjs-interop';

export interface ClienteFormData {
  cliente?: Cliente;
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

        @if (esEdicion && data.cliente?.codigo_cliente) {
          <div class="sm:col-span-2 mb-2 px-1">
            <span class="text-xs text-slate-400">Código cliente: </span>
            <span class="text-xs font-mono font-semibold text-primary">{{ data.cliente!.codigo_cliente }}</span>
          </div>
        }

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

        <!-- Estado -->
        <mat-form-field appearance="outline">
          <mat-label>Estado *</mat-label>
          <mat-select formControlName="estado">
            @for (e of estados; track e) {
              <mat-option [value]="e">{{ e }}</mat-option>
            }
          </mat-select>
          @if (form.get('estado')?.hasError('required') && form.get('estado')?.touched) {
            <mat-error>Seleccione un estado</mat-error>
          }
        </mat-form-field>

        <!-- Ciudad -->
        <mat-form-field appearance="outline">
          <mat-label>Ciudad *</mat-label>
          <mat-select formControlName="ciudad" [disabled]="!ciudadesDisponibles().length">
            @for (c of ciudadesDisponibles(); track c) {
              <mat-option [value]="c">{{ c }}</mat-option>
            }
          </mat-select>
          @if (form.get('ciudad')?.hasError('required') && form.get('ciudad')?.touched) {
            <mat-error>Seleccione una ciudad</mat-error>
          }
        </mat-form-field>

        <!-- Dirección -->
        <mat-form-field appearance="outline" class="sm:col-span-2">
          <mat-label>Dirección</mat-label>
          <textarea matInput formControlName="direccion" rows="2" placeholder="Av. Principal..."></textarea>
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
    MatSelectModule, MatButtonModule,
  ],
})
export class ClienteFormDialogComponent implements OnInit {
  private readonly svc    = inject(MockDataService);
  readonly auth           = inject(AuthMockService);
  private readonly ref    = inject(MatDialogRef<ClienteFormDialogComponent>);
  readonly data           = inject<ClienteFormData>(MAT_DIALOG_DATA);

  readonly vendedores  = toSignal(this.svc.getVendedores(), { initialValue: [] });
  readonly guardando   = signal(false);

  readonly esEdicion = !!this.data?.cliente;

  readonly estados = ESTADOS_LIST;
  readonly ciudadesDisponibles = signal<string[]>([]);

  readonly form = inject(FormBuilder).nonNullable.group({
    razon_social:       ['', Validators.required],
    rif:                ['', [Validators.required, rifValidator]],
    telefono:           [''],
    estado:             ['', Validators.required],
    ciudad:             ['', Validators.required],
    direccion:          [''],
    vendedor_id:        ['', this.auth.hasRole('admin', 'gerente') ? Validators.required : []],
    limite_credito_usd: [0, Validators.min(0)],
  });

  constructor() {
    effect(() => {
      const estadoVal = this.form.get('estado')?.value ?? '';
      const ciudades = getCiudadesPorEstado(estadoVal);
      this.ciudadesDisponibles.set(ciudades);
      const ciudadActual = this.form.get('ciudad')?.value ?? '';
      if (ciudadActual && !ciudades.includes(ciudadActual)) {
        this.form.patchValue({ ciudad: '' });
      }
    });
  }

  ngOnInit(): void {
    const c = this.data?.cliente;
    if (c) {
      this.ciudadesDisponibles.set(getCiudadesPorEstado(c.estado));
      this.form.patchValue({
        razon_social:       c.razon_social,
        rif:                c.rif,
        telefono:           c.telefono ?? '',
        estado:             c.estado,
        ciudad:             c.ciudad,
        direccion:          c.direccion ?? '',
        vendedor_id:        c.vendedor_id,
        limite_credito_usd: c.limite_credito_usd,
      });
    } else if (!this.auth.hasRole('admin', 'gerente')) {
      this.form.patchValue({ vendedor_id: this.auth.usuarioActual()?.id ?? '' });
    }

    this.form.get('estado')?.valueChanges.subscribe(estado => {
      const ciudades = getCiudadesPorEstado(estado);
      this.ciudadesDisponibles.set(ciudades);
      this.form.patchValue({ ciudad: '' });
    });
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
