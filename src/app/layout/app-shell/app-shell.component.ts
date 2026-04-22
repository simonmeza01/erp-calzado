import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

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
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <router-outlet />
        </main>

      </div>

      <!-- Bottom nav — solo mobile -->
      <app-bottom-nav class="lg:hidden" />

    </div>
  `,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent, BottomNavComponent],
})
export class AppShellComponent {}
