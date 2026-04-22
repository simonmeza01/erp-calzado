import { Component, input } from '@angular/core';
import { PedidoStatus } from '../../../core/models';

const CONFIG: Record<PedidoStatus, { label: string; classes: string }> = {
  borrador:        { label: 'Borrador',        classes: 'bg-slate-100 text-slate-600 border-slate-300' },
  en_aprobacion:   { label: 'En aprobación',   classes: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  aprobado:        { label: 'Aprobado',         classes: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  en_preparacion:  { label: 'En preparación',  classes: 'bg-blue-100 text-blue-700 border-blue-300' },
  en_transito:     { label: 'En tránsito',      classes: 'bg-orange-100 text-orange-700 border-orange-300' },
  entregado:       { label: 'Entregado',        classes: 'bg-green-100 text-green-800 border-green-300' },
  cancelado:       { label: 'Cancelado',        classes: 'bg-red-100 text-red-700 border-red-300' },
};

@Component({
  selector: 'app-estado-pedido-badge',
  template: `
    @if (cfg(); as c) {
      <span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border {{ c.classes }}">
        {{ c.label }}
      </span>
    }
  `,
  imports: [],
})
export class EstadoPedidoBadgeComponent {
  readonly status = input.required<PedidoStatus>();
  readonly cfg    = () => CONFIG[this.status()];
}
