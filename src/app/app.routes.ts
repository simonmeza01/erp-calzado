import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AppShellComponent } from './layout/app-shell/app-shell.component';

export const routes: Routes = [
  // Página pública
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },

  // App shell protegida
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Admin + Gerente
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'gerente'] },
      },
      {
        path: 'devoluciones',
        loadComponent: () => import('./pages/devoluciones/devoluciones.component').then(m => m.DevolucionesComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'gerente'] },
      },
      {
        path: 'cuentas-por-vencer',
        loadComponent: () => import('./pages/cuentas-por-vencer/cuentas-por-vencer.component').then(m => m.CuentasPorVencerComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'gerente'] },
      },

      // Solo admin
      {
        path: 'fabricacion',
        loadComponent: () => import('./pages/fabricacion/fabricacion.component').then(m => m.FabricacionComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'compras',
        loadComponent: () => import('./pages/compras/compras.component').then(m => m.ComprasComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },
      {
        path: 'configuracion',
        loadComponent: () => import('./pages/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
        canActivate: [roleGuard],
        data: { roles: ['admin'] },
      },

      // Todos los roles autenticados
      {
        path: 'clientes',
        loadComponent: () => import('./pages/clientes/clientes.component').then(m => m.ClientesComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () => import('./pages/pedidos/pedidos.component').then(m => m.PedidosComponent),
      },
      {
        path: 'pagos/nuevo',
        loadComponent: () => import('./pages/pagos/nuevo-pago.component').then(m => m.NuevoPagoComponent),
      },
      {
        path: 'inventario',
        loadComponent: () => import('./pages/inventario/inventario.component').then(m => m.InventarioComponent),
      },
      {
        path: 'inventario/movimientos',
        loadComponent: () => import('./pages/inventario/inventario-movimientos.component').then(m => m.InventarioMovimientosComponent),
      },
      {
        path: 'comisiones',
        loadComponent: () => import('./pages/comisiones/comisiones.component').then(m => m.ComisionesComponent),
      },
      {
        path: 'mapa',
        loadComponent: () => import('./pages/mapa/mapa-rutas.component').then(m => m.MapaRutasComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: 'login' },
];
