import { Injectable, signal, computed } from '@angular/core';
import { Usuario, UserRole } from '../models';

const STORAGE_KEY = 'erp_usuario_actual';

const USUARIOS_MOCK: Usuario[] = [
  { id: 'u1', nombre: 'María González',  email: 'admin@calzado.com',     rol: 'admin',    activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u2', nombre: 'Carlos Pérez',    email: 'gerente@calzado.com',   rol: 'gerente',  activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u3', nombre: 'Luis Rodríguez',  email: 'vendedor1@calzado.com', rol: 'vendedor', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u4', nombre: 'Ana Martínez',    email: 'vendedor2@calzado.com', rol: 'vendedor', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u5', nombre: 'José Hernández',  email: 'vendedor3@calzado.com', rol: 'vendedor', activo: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'u6', nombre: 'Carmen Díaz',     email: 'vendedor4@calzado.com', rol: 'vendedor', activo: true, created_at: '2024-01-01T00:00:00Z' },
];

@Injectable({ providedIn: 'root' })
export class AuthMockService {
  readonly usuarioActual = signal<Usuario | null>(this._cargarDesdeStorage());

  readonly esAdmin    = computed(() => this.usuarioActual()?.rol === 'admin');
  readonly esGerente  = computed(() => this.usuarioActual()?.rol === 'gerente' || this.esAdmin());
  readonly esVendedor = computed(() => !!this.usuarioActual());
  readonly iniciales  = computed(() => {
    const u = this.usuarioActual();
    if (!u) return '';
    return u.nombre.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  });

  login(email: string): boolean {
    const usuario = USUARIOS_MOCK.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.activo,
    );
    if (!usuario) return false;
    this.usuarioActual.set(usuario);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuario));
    return true;
  }

  logout(): void {
    this.usuarioActual.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const u = this.usuarioActual();
    if (!u) return false;
    return roles.includes(u.rol);
  }

  private _cargarDesdeStorage(): Usuario | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Usuario) : null;
    } catch {
      return null;
    }
  }
}
