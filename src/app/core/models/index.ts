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
export type TipoCuentaBancaria = 'personal' | 'juridica';
export type FacturaFiscalStatus = 'pendiente' | 'pagada' | 'anulada';

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

export interface CuentaBancaria {
  id: string;
  banco: string;
  numero_cuenta?: string;
  tipo: TipoCuentaBancaria; // personal = Padre, juridica = Empresa
  titular: string;
  activo: boolean;
}

export interface FacturaFiscal {
  numero_factura: string;
  tiene_iva: boolean;
  porcentaje_iva: number;           // 16% estándar Venezuela
  monto_base_usd: number;
  monto_iva_usd: number;
  monto_total_factura_usd: number;
  status_pago: FacturaFiscalStatus;
  tipo_pago?: string;
  fecha_emision: string;
  fecha_pago?: string;
}

export interface ResumenDeudaCliente {
  monto_total_adeudado: number;
  conteo_pedidos_pendientes: number;
  rango_maximo_dias_mora: number;
}

export interface Cliente {
  id: string;
  codigo_cliente: string;
  razon_social: string;
  rif: string;
  telefono?: string;
  direccion?: string;
  estado: string;
  ciudad: string;
  vendedor_id: string;
  vendedor?: Usuario;
  limite_credito_usd: number;
  activo: boolean;
  created_at: string;
  coordenadas?: { lat: number; lng: number };
  // Calculados en frontend
  monto_total_adeudado?: number;
  conteo_pedidos_pendientes?: number;
  rango_maximo_dias_mora?: number;
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
  numero_guia?: string;
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
  // Factura fiscal opcional
  factura_fiscal?: FacturaFiscal;
  // Calculados
  saldo_pendiente_usd?: number;
  dias_para_vencer?: number;
  fecha_culminacion_pago?: string;
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
  cuenta_bancaria_id?: string;
  cuenta_bancaria?: CuentaBancaria;
  notas?: string;
  created_at: string;
}

export interface Comision {
  id: string;
  pedido_id: string;
  pedido?: Pedido;
  vendedor_id: string;
  porcentaje: number;
  porcentaje_original?: number;
  monto_usd: number;
  pagada: boolean;
  metodo_pago?: string;
  tiene_descuento?: boolean;
  editado_por_admin?: boolean;
  fecha_pago_comision?: string;
  created_at: string;
}

export interface ConfigComisionMetodoPago {
  metodo_pago: string;
  label: string;
  porcentaje_sin_descuento: number;
  porcentaje_con_descuento: number;
}

export interface UtilidadPedido {
  pedido_id: string;
  numero_pedido: string;
  cliente_nombre: string;
  precio_venta_usd: number;
  monto_iva_usd: number;
  costo_fabricacion_usd: number;
  comision_usd: number;
  utilidad_neta_usd: number;
  margen_porcentaje: number;
}

export interface Devolucion {
  id: string;
  pedido_id: string;
  pedido?: Pedido;
  cliente_id: string;
  status: 'pendiente' | 'mercancia_recibida' | 'procesada' | 'rechazada';
  items_devueltos: { producto_id: string; cantidad: number; motivo: string }[];
  monto_credito_usd?: number;
  mercancia_recibida_at?: string;
  reintegrar_stock?: boolean;
  procesada_at?: string;
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
  producto_id?: string;
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
