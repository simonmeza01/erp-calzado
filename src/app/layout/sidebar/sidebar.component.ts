import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvChipComponent } from '../../shared/components/tasa-bcv-chip/tasa-bcv-chip.component';

interface NavItem { icon: string; label: string; path: string; roles?: string[] }

const NAV_ALL: NavItem[] = [
  { icon: 'dashboard',        label: 'Dashboard',          path: '/dashboard',          roles: ['admin', 'gerente'] },
  { icon: 'people',           label: 'Clientes',           path: '/clientes' },
  { icon: 'receipt_long',     label: 'Pedidos',            path: '/pedidos' },
  { icon: 'payments',         label: 'Registrar Pago',     path: '/pagos/nuevo',        roles: ['vendedor', 'admin', 'gerente'] },
  { icon: 'inventory_2',      label: 'Inventario',         path: '/inventario' },
  { icon: 'percent',          label: 'Mis Comisiones',     path: '/comisiones',         roles: ['vendedor'] },
  { icon: 'assignment_return',label: 'Devoluciones',       path: '/devoluciones',       roles: ['admin', 'gerente'] },
  { icon: 'event_busy',       label: 'Cuentas por Vencer', path: '/cuentas-por-vencer', roles: ['admin', 'gerente'] },
  { icon: 'factory',          label: 'Fabricación',        path: '/fabricacion',        roles: ['admin'] },
  { icon: 'shopping_cart',    label: 'Compras',            path: '/compras',            roles: ['admin'] },
  { icon: 'settings',         label: 'Configuración',      path: '/configuracion',      roles: ['admin'] },
  { icon: 'map',              label: 'Mapa de clientes',   path: '/mapa' },
];

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="flex flex-col w-64 bg-primary text-white h-screen fixed top-0 left-0 z-30 shadow-lg">

      <!-- Logo + BCV -->
      <div class="px-5 pt-6 pb-4 border-b border-primary-700">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-accent text-2xl">👢</span>
          <h1 class="text-xl font-bold tracking-tight">BootERP</h1>
        </div>
        <app-tasa-bcv-chip />
      </div>

      <!-- Navegación -->
      <nav class="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
        @for (item of navItems(); track item.path) {
          <a [routerLink]="item.path"
             routerLinkActive="nav-link-active"
             class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-primary-100
                    hover:bg-white/10 hover:text-white transition-colors cursor-pointer">
            <mat-icon class="text-lg !w-5 !h-5 !text-base leading-none">{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <!-- Avatar usuario -->
      <div class="px-4 py-4 border-t border-primary-700 flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
          {{ auth.iniciales() }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-semibold truncate">{{ auth.usuarioActual()?.nombre }}</p>
          <p class="text-xs text-primary-300 capitalize">{{ auth.usuarioActual()?.rol }}</p>
        </div>
      </div>

    </aside>
  `,
  imports: [RouterLink, RouterLinkActive, MatIconModule, TasaBcvChipComponent],
})
export class SidebarComponent {
  readonly auth = inject(AuthMockService);

  readonly navItems = computed<NavItem[]>(() => {
    const rol = this.auth.usuarioActual()?.rol;
    if (!rol) return [];
    return NAV_ALL.filter(item => {
      if (!item.roles) return true;
      return item.roles.includes(rol);
    });
  });
}
