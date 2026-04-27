import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ShepherdService } from 'angular-shepherd';
import { defaultStepOptions } from '../tours/tour-options';
import { getGlobalTourSteps } from '../tours/global.tour';
import { getDashboardTourSteps } from '../tours/dashboard.tour';
import { getClientesTourSteps } from '../tours/clientes.tour';
import { getPedidosTourSteps } from '../tours/pedidos.tour';
import { getInventarioTourSteps } from '../tours/inventario.tour';
import { getPagosTourSteps } from '../tours/pagos.tour';
import { getFabricacionTourSteps } from '../tours/fabricacion.tour';
import { getComprasTourSteps } from '../tours/compras.tour';
import { getComisionesTourSteps } from '../tours/comisiones.tour';
import { getComisionesAdminTourSteps } from '../tours/comisiones-admin.tour';
import { getCostosTourSteps } from '../tours/costos.tour';
import { getMapaTourSteps } from '../tours/mapa.tour';
import { getConfiguracionTourSteps } from '../tours/configuracion.tour';
import { getCuentasPorPagarTourSteps } from '../tours/cuentas-por-pagar.tour';
import { getDevolucionesTourSteps } from '../tours/devoluciones.tour';
import { AuthMockService } from './auth-mock.service';

const STORAGE_KEY = 'erp_tours_completed';

export type TourId =
  | 'global'
  | 'dashboard'
  | 'clientes'
  | 'pedidos'
  | 'inventario'
  | 'pagos'
  | 'fabricacion'
  | 'compras'
  | 'comisiones'
  | 'comisiones-admin'
  | 'costos'
  | 'mapa'
  | 'configuracion'
  | 'cuentas-por-pagar'
  | 'devoluciones';

const ROUTE_TO_TOUR: Record<string, TourId> = {
  '/dashboard':          'dashboard',
  '/clientes':           'clientes',
  '/pedidos':            'pedidos',
  '/inventario':         'inventario',
  '/pagos/nuevo':        'pagos',
  '/fabricacion':        'fabricacion',
  '/compras':            'compras',
  '/comisiones':         'comisiones',   // resolved to role-specific tour at runtime
  '/costos':             'costos',
  '/mapa':               'mapa',
  '/configuracion':      'configuracion',
  '/cuentas-por-pagar':  'cuentas-por-pagar',
  '/devoluciones':       'devoluciones',
};

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly shepherd = inject(ShepherdService);
  private readonly router   = inject(Router);
  private readonly auth     = inject(AuthMockService);

  /** Roles that can access each tour (undefined = all roles) */
  private readonly tourRoles: Partial<Record<TourId, string[]>> = {
    dashboard:           ['admin', 'gerente'],
    fabricacion:         ['admin'],
    compras:             ['admin'],
    configuracion:       ['admin'],
    devoluciones:        ['admin', 'gerente'],
    'cuentas-por-pagar': ['admin', 'gerente'],
    comisiones:          ['vendedor'],
    'comisiones-admin':  ['admin', 'gerente'],
    costos:              ['admin', 'gerente'],
    pagos:               ['vendedor', 'admin', 'gerente'],
  };

  // ─── Public API ─────────────────────────────────────────────────────────────

  isTourCompleted(tourId: TourId): boolean {
    return this._getCompleted().includes(tourId);
  }

  markTourCompleted(tourId: TourId): void {
    const completed = this._getCompleted();
    if (!completed.includes(tourId)) {
      completed.push(tourId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
    }
  }

  resetTour(tourId: TourId): void {
    const completed = this._getCompleted().filter(id => id !== tourId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  }

  resetAllTours(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  canAccessTour(tourId: TourId): boolean {
    const roles = this.tourRoles[tourId];
    if (!roles) return true;
    return this.auth.hasRole(...(roles as Parameters<typeof this.auth.hasRole>));
  }

  startGlobalTour(force = false): void {
    if (!force && this.isTourCompleted('global')) return;
    const rol = this.auth.usuarioActual()?.rol ?? 'vendedor';
    this._start('global', getGlobalTourSteps(rol));
  }

  startModuleTour(tourId: TourId, force = false): void {
    if (!this.canAccessTour(tourId)) return;
    if (!force && this.isTourCompleted(tourId)) return;
    const steps = this._getStepsForTour(tourId);
    if (steps) this._start(tourId, steps);
  }

  /** Detect the current route and start its tour */
  startCurrentModuleTour(force = false): void {
    const url = this._currentBaseUrl();
    const tourId = ROUTE_TO_TOUR[url];
    if (tourId) {
      this.startModuleTour(tourId, force);
    }
  }

  /** Auto-start the module tour for a route if not yet seen */
  autoStartForRoute(url: string): void {
    const base = this._baseUrl(url);
    let tourId = ROUTE_TO_TOUR[base];
    if (!tourId) return;

    // /comisiones serves different components by role — pick the right tour
    if (base === '/comisiones') {
      const rol = this.auth.usuarioActual()?.rol;
      tourId = rol === 'vendedor' ? 'comisiones' : 'comisiones-admin';
    }

    if (!this.isTourCompleted(tourId) && this.canAccessTour(tourId)) {
      setTimeout(() => this.startModuleTour(tourId!), 600);
    }
  }

  // ─── Private ────────────────────────────────────────────────────────────────

  private _start(tourId: TourId, steps: Parameters<ShepherdService['addSteps']>[0]): void {
    if (this.shepherd.isActive) {
      this.shepherd.cancel();
    }

    this.shepherd.defaultStepOptions = defaultStepOptions;
    this.shepherd.modal = false;
    this.shepherd.confirmCancel = false;
    this.shepherd.addSteps(steps);

    this.shepherd.tourObject?.on('complete', () => this.markTourCompleted(tourId));
    this.shepherd.tourObject?.on('cancel', () => this.markTourCompleted(tourId));

    this.shepherd.start();
  }

  private _getStepsForTour(tourId: TourId) {
    switch (tourId) {
      case 'dashboard':          return getDashboardTourSteps();
      case 'clientes':           return getClientesTourSteps();
      case 'pedidos':            return getPedidosTourSteps();
      case 'inventario':         return getInventarioTourSteps();
      case 'pagos':              return getPagosTourSteps();
      case 'fabricacion':        return getFabricacionTourSteps();
      case 'compras':            return getComprasTourSteps();
      case 'comisiones':         return getComisionesTourSteps();
      case 'comisiones-admin':   return getComisionesAdminTourSteps();
      case 'costos':             return getCostosTourSteps();
      case 'mapa':               return getMapaTourSteps();
      case 'configuracion':      return getConfiguracionTourSteps();
      case 'cuentas-por-pagar':  return getCuentasPorPagarTourSteps();
      case 'devoluciones':       return getDevolucionesTourSteps();
      default:                   return null;
    }
  }

  private _currentBaseUrl(): string {
    return this._baseUrl(this.router.url);
  }

  private _baseUrl(url: string): string {
    return url.split('?')[0].split('#')[0];
  }

  private _getCompleted(): TourId[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as TourId[]) : [];
    } catch {
      return [];
    }
  }
}
