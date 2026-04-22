import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { EstadoPedidoBadgeComponent } from '../../shared/components/estado-pedido-badge/estado-pedido-badge.component';
import { AlertaVencimientoComponent } from '../../shared/components/alerta-vencimiento/alerta-vencimiento.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cuentas-por-vencer',
  template: `
    <div class="space-y-4">

      <!-- Header + export -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Cuentas por vencer</h2>
          <p class="text-xs text-slate-500">{{ pendientes().length }} pedidos con saldo pendiente</p>
        </div>
        <button mat-stroked-button (click)="exportarCsv()" [disabled]="!pendientes().length">
          <mat-icon>download</mat-icon> Exportar CSV
        </button>
      </div>

      <!-- Resumen por urgencia -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (g of grupos(); track g.label) {
          <div class="bg-white rounded-xl border {{ g.borderColor }} shadow-sm p-4 cursor-pointer transition-all
                      {{ filtroDias() === g.key ? 'ring-2 ring-offset-1 ' + g.ring : '' }}"
               (click)="filtroDias.set(filtroDias() === g.key ? '' : g.key)">
            <p class="text-xs font-semibold {{ g.textColor }} uppercase mb-1">{{ g.label }}</p>
            <p class="text-xl font-bold text-slate-800">{{ g.count }}</p>
            <p class="text-sm text-slate-500">{{ bcv.formatUsd(g.monto) }}</p>
          </div>
        }
      </div>

      <!-- Filtros -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3 flex-wrap">
        <mat-form-field appearance="outline" class="flex-1 min-w-40">
          <mat-label>Buscar cliente o pedido…</mat-label>
          <input matInput [(ngModel)]="busqueda" placeholder="Nombre, RIF o número" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="min-w-44">
          <mat-label>Vendedor</mat-label>
          <mat-select [(ngModel)]="filtroVendedor">
            <mat-option value="">Todos</mat-option>
            @for (v of vendedoresDisponibles(); track v.id) {
              <mat-option [value]="v.id">{{ v.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="min-w-36">
          <mat-label>Zona</mat-label>
          <mat-select [(ngModel)]="filtroZona">
            <mat-option value="">Todas</mat-option>
            @for (z of zonasDisponibles(); track z) {
              <mat-option [value]="z">{{ z }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (filtrosActivos()) {
          <button mat-stroked-button (click)="limpiarFiltros()" class="self-center">
            <mat-icon>clear</mat-icon> Limpiar
          </button>
        }
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <mat-icon class="text-red-500">event_busy</mat-icon>
          <h3 class="font-semibold text-slate-800">Pedidos pendientes de cobro</h3>
          @if (filtrados().length !== pendientes().length) {
            <span class="ml-auto text-xs text-slate-400">{{ filtrados().length }} de {{ pendientes().length }}</span>
          }
        </div>

        @if (!filtrados().length) {
          <app-empty-state titulo="Todo al día" subtitulo="No hay pedidos pendientes con esos filtros" />
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Pedido</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Cliente</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden lg:table-cell">Vendedor</th>
                <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase hidden xl:table-cell">Zona</th>
                <th class="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vencimiento</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Total</th>
                <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Saldo</th>
                <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (p of filtrados(); track p.id) {
                @let vencido = (p.dias_para_vencer ?? 99) < 0;
                @let urgente = (p.dias_para_vencer ?? 99) <= 3 && !vencido;
                <tr class="hover:bg-slate-50 transition-colors {{ vencido ? 'bg-red-50/20' : urgente ? 'bg-orange-50/20' : '' }}">
                  <td class="px-5 py-3">
                    <p class="font-mono text-xs font-semibold text-slate-700">{{ p.numero_pedido }}</p>
                    <app-estado-pedido-badge [status]="p.status" />
                  </td>
                  <td class="px-5 py-3 hidden md:table-cell">
                    <p class="text-sm text-slate-800 font-medium">{{ p.cliente?.razon_social ?? '—' }}</p>
                    <p class="text-xs text-slate-400">{{ p.cliente?.rif }}</p>
                  </td>
                  <td class="px-5 py-3 text-slate-600 text-sm hidden lg:table-cell">{{ p.vendedor?.nombre ?? '—' }}</td>
                  <td class="px-5 py-3 text-slate-500 text-xs hidden xl:table-cell">{{ p.cliente?.zona?.nombre ?? '—' }}</td>
                  <td class="px-5 py-3 text-center">
                    @if (p.fecha_vencimiento) {
                      <p class="text-xs text-slate-500 mb-1">{{ p.fecha_vencimiento | date:'dd/MM/yyyy' }}</p>
                    }
                    <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
                  </td>
                  <td class="px-5 py-3 text-right text-slate-600">{{ bcv.formatUsd(p.total_usd) }}</td>
                  <td class="px-5 py-3 text-right font-bold {{ vencido ? 'text-red-600' : urgente ? 'text-orange-600' : 'text-slate-800' }}">
                    {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}
                  </td>
                  <td class="px-3 py-3 text-center">
                    <button mat-icon-button
                            [class.opacity-30]="recordatoriosEnviados().has(p.id)"
                            [disabled]="recordatoriosEnviados().has(p.id)"
                            (click)="enviarRecordatorio(p)"
                            [title]="recordatoriosEnviados().has(p.id) ? 'Recordatorio enviado' : 'Enviar recordatorio'">
                      <mat-icon class="!text-base {{ recordatoriosEnviados().has(p.id) ? 'text-emerald-400' : 'text-slate-400' }}">
                        {{ recordatoriosEnviados().has(p.id) ? 'mark_email_read' : 'mail_outline' }}
                      </mat-icon>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Totales al pie -->
          <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm">
            <span class="text-slate-500">{{ filtrados().length }} pedidos filtrados</span>
            <span class="font-bold text-slate-800">
              Saldo total: {{ bcv.formatUsd(saldoTotal()) }}
            </span>
          </div>
        }
      </div>
    </div>
  `,
  imports: [
    DatePipe, FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule, MatInputModule,
    MatSnackBarModule,
    EstadoPedidoBadgeComponent, AlertaVencimientoComponent, EmptyStateComponent,
  ],
})
export class CuentasPorVencerComponent {
  private readonly svc = inject(MockDataService);
  readonly bcv         = inject(TasaBcvService);
  private readonly snack = inject(MatSnackBar);

  private readonly pedidos = toSignal(this.svc.getPedidos(), { initialValue: [] });

  busqueda       = '';
  filtroVendedor = '';
  filtroZona     = '';
  filtroDias     = signal('');
  recordatoriosEnviados = signal(new Set<string>());

  readonly pendientes = computed(() =>
    this.pedidos()
      .filter(p => !['cancelado', 'borrador', 'entregado'].includes(p.status) && (p.saldo_pendiente_usd ?? 0) > 0)
      .sort((a, b) => (a.dias_para_vencer ?? 999) - (b.dias_para_vencer ?? 999)),
  );

  readonly vendedoresDisponibles = computed(() => {
    const ids = [...new Set(this.pendientes().map(p => p.vendedor_id))];
    return this.pendientes()
      .filter((p, i, arr) => ids.includes(p.vendedor_id) && arr.findIndex(x => x.vendedor_id === p.vendedor_id) === i)
      .map(p => ({ id: p.vendedor_id, nombre: p.vendedor?.nombre ?? p.vendedor_id }));
  });

  readonly zonasDisponibles = computed(() =>
    [...new Set(this.pendientes().map(p => p.cliente?.zona?.nombre).filter(Boolean))] as string[]
  );

  readonly filtrosActivos = computed(() =>
    !!this.busqueda || !!this.filtroVendedor || !!this.filtroZona || !!this.filtroDias()
  );

  readonly filtrados = computed(() => {
    const q = this.busqueda.toLowerCase().trim();
    const vend = this.filtroVendedor;
    const zona = this.filtroZona;
    const dias = this.filtroDias();

    return this.pendientes().filter(p => {
      if (vend && p.vendedor_id !== vend) return false;
      if (zona && p.cliente?.zona?.nombre !== zona) return false;
      if (dias) {
        const d = p.dias_para_vencer ?? 999;
        if (dias === 'vencidos' && d >= 0) return false;
        if (dias === 'hoy3' && !(d >= 0 && d <= 3)) return false;
        if (dias === 'semana' && !(d > 3 && d <= 7)) return false;
        if (dias === 'resto' && d <= 7) return false;
      }
      if (q) {
        const match =
          (p.numero_pedido ?? '').toLowerCase().includes(q) ||
          (p.cliente?.razon_social ?? '').toLowerCase().includes(q) ||
          (p.cliente?.rif ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  });

  readonly grupos = computed(() => {
    const ps = this.pendientes();
    const vencidos = ps.filter(p => (p.dias_para_vencer ?? 0) < 0);
    const hoy3     = ps.filter(p => { const d = p.dias_para_vencer ?? 99; return d >= 0 && d <= 3; });
    const semana   = ps.filter(p => { const d = p.dias_para_vencer ?? 99; return d > 3 && d <= 7; });
    const resto    = ps.filter(p => (p.dias_para_vencer ?? 99) > 7);
    const sum = (arr: typeof ps) => arr.reduce((s, p) => s + (p.saldo_pendiente_usd ?? 0), 0);

    return [
      { key: 'vencidos', label: 'Vencidos',  count: vencidos.length, monto: sum(vencidos), borderColor: 'border-red-300',    textColor: 'text-red-600',    ring: 'ring-red-400'    },
      { key: 'hoy3',     label: '0–3 días',  count: hoy3.length,     monto: sum(hoy3),     borderColor: 'border-orange-300', textColor: 'text-orange-600', ring: 'ring-orange-400' },
      { key: 'semana',   label: '4–7 días',  count: semana.length,   monto: sum(semana),   borderColor: 'border-yellow-300', textColor: 'text-yellow-600', ring: 'ring-yellow-400' },
      { key: 'resto',    label: '+ 7 días',  count: resto.length,    monto: sum(resto),    borderColor: 'border-slate-200',  textColor: 'text-slate-500',  ring: 'ring-slate-400'  },
    ];
  });

  readonly saldoTotal = computed(() =>
    this.filtrados().reduce((s, p) => s + (p.saldo_pendiente_usd ?? 0), 0)
  );

  limpiarFiltros() {
    this.busqueda = '';
    this.filtroVendedor = '';
    this.filtroZona = '';
    this.filtroDias.set('');
  }

  enviarRecordatorio(pedido: any) {
    // Marcar en el mock que se envió recordatorio (solo estado local)
    const set = new Set(this.recordatoriosEnviados());
    set.add(pedido.id);
    this.recordatoriosEnviados.set(set);
    this.snack.open(
      `Recordatorio enviado al cliente ${pedido.cliente?.razon_social ?? pedido.cliente_id}`,
      'OK',
      { duration: 3500 },
    );
  }

  exportarCsv() {
    const rows = this.filtrados();
    if (!rows.length) return;

    const headers = ['Pedido', 'Cliente', 'RIF', 'Zona', 'Vendedor', 'Estado', 'Fecha vencimiento', 'Días para vencer', 'Total USD', 'Saldo USD'];
    const data = rows.map(p => [
      p.numero_pedido,
      p.cliente?.razon_social ?? '',
      p.cliente?.rif ?? '',
      p.cliente?.zona?.nombre ?? '',
      p.vendedor?.nombre ?? '',
      p.status,
      p.fecha_vencimiento ?? '',
      p.dias_para_vencer ?? '',
      p.total_usd.toFixed(2),
      (p.saldo_pendiente_usd ?? 0).toFixed(2),
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cuentas-por-vencer-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.snack.open(`CSV exportado con ${rows.length} registros`, 'OK', { duration: 3000 });
  }
}
