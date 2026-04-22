import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-alerta-vencimiento',
  template: `
    @if (mostrar()) {
      <span class="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border
                   {{ dias()! <= 0 ? 'bg-red-600 text-white border-red-700' : 'bg-red-100 text-red-700 border-red-300' }}">
        ⚠ {{ dias()! <= 0 ? 'Vencido' : 'Vence en ' + dias() + ' día' + (dias() === 1 ? '' : 's') }}
      </span>
    }
  `,
  imports: [],
})
export class AlertaVencimientoComponent {
  readonly dias    = input<number | undefined>();
  readonly mostrar = computed(() => (this.dias() ?? 99) <= 3);
}
