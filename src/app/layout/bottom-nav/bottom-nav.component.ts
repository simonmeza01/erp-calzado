import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthMockService } from '../../core/services/auth-mock.service';

interface NavItem { icon: string; label: string; path: string }

const VENDEDOR_ITEMS: NavItem[] = [
  { icon: 'people',       label: 'Clientes',   path: '/clientes' },
  { icon: 'receipt_long', label: 'Pedidos',    path: '/pedidos' },
  { icon: 'map',          label: 'Mi Ruta',    path: '/mapa' },
  { icon: 'payments',     label: 'Pagar',      path: '/pagos/nuevo' },
];

const ADMIN_ITEMS: NavItem[] = [
  { icon: 'dashboard',    label: 'Dashboard', path: '/dashboard' },
  { icon: 'receipt_long', label: 'Pedidos',   path: '/pedidos' },
  { icon: 'map',          label: 'Mapa',      path: '/mapa' },
  { icon: 'people',       label: 'Clientes',  path: '/clientes' },
];

@Component({
  selector: 'app-bottom-nav',
  template: `
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30
                flex items-center justify-around px-2 pb-safe">
      @for (item of navItems(); track item.path) {
        <a [routerLink]="item.path"
           routerLinkActive="text-primary"
           class="flex flex-col items-center gap-0.5 py-2 px-3 text-slate-400 min-w-0
                  hover:text-primary transition-colors">
          <mat-icon class="!text-xl !w-5 !h-5">{{ item.icon }}</mat-icon>
          <span class="text-[10px] font-medium leading-none truncate">{{ item.label }}</span>
        </a>
      }
    </nav>
    <!-- Espacio para que el contenido no quede debajo del nav -->
    <div class="h-16"></div>
  `,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
})
export class BottomNavComponent {
  readonly auth = inject(AuthMockService);

  readonly navItems = computed<NavItem[]>(() =>
    this.auth.hasRole('admin', 'gerente') ? ADMIN_ITEMS : VENDEDOR_ITEMS,
  );
}
