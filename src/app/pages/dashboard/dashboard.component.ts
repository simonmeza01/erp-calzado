import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  Chart,
  BarController, LineController, DoughnutController,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend,
} from 'chart.js';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { AlertaVencimientoComponent } from '../../shared/components/alerta-vencimiento/alerta-vencimiento.component';

// Registrar módulos de Chart.js
Chart.register(
  BarController, LineController, DoughnutController,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend,
);

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="space-y-6">

      <!-- Filtro mes / año -->
      <div data-tour="dashboard-filtros" class="flex items-center gap-3 flex-wrap">
        <div class="flex-1">
          <h2 class="text-lg font-bold text-slate-800">Dashboard</h2>
          <p class="text-xs text-slate-500">Panel de control y métricas del negocio</p>
        </div>
        <mat-form-field appearance="outline" class="!w-32">
          <mat-label>Mes</mat-label>
          <mat-select [(ngModel)]="filtroMes">
            @for (m of meses; track $index) {
              <mat-option [value]="$index + 1">{{ m }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="!w-28">
          <mat-label>Año</mat-label>
          <mat-select [(ngModel)]="filtroAnio">
            <mat-option [value]="2026">2026</mat-option>
            <mat-option [value]="2025">2025</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- KPI cards Row 1 -->
      <div data-tour="dashboard-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (kpi of kpis(); track kpi.label) {
          <div class="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">{{ kpi.label }}</span>
              <span class="w-8 h-8 rounded-lg flex items-center justify-center {{ kpi.bgIcon }}">
                <mat-icon class="!text-lg {{ kpi.colorIcon }}">{{ kpi.icon }}</mat-icon>
              </span>
            </div>
            <p class="text-2xl font-bold text-slate-800">{{ kpi.valor }}</p>
            <p class="text-xs text-slate-400 mt-0.5">{{ kpi.sub }}</p>
          </div>
        }
      </div>

      <!-- Row 2: Gráficas -->
      <div data-tour="dashboard-graficos" class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Bar chart: Ventas 6 meses -->
        <div class="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-semibold text-slate-800 mb-4">Ventas últimos 6 meses (USD)</h3>
          @if (cargando()) {
            <div class="h-48 bg-slate-100 rounded-lg animate-pulse"></div>
          } @else {
            <canvas baseChart
              [data]="barChartData()"
              [options]="barChartOptions"
              type="bar"
              class="max-h-56">
            </canvas>
          }
        </div>

        <!-- Doughnut: USD vs Bs -->
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 class="font-semibold text-slate-800 mb-4">Distribución de pagos</h3>
          @if (cargando()) {
            <div class="h-48 bg-slate-100 rounded-lg animate-pulse"></div>
          } @else {
            <canvas baseChart
              [data]="doughnutChartData()"
              [options]="doughnutOptions"
              type="doughnut"
              class="max-h-56">
            </canvas>
          }
        </div>
      </div>

      <!-- Row 3: Tablas analíticas -->

      <!-- Cuentas por vencer -->
      <div data-tour="dashboard-cuentas-vencer" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <mat-icon class="text-red-500">event_busy</mat-icon>
          <h3 class="font-semibold text-slate-800">Cuentas por vencer</h3>
          @if (cuentasPorVencer().length) {
            <span class="ml-auto bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {{ cuentasPorVencer().length }}
            </span>
          }
        </div>
        @if (cuentasPorVencer().length === 0) {
          <p class="px-5 py-6 text-sm text-slate-400 text-center">Sin cuentas pendientes 🎉</p>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Vendedor</th>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Cliente</th>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Pedido</th>
                <th class="text-center px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Vence en</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Saldo USD</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (p of cuentasPorVencer().slice(0, 10); track p.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-5 py-2 text-xs text-slate-600">{{ p.vendedor?.nombre ?? '—' }}</td>
                  <td class="px-5 py-2 text-xs text-slate-600 hidden md:table-cell">{{ p.cliente?.razon_social ?? '—' }}</td>
                  <td class="px-5 py-2 text-xs font-mono text-slate-500 hidden sm:table-cell">{{ p.numero_pedido }}</td>
                  <td class="px-5 py-2 text-center">
                    <app-alerta-vencimiento [dias]="p.dias_para_vencer" />
                  </td>
                  <td class="px-5 py-2 text-right font-semibold text-slate-800">
                    {{ bcv.formatUsd(p.saldo_pendiente_usd ?? 0) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Top clientes (admin/gerente) -->
      @if (auth.esGerente()) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <mat-icon class="text-blue-500">people</mat-icon>
            <h3 class="font-semibold text-slate-800">Top clientes por volumen</h3>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase">#</th>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Zona</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Total comprado</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Pedidos</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (c of topClientes(); track c.id; let i = $index) {
                <tr class="hover:bg-slate-50">
                  <td class="px-5 py-2 text-slate-400 font-bold">{{ i + 1 }}</td>
                  <td class="px-5 py-2 font-medium text-slate-800">{{ c.razon_social }}</td>
                  <td class="px-5 py-2 text-slate-500 text-xs hidden md:table-cell">{{ c.zona || '—' }}</td>
                  <td class="px-5 py-2 text-right font-semibold text-slate-800">{{ bcv.formatUsd(c.totalComprado) }}</td>
                  <td class="px-5 py-2 text-right text-slate-500 hidden sm:table-cell">{{ c.numeroPedidos }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Vendedores con más deuda -->
        <div data-tour="dashboard-vendedores" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <mat-icon class="text-orange-500">person_alert</mat-icon>
            <h3 class="font-semibold text-slate-800">Vendedores — deuda pendiente</h3>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Vendedor</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase">Deuda total USD</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden sm:table-cell">Ped. activos</th>
                <th class="text-right px-5 py-2 text-xs font-semibold text-slate-500 uppercase hidden md:table-cell">Comisión mes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (v of vendedoresDeuda(); track v.id) {
                <tr class="hover:bg-slate-50">
                  <td class="px-5 py-2 font-medium text-slate-800">{{ v.nombre }}</td>
                  <td class="px-5 py-2 text-right font-bold {{ v.deuda > 0 ? 'text-red-600' : 'text-slate-400' }}">
                    {{ bcv.formatUsd(v.deuda) }}
                  </td>
                  <td class="px-5 py-2 text-right text-slate-500 hidden sm:table-cell">{{ v.pedidosActivos }}</td>
                  <td class="px-5 py-2 text-right text-emerald-600 font-medium hidden md:table-cell">
                    {{ bcv.formatUsd(v.comisionMes) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Row 4: Solo admin — Utilidad del mes -->
      @if (auth.esAdmin()) {
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div class="flex items-center gap-2 mb-4">
            <mat-icon class="text-emerald-500">trending_up</mat-icon>
            <h3 class="font-semibold text-slate-800">Utilidad del mes</h3>
            <span class="text-xs text-slate-400 ml-2">(solo admin)</span>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            @for (u of utilidad(); track u.label) {
              <div class="text-center p-3 bg-slate-50 rounded-xl">
                <p class="text-xs text-slate-500 mb-1">{{ u.label }}</p>
                <p class="text-lg font-bold {{ u.color }}">{{ u.valor }}</p>
              </div>
            }
          </div>
          <!-- Línea utilidad 12 meses -->
          <h4 class="text-sm font-semibold text-slate-600 mb-3">Utilidad mensual (12 meses)</h4>
          @if (cargando()) {
            <div class="h-40 bg-slate-100 rounded-lg animate-pulse"></div>
          } @else {
            <canvas baseChart
              [data]="lineChartData()"
              [options]="lineChartOptions"
              type="line"
              class="max-h-48">
            </canvas>
          }
        </div>
      }

    </div>
  `,
  imports: [
    FormsModule,
    MatIconModule, MatButtonModule, MatFormFieldModule, MatSelectModule,
    BaseChartDirective,
    AlertaVencimientoComponent,
  ],
})
export class DashboardComponent implements OnInit {
  readonly svc  = inject(MockDataService);
  readonly bcv  = inject(TasaBcvService);
  readonly auth = inject(AuthMockService);

  readonly meses = MESES;

  filtroMes  = new Date().getMonth() + 1;
  filtroAnio = 2026;

  cargando = signal(true);

  private readonly pedidos  = toSignal(this.svc.getPedidos(),  { initialValue: [] });
  private readonly pagos    = toSignal(this.svc.getPagos(),    { initialValue: [] });
  private readonly clientes = toSignal(this.svc.getClientes(), { initialValue: [] });
  private readonly comisiones = toSignal(this.svc.getComisiones(), { initialValue: [] });
  private readonly vendedores = toSignal(this.svc.getVendedores(), { initialValue: [] });
  private readonly productos  = toSignal(this.svc.getProductos(),  { initialValue: [] });

  ngOnInit() {
    setTimeout(() => this.cargando.set(false), 400);
  }

  // ─── KPI cards ──────────────────────────────────────────────────────────────

  readonly kpis = computed(() => {
    const ps = this.pedidos();
    const filtMes = this.filtroMes;
    const filtAnio = this.filtroAnio;

    const esMes = (fecha: string) => {
      const d = new Date(fecha);
      return d.getFullYear() === filtAnio && d.getMonth() + 1 === filtMes;
    };

    const delMes  = ps.filter(p => esMes(p.created_at));
    const ingresosUsd = delMes
      .filter(p => ['entregado', 'en_transito'].includes(p.status))
      .reduce((s, p) => s + p.total_usd, 0);

    const pagadosATiempo = delMes.filter(p =>
      p.status === 'entregado' && p.factura_fiscal?.status_pago === 'pagada' &&
      (p.dias_para_vencer === undefined || p.dias_para_vencer >= 0)
    ).length;

    const totalEntregados = delMes.filter(p => p.status === 'entregado').length;

    const saldoPendiente = ps
      .filter(p => !['cancelado', 'borrador'].includes(p.status))
      .reduce((s, p) => s + (p.saldo_pendiente_usd ?? 0), 0);

    const pendientesCobro = ps.filter(p =>
      !['cancelado', 'borrador', 'entregado'].includes(p.status) && (p.saldo_pendiente_usd ?? 0) > 0
    ).length;

    return [
      {
        label: 'Ingresos del mes',
        valor: this.bcv.formatUsd(ingresosUsd),
        sub: `${MESES[filtMes - 1]} ${filtAnio}`,
        icon: 'attach_money',
        bgIcon: 'bg-emerald-50',
        colorIcon: 'text-emerald-500',
      },
      {
        label: 'Ingresos en Bs',
        valor: this.bcv.formatBs(ingresosUsd),
        sub: `Tasa: ${this.bcv.tasaActual()?.promedio?.toFixed(2) ?? 'N/D'}`,
        icon: 'currency_exchange',
        bgIcon: 'bg-blue-50',
        colorIcon: 'text-blue-500',
      },
      {
        label: 'Pagados a tiempo',
        valor: totalEntregados > 0 ? `${pagadosATiempo}/${totalEntregados}` : '—',
        sub: 'Entregados del mes',
        icon: 'check_circle',
        bgIcon: 'bg-emerald-50',
        colorIcon: 'text-emerald-500',
      },
      {
        label: 'Por cobrar',
        valor: pendientesCobro,
        sub: `${this.bcv.formatUsd(saldoPendiente)} pendiente`,
        icon: 'account_balance_wallet',
        bgIcon: 'bg-amber-50',
        colorIcon: 'text-amber-500',
      },
    ];
  });

  // ─── Cuentas por vencer ──────────────────────────────────────────────────────

  readonly cuentasPorVencer = computed(() =>
    this.pedidos()
      .filter(p => !['cancelado', 'borrador'].includes(p.status) && (p.saldo_pendiente_usd ?? 0) > 0)
      .sort((a, b) => (a.dias_para_vencer ?? 999) - (b.dias_para_vencer ?? 999))
  );

  // ─── Top clientes ─────────────────────────────────────────────────────────

  readonly topClientes = computed(() => {
    const ps = this.pedidos().filter(p => p.status !== 'cancelado');
    const map = new Map<string, { id: string; razon_social: string; zona: string; totalComprado: number; numeroPedidos: number }>();

    for (const p of ps) {
      if (!p.cliente_id) continue;
      const existing = map.get(p.cliente_id);
      const nombre = p.cliente?.razon_social ?? p.cliente_id;
      const zona = p.cliente?.estado ?? '';
      if (existing) {
        existing.totalComprado += p.total_usd;
        existing.numeroPedidos++;
      } else {
        map.set(p.cliente_id, { id: p.cliente_id, razon_social: nombre, zona, totalComprado: p.total_usd, numeroPedidos: 1 });
      }
    }

    return [...map.values()].sort((a, b) => b.totalComprado - a.totalComprado).slice(0, 8);
  });

  // ─── Vendedores deuda ────────────────────────────────────────────────────

  readonly vendedoresDeuda = computed(() => {
    const vends = this.vendedores();
    const ps = this.pedidos();
    const coms = this.comisiones();
    const mes = this.filtroMes;
    const anio = this.filtroAnio;

    return vends.map(v => {
      const misPedidos = ps.filter(p => p.vendedor_id === v.id);
      const deuda = misPedidos
        .filter(p => !['cancelado', 'borrador', 'entregado'].includes(p.status))
        .reduce((s, p) => s + (p.saldo_pendiente_usd ?? 0), 0);
      const pedidosActivos = misPedidos.filter(p => !['cancelado', 'entregado'].includes(p.status)).length;
      const comisionMes = coms
        .filter(c => {
          if (c.vendedor_id !== v.id) return false;
          const d = new Date(c.created_at);
          return d.getFullYear() === anio && d.getMonth() + 1 === mes;
        })
        .reduce((s, c) => s + c.monto_usd, 0);
      return { id: v.id, nombre: v.nombre, deuda, pedidosActivos, comisionMes };
    }).sort((a, b) => b.deuda - a.deuda);
  });

  // ─── Utilidad (solo admin) ────────────────────────────────────────────────

  readonly utilidad = computed(() => {
    const mes = this.filtroMes;
    const anio = this.filtroAnio;
    const ps = this.pedidos().filter(p => {
      const d = new Date(p.created_at);
      return d.getFullYear() === anio && d.getMonth() + 1 === mes && p.status === 'entregado';
    });

    const ingresos = ps.reduce((s, p) => s + p.total_usd, 0);
    const costo = ps.reduce((s, p) => {
      const items = p.items ?? [];
      return s + items.reduce((si, i) => {
        const prod = this.productos().find(pr => pr.id === i.producto_id);
        return si + i.cantidad * (prod?.costo_usd ?? 0);
      }, 0);
    }, 0);
    const utilBruta = ingresos - costo;
    const margen = ingresos > 0 ? (utilBruta / ingresos * 100) : 0;

    return [
      { label: 'Ingresos entregados', valor: this.bcv.formatUsd(ingresos), color: 'text-slate-800' },
      { label: 'Costo mercancía',     valor: this.bcv.formatUsd(costo),    color: 'text-red-600'   },
      { label: 'Utilidad bruta',      valor: this.bcv.formatUsd(utilBruta), color: 'text-emerald-600' },
      { label: 'Margen',              valor: `${margen.toFixed(1)}%`,      color: margen >= 20 ? 'text-emerald-600' : 'text-amber-600' },
    ];
  });

  // ─── Charts ────────────────────────────────────────────────────────────────

  readonly barChartData = computed((): ChartData<'bar'> => {
    const ps = this.pedidos();
    const anio = this.filtroAnio;
    const hoyMes = new Date().getMonth();

    // últimos 6 meses antes del mes actual (o filtroMes)
    const mesesLabels: string[] = [];
    const valores: number[] = [];
    for (let i = 5; i >= 0; i--) {
      const m = ((this.filtroMes - 1 - i + 12) % 12);
      const y = m >= this.filtroMes - 1 ? anio : anio;
      mesesLabels.push(MESES[m]);
      const total = ps
        .filter(p => {
          const d = new Date(p.created_at);
          return d.getMonth() === m && !['cancelado', 'borrador'].includes(p.status);
        })
        .reduce((s, p) => s + p.total_usd, 0);
      valores.push(Math.round(total));
    }

    return {
      labels: mesesLabels,
      datasets: [{
        data: valores,
        label: 'Ventas USD',
        backgroundColor: 'rgba(99,102,241,0.7)',
        borderColor: 'rgba(99,102,241,1)',
        borderWidth: 1,
        borderRadius: 6,
      }],
    };
  });

  readonly barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };

  readonly doughnutChartData = computed((): ChartData<'doughnut'> => {
    const ps = this.pagos();
    let totalUsd = 0;
    let totalBs  = 0;
    for (const p of ps) {
      if (p.moneda === 'usd') totalUsd += p.monto_usd ?? 0;
      else totalBs += (p.monto_bs ?? 0) / (p.tasa_cambio ?? 41.5);
    }
    return {
      labels: ['USD', 'Bolívares (equiv.)'],
      datasets: [{
        data: [Math.round(totalUsd * 100) / 100, Math.round(totalBs * 100) / 100],
        backgroundColor: ['rgba(16,185,129,0.8)', 'rgba(245,158,11,0.8)'],
        borderWidth: 0,
      }],
    };
  });

  readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const },
    },
    cutout: '65%',
  };

  readonly lineChartData = computed((): ChartData<'line'> => {
    const ps = this.pedidos();
    const prods = this.productos();
    const anio = this.filtroAnio;
    const labels: string[] = [];
    const valores: number[] = [];

    for (let m = 0; m < 12; m++) {
      labels.push(MESES[m]);
      const entregados = ps.filter(p => {
        const d = new Date(p.created_at);
        return d.getFullYear() === anio && d.getMonth() === m && p.status === 'entregado';
      });
      const ingresos = entregados.reduce((s, p) => s + p.total_usd, 0);
      const costo = entregados.reduce((s, p) => {
        const items = p.items ?? [];
        return s + items.reduce((si, i) => {
          const prod = prods.find(pr => pr.id === i.producto_id);
          return si + i.cantidad * (prod?.costo_usd ?? 0);
        }, 0);
      }, 0);
      valores.push(Math.round(ingresos - costo));
    }

    return {
      labels,
      datasets: [{
        data: valores,
        label: 'Utilidad USD',
        borderColor: 'rgba(16,185,129,1)',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      }],
    };
  });

  readonly lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
      x: { grid: { display: false } },
    },
  };
}
