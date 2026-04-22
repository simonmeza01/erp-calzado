import { Component, Input, OnDestroy, OnChanges, afterNextRender } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-mini-mapa-cliente',
  template: `<div [id]="mapId" style="height:200px;width:100%;border-radius:8px;overflow:hidden;"></div>`,
  styles: [':host { display: block; }'],
  imports: [],
})
export class MiniMapaClienteComponent implements OnDestroy, OnChanges {
  @Input() lat!: number;
  @Input() lng!: number;
  @Input() nombre = '';

  readonly mapId = `mini-map-${Math.random().toString(36).slice(2, 8)}`;

  private map?: L.Map;
  private marker?: L.Marker;

  constructor() {
    afterNextRender(() => {
      this.initMap();
      requestAnimationFrame(() => this.map?.invalidateSize());
    });
  }

  ngOnChanges(): void {
    if (this.map && this.lat && this.lng) {
      this.map.setView([this.lat, this.lng], 15);
      this.marker?.setLatLng([this.lat, this.lng]);
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    if (!this.lat || !this.lng) return;

    this.map = L.map(this.mapId, {
      zoomControl:        false,
      attributionControl: false,
      dragging:           false,
      scrollWheelZoom:    false,
      doubleClickZoom:    false,
      boxZoom:            false,
      keyboard:           false,
    }).setView([this.lat, this.lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    const icon = L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;background:#1E3A5F;border:2px solid white;
             border-radius:50%;display:flex;align-items:center;justify-content:center;
             box-shadow:0 2px 4px rgba(0,0,0,0.3);">
               <div style="width:8px;height:8px;background:white;border-radius:50%;"></div>
             </div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });

    this.marker = L.marker([this.lat, this.lng], { icon });
    if (this.nombre) {
      this.marker.bindTooltip(this.nombre, { permanent: true, direction: 'top', offset: [0, -14] });
    }
    this.marker.addTo(this.map);
  }
}
