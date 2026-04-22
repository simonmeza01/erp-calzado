// ─── Roles y tipos primitivos ───────────────────────────────────────────────
export type UserRole = 'admin' | 'gerente' | 'vendedor';

export type PedidoStatus =
  | 'borrador'
  | 'en_aprobacion'
  | 'aprobado'
  | 'en_preparacion'
  | 'en_transito'
  | 'entregado'
  | 'cancelado';

export type PagoTipo = 'abono' | 'completo';
export type PagoMoneda = 'usd' | 'bs';

// ─── Entidades ───────────────────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  rol: UserRole;
  activo: boolean;
  created_at: string;
}

export interface Zona {
  id: string;
  nombre: string;
  vendedor_id?: string;
}

export interface Cliente {
  id: string;
  razon_social: string;
  rif: string;
  telefono?: string;
  direccion?: string;
  zona_id?: string;
  zona?: Zona;
  vendedor_id: string;
  vendedor?: Usuario;
  ultima_visita?: string;
  limite_credito_usd: number;
  activo: boolean;
  created_at: string;
  coordenadas?: { lat: number; lng: number };
  // Calculados en frontend
  saldo_pendiente_usd?: number;
}

export interface Producto {
  id: string;
  sku: string;
  nombre: string;
  talla?: string;
  color?: string;
  modelo?: string;
  precio_usd: number;
  costo_usd?: number;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  producto_id: string;
  producto?: Producto;
  cantidad: number;
  precio_unitario_usd: number;
  descuento: number;
  subtotal_usd?: number; // cantidad * precio * (1 - descuento/100)
}

export interface Pedido {
  id: string;
  numero_pedido: string;
  cliente_id: string;
  cliente?: Cliente;
  vendedor_id: string;
  vendedor?: Usuario;
  status: PedidoStatus;
  tiene_factura: boolean;
  numero_guia?: string;
  numero_factura?: string;
  monto_factura_usd?: number;
  factura_pagada: boolean;
  tipo_pago_factura?: string;
  descuento_porcentaje: number;
  total_usd: number;
  total_bs?: number;
  tasa_bcv?: number;
  fecha_vencimiento?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  items?: PedidoItem[];
  pagos?: Pago[];
  // Calculados
  saldo_pendiente_usd?: number;
  dias_para_vencer?: number;
}

export interface Pago {
  id: string;
  pedido_id: string;
  vendedor_id: string;
  fecha_pago: string;
  tipo: PagoTipo;
  moneda: PagoMoneda;
  monto_usd?: number;
  monto_bs?: number;
  tasa_cambio?: number;
  banco_destino?: string;
  notas?: string;
  created_at: string;
}

export interface Comision {
  id: string;
  pedido_id: string;
  pedido?: Pedido;
  vendedor_id: string;
  porcentaje: number;
  monto_usd: number;
  pagada: boolean;
  created_at: string;
}

export interface Devolucion {
  id: string;
  pedido_id: string;
  pedido?: Pedido;
  cliente_id: string;
  status: 'pendiente' | 'mercancia_recibida' | 'procesada';
  items_devueltos: { producto_id: string; cantidad: number; motivo: string }[];
  monto_credito_usd?: number;
  mercancia_recibida_at?: string;
  notas?: string;
  created_at: string;
}

export interface InventarioMovimiento {
  id: string;
  producto_id: string;
  producto?: Producto;
  tipo: 'entrada_fabricacion' | 'salida_pedido' | 'devolucion' | 'ajuste';
  cantidad: number;
  referencia_id?: string;
  notas?: string;
  created_at: string;
}

export interface LoteFabricacion {
  id: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  cantidad_planificada: number;
  cantidad_producida: number;
  status: 'planificado' | 'en_proceso' | 'completado';
  tipo: 'botas' | 'pvc';
  notas?: string;
  created_at: string;
}

export interface Material {
  id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo?: number;
  costo_unitario_usd?: number;
}

export interface Proveedor {
  id: string;
  nombre: string;
  rif?: string;
  telefono?: string;
  email?: string;
  activo: boolean;
}

export interface TasaBcv {
  promedio: number;
  fechaActualizacion: string;
}
