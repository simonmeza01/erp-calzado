import {
  Component, OnDestroy, inject, signal, computed, effect, afterNextRender,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { differenceInDays, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import * as L from 'leaflet';
import { MockDataService } from '../../core/services/mock-data.service';
import { Cliente, Pedido, Usuario } from '../../core/models';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

// ─── Constantes ──────────────────────────────────────────────────────────────

const ZONA_COLORES: Record<string, string> = {
  'Norte':  '#1E3A5F',
  'Sur':    '#15803d',
  'Este':   '#854d0e',
  'Oeste':  '#9d174d',
  'Centro': '#4b5563',
};

const FABRICA = { lat: 10.5050, lng: -66.8300 };

const FILTROS = [
  { label: 'Todos',           value: 'todos' },
  { label: 'Con deuda',       value: 'condeuda' },
  { label: 'Por vencer',      value: 'porvencer' },
  { label: 'Sin visitar 7d',  value: 'sinvisitar7' },
  { label: 'Sin visitar 14d', value: 'sinvisitar14' },
];

type ModoVista  = 'pines' | 'ruta' | 'calor' | 'sinvisitar';
type ClienteMap = Cliente & { _tieneAlerta?: boolean };

interface RutaResumen {
  clientes: Cliente[];
  distancia_total_km: number;
  tiempo_estimado_min: number;
  monto_total_cobrar_usd: number;
}

// ─── Componente ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-mapa-rutas',
  styles: [`:host { display: block; height: calc(100vh - 112px); overflow: hidden; }`],
  template: `
<div class="flex h-full overflow-hidden bg-slate-100">

  <!-- ── Panel izquierdo ────────────────────────────────────────────────── -->
  <div class="w-[280px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden shadow-sm">

    <!-- Selector de vendedor -->
    <div class="p-3 border-b border-slate-100">
      <mat-form-field class="w-full" appearance="outline" subscriptSizing="dynamic">
        <mat-label>Vendedor</mat-label>
        <mat-select [value]="vendedorSel()" (selectionChange)="onVendedorChange($event.value)">
          <mat-option value="all">Todos los vendedores</mat-option>
          @for (v of vendedores(); track v.id) {
            <mat-option [value]="v.id">{{ v.nombre }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Chips de filtro -->
    <div class="px-3 py-2 border-b border-slate-100">
      <div class="flex flex-wrap gap-1.5">
        @for (f of filtros; track f.value) {
          <button (click)="filtroActivo.set(f.value)"
                  class="px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
                  [class.bg-primary]="filtroActivo() === f.value"
                  [class.text-white]="filtroActivo() === f.value"
                  [class.bg-slate-100]="filtroActivo() !== f.value"
                  [class.text-slate-600]="filtroActivo() !== f.value">
            {{ f.label }}
          </button>
        }
      </div>
    </div>

    <!-- Resumen de ruta (condicional) -->
    @if (rutaData(); as ruta) {
      <div class="mx-3 mt-3 p-3 rounded-lg border border-primary/20 bg-primary/5 text-sm flex-shrink-0">
        <div class="text-[10px] font-semibold text-primary uppercase tracking-wide mb-1">Ruta del día</div>
        <div class="text-slate-700 text-xs">{{ ruta.clientes.length }} clientes · ~{{ ruta.tiempo_estimado_min }} min · {{ ruta.distancia_total_km }} km</div>
        <div class="text-green-700 font-semibold text-sm mt-1">{{ fUsd(ruta.monto_total_cobrar_usd) }} en cobros</div>
      </div>
    }

    <!-- Lista de clientes -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1.5 mt-1">
      @for (c of clientesFiltrados(); track c.id; let i = $index) {
        <div (click)="centrarEnCliente(c)"
             class="p-2.5 rounded-lg border border-slate-100 hover:border-primary/40 hover:bg-slate-50
                    cursor-pointer transition-all select-none">
          <div class="flex items-start gap-2">
            <!-- Número orden / color zona -->
            <div class="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                        text-white text-[10px] font-bold mt-0.5"
                 [style.background]="zonaColor(c.zona?.nombre)">
              {{ i + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-slate-800 truncate leading-tight">{{ c.razon_social }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">
                {{ c.zona?.nombre ?? '—' }} ·
                <span [class]="visitaClase(c.ultima_visita)">
                  @if (c.ultima_visita) { {{ c.ultima_visita | timeAgo }} } @else { Sin visita }
                </span>
              </p>
              @if ((c.saldo_pendiente_usd ?? 0) > 0) {
                <p class="text-[10px] font-semibold text-red-600 mt-0.5">{{ fUsd(c.saldo_pendiente_usd ?? 0) }} pendiente</p>
              } @else {
                <p class="text-[10px] text-green-600 mt-0.5">Al día</p>
              }
              @if (c._tieneAlerta) {
                <p class="text-[10px] font-semibold text-amber-600 mt-0.5">⚡ Pedido por vencer</p>
              }
            </div>
          </div>
        </div>
      } @empty {
        <div class="text-center text-slate-400 text-xs py-10">Sin clientes para este filtro</div>
      }
    </div>

    <!-- Selector de modo de vista -->
    <div class="p-3 border-t border-slate-100 flex-shrink-0">
      <p class="text-[10px] text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Modo de vista</p>
      <mat-button-toggle-group [value]="modoVista()" (change)="cambiarModo($event.value)"
                               class="w-full" aria-label="Modo de vista">
        <mat-button-toggle value="pines"      class="flex-1">
          <mat-icon class="!text-sm !w-4 !h-4">place</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="ruta"       class="flex-1">
          <mat-icon class="!text-sm !w-4 !h-4">route</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="calor"      class="flex-1">
          <mat-icon class="!text-sm !w-4 !h-4">monetization_on</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="sinvisitar" class="flex-1">
          <mat-icon class="!text-sm !w-4 !h-4">event_busy</mat-icon>
        </mat-button-toggle>
      </mat-button-toggle-group>
      <div class="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
        <span>Pines</span><span>Ruta</span><span>Deuda</span><span>Visitas</span>
      </div>
    </div>

  </div>

  <!-- ── Mapa ───────────────────────────────────────────────────────────── -->
  <div class="flex-1 relative">
    <div id="map-container" style="position:absolute;inset:0;"></div>

    <!-- Leyenda de zonas -->
    <div class="absolute bottom-6 left-3 z-[1000] bg-white/90 backdrop-blur-sm
                rounded-lg shadow-md p-2.5 text-[10px] space-y-1">
      @for (zona of zonas; track zona.nombre) {
        <div class="flex items-center gap-1.5">
          <div class="w-3 h-3 rounded-full flex-shrink-0" [style.background]="zona.color"></div>
          <span class="text-slate-600">{{ zona.nombre }}</span>
        </div>
      }
      <div class="flex items-center gap-1.5 pt-0.5 border-t border-slate-100 mt-0.5">
        <div class="w-3 h-3 rounded flex-shrink-0 bg-amber-400"></div>
        <span class="text-slate-600">Fábrica</span>
      </div>
    </div>
  </div>

</div>
  `,
  imports: [
    FormsModule,
    MatSelectModule, MatFormFieldModule, MatButtonToggleModule, MatIconModule,
    TimeAgoPipe,
  ],
})
export class MapaRutasComponent implements OnDestroy {
  private readonly mockData = inject(MockDataService);
  private readonly router   = inject(Router);

  private map!: L.Map;
  private markerLayer  = L.layerGroup();
  private overlayLayer = L.layerGroup();
  private mapaIniciado = false;

  // ── Estado ──────────────────────────────────────────────────────────────
  readonly vendedorSel  = signal<string>('all');
  readonly filtroActivo = signal<string>('todos');
  readonly modoVista    = signal<ModoVista>('pines');
  readonly rutaData     = signal<RutaResumen | null>(null);

  readonly filtros = FILTROS;
  readonly zonas   = Object.entries(ZONA_COLORES).map(([nombre, color]) => ({ nombre, color }));

  // ── Datos reactivos ──────────────────────────────────────────────────────
  readonly vendedores = toSignal(this.mockData.getVendedores(), { initialValue: [] as Usuario[] });

  private readonly clientesBase = toSignal(
    toObservable(this.vendedorSel).pipe(
      switchMap(id => this.mockData.getClientesConCoordenadas(id === 'all' ? undefined : id)),
    ),
    { initialValue: [] as Cliente[] },
  );

  private readonly pedidos = toSignal(this.mockData.getPedidos(), { initialValue: [] as Pedido[] });

  readonly clientesFiltrados = computed<ClienteMap[]>(() => {
    const clientes  = this.clientesBase();
    const allPeds   = this.pedidos();
    const filtro    = this.filtroActivo();
    const hoy       = new Date();

    const enriched: ClienteMap[] = clientes.map(c => ({
      ...c,
      _tieneAlerta: allPeds.some(p =>
        p.cliente_id === c.id &&
        !!p.fecha_vencimiento &&
        differenceInDays(parseISO(p.fecha_vencimiento), hoy) <= 3 &&
        differenceInDays(parseISO(p.fecha_vencimiento), hoy) >= 0,
      ),
    }));

    switch (filtro) {
      case 'condeuda':
        return enriched.filter(c => (c.saldo_pendiente_usd ?? 0) > 0);
      case 'porvencer':
        return enriched.filter(c => c._tieneAlerta);
      case 'sinvisitar7':
        return enriched.filter(c =>
          !c.ultima_visita || differenceInDays(hoy, parseISO(c.ultima_visita)) >= 7,
        );
      case 'sinvisitar14':
        return enriched.filter(c =>
          !c.ultima_visita || differenceInDays(hoy, parseISO(c.ultima_visita)) >= 14,
        );
      default:
        return enriched;
    }
  });

  constructor() {
    // Rerender markers whenever filter or mode changes
    effect(() => {
      const clientes = this.clientesFiltrados();
      const modo     = this.modoVista();
      if (!this.mapaIniciado) return;
      this.renderizarVista(clientes, modo);
    });

    // afterNextRender fires after the first browser paint — the only safe
    // place to initialize Leaflet, since the container must have its final
    // CSS-computed size before L.map() reads it.
    afterNextRender(() => {
      this.initMap();
      // requestAnimationFrame ensures the browser has actually painted the
      // layout before invalidateSize() and the first tile fetch.
      requestAnimationFrame(() => {
        this.map.invalidateSize();
        this.mapaIniciado = true;
        this.renderizarVista(this.clientesFiltrados(), this.modoVista());
      });
    });
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  // ── Inicialización del mapa ──────────────────────────────────────────────

  private initMap(): void {
    // Inject pulse keyframe once
    if (!document.getElementById('mapa-keyframes')) {
      const style = document.createElement('style');
      style.id = 'mapa-keyframes';
      style.textContent = `
        @keyframes pulse-ring {
          0%,100% { box-shadow: 0 0 0 0 rgba(226,75,74,0.5); }
          50%      { box-shadow: 0 0 0 6px rgba(226,75,74,0); }
        }
      `;
      document.head.appendChild(style);
    }

    this.map = L.map('map-container', { zoomControl: true }).setView([10.4880, -66.8900], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    this.markerLayer.addTo(this.map);
    this.overlayLayer.addTo(this.map);

    // Pin de fábrica (cuadrado dorado)
    const fabIcon = L.divIcon({
      className: '',
      html: `<div style="width:30px;height:30px;background:#F59E0B;border:2px solid white;
             border-radius:6px;display:flex;align-items:center;justify-content:center;
             color:white;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.4)">F</div>`,
      iconSize: [30, 30], iconAnchor: [15, 15],
    });
    L.marker([FABRICA.lat, FABRICA.lng], { icon: fabIcon })
      .bindTooltip('Fábrica — Los Cortijos', { permanent: false, direction: 'top' })
      .addTo(this.map);
  }

  // ── Renderizado ──────────────────────────────────────────────────────────

  private renderizarVista(clientes: ClienteMap[], modo: ModoVista): void {
    this.limpiarCapas();

    if (modo === 'ruta') {
      const vendId = this.vendedorSel();
      if (vendId !== 'all') {
        this.activarModoRuta(clientes, vendId);
      } else {
        // No hay vendedor seleccionado: mostrar pines normales
        this.renderizarPines(clientes);
      }
    } else if (modo === 'calor') {
      this.activarModoCalorDeuda(clientes);
    } else if (modo === 'sinvisitar') {
      this.activarModoSinVisitar(clientes);
    } else {
      this.renderizarPines(clientes);
    }
  }

  private limpiarCapas(): void {
    this.markerLayer.clearLayers();
    this.overlayLayer.clearLayers();
  }

  private renderizarPines(clientes: ClienteMap[]): void {
    clientes.forEach((c, i) => {
      const icon = this.createPin(ZONA_COLORES[c.zona?.nombre ?? ''] ?? '#4b5563', i + 1, !!c._tieneAlerta);
      this.addClienteMarker(c, icon);
    });
  }

  private activarModoRuta(clientesFiltrados: ClienteMap[], vendedorId: string): void {
    this.mockData.getRutaOptima(vendedorId).subscribe(ruta => {
      this.rutaData.set(ruta);

      // Polyline desde fábrica pasando por todos los clientes
      const coords: L.LatLngExpression[] = [
        [FABRICA.lat, FABRICA.lng],
        ...ruta.clientes.map(c => [c.coordenadas!.lat, c.coordenadas!.lng] as L.LatLngExpression),
      ];
      this.overlayLayer.addLayer(
        L.polyline(coords, { color: '#1E3A5F', weight: 2, dashArray: '6, 4', opacity: 0.7 }),
      );

      // Pines numerados según orden de ruta
      ruta.clientes.forEach((c, i) => {
        const enriquecido = clientesFiltrados.find(cl => cl.id === c.id) ?? c as ClienteMap;
        const icon = this.createPin(
          ZONA_COLORES[c.zona?.nombre ?? ''] ?? '#4b5563',
          i + 1,
          !!enriquecido._tieneAlerta,
        );
        this.addClienteMarker(enriquecido, icon);
      });
    });
  }

  private activarModoCalorDeuda(clientes: ClienteMap[]): void {
    clientes.forEach((c, i) => {
      // Pin normal
      const icon = this.createPin(ZONA_COLORES[c.zona?.nombre ?? ''] ?? '#4b5563', i + 1, !!c._tieneAlerta);
      this.addClienteMarker(c, icon);

      // Círculo proporcional a la deuda
      const saldo = c.saldo_pendiente_usd ?? 0;
      if (saldo > 0) {
        this.overlayLayer.addLayer(
          L.circle([c.coordenadas!.lat, c.coordenadas!.lng], {
            radius:      Math.max(200, saldo / 3),
            color:       '#E24B4A',
            fillColor:   '#FCA5A5',
            fillOpacity: Math.min(0.7, saldo / 5000 + 0.2),
            weight: 1,
          }).bindTooltip(`$${saldo.toLocaleString('es-VE')}`, { permanent: false }),
        );
      }
    });
  }

  private activarModoSinVisitar(clientes: ClienteMap[]): void {
    const hoy = new Date();
    clientes.forEach((c, i) => {
      const dias        = c.ultima_visita ? differenceInDays(hoy, parseISO(c.ultima_visita)) : 999;
      const sinVisitar  = dias >= 7;
      const color       = sinVisitar ? '#6b7280' : (ZONA_COLORES[c.zona?.nombre ?? ''] ?? '#4b5563');
      const label       = sinVisitar ? `${dias}d` : String(i + 1);
      const alerta      = sinVisitar || !!c._tieneAlerta;
      const icon = this.createPinLabel(color, label, alerta);
      this.addClienteMarker(c, icon);
    });
  }

  // ── Helpers de marcadores ────────────────────────────────────────────────

  private addClienteMarker(c: ClienteMap, icon: L.DivIcon): void {
    const marker = L.marker([c.coordenadas!.lat, c.coordenadas!.lng], { icon });
    marker.bindPopup(this.buildPopupHtml(c), { maxWidth: 250 });
    marker.on('popupopen', () => this.attachPopupListeners(c));
    this.markerLayer.addLayer(marker);
  }

  private createPin(color: string, numero: number, alerta = false): L.DivIcon {
    return this.createPinLabel(color, String(numero), alerta);
  }

  private createPinLabel(color: string, label: string, alerta = false): L.DivIcon {
    const border  = alerta ? '2.5px solid #E24B4A' : '2px solid white';
    const animate = alerta ? 'animation:pulse-ring 1.4s ease infinite;' : '';
    return L.divIcon({
      className: '',
      html: `<div style="width:28px;height:28px;background:${color};border:${border};border-radius:50%;
             display:flex;align-items:center;justify-content:center;color:white;font-size:11px;
             font-weight:600;box-shadow:0 2px 4px rgba(0,0,0,0.3);${animate}">${label}</div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    });
  }

  private buildPopupHtml(c: ClienteMap): string {
    const saldo      = c.saldo_pendiente_usd ?? 0;
    const saldoBg    = saldo > 0 ? '#FEF2F2' : '#F0FDF4';
    const saldoColor = saldo > 0 ? '#991B1B' : '#166534';
    const saldoTexto = saldo > 0 ? `$${saldo.toLocaleString('es-VE')} pendiente` : 'Al día';
    const visita     = c.ultima_visita
      ? formatDistanceToNow(parseISO(c.ultima_visita), { locale: es, addSuffix: true })
      : 'Sin registro';
    return `
      <div style="font-family:sans-serif;min-width:200px;">
        <div style="font-weight:600;font-size:14px;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:6px;">
          ${c.razon_social}
        </div>
        <div style="font-size:12px;color:#666;margin-bottom:2px;">RIF: <strong style="color:#333">${c.rif}</strong></div>
        <div style="font-size:12px;color:#666;margin-bottom:2px;">Zona: <strong style="color:#333">${c.zona?.nombre ?? '—'}</strong></div>
        <div style="font-size:12px;color:#666;margin-bottom:2px;">Última visita: <strong style="color:#333">${visita}</strong></div>
        <div style="font-size:13px;margin-top:8px;padding:6px;background:${saldoBg};border-radius:6px;">
          Saldo: <strong style="color:${saldoColor}">${saldoTexto}</strong>
        </div>
        <div style="display:flex;gap:6px;margin-top:10px;">
          <a id="btn-ver-${c.id}" href="#" style="flex:1;text-align:center;padding:5px;background:#1E3A5F;
             color:white;border-radius:6px;font-size:11px;text-decoration:none;">Ver cliente</a>
          <a id="btn-ped-${c.id}" href="#" style="flex:1;text-align:center;padding:5px;background:#F59E0B;
             color:white;border-radius:6px;font-size:11px;text-decoration:none;">Nuevo pedido</a>
        </div>
      </div>`;
  }

  private attachPopupListeners(c: ClienteMap): void {
    setTimeout(() => {
      document.getElementById(`btn-ver-${c.id}`)?.addEventListener('click', e => {
        e.preventDefault();
        this.map.closePopup();
        this.router.navigate(['/clientes', c.id]);
      });
      document.getElementById(`btn-ped-${c.id}`)?.addEventListener('click', e => {
        e.preventDefault();
        this.map.closePopup();
        this.router.navigate(['/pedidos/nuevo'], { queryParams: { clienteId: c.id } });
      });
    }, 0);
  }

  // ── Acciones del panel ───────────────────────────────────────────────────

  centrarEnCliente(c: ClienteMap): void {
    if (!this.mapaIniciado || !c.coordenadas) return;
    this.map.flyTo([c.coordenadas.lat, c.coordenadas.lng], 15, { duration: 0.8 });
    // Abrir popup tras la animación de vuelo
    setTimeout(() => {
      this.markerLayer.getLayers().forEach((layer: L.Layer) => {
        if (layer instanceof L.Marker) {
          const pos = layer.getLatLng();
          if (
            Math.abs(pos.lat - c.coordenadas!.lat) < 0.0001 &&
            Math.abs(pos.lng - c.coordenadas!.lng) < 0.0001
          ) {
            layer.openPopup();
          }
        }
      });
    }, 900);
  }

  onVendedorChange(id: string): void {
    this.vendedorSel.set(id);
    // Si estaba en modo ruta pero cambió a "todos", salir del modo ruta
    if (id === 'all' && this.modoVista() === 'ruta') {
      this.modoVista.set('pines');
    }
    this.rutaData.set(null);
  }

  cambiarModo(modo: ModoVista): void {
    this.modoVista.set(modo);
    if (modo !== 'ruta') this.rutaData.set(null);
  }

  zonaColor(zona?: string): string {
    return ZONA_COLORES[zona ?? ''] ?? '#4b5563';
  }

  fUsd(n: number): string {
    return '$' + Math.round(n).toLocaleString('es-VE');
  }

  visitaClase(ultimaVisita?: string): string {
    if (!ultimaVisita) return 'text-red-500';
    const dias = differenceInDays(new Date(), parseISO(ultimaVisita));
    if (dias >= 14) return 'text-red-500';
    if (dias >= 7)  return 'text-amber-500';
    return 'text-slate-400';
  }
}
