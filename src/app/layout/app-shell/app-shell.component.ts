import { Component, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { TutorialService } from '../../core/services/tutorial.service';

@Component({
  selector: 'app-shell',
  template: `
    <div class="flex h-screen bg-slate-100 overflow-hidden">

      <!-- Sidebar — solo desktop (lg+) -->
      <app-sidebar class="hidden lg:flex" />

      <!-- Columna principal -->
      <div class="flex flex-col flex-1 min-w-0 lg:ml-64">

        <!-- Header fijo -->
        <app-header />

        <!-- Contenido de página -->
        <main data-tour="main-content" class="flex-1 overflow-y-auto p-4 lg:p-6">
          <router-outlet />
        </main>

      </div>

      <!-- Bottom nav — solo mobile -->
      <app-bottom-nav class="lg:hidden" />

    </div>
  `,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, BottomNavComponent],
})
export class AppShellComponent implements AfterViewInit, OnDestroy {
  private readonly tutorialSvc = inject(TutorialService);
  private readonly router      = inject(Router);
  private _routerSub?: Subscription;

  ngAfterViewInit(): void {
    // Auto-start global tour on first login
    setTimeout(() => {
      this.tutorialSvc.startGlobalTour();
    }, 800);

    // Auto-start module tour on each navigation (first visit only)
    this._routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe((e: NavigationEnd) => {
      setTimeout(() => {
        this.tutorialSvc.autoStartForRoute(e.urlAfterRedirects);
      }, 800);
    });
  }

  ngOnDestroy(): void {
    this._routerSub?.unsubscribe();
  }
}
