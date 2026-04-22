import { Component, inject, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MockDataService } from '../../core/services/mock-data.service';
import { TasaBcvService } from '../../core/services/tasa-bcv.service';
import { AuthMockService } from '../../core/services/auth-mock.service';
import { LoadingSkeletonComponent } from '../../shared/components/loading-skeleton/loading-skeleton.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ProveedorDialogComponent } from './proveedor-dialog.component';
import { RegistrarCompraDialogComponent } from './registrar-compra-dialog.component';
import { Material } from '../../core/models';

// Tabla MRP: cantidad de material por par de bota
const MRP_RECETA: { nombre: string; porPar: number; unidad: string; materialId: string }[] = [
  { nombre: 'PVC (kg)',              porPar: 0.8,  unidad: 'kg',    materialId: 'mat6' },
  { nombre: 'Suela caucho (par)',    porPar: 1,    unidad: 'pares', materialId: 'mat3' },
  { nombre: 'Hilo encerado (rollo)', porPar: 0.05, unidad: 'rollo', materialId: 'mat4' },
  { nombre: 'Plantilla (par)',       porPar: 1,    unidad: 'pares', materialId: 'mat5' },
  { nombre: 'Cuero vacuno (dm²)',    porPar: 8,    unidad: 'dm²',   materialId: 'mat1' },
  { nombre: 'Cuero sintético (dm²)', porPar: 6,    unidad: 'dm²',   materialId: 'mat2' },
  { nombre: 'Pegamento (litro)',     porPar: 0.05, unidad: 'litro', materialId: 'mat8' },
  { nombre: 'Resina PVC amarilla (kg)', porPar: 0.2, unidad: 'kg',  materialId: 'mat7' },
];

@Component({
  selector: 'app-compras',
  template: `
    <div class="space-y-4">

      <mat-tab-group animationDuration="200ms">

        <!-- TAB 1: Materiales -->
        <mat-tab label="Materiales">
          <div class="pt-4 space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-slate-500">{{ materiales().length }} materias primas</p>
              @if (auth.esAdmin()) {
                <button mat-flat-button color="primary" (click)="abrirRegistrarCompra()">
                  <mat-icon>add_shopping_cart</mat-icon> Registrar compra
                </button>
              }
            </div>

            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              @if (!materiales().length) {
                <app-loading-skeleton [count]="5" class="p-5 block" />
              } @else {
                <table class="w-full text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Material</th>
                      <th class="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unidad</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock actual</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Stock mín.</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Costo USD</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      @if (auth.esAdmin()) {
                        <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acción</th>
                      }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (m of materiales(); track m.id) {
                      @let bajo = (m.stock_minimo ?? 0) > 0 && m.stock_actual < (m.stock_minimo ?? 0);
                      <tr class="hover:bg-slate-50 transition-colors {{ bajo ? 'bg-red-50/30' : '' }}">
                        <td class="px-5 py-3 font-medium text-slate-800">{{ m.nombre }}</td>
                        <td class="px-4 py-3 text-center text-slate-500 text-xs">{{ m.unidad }}</td>
                        <td class="px-5 py-3 text-right font-bold {{ bajo ? 'text-red-600' : 'text-slate-800' }}">
                          {{ m.stock_actual | number:'1.0-2' }}
                        </td>
                        <td class="px-5 py-3 text-right text-slate-400 hidden md:table-cell">
                          {{ m.stock_minimo ?? '—' }}
                        </td>
                        <td class="px-5 py-3 text-right text-slate-600 hidden md:table-cell">
                          @if (m.costo_unitario_usd) { {{ bcv.formatUsd(m.costo_unitario_usd) }} }
                          @else { — }
                        </td>
                        <td class="px-5 py-3 text-center">
                          @if (bajo) {
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Reabastecer</span>
                          } @else {
                            <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">OK</span>
                          }
                        </td>
                        @if (auth.esAdmin()) {
                          <td class="px-3 py-3 text-center">
                            <button mat-icon-button (click)="abrirRegistrarCompra(m)" title="Registrar compra">
                              <mat-icon class="!text-base text-primary">add_shopping_cart</mat-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </mat-tab>

        <!-- TAB 2: Proveedores -->
        <mat-tab label="Proveedores">
          <div class="pt-4 space-y-4">
            <div class="flex items-center justify-between">
              <p class="text-sm text-slate-500">{{ proveedores().length }} proveedores registrados</p>
              @if (auth.esAdmin()) {
                <button mat-flat-button color="primary" (click)="abrirProveedorDialog()">
                  <mat-icon>add</mat-icon> Nuevo proveedor
                </button>
              }
            </div>

            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              @if (!proveedores().length) {
                <app-loading-skeleton [count]="3" class="p-5 block" />
              } @else {
                <table class="w-full text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">RIF</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Teléfono</th>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                      <th class="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      @if (auth.esAdmin()) {
                        <th class="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Acciones</th>
                      }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (p of proveedores(); track p.id) {
                      <tr class="hover:bg-slate-50 transition-colors">
                        <td class="px-5 py-3 font-semibold text-slate-800">{{ p.nombre }}</td>
                        <td class="px-5 py-3 font-mono text-xs text-slate-500 hidden sm:table-cell">{{ p.rif ?? '—' }}</td>
                        <td class="px-5 py-3 text-slate-500 hidden md:table-cell">{{ p.telefono ?? '—' }}</td>
                        <td class="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{{ p.email ?? '—' }}</td>
                        <td class="px-5 py-3 text-center">
                          <span class="text-xs font-semibold px-2 py-0.5 rounded-full
                                       {{ p.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500' }}">
                            {{ p.activo ? 'Activo' : 'Inactivo' }}
                          </span>
                        </td>
                        @if (auth.esAdmin()) {
                          <td class="px-3 py-3 text-center">
                            <button mat-icon-button (click)="abrirProveedorDialog(p)">
                              <mat-icon class="!text-base text-slate-500">edit</mat-icon>
                            </button>
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              }
            </div>
          </div>
        </mat-tab>

        <!-- TAB 3: MRP -->
        <mat-tab label="MRP">
          <div class="pt-4 space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p class="text-sm font-semibold text-blue-800 mb-1">Calculadora de necesidades de producción</p>
              <p class="text-xs text-blue-600">Ingresa cuántos pares necesitas producir para ver qué materiales hay que comprar.</p>
            </div>

            <div class="flex items-center gap-3">
              <mat-form-field appearance="outline" class="w-48">
                <mat-label>Pares de botas</mat-label>
                <input matInput type="number" min="1" [(ngModel)]="paresInput" placeholder="100" />
              </mat-form-field>
              <button mat-flat-button color="primary" (click)="calcularMRP()">
                <mat-icon>calculate</mat-icon> Calcular materiales
              </button>
            </div>

            @if (mrpResultados().length) {
              <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p class="font-semibold text-slate-800">Materiales necesarios para {{ paresCalculados() }} pares</p>
                  <span class="text-xs text-red-600 font-medium">
                    {{ mrpResultados().filter(r => r.aComprar > 0).length }} materiales a comprar
                  </span>
                </div>
                <table class="w-full text-sm">
                  <thead class="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th class="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Material</th>
                      <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Por par</th>
                      <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total necesario</th>
                      <th class="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock actual</th>
                      <th class="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">A comprar</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (r of mrpResultados(); track r.nombre) {
                      <tr class="hover:bg-slate-50 {{ r.aComprar > 0 ? 'bg-red-50/20' : '' }}">
                        <td class="px-5 py-3 text-slate-800">{{ r.nombre }}</td>
                        <td class="px-4 py-3 text-right text-slate-500">{{ r.porPar }}</td>
                        <td class="px-4 py-3 text-right text-slate-700 font-medium">{{ r.totalNecesario }}</td>
                        <td class="px-4 py-3 text-right {{ r.stockActual < r.totalNecesario ? 'text-red-600' : 'text-emerald-600' }}">
                          {{ r.stockActual }}
                        </td>
                        <td class="px-5 py-3 text-right font-bold {{ r.aComprar > 0 ? 'text-red-600' : 'text-emerald-600' }}">
                          {{ r.aComprar > 0 ? r.aComprar : '—' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  imports: [
    DecimalPipe, FormsModule,
    MatIconModule, MatButtonModule, MatTabsModule,
    MatFormFieldModule, MatInputModule,
    MatDialogModule, MatSnackBarModule,
    LoadingSkeletonComponent,
  ],
})
export class ComprasComponent {
  private readonly svc    = inject(MockDataService);
  readonly bcv            = inject(TasaBcvService);
  readonly auth           = inject(AuthMockService);
  private readonly dialog = inject(MatDialog);
  private readonly snack  = inject(MatSnackBar);

  readonly materiales  = toSignal(this.svc.getMateriales(),   { initialValue: [] });
  readonly proveedores = toSignal(this.svc.getProveedores(),  { initialValue: [] });

  paresInput    = 100;
  paresCalculados = signal(0);
  mrpResultados   = signal<any[]>([]);

  calcularMRP() {
    const pares = this.paresInput || 0;
    if (pares <= 0) return;
    this.paresCalculados.set(pares);

    const mats = this.materiales();
    const resultados = MRP_RECETA.map(receta => {
      const mat = mats.find(m => m.id === receta.materialId);
      const stockActual = mat?.stock_actual ?? 0;
      const totalNecesario = Math.ceil(pares * receta.porPar);
      return {
        nombre: receta.nombre,
        porPar: receta.porPar,
        totalNecesario,
        stockActual,
        aComprar: Math.max(0, totalNecesario - stockActual),
      };
    });
    this.mrpResultados.set(resultados);
  }

  abrirProveedorDialog(proveedor?: any) {
    const ref = this.dialog.open(ProveedorDialogComponent, {
      data: proveedor ?? null, width: '480px',
    });
    ref.afterClosed().subscribe((data) => {
      if (!data) return;
      if (proveedor?.id) {
        this.svc.actualizarProveedor(proveedor.id, data).subscribe({
          next: () => this.snack.open('Proveedor actualizado', 'OK', { duration: 3000 }),
          error: () => this.snack.open('Error al actualizar', 'Cerrar', { duration: 3000 }),
        });
      } else {
        this.svc.crearProveedor(data).subscribe({
          next: () => this.snack.open('Proveedor creado', 'OK', { duration: 3000 }),
          error: () => this.snack.open('Error al crear', 'Cerrar', { duration: 3000 }),
        });
      }
    });
  }

  abrirRegistrarCompra(material?: Material) {
    const ref = this.dialog.open(RegistrarCompraDialogComponent, {
      data: {
        materiales: this.materiales(),
        proveedores: this.proveedores(),
        materialId: material?.id,
      },
      width: '500px',
    });
    ref.afterClosed().subscribe((data) => {
      if (!data) return;
      const prov = this.proveedores().find(p => p.id === data.proveedorId);
      this.svc.registrarCompraMateria(data.materialId, data.cantidad, prov?.nombre ?? '', data.precioTotal).subscribe({
        next: () => this.snack.open(`Compra registrada: +${data.cantidad} unidades`, 'OK', { duration: 3000 }),
        error: () => this.snack.open('Error al registrar compra', 'Cerrar', { duration: 3000 }),
      });
    });
  }
}
