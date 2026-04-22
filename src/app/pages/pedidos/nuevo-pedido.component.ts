import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormArray } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSnackBar } from '@angular/material/snack-bar';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';
import { MockDataService } from '../../core/services/mock-data.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { Producto } from '../../core/models';
import { TasaBcvChipComponent } from '../../shared/components/tasa-bcv-chip/tasa-bcv-chip.component';

interface ItemForm { producto: Producto; cantidad: number; precio_unitario_usd: number; descuento: number }

@Component({
  selector: 'app-nuevo-pedido',
  template: `
    <div class="max-w-3xl mx-auto">

      <!-- Header -->
      <div class="flex items-center gap-3 mb-5">
        <button mat-icon-button (click)="volver()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 class="text-lg font-bold text-slate-800">Nuevo Pedido</h2>
      </div>

      <mat-stepper [linear]="true" #stepper class="rounded-xl shadow-sm border border-slate-200">

        <!-- ═══ PASO 1: Cliente y configuración ═══════════════════════════ -->
        <mat-step [stepControl]="paso1" label="Cliente y configuración">
          <form [formGroup]="paso1" class="p-4 space-y-4">

            <!-- Cliente autocomplete -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Cliente *</mat-label>
              <input matInput [matAutocomplete]="clienteAuto" [formControl]="buscarClienteCtrl"
                     placeholder="Buscar por nombre o RIF…" />
              <mat-icon matSuffix>search</mat-icon>
              <mat-autocomplete #clienteAuto (optionSelected)="seleccionarCliente($event.option.value)" [displayWith]="displayCliente">
                @for (c of clientesFiltrados(); track c.id) {
                  <mat-option [value]="c">
                    <span class="font-medium">{{ c.razon_social }}</span>
                    <span class="text-slate-400 text-xs ml-2">{{ c.rif }}</span>
                  </mat-option>
                }
              </mat-autocomplete>
              @if (paso1.get('cliente_id')?.hasError('required') && paso1.get('cliente_id')?.touched) {
                <mat-error>Seleccione un cliente</mat-error>
              }
            </mat-form-field>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <!-- Fecha vencimiento -->
              <mat-form-field appearance="outline">
                <mat-label>Fecha de vencimiento</mat-label>
                <input matInput type="date" formControlName="fecha_vencimiento" [min]="hoy" />
              </mat-form-field>

              <!-- Descuento general -->
              <mat-form-field appearance="outline">
                <mat-label>Descuento general (%)</mat-label>
                <input matInput type="number" formControlName="descuento_porcentaje" min="0" max="100" />
                <span matSuffix class="ml-1">%</span>
              </mat-form-field>

              <!-- Número guía -->
              <mat-form-field appearance="outline">
                <mat-label>Número de guía</mat-label>
                <input matInput formControlName="numero_guia" placeholder="MRW-000000" />
              </mat-form-field>

            </div>

            <!-- Tiene factura -->
            <div class="flex items-center gap-3">
              <mat-slide-toggle formControlName="tiene_factura" color="primary">
                Tiene factura
              </mat-slide-toggle>
            </div>

            @if (paso1.get('tiene_factura')?.value) {
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <mat-form-field appearance="outline">
                  <mat-label>Número de factura</mat-label>
                  <input matInput formControlName="numero_factura" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tipo de pago factura</mat-label>
                  <mat-select formControlName="tipo_pago_factura">
                    <mat-option value="transferencia">Transferencia</mat-option>
                    <mat-option value="efectivo_usd">Efectivo USD</mat-option>
                    <mat-option value="efectivo_bs">Efectivo Bs.</mat-option>
                    <mat-option value="retencion">Retención</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            }

            <!-- Notas -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Notas (opcional)</mat-label>
              <textarea matInput formControlName="notas" rows="2"></textarea>
            </mat-form-field>

            <div class="flex justify-end">
              <button mat-flat-button matStepperNext color="primary"
                      [disabled]="!paso1.get('cliente_id')?.value">
                Siguiente <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </form>
        </mat-step>

        <!-- ═══ PASO 2: Productos ═══════════════════════════════════════ -->
        <mat-step label="Productos">
          <div class="p-4 space-y-4">

            <!-- Buscador de producto -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Agregar producto (SKU o nombre)</mat-label>
              <input matInput [matAutocomplete]="prodAuto" [formControl]="buscarProductoCtrl"
                     placeholder="BT-40-NGR-IND o Bota Industrial…" />
              <mat-icon matSuffix>add_shopping_cart</mat-icon>
              <mat-autocomplete #prodAuto (optionSelected)="agregarItem($event.option.value)"
                                [displayWith]="displayProducto">
                @for (p of productosFiltrados(); track p.id) {
                  <mat-option [value]="p">
                    <div class="flex items-center gap-3 py-1">
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-sm">{{ p.nombre }}</p>
                        <p class="font-mono text-xs text-slate-400">{{ p.sku }}</p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="text-sm font-semibold">{{ bcv.formatUsd(p.precio_usd) }}</p>
                        <span class="text-xs px-1.5 rounded {{ p.stock_actual === 0 ? 'bg-red-100 text-red-600' : p.stock_actual <= p.stock_minimo ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600' }}">
                          Stock: {{ p.stock_actual }}
                        </span>
                      </div>
                    </div>
                  </mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>

            <!-- Tabla de items -->
            @if (items().length) {
              <div class="overflow-x-auto rounded-lg border border-slate-200">
                <table class="w-full text-sm">
                  <thead class="bg-slate-50">
                    <tr>
                      <th class="text-left px-3 py-2 text-xs text-slate-500 font-semibold uppercase">Producto</th>
                      <th class="text-center px-3 py-2 text-xs text-slate-500 font-semibold uppercase hidden sm:table-cell">Stock</th>
                      <th class="text-center px-3 py-2 text-xs text-slate-500 font-semibold uppercase">Cantidad</th>
                      <th class="text-right px-3 py-2 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">Precio USD</th>
                      <th class="text-center px-3 py-2 text-xs text-slate-500 font-semibold uppercase hidden md:table-cell">Desc%</th>
                      <th class="text-right px-3 py-2 text-xs text-slate-500 font-semibold uppercase">Subtotal</th>
                      <th class="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (item of items(); track item.producto.id; let i = $index) {
                      <tr>
                        <td class="px-3 py-2">
                          <p class="font-medium text-slate-800 text-xs">{{ item.producto.nombre }}</p>
                          <p class="font-mono text-xs text-slate-400">{{ item.producto.sku }}</p>
                        </td>
                        <td class="px-3 py-2 text-center hidden sm:table-cell">
                          <span class="text-xs font-semibold {{ item.producto.stock_actual === 0 ? 'text-red-600' : item.producto.stock_actual <= item.producto.stock_minimo ? 'text-amber-600' : 'text-emerald-600' }}">
                            {{ item.producto.stock_actual }}
                          </span>
                        </td>
                        <td class="px-3 py-2 text-center">
                          <input type="number" [value]="item.cantidad"
                                 (change)="actualizarCantidad(i, +$any($event.target).value)"
                                 min="1" [max]="item.producto.stock_actual || 999"
                                 class="w-16 text-center border border-slate-300 rounded p-1 text-sm focus:border-primary focus:outline-none" />
                        </td>
                        <td class="px-3 py-2 text-right hidden md:table-cell">
                          <input type="number" [value]="item.precio_unitario_usd"
                                 (change)="actualizarPrecio(i, +$any($event.target).value)"
                                 min="0.01" step="0.01"
                                 class="w-20 text-right border border-slate-300 rounded p-1 text-sm focus:border-primary focus:outline-none" />
                        </td>
                        <td class="px-3 py-2 text-center hidden md:table-cell">
                          <input type="number" [value]="item.descuento"
                                 (change)="actualizarDescuento(i, +$any($event.target).value)"
                                 min="0" max="100"
                                 class="w-14 text-center border border-slate-300 rounded p-1 text-sm focus:border-primary focus:outline-none" />
                        </td>
                        <td class="px-3 py-2 text-right font-semibold text-slate-800">
                          {{ bcv.formatUsd(subtotalItem(item)) }}
                        </td>
                        <td class="px-2 py-2">
                          <button (click)="eliminarItem(i)" class="text-red-400 hover:text-red-600 transition-colors">
                            <mat-icon class="!text-base">delete</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Resumen totales -->
              <div class="bg-slate-50 rounded-lg p-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-slate-500">Subtotal</span>
                  <span class="font-medium">{{ bcv.formatUsd(subtotalBruto()) }}</span>
                </div>
                @if ((paso1.get('descuento_porcentaje')?.value ?? 0) > 0) {
                  <div class="flex justify-between text-sm text-red-500">
                    <span>Descuento general ({{ paso1.get('descuento_porcentaje')?.value }}%)</span>
                    <span>– {{ bcv.formatUsd(montoDescuento()) }}</span>
                  </div>
                }
                <div class="flex justify-between items-center border-t border-slate-200 pt-2 mt-2">
                  <span class="text-base font-bold text-slate-800">TOTAL USD</span>
                  <span class="text-2xl font-bold text-primary">{{ bcv.formatUsd(totalUsd()) }}</span>
                </div>
                @if (bcv.tasaActual(); as tasa) {
                  <div class="flex justify-between items-center text-sm text-slate-500">
                    <div class="flex items-center gap-2">
                      <span>TOTAL Bs.</span>
                      <app-tasa-bcv-chip />
                    </div>
                    <span class="font-semibold">{{ bcv.formatBs(totalUsd()) }}</span>
                  </div>
                }
              </div>
            } @else {
              <div class="text-center py-12 text-slate-400">
                <mat-icon class="!text-5xl mb-2">shopping_cart</mat-icon>
                <p>Agrega productos usando el buscador</p>
              </div>
            }

            <div class="flex justify-between">
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon> Atrás
              </button>
              <button mat-flat-button matStepperNext color="primary" [disabled]="!items().length">
                Siguiente <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </mat-step>

        <!-- ═══ PASO 3: Confirmación ═══════════════════════════════════ -->
        <mat-step label="Confirmación">
          <div class="p-4 space-y-4">

            <!-- Resumen -->
            <div class="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 class="font-semibold text-slate-700">Resumen del pedido</h4>

              <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p class="text-slate-400 text-xs">Cliente</p>
                  <p class="font-medium text-slate-800">{{ clienteSeleccionado()?.razon_social }}</p>
                </div>
                @if (paso1.get('fecha_vencimiento')?.value) {
                  <div>
                    <p class="text-slate-400 text-xs">Vencimiento</p>
                    <p class="font-medium text-slate-800">{{ paso1.get('fecha_vencimiento')?.value }}</p>
                  </div>
                }
                <div>
                  <p class="text-slate-400 text-xs">Productos</p>
                  <p class="font-medium text-slate-800">{{ items().length }} SKU(s) distintos</p>
                </div>
                <div>
                  <p class="text-slate-400 text-xs">Total USD</p>
                  <p class="text-lg font-bold text-primary">{{ bcv.formatUsd(totalUsd()) }}</p>
                </div>
              </div>

              <!-- Lista de items resumida -->
              <div class="space-y-1">
                @for (item of items(); track item.producto.id) {
                  <div class="flex justify-between text-xs text-slate-600 py-1 border-b border-slate-100">
                    <span>{{ item.producto.nombre }} × {{ item.cantidad }}</span>
                    <span class="font-semibold">{{ bcv.formatUsd(subtotalItem(item)) }}</span>
                  </div>
                }
              </div>
            </div>

            <!-- Acción -->
            <div class="bg-white rounded-xl border border-slate-200 p-4">
              <p class="text-sm font-semibold text-slate-700 mb-3">¿Cómo deseas guardar el pedido?</p>
              <div class="flex flex-col sm:flex-row gap-3">
                <button (click)="accionSeleccionada.set('borrador')"
                        class="flex-1 rounded-lg border-2 p-3 text-left transition-all cursor-pointer
                               {{ accionSeleccionada() === 'borrador' ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300' }}">
                  <p class="font-semibold text-sm text-slate-800">Guardar como borrador</p>
                  <p class="text-xs text-slate-400 mt-0.5">Puedes modificarlo antes de enviarlo</p>
                </button>
                <button (click)="accionSeleccionada.set('en_aprobacion')"
                        class="flex-1 rounded-lg border-2 p-3 text-left transition-all cursor-pointer
                               {{ accionSeleccionada() === 'en_aprobacion' ? 'border-accent bg-accent/5' : 'border-slate-200 hover:border-slate-300' }}">
                  <p class="font-semibold text-sm text-slate-800">Enviar a aprobación</p>
                  <p class="text-xs text-slate-400 mt-0.5">El gerente recibirá el pedido para revisar</p>
                </button>
              </div>
            </div>

            <div class="flex justify-between">
              <button mat-button matStepperPrevious>
                <mat-icon>arrow_back</mat-icon> Atrás
              </button>
              <button mat-flat-button color="primary" (click)="confirmar()"
                      [disabled]="guardando()">
                <mat-icon class="mr-1">{{ guardando() ? 'hourglass_empty' : 'check' }}</mat-icon>
                {{ guardando() ? 'Guardando…' : 'Confirmar pedido' }}
              </button>
            </div>

          </div>
        </mat-step>

      </mat-stepper>
    </div>
  `,
  imports: [
    ReactiveFormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatSlideToggleModule, MatRadioModule, MatAutocompleteModule,
    TasaBcvChipComponent,
  ],
})
export class NuevoPedidoComponent implements OnInit {
  private readonly svc    = inject(MockDataService);
  private readonly auth   = inject(AuthMockService);
  private readonly router = inject(Router);
  private readonly route  = inject(ActivatedRoute);
  private readonly snack  = inject(MatSnackBar);
  readonly bcv            = inject(TasaBcvService);

  readonly hoy = new Date().toISOString().slice(0, 10);
  readonly guardando          = signal(false);
  readonly accionSeleccionada = signal<'borrador' | 'en_aprobacion'>('en_aprobacion');
  readonly items              = signal<ItemForm[]>([]);
  readonly clienteSeleccionado = signal<any>(null);

  readonly buscarClienteCtrl  = new FormControl('');
  readonly buscarProductoCtrl = new FormControl('');

  private readonly fb = inject(FormBuilder);

  readonly paso1 = this.fb.nonNullable.group({
    cliente_id:          ['', Validators.required],
    fecha_vencimiento:   [''],
    descuento_porcentaje:[0, [Validators.min(0), Validators.max(100)]],
    tiene_factura:       [false],
    numero_factura:      [''],
    tipo_pago_factura:   [''],
    numero_guia:         [''],
    notas:               [''],
  });

  private readonly _clientes = toSignal(
    this.svc.getClientes(
      this.auth.hasRole('vendedor') ? (this.auth.usuarioActual()?.id ?? undefined) : undefined,
    ),
    { initialValue: [] },
  );

  private readonly _productos = toSignal(this.svc.getProductos(), { initialValue: [] });

  readonly clientesFiltrados = toSignal(
    this.buscarClienteCtrl.valueChanges.pipe(
      startWith(''),
      map(q => {
        const s = (typeof q === 'string' ? q : (q as any)?.razon_social ?? '').toLowerCase();
        return this._clientes().filter(c =>
          c.razon_social.toLowerCase().includes(s) || c.rif.toLowerCase().includes(s),
        ).slice(0, 8);
      }),
    ),
    { initialValue: [] },
  );

  readonly productosFiltrados = toSignal(
    this.buscarProductoCtrl.valueChanges.pipe(
      startWith(''),
      map(q => {
        const s = (typeof q === 'string' ? q : '').toLowerCase();
        if (!s) return this._productos().filter(p => p.activo).slice(0, 10);
        return this._productos().filter(p =>
          p.activo && (p.sku.toLowerCase().includes(s) || p.nombre.toLowerCase().includes(s)),
        ).slice(0, 8);
      }),
    ),
    { initialValue: [] },
  );

  ngOnInit(): void {
    // Pre-seleccionar cliente si viene por queryParam
    this.route.queryParamMap.subscribe(params => {
      const clienteId = params.get('clienteId');
      if (clienteId) {
        this.svc.getCliente(clienteId).subscribe(c => {
          this.clienteSeleccionado.set(c);
          this.paso1.patchValue({ cliente_id: c.id });
          this.buscarClienteCtrl.setValue(c.razon_social as any, { emitEvent: false });
        });
      }
    });
  }

  seleccionarCliente(c: any): void {
    this.clienteSeleccionado.set(c);
    this.paso1.patchValue({ cliente_id: c.id });
    this.buscarClienteCtrl.setValue(c.razon_social, { emitEvent: false });
  }

  displayCliente(c: any): string { return c?.razon_social ?? ''; }
  displayProducto(p: any): string { return p?.nombre ?? ''; }

  agregarItem(prod: Producto): void {
    const existing = this.items().findIndex(i => i.producto.id === prod.id);
    if (existing >= 0) {
      this.actualizarCantidad(existing, this.items()[existing].cantidad + 1);
    } else {
      this.items.update(list => [...list, {
        producto: prod,
        cantidad: 1,
        precio_unitario_usd: prod.precio_usd,
        descuento: 0,
      }]);
    }
    this.buscarProductoCtrl.reset('');
  }

  actualizarCantidad(i: number, val: number): void {
    this.items.update(list => list.map((item, idx) =>
      idx === i ? { ...item, cantidad: Math.max(1, Math.min(val, item.producto.stock_actual || 999)) } : item,
    ));
  }

  actualizarPrecio(i: number, val: number): void {
    this.items.update(list => list.map((item, idx) =>
      idx === i ? { ...item, precio_unitario_usd: Math.max(0, val) } : item,
    ));
  }

  actualizarDescuento(i: number, val: number): void {
    this.items.update(list => list.map((item, idx) =>
      idx === i ? { ...item, descuento: Math.max(0, Math.min(100, val)) } : item,
    ));
  }

  eliminarItem(i: number): void {
    this.items.update(list => list.filter((_, idx) => idx !== i));
  }

  subtotalItem(item: ItemForm): number {
    return item.cantidad * item.precio_unitario_usd * (1 - item.descuento / 100);
  }

  readonly subtotalBruto = computed(() => this.items().reduce((s, i) => s + this.subtotalItem(i), 0));
  readonly montoDescuento = computed(() => this.subtotalBruto() * (this.paso1.get('descuento_porcentaje')?.value ?? 0) / 100);
  readonly totalUsd = computed(() => this.subtotalBruto() - this.montoDescuento());

  confirmar(): void {
    if (!this.items().length) return;
    this.guardando.set(true);

    const v = this.paso1.getRawValue();
    const tasa = this.bcv.tasaActual()?.promedio;
    const total = this.totalUsd();

    this.svc.crearPedido({
      cliente_id:          v.cliente_id,
      vendedor_id:         this.auth.usuarioActual()?.id ?? '',
      status:              this.accionSeleccionada(),
      tiene_factura:       v.tiene_factura,
      numero_factura:      v.numero_factura || undefined,
      tipo_pago_factura:   v.tipo_pago_factura || undefined,
      numero_guia:         v.numero_guia || undefined,
      descuento_porcentaje: v.descuento_porcentaje,
      fecha_vencimiento:   v.fecha_vencimiento || undefined,
      notas:               v.notas || undefined,
      total_usd:           total,
      total_bs:            tasa ? total * tasa : undefined,
      tasa_bcv:            tasa,
      factura_pagada:      false,
    }).subscribe(pedido => {
      // Registrar los items en el mock
      this.svc.agregarItemsPedido(
        pedido.id,
        this.items().map(i => ({
          producto_id:        i.producto.id,
          cantidad:           i.cantidad,
          precio_unitario_usd: i.precio_unitario_usd,
          descuento:          i.descuento,
          subtotal_usd:       this.subtotalItem(i),
        })),
      );

      this.guardando.set(false);
      this.snack.open('Pedido creado exitosamente', 'Ver', { duration: 4000 })
        .onAction().subscribe(() => this.router.navigate(['/pedidos', pedido.id]));
      this.router.navigate(['/pedidos', pedido.id]);
    });
  }

  volver(): void { this.router.navigate(['/pedidos']); }
}
