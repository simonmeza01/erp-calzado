import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TasaBcvService } from '../../../core/services/tasa-bcv.service';

@Component({
  selector: 'app-tasa-bcv-chip',
  template: `
    @if (bcv.tasaActual(); as tasa) {
      <span class="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent-700 border border-accent/30 rounded-full px-2 py-0.5 font-medium">
        <span class="w-1.5 h-1.5 rounded-full bg-accent inline-block"></span>
        BCV Bs.&nbsp;{{ tasa.promedio | number:'1.2-2' }}
        @if (bcv.ultimaActualizacion()) {
          <span class="text-slate-400 font-normal">| {{ bcv.ultimaActualizacion() }}</span>
        }
      </span>
    } @else {
      <span class="text-xs text-slate-400 italic">Cargando tasa…</span>
    }
  `,
  imports: [DecimalPipe],
})
export class TasaBcvChipComponent {
  readonly bcv = inject(TasaBcvService);
}
