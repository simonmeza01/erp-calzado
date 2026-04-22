import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <svg class="w-20 h-20 text-slate-300 mb-4" fill="none" viewBox="0 0 96 96" stroke="currentColor" stroke-width="1.5">
        <circle cx="48" cy="48" r="36" />
        <path d="M32 48h32M48 32v32" stroke-linecap="round" />
      </svg>
      <p class="text-slate-500 font-medium text-base">{{ titulo() }}</p>
      @if (subtitulo()) {
        <p class="text-slate-400 text-sm mt-1">{{ subtitulo() }}</p>
      }
    </div>
  `,
  imports: [],
})
export class EmptyStateComponent {
  readonly titulo    = input('Sin resultados');
  readonly subtitulo = input('');
}
