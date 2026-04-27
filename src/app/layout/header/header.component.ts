import { Component, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvChipComponent } from '../../shared/components/tasa-bcv-chip/tasa-bcv-chip.component';
import { MockDataService } from '../../core/services/mock-data.service';
import { TutorialService } from '../../core/services/tutorial.service';
import { toSignal as tsignal } from '@angular/core/rxjs-interop';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':           'Dashboard',
  '/clientes':            'Clientes',
  '/pedidos':             'Pedidos',
  '/pagos/nuevo':         'Registrar Pago',
  '/inventario':          'Inventario',
  '/comisiones':          'Comisiones',
  '/costos':              'Costos y Utilidad',
  '/devoluciones':        'Devoluciones',
  '/cuentas-por-pagar':   'Cuentas por Pagar',
  '/fabricacion':         'Fabricación',
  '/compras':             'Compras',
  '/configuracion':       'Configuración',
};

@Component({
  selector: 'app-header',
  template: `
    <header class="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">

      <!-- Título de página -->
      <h2 data-tour="header-title" class="text-base font-semibold text-slate-800 truncate">{{ paginaTitulo() }}</h2>

      <!-- Controles derecha -->
      <div class="flex items-center gap-2 flex-shrink-0">

        <!-- BCV chip (solo desktop) -->
        <span class="hidden sm:inline-flex">
          <app-tasa-bcv-chip />
        </span>

        <!-- Notificaciones -->
        <button mat-icon-button
                data-tour="header-notifications"
                [matBadge]="notifCount()"
                [matBadgeHidden]="!notifCount()"
                matBadgeColor="warn"
                matBadgeSize="small"
                aria-label="Notificaciones">
          <mat-icon>notifications_outlined</mat-icon>
        </button>

        <!-- Botón de ayuda / tutorial -->
        <button mat-icon-button
                data-tour="header-help"
                [matMenuTriggerFor]="helpMenu"
                aria-label="Ayuda y tutoriales"
                class="text-slate-500 hover:text-primary">
          <mat-icon>help_outline</mat-icon>
        </button>
        <mat-menu #helpMenu="matMenu">
          <button mat-menu-item (click)="iniciarTourModulo()">
            <mat-icon>play_circle_outline</mat-icon>
            <span>Tutorial de esta página</span>
          </button>
          <button mat-menu-item (click)="iniciarTourGlobal()">
            <mat-icon>explore</mat-icon>
            <span>Tour general del sistema</span>
          </button>
          <mat-divider />
          <button mat-menu-item (click)="reiniciarTodos()">
            <mat-icon>refresh</mat-icon>
            <span>Reiniciar todos los tutoriales</span>
          </button>
        </mat-menu>

        <!-- Avatar + menú -->
        <button class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white"
                data-tour="header-user-menu"
                [matMenuTriggerFor]="userMenu"
                aria-label="Menú usuario">
          {{ auth.iniciales() }}
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="px-4 py-2 border-b border-slate-100">
            <p class="text-sm font-semibold text-slate-800">{{ auth.usuarioActual()?.nombre }}</p>
            <p class="text-xs text-slate-500 capitalize">{{ auth.usuarioActual()?.rol }}</p>
          </div>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar sesión</span>
          </button>
        </mat-menu>

      </div>
    </header>
  `,
  imports: [
    MatIconModule, MatButtonModule, MatMenuModule, MatBadgeModule, MatDividerModule,
    TasaBcvChipComponent,
  ],
})
export class HeaderComponent {
  readonly auth       = inject(AuthMockService);
  private readonly router      = inject(Router);
  private readonly mockSvc     = inject(MockDataService);
  private readonly tutorialSvc = inject(TutorialService);

  readonly paginaTitulo = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => ROUTE_LABELS[e.urlAfterRedirects] ?? 'BootERP'),
      startWith(ROUTE_LABELS[this.router.url] ?? 'BootERP'),
    ),
    { initialValue: 'BootERP' },
  );

  readonly notifCount = tsignal(
    this.mockSvc.getPedidos().pipe(
      map(pedidos => pedidos.filter(p =>
        p.dias_para_vencer !== undefined && p.dias_para_vencer <= 3 &&
        !['entregado', 'cancelado'].includes(p.status),
      ).length),
    ),
    { initialValue: 0 },
  );

  iniciarTourModulo(): void {
    this.tutorialSvc.startCurrentModuleTour(true);
  }

  iniciarTourGlobal(): void {
    this.tutorialSvc.startGlobalTour(true);
  }

  reiniciarTodos(): void {
    this.tutorialSvc.resetAllTours();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
