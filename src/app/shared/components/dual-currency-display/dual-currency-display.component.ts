import { Component, input, inject, computed } from '@angular/core';
import { TasaBcvService } from '../../../core/services/tasa-bcv.service';

@Component({
  selector: 'app-dual-currency',
  template: `
    <span class="font-medium text-slate-800">{{ usdText() }}</span>
    @if (bcv.tasaActual()) {
      <span class="text-slate-400 mx-1">/</span>
      <span class="text-sm text-slate-500">{{ bsText() }}</span>
    }
  `,
  host: { class: 'inline-flex items-center' },
  imports: [],
})
export class DualCurrencyDisplayComponent {
  readonly monto   = input.required<number>();
  readonly tasa    = input<number | undefined>();
  readonly bcv     = inject(TasaBcvService);
  readonly usdText = computed(() => this.bcv.formatUsd(this.monto()));
  readonly bsText  = computed(() => this.bcv.formatBs(this.monto(), this.tasa()));
}
