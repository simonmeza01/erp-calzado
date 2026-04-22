import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TasaBcv } from '../models';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const CACHE_KEY     = 'erp_tasa_bcv';
const CACHE_TTL_MS  = 60 * 60 * 1000; // 60 minutos
const API_URL       = 'https://ve.dolarapi.com/v1/dolares/oficial';

interface CacheEntry {
  tasa: TasaBcv;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class TasaBcvService {
  private readonly http = inject(HttpClient);

  readonly tasaActual         = signal<TasaBcv | null>(null);
  readonly ultimaActualizacion = signal<string>('');

  constructor() {
    this._inicializar();
  }

  formatBs(usd: number, tasa?: number): string {
    const t = tasa ?? this.tasaActual()?.promedio ?? 0;
    if (!t) return 'N/D';
    return `Bs. ${(usd * t).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  formatUsd(usd: number): string {
    return `$ ${usd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  convertirABs(usd: number, tasa?: number): number {
    const t = tasa ?? this.tasaActual()?.promedio ?? 0;
    return usd * t;
  }

  private _inicializar(): void {
    const cached = this._leerCache();
    if (cached) {
      this._aplicar(cached.tasa);
      return;
    }
    this._fetchApi();
  }

  private _fetchApi(): void {
    this.http.get<{ promedio: number; fechaActualizacion: string }>(API_URL).subscribe({
      next: resp => {
        const tasa: TasaBcv = {
          promedio: resp.promedio,
          fechaActualizacion: resp.fechaActualizacion ?? new Date().toISOString(),
        };
        this._guardarCache(tasa);
        this._aplicar(tasa);
      },
      error: () => {
        // Fallback con tasa de referencia
        this._aplicar({ promedio: 41.50, fechaActualizacion: new Date().toISOString() });
      },
    });
  }

  private _aplicar(tasa: TasaBcv): void {
    this.tasaActual.set(tasa);
    this._actualizarLabel(tasa.fechaActualizacion);
  }

  private _actualizarLabel(fecha: string): void {
    try {
      const label = formatDistanceToNow(new Date(fecha), { locale: es, addSuffix: true });
      this.ultimaActualizacion.set(label);
    } catch {
      this.ultimaActualizacion.set('');
    }
  }

  private _leerCache(): CacheEntry | null {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp > CACHE_TTL_MS) return null;
      return entry;
    } catch {
      return null;
    }
  }

  private _guardarCache(tasa: TasaBcv): void {
    const entry: CacheEntry = { tasa, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  }
}
