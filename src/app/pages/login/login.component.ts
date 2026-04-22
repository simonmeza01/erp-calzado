import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AuthMockService } from '../../core/services/auth-mock.service';

const CREDENCIALES = [
  { email: 'admin@calzado.com',     label: 'Admin — María González' },
  { email: 'gerente@calzado.com',   label: 'Gerente — Carlos Pérez' },
  { email: 'vendedor1@calzado.com', label: 'Vendedor — Luis Rodríguez' },
  { email: 'vendedor2@calzado.com', label: 'Vendedor — Ana Martínez' },
];

@Component({
  selector: 'app-login',
  template: `
    <div class="min-h-screen bg-primary flex items-center justify-center p-4">

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">

        <!-- Logo -->
        <div class="text-center mb-8">
          <span class="text-5xl">👢</span>
          <h1 class="text-2xl font-bold text-primary mt-2">BootERP</h1>
          <p class="text-slate-400 text-sm mt-1">ERP para Empresa de Calzado</p>
        </div>

        <!-- Selector rápido (demo) -->
        <div class="mb-5 bg-accent/10 border border-accent/30 rounded-lg p-3">
          <p class="text-xs font-semibold text-accent-700 mb-2">Acceso rápido (demo)</p>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Seleccionar usuario</mat-label>
            <mat-select [(ngModel)]="emailSeleccionado" (ngModelChange)="email.set($event)">
              @for (c of credenciales; track c.email) {
                <mat-option [value]="c.email">{{ c.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Formulario -->
        <form (ngSubmit)="iniciarSesion()" #f="ngForm" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Correo electrónico</mat-label>
            <input matInput type="email" [(ngModel)]="emailModel" name="email"
                   required placeholder="usuario@calzado.com" />
            <mat-icon matSuffix>mail</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="mostrarPass() ? 'text' : 'password'"
                   [(ngModel)]="passModel" name="pass"
                   required placeholder="••••••••" />
            <button mat-icon-button matSuffix type="button"
                    (click)="mostrarPass.set(!mostrarPass())">
              <mat-icon>{{ mostrarPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          @if (error()) {
            <p class="text-red-600 text-sm text-center bg-red-50 rounded-lg p-2">
              {{ error() }}
            </p>
          }

          <button mat-flat-button type="submit"
                  class="w-full !bg-primary !text-white !py-3 !rounded-lg !text-base !font-semibold">
            Iniciar sesión
          </button>
        </form>

        <p class="text-center text-xs text-slate-400 mt-6">
          Demo: usa cualquier email de la lista o escribe directamente
        </p>
      </div>

    </div>
  `,
  imports: [
    FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule,
  ],
})
export class LoginComponent {
  readonly auth   = inject(AuthMockService);
  readonly router = inject(Router);

  readonly credenciales     = CREDENCIALES;
  emailSeleccionado         = '';
  emailModel                = '';
  passModel                 = '';
  readonly mostrarPass      = signal(false);
  readonly error            = signal('');

  // Sincroniza selector → input email
  get email() { return { set: (v: string) => { this.emailModel = v; } }; }

  iniciarSesion(): void {
    this.error.set('');
    const ok = this.auth.login(this.emailModel.trim());
    if (!ok) {
      this.error.set('Correo no encontrado o usuario inactivo.');
      return;
    }
    const rol = this.auth.usuarioActual()?.rol;
    this.router.navigate([rol === 'vendedor' ? '/clientes' : '/dashboard']);
  }
}
