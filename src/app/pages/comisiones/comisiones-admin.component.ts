import { Component, inject, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { Comision, ConfigComisionMetodoPago } from '../../core/models';

@Component({
  selector: 'app-comisiones-admin',
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Gestionar Comisiones</h2>
          <p class="text-xs text-slate-500">Vista de administrador — todos los vendedores</p>
        </div>
      </div>

      <!-- KPI Cards -->
      <div data-tour="comisiones-admin-kpis" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p class="text-xs text-slate-500 uppercase font-semibold mb-1">Total generado</p>
          <p class="text-2xl font-bold text-slate-800">{{ bcv.formatUsd(kpiTotal()) }}</p>
        </div>
        <div class="bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm p-4">
          <p class="text-xs text-emerald-600 uppercase font-semibold mb-1">Pagadas</p>
          <p class="text-2xl font-bold text-emerald-700">{{ bcv.formatUsd(kpiPagadas()) }}</p>
        </div>
        <div class="bg-amber-50 rounded-xl border border-amber-200 shadow-sm p-4">
          <p class="text-xs text-amber-600 uppercase font-semibold mb-1">Pendientes</p>
          <p class="text-2xl font-bold text-amber-700">{{ bcv.formatUsd(kpiPendientes()) }}</p>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 shadow-sm p-4">
          <p class="text-xs text-blue-600 uppercase font-semibold mb-1">Registradas</p>
          <p class="text-2xl font-bold text-blue-700">{{ comisionesRaw().length }}</p>
        </div>
      </div>

      <!-- Filtros -->
      <div data-tour="comisiones-admin-filtros" class="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div class="flex flex-wrap gap-3 items-end">
          <mat-form-field appearance="outline" class="!w-44">
            <mat-label>Vendedor</mat-label>
            <mat-select [(ngModel)]="filtroVendedor">
              <mat-option value="">Todos</mat-option>
              @for (v of vendedores(); track v.id) {
                <mat-option [value]="v.id">{{ v.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="!w-40">
            <mat-label>Estado</mat-label>
            <mat-select [(ngModel)]="filtroEstado">
              <mat-option value="">Todos</mat-option>
              <mat-option value="pendiente">Pendiente</mat-option>
              <mat-option value="pagada">Pagada</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="!w-40">
            <mat-label>Método pago</mat-label>
            <mat-select [(ngModel)]="filtroMetodo">
              <mat-option value="">Todos</mat-option>
              <mat-option value="transferencia">Transferencia</mat-option>
              <mat-option value="efectivo_usd">Efectivo USD</mat-option>
              <mat-option value="efectivo_bs">Efectivo Bs.</mat-option>
              <mat-option value="retencion">Retención</mat-option>
            </mat-select>
          </mat-form-field>

          @if (filtroVendedor || filtroEstado || filtroMetodo) {
            <button mat-stroked-button (click)="limpiarFiltros()" class="mb-5">
              <mat-icon>clear</mat-icon> Limpiar
            </button>
          }
        </div>
      </div>

      <!-- Tabla de comisiones -->
      <div data-tour="comisiones-admin-tabla" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-700">
            Comisiones ({{ comisionesFiltradas().length }})
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Pedido</th>
                <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">Vendedor</th>
                <th class="text-left px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden lg:table-cell">Método Pago</th>
                <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase hidden lg:table-cell">% Original</th>
                <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase">% Final</th>
                <th class="text-right px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Monto</th>
                <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Pagada</th>
                <th class="text-center px-4 py-3 text-xs text-slate-500 font-semibold uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (c of comisionesFiltradas(); track c.id) {
                <tr class="hover:bg-slate-50 transition-colors">

                  <!-- Pedido -->
                  <td class="px-4 py-3">
                    <p class="font-semibold text-slate-800 text-xs">
                      {{ c.pedido?.numero_pedido ?? c.pedido_id }}
                    </p>
                    <p class="text-xs text-slate-400 mt-0.5">
                      {{ c.pedido?.cliente?.razon_social ?? '—' }}
                    </p>
                    @if (c.tiene_descuento) {
                      <span class="inline-flex items-center gap-0.5 text-xs text-orange-600 bg-orange-50 rounded px-1 mt-0.5">
                        <mat-icon class="!text-xs !w-3 !h-3">discount</mat-icon> c/desc.
                      </span>
                    }
                  </td>

                  <!-- Vendedor -->
                  <td class="px-4 py-3 hidden md:table-cell">
                    <p class="text-sm text-slate-700">{{ nombreVendedor(c.vendedor_id) }}</p>
                  </td>

                  <!-- Método pago -->
                  <td class="px-4 py-3 hidden lg:table-cell">
                    <span class="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5">
                      {{ labelMetodoPago(c.metodo_pago) }}
                    </span>
                  </td>

                  <!-- % Original -->
                  <td class="px-4 py-3 text-center hidden lg:table-cell">
                    <span class="text-xs text-slate-500">{{ c.porcentaje_original ?? c.porcentaje }}%</span>
                  </td>

                  <!-- % Final (editable) -->
                  <td class="px-4 py-3 text-center">
                    @if (editandoId() === c.id) {
                      <div class="flex items-center gap-1 justify-center">
                        <input
                          type="number" min="0" max="100" step="0.5"
                          [(ngModel)]="editPorcentaje"
                          class="w-14 text-center border border-primary rounded p-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <span class="text-xs text-slate-400">%</span>
                      </div>
                    } @else {
                      <div class="flex items-center gap-1 justify-center">
                        <span class="font-semibold text-slate-800">{{ c.porcentaje }}%</span>
                        @if (c.editado_por_admin) {
                          <mat-icon class="!text-xs !w-3.5 !h-3.5 text-blue-500"
                                    matTooltip="Editado por admin">edit</mat-icon>
                        }
                      </div>
                    }
                  </td>

                  <!-- Monto -->
                  <td class="px-4 py-3 text-right">
                    <span class="font-bold text-slate-800">{{ bcv.formatUsd(c.monto_usd) }}</span>
                  </td>

                  <!-- Pagada toggle -->
                  <td class="px-4 py-3 text-center">
                    <mat-slide-toggle
                      [checked]="c.pagada"
                      (change)="togglePagada(c, $event.checked)"
                      color="primary"
                      [matTooltip]="c.pagada ? ('Pagada el ' + (c.fecha_pago_comision ?? '')) : 'Marcar como pagada'"
                    />
                  </td>

                  <!-- Acciones -->
                  <td class="px-4 py-3 text-center">
                    @if (editandoId() === c.id) {
                      <div class="flex gap-1 justify-center">
                        <button mat-icon-button color="primary" (click)="guardarEdicion(c)"
                                matTooltip="Guardar">
                          <mat-icon class="!text-base">check</mat-icon>
                        </button>
                        <button mat-icon-button (click)="cancelarEdicion()"
                                matTooltip="Cancelar">
                          <mat-icon class="!text-base">close</mat-icon>
                        </button>
                      </div>
                    } @else {
                      <button mat-icon-button (click)="iniciarEdicion(c)"
                              matTooltip="Editar porcentaje">
                        <mat-icon class="!text-base text-slate-400">edit</mat-icon>
                      </button>
                    }
                  </td>

                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="px-4 py-10 text-center text-slate-400">
                    <mat-icon class="!text-4xl mb-2 block mx-auto">percent</mat-icon>
                    <p>No hay comisiones con estos filtros</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Configuración de tasas de comisión -->
      <div data-tour="comisiones-admin-config" class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-semibold text-slate-700 flex items-center gap-2">
            <mat-icon class="text-slate-400">tune</mat-icon>
            Tasas de comisión por método de pago
          </h3>
          <button mat-flat-button color="primary" size="small" (click)="guardarConfiguracion()"
                  [disabled]="guardandoConfig()">
            <mat-icon>save</mat-icon>
            {{ guardandoConfig() ? 'Guardando…' : 'Guardar configuración' }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="text-left px-5 py-3 text-xs text-slate-500 font-semibold uppercase">Método de pago</th>
                <th class="text-center px-5 py-3 text-xs text-slate-500 font-semibold uppercase">% Sin descuento</th>
                <th class="text-center px-5 py-3 text-xs text-slate-500 font-semibold uppercase">% Con descuento</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (cfg of configEditable(); track cfg.metodo_pago; let i = $index) {
                <tr class="hover:bg-slate-50">
                  <td class="px-5 py-3">
                    <p class="font-medium text-slate-800">{{ cfg.label }}</p>
                    <p class="text-xs text-slate-400 font-mono">{{ cfg.metodo_pago }}</p>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <input type="number" min="0" max="100" step="0.5"
                             [(ngModel)]="configEditable()[i].porcentaje_sin_descuento"
                             class="w-16 text-center border border-slate-300 rounded p-1 text-sm focus:border-primary focus:outline-none" />
                      <span class="text-slate-400 text-xs">%</span>
                    </div>
                  </td>
                  <td class="px-5 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <input type="number" min="0" max="100" step="0.5"
                             [(ngModel)]="configEditable()[i].porcentaje_con_descuento"
                             class="w-16 text-center border border-slate-300 rounded p-1 text-sm focus:border-primary focus:outline-none" />
                      <span class="text-slate-400 text-xs">%</span>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p class="text-xs text-slate-400">
            <mat-icon class="!text-xs !w-3.5 !h-3.5 align-middle">info</mat-icon>
            Los cambios aplican a nuevas comisiones generadas automáticamente. Las existentes no se modifican.
          </p>
        </div>
      </div>

    </div>
  `,
  imports: [
    FormsModule,
    MatIconModule, MatButtonModule, MatSelectModule, MatFormFieldModule,
    MatInputModule, MatSlideToggleModule, MatTooltipModule,
  ],
})
export class ComisionesAdminComponent {
  private readonly svc   = inject(MockDataService);
  private readonly snack = inject(MatSnackBar);
  readonly bcv           = inject(TasaBcvService);

  readonly comisionesRaw = toSignal(this.svc.getComisiones(), { initialValue: [] });
  readonly vendedoresAll = toSignal(this.svc.getVendedores(), { initialValue: [] });
  readonly configRaw     = toSignal(this.svc.getConfigComisiones(), { initialValue: [] });

  filtroVendedor = '';
  filtroEstado   = '';
  filtroMetodo   = '';

  readonly editandoId     = signal<string | null>(null);
  readonly guardandoConfig = signal(false);
  editPorcentaje = 0;

  readonly configEditable = signal<ConfigComisionMetodoPago[]>([]);

  constructor() {
    // Inicializar copia editable de la configuración
    this.svc.getConfigComisiones().subscribe(cfg => {
      if (this.editandoId() === null) {
        this.configEditable.set(cfg.map(c => ({ ...c })));
      }
    });
  }

  readonly vendedores = computed(() => this.vendedoresAll());

  readonly comisionesFiltradas = computed(() => {
    let lista = this.comisionesRaw();
    if (this.filtroVendedor) lista = lista.filter(c => c.vendedor_id === this.filtroVendedor);
    if (this.filtroEstado === 'pagada')   lista = lista.filter(c =>  c.pagada);
    if (this.filtroEstado === 'pendiente') lista = lista.filter(c => !c.pagada);
    if (this.filtroMetodo) lista = lista.filter(c => c.metodo_pago === this.filtroMetodo);
    return lista;
  });

  readonly kpiTotal     = computed(() => this.comisionesRaw().reduce((s, c) => s + c.monto_usd, 0));
  readonly kpiPagadas   = computed(() => this.comisionesRaw().filter(c => c.pagada).reduce((s, c) => s + c.monto_usd, 0));
  readonly kpiPendientes = computed(() => this.comisionesRaw().filter(c => !c.pagada).reduce((s, c) => s + c.monto_usd, 0));

  nombreVendedor(vendedorId: string): string {
    return this.vendedoresAll().find(v => v.id === vendedorId)?.nombre ?? vendedorId;
  }

  labelMetodoPago(metodo?: string): string {
    const map: Record<string, string> = {
      transferencia: 'Transferencia',
      efectivo_usd:  'Efectivo USD',
      efectivo_bs:   'Efectivo Bs.',
      retencion:     'Retención',
    };
    return metodo ? (map[metodo] ?? metodo) : '—';
  }

  limpiarFiltros(): void {
    this.filtroVendedor = '';
    this.filtroEstado   = '';
    this.filtroMetodo   = '';
  }

  iniciarEdicion(c: Comision): void {
    this.editandoId.set(c.id);
    this.editPorcentaje = c.porcentaje;
  }

  cancelarEdicion(): void {
    this.editandoId.set(null);
  }

  guardarEdicion(c: Comision): void {
    const pedidoTotal = c.pedido?.total_usd ?? 0;
    const monto = Math.round(pedidoTotal * this.editPorcentaje * 100) / 10000;
    this.svc.actualizarComision(c.id, {
      porcentaje: this.editPorcentaje,
      monto_usd:  monto,
    }).subscribe(() => {
      this.editandoId.set(null);
      this.snack.open('Comisión actualizada', '', { duration: 2500 });
    });
  }

  togglePagada(c: Comision, pagada: boolean): void {
    this.svc.marcarComisionPagada(c.id, pagada).subscribe(() => {
      this.snack.open(
        pagada ? 'Comisión marcada como pagada' : 'Comisión marcada como pendiente',
        '', { duration: 2500 },
      );
    });
  }

  guardarConfiguracion(): void {
    this.guardandoConfig.set(true);
    this.svc.actualizarConfigComisiones(this.configEditable()).subscribe(() => {
      this.guardandoConfig.set(false);
      this.snack.open('Configuración de comisiones guardada', '', { duration: 3000 });
    });
  }
}
