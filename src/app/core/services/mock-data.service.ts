import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, combineLatest } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import {
  Usuario, Cliente, CuentaBancaria, Producto, Pedido, PedidoItem,
  Pago, Comision, Devolucion, InventarioMovimiento,
  LoteFabricacion, Material, Proveedor, PedidoStatus,
  FacturaFiscal, ResumenDeudaCliente, ConfigComisionMetodoPago, UtilidadPedido,
} from '../models';

// ─── Datos seed ──────────────────────────────────────────────────────────────

const CONFIG_COMISIONES_DEFAULT: ConfigComisionMetodoPago[] = [
  { metodo_pago: 'transferencia',  label: 'Transferencia',   porcentaje_sin_descuento: 3,   porcentaje_con_descuento: 2   },
  { metodo_pago: 'efectivo_usd',   label: 'Efectivo USD',    porcentaje_sin_descuento: 4,   porcentaje_con_descuento: 3   },
  { metodo_pago: 'efectivo_bs',    label: 'Efectivo Bs.',    porcentaje_sin_descuento: 3,   porcentaje_con_descuento: 2   },
  { metodo_pago: 'retencion',      label: 'Retención',       porcentaje_sin_descuento: 2,   porcentaje_con_descuento: 1.5 },
  { metodo_pago: 'default',        label: 'Otro',            porcentaje_sin_descuento: 3,   porcentaje_con_descuento: 2   },
];

const USUARIOS: Usuario[] = [
  { id: 'u1', nombre: 'María González',  email: 'admin@calzado.com',     telefono: '0414-1234567', rol: 'admin',    activo: true,  created_at: '2024-01-01T00:00:00Z' },
  { id: 'u2', nombre: 'Carlos Pérez',    email: 'gerente@calzado.com',   telefono: '0424-2345678', rol: 'gerente',  activo: true,  created_at: '2024-01-01T00:00:00Z' },
  { id: 'u3', nombre: 'Luis Rodríguez',  email: 'vendedor1@calzado.com', telefono: '0412-3456789', rol: 'vendedor', activo: true,  created_at: '2024-01-01T00:00:00Z' },
  { id: 'u4', nombre: 'Ana Martínez',    email: 'vendedor2@calzado.com', telefono: '0416-4567890', rol: 'vendedor', activo: true,  created_at: '2024-01-01T00:00:00Z' },
  { id: 'u5', nombre: 'José Hernández',  email: 'vendedor3@calzado.com', telefono: '0426-5678901', rol: 'vendedor', activo: true,  created_at: '2024-01-01T00:00:00Z' },
  { id: 'u6', nombre: 'Carmen Díaz',     email: 'vendedor4@calzado.com', telefono: '0414-6789012', rol: 'vendedor', activo: true,  created_at: '2024-01-01T00:00:00Z' },
];

const CUENTAS_BANCARIAS: CuentaBancaria[] = [
  { id: 'cb1', banco: 'BDV',       numero_cuenta: '0102-1234-56-0123456789', tipo: 'juridica', titular: 'Calzado Industrial C.A.',  activo: true },
  { id: 'cb2', banco: 'Banesco',   numero_cuenta: '0134-9876-54-3210987654', tipo: 'juridica', titular: 'Calzado Industrial C.A.',  activo: true },
  { id: 'cb3', banco: 'BNC',       numero_cuenta: '0191-5678-90-1234567890', tipo: 'juridica', titular: 'Calzado Industrial C.A.',  activo: true },
  { id: 'cb4', banco: 'Mercantil', numero_cuenta: '0105-4321-09-8765432109', tipo: 'personal', titular: 'Luis Rodríguez',            activo: true },
  { id: 'cb5', banco: 'Provincial',numero_cuenta: '0108-2468-13-5791357913', tipo: 'personal', titular: 'María González',            activo: true },
  { id: 'cb6', banco: 'Banesco',   numero_cuenta: '0134-1111-22-3333444455', tipo: 'personal', titular: 'Ana Martínez',              activo: true },
];

const CLIENTES: Cliente[] = [
  { id: 'c1',  codigo_cliente: 'CLI-0001', razon_social: 'Distribuidora El Norte C.A.',      rif: 'J-31245678-9', telefono: '0212-1234567', direccion: 'Av. Principal, Los Dos Caminos, Caracas',    estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u3', limite_credito_usd: 5000, activo: true,  created_at: '2024-01-15T00:00:00Z', coordenadas: { lat: 10.4912, lng: -66.8520 } },
  { id: 'c2',  codigo_cliente: 'CLI-0002', razon_social: 'Comercial Chacao S.R.L.',           rif: 'J-28456789-3', telefono: '0212-2345678', direccion: 'CC Chacao, Local 45, Chacao, Caracas',         estado: 'Miranda',          ciudad: 'Chacao',     vendedor_id: 'u3', limite_credito_usd: 3000, activo: true,  created_at: '2024-01-20T00:00:00Z', coordenadas: { lat: 10.4870, lng: -66.8450 } },
  { id: 'c3',  codigo_cliente: 'CLI-0003', razon_social: 'Tienda Las Mercedes C.A.',          rif: 'J-30567890-1', telefono: '0212-3456789', direccion: 'Av. Las Mercedes, Las Mercedes, Caracas',       estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u3', limite_credito_usd: 4000, activo: true,  created_at: '2024-02-01T00:00:00Z', coordenadas: { lat: 10.4810, lng: -66.8580 } },
  { id: 'c4',  codigo_cliente: 'CLI-0004', razon_social: 'El Valle Shoes S.R.L.',             rif: 'J-29678901-2', telefono: '0212-4567890', direccion: 'Av. El Valle, El Valle, Caracas',               estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u4', limite_credito_usd: 6000, activo: true,  created_at: '2024-02-10T00:00:00Z', coordenadas: { lat: 10.4480, lng: -66.9100 } },
  { id: 'c5',  codigo_cliente: 'CLI-0005', razon_social: 'Coche Distribuciones C.A.',         rif: 'J-27789012-4', telefono: '0212-5678901', direccion: 'Av. Intercomunal de Coche, Coche, Caracas',     estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u4', limite_credito_usd: 2500, activo: true,  created_at: '2024-02-15T00:00:00Z', coordenadas: { lat: 10.4520, lng: -66.9000 } },
  { id: 'c6',  codigo_cliente: 'CLI-0006', razon_social: 'Petare Calzado Import C.A.',        rif: 'J-32890123-5', telefono: '0212-6789012', direccion: 'Av. Petare, Petare, Caracas',                  estado: 'Miranda',          ciudad: 'Petare',     vendedor_id: 'u5', limite_credito_usd: 3500, activo: true,  created_at: '2024-03-01T00:00:00Z', coordenadas: { lat: 10.4780, lng: -66.7850 } },
  { id: 'c7',  codigo_cliente: 'CLI-0007', razon_social: 'Caucagüita Trading S.R.L.',         rif: 'J-26901234-6', telefono: '0212-7890123', direccion: 'Sector Caucagüita, Petare, Caracas',            estado: 'Miranda',          ciudad: 'Petare',     vendedor_id: 'u5', limite_credito_usd: 7000, activo: true,  created_at: '2024-03-10T00:00:00Z', coordenadas: { lat: 10.4680, lng: -66.7700 } },
  { id: 'c8',  codigo_cliente: 'CLI-0008', razon_social: 'Catia Distribuidora C.A.',          rif: 'J-33012345-7', telefono: '0212-8901234', direccion: 'Av. Sucre, Catia, Caracas',                    estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u6', limite_credito_usd: 1500, activo: true,  created_at: '2024-03-20T00:00:00Z', coordenadas: { lat: 10.5010, lng: -66.9380 } },
  { id: 'c9',  codigo_cliente: 'CLI-0009', razon_social: '23 de Enero Dist. S.A.',            rif: 'J-25123456-8', telefono: '0212-9012345', direccion: 'Urb. 23 de Enero, Caracas',                    estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u6', limite_credito_usd: 4500, activo: true,  created_at: '2024-04-01T00:00:00Z', coordenadas: { lat: 10.4960, lng: -66.9500 } },
  { id: 'c10', codigo_cliente: 'CLI-0010', razon_social: 'Sabana Grande Calzado C.A.',        rif: 'J-34234567-0', telefono: '0212-0123456', direccion: 'Blvd. Sabana Grande, Caracas',                 estado: 'Distrito Capital', ciudad: 'Caracas',    vendedor_id: 'u4', limite_credito_usd: 2000, activo: true,  created_at: '2024-04-15T00:00:00Z', coordenadas: { lat: 10.4950, lng: -66.8900 } },
];

const PRODUCTOS: Producto[] = [
  { id: 'p1',  sku: 'BT-40-NGR-IND', nombre: 'Bota 40 Negra Industrial',       talla: '40', color: 'Negro',    modelo: 'Industrial', precio_usd: 45, costo_usd: 28, stock_actual: 85,  stock_minimo: 20, activo: true  },
  { id: 'p2',  sku: 'BT-41-NGR-IND', nombre: 'Bota 41 Negra Industrial',       talla: '41', color: 'Negro',    modelo: 'Industrial', precio_usd: 45, costo_usd: 28, stock_actual: 60,  stock_minimo: 20, activo: true  },
  { id: 'p3',  sku: 'BT-42-NGR-IND', nombre: 'Bota 42 Negra Industrial',       talla: '42', color: 'Negro',    modelo: 'Industrial', precio_usd: 45, costo_usd: 28, stock_actual: 40,  stock_minimo: 20, activo: true  },
  { id: 'p4',  sku: 'BT-40-MAR-CLQ', nombre: 'Bota 40 Marrón Clásica',         talla: '40', color: 'Marrón',   modelo: 'Clásica',    precio_usd: 38, costo_usd: 22, stock_actual: 120, stock_minimo: 25, activo: true  },
  { id: 'p5',  sku: 'BT-41-MAR-CLQ', nombre: 'Bota 41 Marrón Clásica',         talla: '41', color: 'Marrón',   modelo: 'Clásica',    precio_usd: 38, costo_usd: 22, stock_actual: 95,  stock_minimo: 25, activo: true  },
  { id: 'p6',  sku: 'BT-39-GRI-DEP', nombre: 'Bota 39 Gris Deportiva',         talla: '39', color: 'Gris',     modelo: 'Deportiva',  precio_usd: 32, costo_usd: 19, stock_actual: 5,   stock_minimo: 15, activo: true  },
  { id: 'p7',  sku: 'BT-40-NGR-SEG', nombre: 'Bota 40 Negra Seguridad',        talla: '40', color: 'Negro',    modelo: 'Seguridad',  precio_usd: 55, costo_usd: 35, stock_actual: 30,  stock_minimo: 10, activo: true  },
  { id: 'p8',  sku: 'BT-43-NGR-IND', nombre: 'Bota 43 Negra Industrial',       talla: '43', color: 'Negro',    modelo: 'Industrial', precio_usd: 45, costo_usd: 28, stock_actual: 0,   stock_minimo: 10, activo: true  },
  { id: 'p9',  sku: 'BT-42-MAR-CLQ', nombre: 'Bota 42 Marrón Clásica',         talla: '42', color: 'Marrón',   modelo: 'Clásica',    precio_usd: 38, costo_usd: 22, stock_actual: 75,  stock_minimo: 20, activo: true  },
  { id: 'p10', sku: 'BT-41-NGR-SEG', nombre: 'Bota 41 Negra Seguridad',        talla: '41', color: 'Negro',    modelo: 'Seguridad',  precio_usd: 55, costo_usd: 35, stock_actual: 25,  stock_minimo: 10, activo: true  },
  { id: 'p11', sku: 'PVC-38-BLA-STD', nombre: 'Bota PVC 38 Blanca Estándar',   talla: '38', color: 'Blanco',   modelo: 'PVC',        precio_usd: 25, costo_usd: 14, stock_actual: 200, stock_minimo: 30, activo: true  },
  { id: 'p12', sku: 'PVC-40-BLA-STD', nombre: 'Bota PVC 40 Blanca Estándar',   talla: '40', color: 'Blanco',   modelo: 'PVC',        precio_usd: 25, costo_usd: 14, stock_actual: 180, stock_minimo: 30, activo: true  },
  { id: 'p13', sku: 'PVC-42-AMA-STD', nombre: 'Bota PVC 42 Amarilla Estándar', talla: '42', color: 'Amarillo', modelo: 'PVC',        precio_usd: 27, costo_usd: 15, stock_actual: 8,   stock_minimo: 20, activo: true  },
  { id: 'p14', sku: 'BT-44-NGR-IND', nombre: 'Bota 44 Negra Industrial',        talla: '44', color: 'Negro',    modelo: 'Industrial', precio_usd: 45, costo_usd: 28, stock_actual: 15,  stock_minimo: 10, activo: true  },
  { id: 'p15', sku: 'BT-38-CAF-CLQ', nombre: 'Bota 38 Café Clásica',            talla: '38', color: 'Café',     modelo: 'Clásica',    precio_usd: 38, costo_usd: 22, stock_actual: 45,  stock_minimo: 15, activo: false },
];

// Hoy = 2026-04-23.
const PEDIDOS_RAW: Pedido[] = [
  // ─── 5 Entregados y pagados ─────────────────────────────────────────────────
  { id: 'ped1',  numero_pedido: 'PED-2026-001', cliente_id: 'c1',  vendedor_id: 'u3', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0001', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 1200, monto_iva_usd: 0, monto_total_factura_usd: 1200, status_pago: 'pagada',  tipo_pago: 'transferencia', fecha_emision: '2026-01-10', fecha_pago: '2026-01-25' }, descuento_porcentaje: 0,  total_usd: 1200,  tasa_bcv: 40.50, created_at: '2026-01-10T08:00:00Z', updated_at: '2026-01-25T10:00:00Z' },
  { id: 'ped2',  numero_pedido: 'PED-2026-002', cliente_id: 'c2',  vendedor_id: 'u4', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0002', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 800,  monto_iva_usd: 0, monto_total_factura_usd: 760,  status_pago: 'pagada',  tipo_pago: 'efectivo_usd',  fecha_emision: '2026-01-15', fecha_pago: '2026-02-01' }, descuento_porcentaje: 5,  total_usd: 760,   tasa_bcv: 40.80, created_at: '2026-01-15T09:00:00Z', updated_at: '2026-02-01T11:00:00Z' },
  { id: 'ped3',  numero_pedido: 'PED-2026-003', cliente_id: 'c3',  vendedor_id: 'u5', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0003', tiene_iva: true,  porcentaje_iva: 16, monto_base_usd: 1500, monto_iva_usd: 240, monto_total_factura_usd: 1740, status_pago: 'pagada', tipo_pago: 'transferencia', fecha_emision: '2026-01-20', fecha_pago: '2026-02-10' }, descuento_porcentaje: 0,  total_usd: 1500,  tasa_bcv: 41.00, created_at: '2026-01-20T07:30:00Z', updated_at: '2026-02-10T09:00:00Z' },
  { id: 'ped4',  numero_pedido: 'PED-2026-004', cliente_id: 'c4',  vendedor_id: 'u6', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0004', tiene_iva: true,  porcentaje_iva: 16, monto_base_usd: 2100, monto_iva_usd: 336, monto_total_factura_usd: 2226, status_pago: 'pagada', tipo_pago: 'transferencia', fecha_emision: '2026-02-01', fecha_pago: '2026-02-20' }, descuento_porcentaje: 10, total_usd: 1890,  tasa_bcv: 41.10, created_at: '2026-02-01T08:00:00Z', updated_at: '2026-02-20T14:00:00Z' },
  { id: 'ped5',  numero_pedido: 'PED-2026-005', cliente_id: 'c5',  vendedor_id: 'u3', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0005', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 650,  monto_iva_usd: 0, monto_total_factura_usd: 650,  status_pago: 'pagada',  tipo_pago: 'efectivo_usd',  fecha_emision: '2026-02-05', fecha_pago: '2026-02-22' }, descuento_porcentaje: 0,  total_usd: 650,   tasa_bcv: 41.20, created_at: '2026-02-05T10:00:00Z', updated_at: '2026-02-22T16:00:00Z', notas: 'Cliente solicitó devolución parcial' },

  // ─── 4 Aprobado/En preparación (incluye 3 con vencimiento próximo) ──────────
  { id: 'ped6',  numero_pedido: 'PED-2026-006', cliente_id: 'c6',  vendedor_id: 'u3', status: 'aprobado',       descuento_porcentaje: 0,  total_usd: 900,   fecha_vencimiento: '2026-04-10', created_at: '2026-03-25T08:00:00Z', updated_at: '2026-04-01T09:00:00Z', notas: 'Pago acordado antes del 10 de abril' },
  { id: 'ped7',  numero_pedido: 'PED-2026-007', cliente_id: 'c7',  vendedor_id: 'u4', status: 'aprobado',       factura_fiscal: { numero_factura: 'F-2026-0007', tiene_iva: true,  porcentaje_iva: 16, monto_base_usd: 1800, monto_iva_usd: 288, monto_total_factura_usd: 2088, status_pago: 'pendiente', fecha_emision: '2026-03-28' }, descuento_porcentaje: 5,  total_usd: 1710,  fecha_vencimiento: '2026-04-11', created_at: '2026-03-28T10:00:00Z', updated_at: '2026-04-02T11:00:00Z' },
  { id: 'ped8',  numero_pedido: 'PED-2026-008', cliente_id: 'c8',  vendedor_id: 'u5', status: 'en_preparacion', descuento_porcentaje: 0,  total_usd: 450,   fecha_vencimiento: '2026-04-12', created_at: '2026-04-01T07:00:00Z', updated_at: '2026-04-05T08:00:00Z' },
  { id: 'ped9',  numero_pedido: 'PED-2026-009', cliente_id: 'c9',  vendedor_id: 'u6', status: 'en_preparacion', descuento_porcentaje: 8,  total_usd: 2024,  created_at: '2026-04-03T09:00:00Z', updated_at: '2026-04-06T10:00:00Z' },

  // ─── 3 En tránsito ──────────────────────────────────────────────────────────
  { id: 'ped10', numero_pedido: 'PED-2026-010', cliente_id: 'c1',  vendedor_id: 'u3', status: 'en_transito',    numero_guia: 'MRW-000123',   factura_fiscal: { numero_factura: 'F-2026-0010', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 1100, monto_iva_usd: 0, monto_total_factura_usd: 1100, status_pago: 'pendiente', fecha_emision: '2026-04-02' }, descuento_porcentaje: 0, total_usd: 1100, tasa_bcv: 41.50, created_at: '2026-04-02T08:00:00Z', updated_at: '2026-04-07T09:00:00Z' },
  { id: 'ped11', numero_pedido: 'PED-2026-011', cliente_id: 'c2',  vendedor_id: 'u4', status: 'en_transito',    numero_guia: 'ZOOM-005567',  factura_fiscal: { numero_factura: 'F-2026-0011', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 750,  monto_iva_usd: 0, monto_total_factura_usd: 750,  status_pago: 'pendiente', fecha_emision: '2026-04-04' }, descuento_porcentaje: 0, total_usd: 750,  tasa_bcv: 41.50, created_at: '2026-04-04T10:00:00Z', updated_at: '2026-04-08T11:00:00Z' },
  { id: 'ped12', numero_pedido: 'PED-2026-012', cliente_id: 'c3',  vendedor_id: 'u5', status: 'en_transito',    numero_guia: 'TEALCA-00892', descuento_porcentaje: 0, total_usd: 1350, created_at: '2026-04-05T07:00:00Z', updated_at: '2026-04-08T08:00:00Z' },

  // ─── 2 Borradores ───────────────────────────────────────────────────────────
  { id: 'ped13', numero_pedido: 'PED-2026-013', cliente_id: 'c4',  vendedor_id: 'u6', status: 'borrador',       descuento_porcentaje: 0,  total_usd: 500,   created_at: '2026-04-08T14:00:00Z', updated_at: '2026-04-08T14:00:00Z', notas: 'Pendiente confirmar tallas' },
  { id: 'ped14', numero_pedido: 'PED-2026-014', cliente_id: 'c5',  vendedor_id: 'u3', status: 'borrador',       descuento_porcentaje: 0,  total_usd: 300,   created_at: '2026-04-09T08:00:00Z', updated_at: '2026-04-09T08:00:00Z' },

  // ─── 2 Cancelados ───────────────────────────────────────────────────────────
  { id: 'ped15', numero_pedido: 'PED-2026-015', cliente_id: 'c7',  vendedor_id: 'u4', status: 'cancelado',      descuento_porcentaje: 0,  total_usd: 980,   created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-15T11:00:00Z', notas: 'Cliente desistió del pedido' },
  { id: 'ped16', numero_pedido: 'PED-2026-016', cliente_id: 'c8',  vendedor_id: 'u5', status: 'cancelado',      descuento_porcentaje: 0,  total_usd: 600,   created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-22T14:00:00Z', notas: 'Producto sin stock disponible' },

  // ─── Pedidos adicionales ─────────────────────────────────────────────────────
  { id: 'ped17', numero_pedido: 'PED-2026-017', cliente_id: 'c9',  vendedor_id: 'u6', status: 'en_aprobacion',  descuento_porcentaje: 0,  total_usd: 1650,  created_at: '2026-04-07T11:00:00Z', updated_at: '2026-04-08T12:00:00Z' },
  { id: 'ped18', numero_pedido: 'PED-2026-018', cliente_id: 'c2',  vendedor_id: 'u4', status: 'entregado',      factura_fiscal: { numero_factura: 'F-2026-0018', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 870, monto_iva_usd: 0, monto_total_factura_usd: 870, status_pago: 'pendiente', fecha_emision: '2026-03-01' }, descuento_porcentaje: 0, total_usd: 870, tasa_bcv: 41.30, created_at: '2026-03-01T08:00:00Z', updated_at: '2026-03-20T10:00:00Z', notas: 'Factura pendiente de cobro' },
  { id: 'ped19', numero_pedido: 'PED-2026-019', cliente_id: 'c3',  vendedor_id: 'u5', status: 'aprobado',       descuento_porcentaje: 0,  total_usd: 2500,  created_at: '2026-04-06T09:00:00Z', updated_at: '2026-04-07T10:00:00Z' },
  { id: 'ped20', numero_pedido: 'PED-2026-020', cliente_id: 'c4',  vendedor_id: 'u6', status: 'en_preparacion', descuento_porcentaje: 5,  total_usd: 1377.50, created_at: '2026-04-05T13:00:00Z', updated_at: '2026-04-08T14:00:00Z' },

  // ─── Pedidos con vencimiento próximo ─────────────────────────────────────────
  { id: 'ped21', numero_pedido: 'PED-2026-021', cliente_id: 'c1',  vendedor_id: 'u3', status: 'aprobado',       factura_fiscal: { numero_factura: 'F-2026-0021', tiene_iva: true, porcentaje_iva: 16, monto_base_usd: 1250, monto_iva_usd: 200, monto_total_factura_usd: 1450, status_pago: 'pendiente', fecha_emision: '2026-04-10' }, descuento_porcentaje: 0,  total_usd: 1250,  fecha_vencimiento: '2026-04-13', created_at: '2026-04-10T08:00:00Z', updated_at: '2026-04-11T09:00:00Z', notas: 'Pago acordado para mañana' },
  { id: 'ped22', numero_pedido: 'PED-2026-022', cliente_id: 'c6',  vendedor_id: 'u5', status: 'aprobado',       descuento_porcentaje: 0,  total_usd: 2100,  fecha_vencimiento: '2026-04-13', created_at: '2026-04-10T10:00:00Z', updated_at: '2026-04-11T11:00:00Z' },
  { id: 'ped23', numero_pedido: 'PED-2026-023', cliente_id: 'c3',  vendedor_id: 'u3', status: 'en_preparacion', descuento_porcentaje: 0,  total_usd: 380,   fecha_vencimiento: '2026-04-14', created_at: '2026-04-11T07:00:00Z', updated_at: '2026-04-12T08:00:00Z' },
  { id: 'ped24', numero_pedido: 'PED-2026-024', cliente_id: 'c10', vendedor_id: 'u4', status: 'aprobado',       factura_fiscal: { numero_factura: 'F-2026-0024', tiene_iva: true, porcentaje_iva: 16, monto_base_usd: 3200, monto_iva_usd: 512, monto_total_factura_usd: 3712, status_pago: 'pendiente', fecha_emision: '2026-04-11' }, descuento_porcentaje: 0,  total_usd: 3200,  fecha_vencimiento: '2026-04-14', created_at: '2026-04-11T09:00:00Z', updated_at: '2026-04-12T10:00:00Z' },
  { id: 'ped25', numero_pedido: 'PED-2026-025', cliente_id: 'c7',  vendedor_id: 'u5', status: 'en_transito',    factura_fiscal: { numero_factura: 'F-2026-0025', tiene_iva: false, porcentaje_iva: 16, monto_base_usd: 890, monto_iva_usd: 0, monto_total_factura_usd: 890, status_pago: 'pendiente', fecha_emision: '2026-04-11' }, descuento_porcentaje: 0,  total_usd: 890,   fecha_vencimiento: '2026-04-15', created_at: '2026-04-11T11:00:00Z', updated_at: '2026-04-12T12:00:00Z' },
];

const ITEMS: PedidoItem[] = [
  // PED-001
  { id: 'i1',  pedido_id: 'ped1',  producto_id: 'p1',  cantidad: 10, precio_unitario_usd: 45, descuento: 0  },
  { id: 'i2',  pedido_id: 'ped1',  producto_id: 'p4',  cantidad: 12, precio_unitario_usd: 38, descuento: 0  },
  { id: 'i3',  pedido_id: 'ped1',  producto_id: 'p7',  cantidad:  6, precio_unitario_usd: 55, descuento: 0  },
  // PED-002
  { id: 'i4',  pedido_id: 'ped2',  producto_id: 'p2',  cantidad:  8, precio_unitario_usd: 45, descuento: 5  },
  { id: 'i5',  pedido_id: 'ped2',  producto_id: 'p5',  cantidad:  6, precio_unitario_usd: 38, descuento: 5  },
  // PED-003
  { id: 'i6',  pedido_id: 'ped3',  producto_id: 'p1',  cantidad: 15, precio_unitario_usd: 45, descuento: 0  },
  { id: 'i7',  pedido_id: 'ped3',  producto_id: 'p11', cantidad: 20, precio_unitario_usd: 25, descuento: 0  },
  // PED-005 (tiene devolucion)
  { id: 'i8',  pedido_id: 'ped5',  producto_id: 'p4',  cantidad:  8, precio_unitario_usd: 38, descuento: 0  },
  { id: 'i9',  pedido_id: 'ped5',  producto_id: 'p6',  cantidad:  5, precio_unitario_usd: 32, descuento: 0  },
  // PED-006
  { id: 'i10', pedido_id: 'ped6',  producto_id: 'p1',  cantidad: 10, precio_unitario_usd: 45, descuento: 0  },
  { id: 'i11', pedido_id: 'ped6',  producto_id: 'p12', cantidad: 18, precio_unitario_usd: 25, descuento: 0  },
  // PED-009
  { id: 'i12', pedido_id: 'ped9',  producto_id: 'p7',  cantidad: 20, precio_unitario_usd: 55, descuento: 8  },
  { id: 'i13', pedido_id: 'ped9',  producto_id: 'p10', cantidad: 10, precio_unitario_usd: 55, descuento: 8  },
  // PED-019
  { id: 'i14', pedido_id: 'ped19', producto_id: 'p1',  cantidad: 20, precio_unitario_usd: 45, descuento: 0  },
  { id: 'i15', pedido_id: 'ped19', producto_id: 'p4',  cantidad: 20, precio_unitario_usd: 38, descuento: 0  },
  { id: 'i16', pedido_id: 'ped19', producto_id: 'p7',  cantidad: 10, precio_unitario_usd: 55, descuento: 0  },
];

const PAGOS: Pago[] = [
  { id: 'pag1',  pedido_id: 'ped1',  vendedor_id: 'u3', fecha_pago: '2026-01-25', tipo: 'completo', moneda: 'usd', monto_usd: 1200,  cuenta_bancaria_id: 'cb1', created_at: '2026-01-25T10:00:00Z' },
  { id: 'pag2',  pedido_id: 'ped2',  vendedor_id: 'u4', fecha_pago: '2026-02-01', tipo: 'completo', moneda: 'bs',  monto_bs: 30990.8, tasa_cambio: 40.78, cuenta_bancaria_id: 'cb2', created_at: '2026-02-01T11:00:00Z' },
  { id: 'pag3',  pedido_id: 'ped3',  vendedor_id: 'u5', fecha_pago: '2026-02-05', tipo: 'abono',    moneda: 'usd', monto_usd: 750,   cuenta_bancaria_id: 'cb4', created_at: '2026-02-05T09:00:00Z' },
  { id: 'pag4',  pedido_id: 'ped3',  vendedor_id: 'u5', fecha_pago: '2026-02-10', tipo: 'abono',    moneda: 'usd', monto_usd: 750,   cuenta_bancaria_id: 'cb4', created_at: '2026-02-10T10:00:00Z' },
  { id: 'pag5',  pedido_id: 'ped4',  vendedor_id: 'u6', fecha_pago: '2026-02-20', tipo: 'completo', moneda: 'usd', monto_usd: 1890,  cuenta_bancaria_id: 'cb5', created_at: '2026-02-20T14:00:00Z' },
  { id: 'pag6',  pedido_id: 'ped5',  vendedor_id: 'u3', fecha_pago: '2026-02-22', tipo: 'completo', moneda: 'bs',  monto_bs: 26780,  tasa_cambio: 41.20, cuenta_bancaria_id: 'cb1', created_at: '2026-02-22T16:00:00Z' },
  { id: 'pag7',  pedido_id: 'ped6',  vendedor_id: 'u3', fecha_pago: '2026-04-05', tipo: 'abono',    moneda: 'usd', monto_usd: 400,   cuenta_bancaria_id: 'cb2', created_at: '2026-04-05T09:00:00Z' },
  { id: 'pag8',  pedido_id: 'ped7',  vendedor_id: 'u4', fecha_pago: '2026-04-02', tipo: 'abono',    moneda: 'bs',  monto_bs: 41250,  tasa_cambio: 41.50, cuenta_bancaria_id: 'cb4', created_at: '2026-04-02T11:00:00Z' },
  { id: 'pag9',  pedido_id: 'ped9',  vendedor_id: 'u6', fecha_pago: '2026-04-06', tipo: 'abono',    moneda: 'usd', monto_usd: 1000,  cuenta_bancaria_id: 'cb1', created_at: '2026-04-06T10:00:00Z' },
  { id: 'pag10', pedido_id: 'ped10', vendedor_id: 'u3', fecha_pago: '2026-04-07', tipo: 'abono',    moneda: 'usd', monto_usd: 500,   cuenta_bancaria_id: 'cb5', created_at: '2026-04-07T09:00:00Z' },
  { id: 'pag11', pedido_id: 'ped11', vendedor_id: 'u4', fecha_pago: '2026-04-08', tipo: 'abono',    moneda: 'bs',  monto_bs: 10375,  tasa_cambio: 41.50, cuenta_bancaria_id: 'cb2', created_at: '2026-04-08T10:00:00Z' },
  { id: 'pag12', pedido_id: 'ped12', vendedor_id: 'u5', fecha_pago: '2026-04-08', tipo: 'abono',    moneda: 'usd', monto_usd: 700,   cuenta_bancaria_id: 'cb4', created_at: '2026-04-08T11:00:00Z' },
  { id: 'pag13', pedido_id: 'ped17', vendedor_id: 'u6', fecha_pago: '2026-04-08', tipo: 'abono',    moneda: 'bs',  monto_bs: 20750,  tasa_cambio: 41.50, cuenta_bancaria_id: 'cb1', created_at: '2026-04-08T12:00:00Z' },
  { id: 'pag14', pedido_id: 'ped18', vendedor_id: 'u4', fecha_pago: '2026-03-15', tipo: 'abono',    moneda: 'usd', monto_usd: 400,   cuenta_bancaria_id: 'cb2', created_at: '2026-03-15T10:00:00Z' },
  { id: 'pag15', pedido_id: 'ped19', vendedor_id: 'u5', fecha_pago: '2026-04-07', tipo: 'abono',    moneda: 'usd', monto_usd: 1200,  cuenta_bancaria_id: 'cb5', created_at: '2026-04-07T11:00:00Z' },
];

const COMISIONES: Comision[] = [
  // ped1: transferencia, sin descuento → 3% de $1200 = $36
  { id: 'com1', pedido_id: 'ped1',  vendedor_id: 'u3', porcentaje: 3,   porcentaje_original: 3,   monto_usd: 36,    pagada: true,  metodo_pago: 'transferencia', tiene_descuento: false, fecha_pago_comision: '2026-02-10', created_at: '2026-02-01T00:00:00Z' },
  // ped2: efectivo_usd, con descuento → 3% de $760 = $22.80
  { id: 'com2', pedido_id: 'ped2',  vendedor_id: 'u4', porcentaje: 3,   porcentaje_original: 3,   monto_usd: 22.80, pagada: true,  metodo_pago: 'efectivo_usd',  tiene_descuento: true,  fecha_pago_comision: '2026-02-20', created_at: '2026-02-15T00:00:00Z' },
  // ped3: transferencia, sin descuento → 3% de $1500 = $45
  { id: 'com3', pedido_id: 'ped3',  vendedor_id: 'u5', porcentaje: 3,   porcentaje_original: 3,   monto_usd: 45,    pagada: true,  metodo_pago: 'transferencia', tiene_descuento: false, fecha_pago_comision: '2026-03-01', created_at: '2026-02-20T00:00:00Z' },
  // ped4: transferencia, con descuento → admin editó a 3% (original 2%): $1890 * 3% = $56.70
  { id: 'com4', pedido_id: 'ped4',  vendedor_id: 'u6', porcentaje: 3,   porcentaje_original: 2,   monto_usd: 56.70, pagada: false, metodo_pago: 'transferencia', tiene_descuento: true,  editado_por_admin: true, created_at: '2026-03-01T00:00:00Z' },
  // ped5: efectivo_bs, sin descuento → 3% de $650 = $19.50
  { id: 'com5', pedido_id: 'ped5',  vendedor_id: 'u3', porcentaje: 3,   porcentaje_original: 3,   monto_usd: 19.50, pagada: false, metodo_pago: 'efectivo_bs',   tiene_descuento: false, created_at: '2026-03-05T00:00:00Z' },
  // ped10: transferencia, sin descuento → 3% de $1100 = $33
  { id: 'com6', pedido_id: 'ped10', vendedor_id: 'u3', porcentaje: 3,   porcentaje_original: 3,   monto_usd: 33,    pagada: false, metodo_pago: 'transferencia', tiene_descuento: false, created_at: '2026-04-08T00:00:00Z' },
];

const DEVOLUCIONES: Devolucion[] = [
  {
    id: 'dev1',
    pedido_id: 'ped5',
    cliente_id: 'c5',
    status: 'pendiente',
    items_devueltos: [
      { producto_id: 'p6', cantidad: 3, motivo: 'Talla incorrecta' },
    ],
    monto_credito_usd: 96,
    notas: 'Cliente solicita cambio por talla 40',
    created_at: '2026-04-01T10:00:00Z',
  },
];

const MOVIMIENTOS: InventarioMovimiento[] = [
  { id: 'mov1', producto_id: 'p1',  tipo: 'entrada_fabricacion', cantidad: 50,  notas: 'Lote enero',     created_at: '2026-01-05T00:00:00Z' },
  { id: 'mov2', producto_id: 'p4',  tipo: 'entrada_fabricacion', cantidad: 80,  notas: 'Lote enero',     created_at: '2026-01-05T00:00:00Z' },
  { id: 'mov3', producto_id: 'p1',  tipo: 'salida_pedido',       cantidad: 10,  referencia_id: 'ped1',  created_at: '2026-01-25T00:00:00Z' },
  { id: 'mov4', producto_id: 'p11', tipo: 'entrada_fabricacion', cantidad: 200, notas: 'Lote PVC feb',   created_at: '2026-02-10T00:00:00Z' },
  { id: 'mov5', producto_id: 'p12', tipo: 'entrada_fabricacion', cantidad: 200, notas: 'Lote PVC feb',   created_at: '2026-02-10T00:00:00Z' },
  { id: 'mov6', producto_id: 'p6',  tipo: 'devolucion',          cantidad: 3,   referencia_id: 'dev1',  created_at: '2026-04-01T00:00:00Z' },
  { id: 'mov7', producto_id: 'p8',  tipo: 'ajuste',              cantidad: -5,  notas: 'Producto dañado', created_at: '2026-03-15T00:00:00Z' },
];

const LOTES: LoteFabricacion[] = [
  { id: 'lot1', fecha_inicio: '2026-01-03', fecha_fin: '2026-01-20', cantidad_planificada: 300, cantidad_producida: 295, status: 'completado', tipo: 'botas', notas: 'Lote botas industriales Q1', created_at: '2026-01-03T00:00:00Z' },
  { id: 'lot2', fecha_inicio: '2026-02-05', fecha_fin: '2026-02-25', cantidad_planificada: 500, cantidad_producida: 500, status: 'completado', tipo: 'pvc',   notas: 'Lote PVC blanco y amarillo',  created_at: '2026-02-05T00:00:00Z' },
  { id: 'lot3', fecha_inicio: '2026-04-10',                          cantidad_planificada: 400, cantidad_producida: 0,   status: 'planificado',tipo: 'botas', notas: 'Lote Q2 botas negras',         created_at: '2026-04-08T00:00:00Z' },
];

const MATERIALES: Material[] = [
  { id: 'mat1', nombre: 'Cuero vacuno natural',    unidad: 'dm²',  stock_actual: 5000, stock_minimo: 1000, costo_unitario_usd: 0.85 },
  { id: 'mat2', nombre: 'Cuero sintético negro',   unidad: 'dm²',  stock_actual: 8000, stock_minimo: 2000, costo_unitario_usd: 0.45 },
  { id: 'mat3', nombre: 'Suela de caucho',          unidad: 'pares', stock_actual: 800,  stock_minimo: 200,  costo_unitario_usd: 3.50 },
  { id: 'mat4', nombre: 'Hilo encerado',            unidad: 'rollo', stock_actual: 120,  stock_minimo: 30,   costo_unitario_usd: 2.00 },
  { id: 'mat5', nombre: 'Plantilla anatomica',      unidad: 'pares', stock_actual: 1500, stock_minimo: 500,  costo_unitario_usd: 1.20 },
  { id: 'mat6', nombre: 'Resina PVC blanca',        unidad: 'kg',    stock_actual: 200,  stock_minimo: 50,   costo_unitario_usd: 2.80 },
  { id: 'mat7', nombre: 'Resina PVC amarilla',      unidad: 'kg',    stock_actual: 40,   stock_minimo: 50,   costo_unitario_usd: 3.10 },
  { id: 'mat8', nombre: 'Pegamento industrial',     unidad: 'litro', stock_actual: 85,   stock_minimo: 20,   costo_unitario_usd: 5.50 },
];

const PROVEEDORES: Proveedor[] = [
  { id: 'prov1', nombre: 'Curtiembre El Rodeo C.A.',    rif: 'J-20123456-1', telefono: '0241-8123456', email: 'ventas@elrodeo.com',    activo: true  },
  { id: 'prov2', nombre: 'Suelas y Componentes S.A.',   rif: 'J-21234567-2', telefono: '0212-9234567', email: 'info@suelasycomp.com',  activo: true  },
  { id: 'prov3', nombre: 'Plásticos Nacionales S.R.L.', rif: 'J-22345678-3', telefono: '0244-7345678', email: 'pedidos@plastnac.com',  activo: true  },
  { id: 'prov4', nombre: 'Insumos Industriales C.A.',   rif: 'J-23456789-4', telefono: '0261-6456789', email: null as unknown as string, activo: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function diasParaVencer(fecha?: string): number | undefined {
  if (!fecha) return undefined;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const venc = new Date(fecha);
  venc.setHours(0, 0, 0, 0);
  return Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
}

function calcularSaldoPedido(pedido: Pedido, pagos: Pago[]): number {
  const cobrado = pagos
    .filter(p => p.pedido_id === pedido.id)
    .reduce((sum, p) => {
      if (p.moneda === 'usd') return sum + (p.monto_usd ?? 0);
      if (p.moneda === 'bs' && p.tasa_cambio) return sum + (p.monto_bs ?? 0) / p.tasa_cambio;
      return sum;
    }, 0);
  return Math.max(0, pedido.total_usd - cobrado);
}

function calcularResumenDeuda(
  clienteId: string,
  pedidos: Pedido[],
  pagos: Pago[],
): ResumenDeudaCliente {
  const pedidosCliente = pedidos.filter(
    p => p.cliente_id === clienteId && p.status !== 'cancelado',
  );

  let montoTotal = 0;
  let conteo = 0;
  let maxDiasMora = 0;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (const pedido of pedidosCliente) {
    const saldo = calcularSaldoPedido(pedido, pagos);
    if (saldo > 0) {
      montoTotal += saldo;
      conteo++;

      const fechaRef = pedido.fecha_vencimiento
        ? new Date(pedido.fecha_vencimiento)
        : new Date(pedido.created_at);
      fechaRef.setHours(0, 0, 0, 0);

      if (hoy > fechaRef) {
        const diasMora = Math.floor(
          (hoy.getTime() - fechaRef.getTime()) / (1000 * 60 * 60 * 24),
        );
        maxDiasMora = Math.max(maxDiasMora, diasMora);
      }
    }
  }

  return {
    monto_total_adeudado: montoTotal,
    conteo_pedidos_pendientes: conteo,
    rango_maximo_dias_mora: maxDiasMora,
  };
}

function enrichPago(p: Pago, cuentas: CuentaBancaria[]): Pago {
  return {
    ...p,
    cuenta_bancaria: cuentas.find(cb => cb.id === p.cuenta_bancaria_id),
  };
}

function enrichPedido(p: Pedido, pagos: Pago[], cuentas: CuentaBancaria[]): Pedido {
  const cliente = CLIENTES.find(c => c.id === p.cliente_id);
  const vendedor = USUARIOS.find(u => u.id === p.vendedor_id);
  const items = ITEMS
    .filter(i => i.pedido_id === p.id)
    .map(i => ({
      ...i,
      producto: PRODUCTOS.find(pr => pr.id === i.producto_id),
      subtotal_usd: i.cantidad * i.precio_unitario_usd * (1 - i.descuento / 100),
    }));
  const pagosPedido = pagos
    .filter(pg => pg.pedido_id === p.id)
    .map(pg => enrichPago(pg, cuentas));

  return {
    ...p,
    cliente: cliente ? { ...cliente } : undefined,
    vendedor,
    items,
    pagos: pagosPedido,
    saldo_pendiente_usd: calcularSaldoPedido(p, pagos),
    dias_para_vencer: diasParaVencer(p.fecha_vencimiento),
    fecha_culminacion_pago: p.fecha_culminacion_pago,
  };
}

// ─── Servicio ─────────────────────────────────────────────────────────────────

// ─── Helpers de comisiones ────────────────────────────────────────────────────

function tieneDescuentoPedido(pedido: Pedido): boolean {
  if (pedido.descuento_porcentaje > 0) return true;
  if (!pedido.items) return false;
  return pedido.items.some(i => i.descuento > 0);
}

function calcularPorcentajeComision(
  pedido: Pedido,
  metodoPago: string,
  config: ConfigComisionMetodoPago[],
): { porcentaje: number; metodo_pago: string; tiene_descuento: boolean } {
  const conDescuento = tieneDescuentoPedido(pedido);
  const cfg = config.find(c => c.metodo_pago === metodoPago)
    ?? config.find(c => c.metodo_pago === 'default')
    ?? { porcentaje_sin_descuento: 3, porcentaje_con_descuento: 2 } as ConfigComisionMetodoPago;
  const porcentaje = conDescuento ? cfg.porcentaje_con_descuento : cfg.porcentaje_sin_descuento;
  return { porcentaje, metodo_pago: metodoPago, tiene_descuento: conDescuento };
}

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private _pedidos$ = new BehaviorSubject<Pedido[]>(PEDIDOS_RAW);
  private _pagos$ = new BehaviorSubject<Pago[]>(PAGOS);
  private _cuentas$ = new BehaviorSubject<CuentaBancaria[]>(CUENTAS_BANCARIAS);
  private _devoluciones$ = new BehaviorSubject<Devolucion[]>(DEVOLUCIONES);
  private _productos$ = new BehaviorSubject<Producto[]>(PRODUCTOS);
  private _clientes$ = new BehaviorSubject<Cliente[]>(CLIENTES);
  private _comisiones$ = new BehaviorSubject<Comision[]>(COMISIONES);
  private _movimientos$ = new BehaviorSubject<InventarioMovimiento[]>(MOVIMIENTOS);
  private _lotes$ = new BehaviorSubject<LoteFabricacion[]>(LOTES);
  private _materiales$ = new BehaviorSubject<Material[]>(MATERIALES);
  private _proveedores$ = new BehaviorSubject<Proveedor[]>(PROVEEDORES);
  private _configComisiones$ = new BehaviorSubject<ConfigComisionMetodoPago[]>(CONFIG_COMISIONES_DEFAULT);

  // ─── Queries ──────────────────────────────────────────────────────────────

  getUsuarios(): Observable<Usuario[]> {
    return of(USUARIOS).pipe(delay(100));
  }

  getVendedores(): Observable<Usuario[]> {
    return of(USUARIOS.filter(u => u.rol === 'vendedor')).pipe(delay(50));
  }

  getCuentasBancarias(): Observable<CuentaBancaria[]> {
    return this._cuentas$.asObservable();
  }

  getClientes(vendedorId?: string): Observable<Cliente[]> {
    return combineLatest([this._clientes$, this._pedidos$, this._pagos$]).pipe(
      map(([clientes, pedidos, pagos]) => {
        const filtered = vendedorId ? clientes.filter(c => c.vendedor_id === vendedorId) : clientes;
        return filtered.map(c => {
          const resumen = calcularResumenDeuda(c.id, pedidos, pagos);
          return {
            ...c,
            vendedor: USUARIOS.find(u => u.id === c.vendedor_id),
            ...resumen,
          };
        });
      }),
    );
  }

  getCliente(id: string): Observable<Cliente> {
    return combineLatest([this._clientes$, this._pedidos$, this._pagos$]).pipe(
      map(([clientes, pedidos, pagos]) => {
        const c = clientes.find(cl => cl.id === id);
        if (!c) throw new Error(`Cliente ${id} no encontrado`);
        const resumen = calcularResumenDeuda(c.id, pedidos, pagos);
        return {
          ...c,
          vendedor: USUARIOS.find(u => u.id === c.vendedor_id),
          ...resumen,
        };
      }),
    );
  }

  getPedidos(vendedorId?: string, status?: PedidoStatus, clienteId?: string): Observable<Pedido[]> {
    return combineLatest([this._pedidos$, this._pagos$, this._cuentas$]).pipe(
      map(([lista, pagos, cuentas]) => {
        let filtered = vendedorId ? lista.filter(p => p.vendedor_id === vendedorId) : lista;
        if (status) filtered = filtered.filter(p => p.status === status);
        if (clienteId) filtered = filtered.filter(p => p.cliente_id === clienteId);
        return filtered
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map(p => enrichPedido(p, pagos, cuentas));
      }),
    );
  }

  getPedido(id: string): Observable<Pedido> {
    return combineLatest([this._pedidos$, this._pagos$, this._cuentas$]).pipe(
      map(([lista, pagos, cuentas]) => {
        const p = lista.find(pd => pd.id === id);
        if (!p) throw new Error(`Pedido ${id} no encontrado`);
        return enrichPedido(p, pagos, cuentas);
      }),
    );
  }

  getProductos(): Observable<Producto[]> {
    return this._productos$.asObservable();
  }

  getPagos(pedidoId?: string): Observable<Pago[]> {
    return combineLatest([this._pagos$, this._cuentas$]).pipe(
      map(([lista, cuentas]) => {
        const filtered = pedidoId ? lista.filter(p => p.pedido_id === pedidoId) : lista;
        return filtered.map(p => enrichPago(p, cuentas));
      }),
    );
  }

  getComisiones(vendedorId?: string): Observable<Comision[]> {
    return combineLatest([this._comisiones$, this._pedidos$, this._pagos$, this._cuentas$]).pipe(
      map(([lista, pedidos, pagos, cuentas]) => {
        const filtered = vendedorId ? lista.filter(c => c.vendedor_id === vendedorId) : lista;
        return filtered
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map(c => ({
            ...c,
            pedido: pedidos.find(p => p.id === c.pedido_id)
              ? enrichPedido(pedidos.find(p => p.id === c.pedido_id)!, pagos, cuentas)
              : undefined,
          }));
      }),
    );
  }

  getConfigComisiones(): Observable<ConfigComisionMetodoPago[]> {
    return this._configComisiones$.asObservable();
  }

  actualizarConfigComisiones(config: ConfigComisionMetodoPago[]): Observable<ConfigComisionMetodoPago[]> {
    this._configComisiones$.next(config);
    return of(config).pipe(delay(100));
  }

  calcularUtilidadPorPedido(): Observable<UtilidadPedido[]> {
    return combineLatest([this._pedidos$, this._pagos$, this._cuentas$, this._comisiones$]).pipe(
      map(([pedidos, pagos, cuentas, comisiones]) => {
        return pedidos
          .filter(p => !['borrador', 'cancelado'].includes(p.status))
          .map(p => {
            const enriched = enrichPedido(p, pagos, cuentas);
            const cliente = CLIENTES.find(c => c.id === p.cliente_id);

            const costoFabricacion = (enriched.items ?? []).reduce((sum, item) => {
              const prod = PRODUCTOS.find(pr => pr.id === item.producto_id);
              return sum + (prod?.costo_usd ?? 0) * item.cantidad;
            }, 0);

            const monto_iva_usd = p.factura_fiscal?.monto_iva_usd ?? 0;
            const comision = comisiones.find(c => c.pedido_id === p.id);
            const comisionUsd = comision?.monto_usd ?? 0;

            const utilidadNeta = p.total_usd - monto_iva_usd - costoFabricacion - comisionUsd;
            const margen = p.total_usd > 0 ? (utilidadNeta / p.total_usd) * 100 : 0;

            return {
              pedido_id:             p.id,
              numero_pedido:         p.numero_pedido,
              cliente_nombre:        cliente?.razon_social ?? '—',
              precio_venta_usd:      p.total_usd,
              monto_iva_usd,
              costo_fabricacion_usd: costoFabricacion,
              comision_usd:          comisionUsd,
              utilidad_neta_usd:     utilidadNeta,
              margen_porcentaje:     Math.round(margen * 10) / 10,
            } satisfies UtilidadPedido;
          })
          .sort((a, b) => b.utilidad_neta_usd - a.utilidad_neta_usd);
      }),
    );
  }

  getDevoluciones(clienteId?: string): Observable<Devolucion[]> {
    return combineLatest([this._devoluciones$, this._pedidos$, this._cuentas$]).pipe(
      map(([lista, pedidos, cuentas]) => {
        const filtered = clienteId ? lista.filter(d => d.cliente_id === clienteId) : lista;
        return filtered.map(d => ({
          ...d,
          pedido: enrichPedido(
            pedidos.find(p => p.id === d.pedido_id) ?? ({ id: d.pedido_id } as Pedido),
            this._pagos$.getValue(),
            cuentas,
          ),
        }));
      }),
    );
  }

  getInventarioMovimientos(productoId?: string): Observable<InventarioMovimiento[]> {
    return this._movimientos$.pipe(
      map(lista => {
        const filtered = productoId ? lista.filter(m => m.producto_id === productoId) : lista;
        return filtered
          .map(m => ({ ...m, producto: this._productos$.getValue().find(p => p.id === m.producto_id) }))
          .sort((a, b) => b.created_at.localeCompare(a.created_at));
      }),
    );
  }

  getLotesFabricacion(): Observable<LoteFabricacion[]> {
    return this._lotes$.pipe(map(lista => [...lista].sort((a, b) => b.created_at.localeCompare(a.created_at))));
  }

  getMateriales(): Observable<Material[]> {
    return this._materiales$.asObservable();
  }

  getProveedores(): Observable<Proveedor[]> {
    return this._proveedores$.asObservable();
  }

  // ─── Mutaciones ───────────────────────────────────────────────────────────

  crearPedido(parcial: Partial<Pedido>): Observable<Pedido> {
    const ahora = new Date().toISOString();
    const n = this._pedidos$.getValue().length + 1;
    const nuevo: Pedido = {
      id: `ped_new_${Date.now()}`,
      numero_pedido: `PED-2026-${String(100 + n).padStart(3, '0')}`,
      cliente_id: '',
      vendedor_id: '',
      status: 'borrador',
      descuento_porcentaje: 0,
      total_usd: 0,
      created_at: ahora,
      updated_at: ahora,
      ...parcial,
    };
    this._pedidos$.next([...this._pedidos$.getValue(), nuevo]);
    return of(enrichPedido(nuevo, this._pagos$.getValue(), this._cuentas$.getValue())).pipe(delay(150));
  }

  actualizarPedido(id: string, cambios: Partial<Pedido>): Observable<Pedido> {
    const lista = this._pedidos$.getValue();
    const idx = lista.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Pedido ${id} no existe`);
    const actualizado = { ...lista[idx], ...cambios, updated_at: new Date().toISOString() };
    const nueva = [...lista];
    nueva[idx] = actualizado;
    this._pedidos$.next(nueva);
    return of(enrichPedido(actualizado, this._pagos$.getValue(), this._cuentas$.getValue())).pipe(delay(150));
  }

  // ─── Cambio de estado con validación de roles y máquina de estados ───────────
  cambiarStatusPedido(
    id: string,
    nuevoStatus: PedidoStatus,
    rolUsuario: import('../models').UserRole,
  ): Observable<Pedido> {
    const lista = this._pedidos$.getValue();
    const idx   = lista.findIndex(p => p.id === id);
    if (idx === -1) throw new Error(`Pedido ${id} no existe`);

    const actual = lista[idx].status;

    // Transiciones permitidas por rol
    const TRANSICIONES: Record<PedidoStatus, PedidoStatus[]> = {
      borrador:       ['en_aprobacion'],
      en_aprobacion:  ['aprobado', 'cancelado'],
      aprobado:       ['en_preparacion', 'cancelado'],
      en_preparacion: ['en_transito', 'cancelado'],
      en_transito:    ['entregado', 'cancelado'],
      entregado:      [],
      cancelado:      [],
    };

    const permitidos = TRANSICIONES[actual] ?? [];
    if (!permitidos.includes(nuevoStatus)) {
      throw new Error(
        `Transición inválida: ${actual} → ${nuevoStatus}. Permitidas: ${permitidos.join(', ') || 'ninguna'}`,
      );
    }

    // Vendedor solo puede enviar a aprobación
    if (rolUsuario === 'vendedor' && nuevoStatus !== 'en_aprobacion') {
      throw new Error('Los vendedores solo pueden enviar pedidos a aprobación.');
    }

    // Admin/gerente tienen control total sobre el resto
    return this.actualizarPedido(id, { status: nuevoStatus });
  }

  registrarPago(parcial: Partial<Pago>): Observable<Pago> {
    const nuevo: Pago = {
      id: `pag_new_${Date.now()}`,
      pedido_id: '',
      vendedor_id: '',
      fecha_pago: new Date().toISOString().slice(0, 10),
      tipo: 'abono',
      moneda: 'usd',
      created_at: new Date().toISOString(),
      ...parcial,
    };

    const pagosActualizados = [...this._pagos$.getValue(), nuevo];
    this._pagos$.next(pagosActualizados);

    // Auto-registrar fecha_culminacion_pago y generar comisión si el saldo llega a cero
    if (nuevo.pedido_id) {
      const pedidosActuales = this._pedidos$.getValue();
      const idxPed = pedidosActuales.findIndex(p => p.id === nuevo.pedido_id);
      if (idxPed !== -1) {
        const pedido = pedidosActuales[idxPed];
        const saldoRestante = calcularSaldoPedido(pedido, pagosActualizados);
        if (saldoRestante <= 0.009 && !pedido.fecha_culminacion_pago) {
          const nuevaLista = [...pedidosActuales];
          nuevaLista[idxPed] = {
            ...pedido,
            fecha_culminacion_pago: nuevo.fecha_pago,
            updated_at: new Date().toISOString(),
          };
          this._pedidos$.next(nuevaLista);

          // Auto-generar comisión si no existe una para este pedido
          const yaExiste = this._comisiones$.getValue().some(c => c.pedido_id === nuevo.pedido_id);
          if (!yaExiste) {
            const enrichedPedido = enrichPedido(pedido, pagosActualizados, this._cuentas$.getValue());
            const metodoPago = nuevo.moneda === 'usd'
              ? (nuevo.cuenta_bancaria_id ? 'transferencia' : 'efectivo_usd')
              : 'efectivo_bs';
            const config = this._configComisiones$.getValue();
            const calc  = calcularPorcentajeComision(enrichedPedido, metodoPago, config);
            const nuevaComision: Comision = {
              id: `com_auto_${Date.now()}`,
              pedido_id:          nuevo.pedido_id,
              vendedor_id:        pedido.vendedor_id,
              porcentaje:         calc.porcentaje,
              porcentaje_original: calc.porcentaje,
              monto_usd:          Math.round(pedido.total_usd * calc.porcentaje) / 100,
              pagada:             false,
              metodo_pago:        calc.metodo_pago,
              tiene_descuento:    calc.tiene_descuento,
              created_at:         new Date().toISOString(),
            };
            this._comisiones$.next([...this._comisiones$.getValue(), nuevaComision]);
          }
        }
      }
    }

    return of(enrichPago(nuevo, this._cuentas$.getValue())).pipe(delay(150));
  }

  crearDevolucion(parcial: Partial<Devolucion>): Observable<Devolucion> {
    const nueva: Devolucion = {
      id: `dev_new_${Date.now()}`,
      pedido_id: '',
      cliente_id: '',
      status: 'pendiente',
      items_devueltos: [],
      created_at: new Date().toISOString(),
      ...parcial,
    };
    this._devoluciones$.next([...this._devoluciones$.getValue(), nueva]);
    return of(nueva).pipe(delay(150));
  }

  actualizarDevolucion(id: string, cambios: Partial<Devolucion>): Observable<Devolucion> {
    const lista = this._devoluciones$.getValue();
    const idx = lista.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Devolución ${id} no existe`);
    const actualizada = { ...lista[idx], ...cambios };
    const nueva = [...lista];
    nueva[idx] = actualizada;
    this._devoluciones$.next(nueva);
    return of(actualizada).pipe(delay(150));
  }

  recibirDevolucion(id: string, notas?: string): Observable<Devolucion> {
    return this.actualizarDevolucion(id, {
      status: 'mercancia_recibida',
      mercancia_recibida_at: new Date().toISOString(),
      ...(notas ? { notas } : {}),
    });
  }

  procesarDevolucion(id: string, reintegrarStock: boolean): Observable<Devolucion> {
    const lista = this._devoluciones$.getValue();
    const idx = lista.findIndex(d => d.id === id);
    if (idx === -1) throw new Error(`Devolución ${id} no existe`);
    const dev = lista[idx];

    if (reintegrarStock) {
      const prods = this._productos$.getValue();
      const movs = this._movimientos$.getValue();
      const nuevosMovs = [...movs];
      const nuevosProds = [...prods];

      for (const item of dev.items_devueltos) {
        const pidx = nuevosProds.findIndex(p => p.id === item.producto_id);
        if (pidx !== -1) {
          nuevosProds[pidx] = {
            ...nuevosProds[pidx],
            stock_actual: nuevosProds[pidx].stock_actual + item.cantidad,
          };
          nuevosMovs.push({
            id: `mov_dev_${Date.now()}_${item.producto_id}`,
            producto_id: item.producto_id,
            tipo: 'devolucion',
            cantidad: item.cantidad,
            referencia_id: id,
            notas: `Devolución ${id} procesada`,
            created_at: new Date().toISOString(),
          });
        }
      }
      this._productos$.next(nuevosProds);
      this._movimientos$.next(nuevosMovs);
    }

    return this.actualizarDevolucion(id, {
      status: 'procesada',
      reintegrar_stock: reintegrarStock,
      procesada_at: new Date().toISOString(),
    });
  }

  rechazarDevolucion(id: string, notas?: string): Observable<Devolucion> {
    return this.actualizarDevolucion(id, {
      status: 'rechazada',
      ...(notas ? { notas } : {}),
    });
  }

  crearCliente(parcial: Partial<Cliente>): Observable<Cliente> {
    const lista = this._clientes$.getValue();
    const nextNum = String(lista.length + 1).padStart(4, '0');
    const nuevo: Cliente = {
      id: `c_new_${Date.now()}`,
      codigo_cliente: `CLI-${nextNum}`,
      razon_social: '',
      rif: '',
      vendedor_id: '',
      estado: '',
      ciudad: '',
      limite_credito_usd: 0,
      activo: true,
      created_at: new Date().toISOString(),
      ...parcial,
    };
    this._clientes$.next([...lista, nuevo]);
    return of({
      ...nuevo,
      vendedor: USUARIOS.find(u => u.id === nuevo.vendedor_id),
    }).pipe(delay(300));
  }

  actualizarCliente(id: string, cambios: Partial<Cliente>): Observable<Cliente> {
    const lista = this._clientes$.getValue();
    const idx = lista.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Cliente ${id} no existe`);
    const actualizado = { ...lista[idx], ...cambios };
    const nueva = [...lista];
    nueva[idx] = actualizado;
    this._clientes$.next(nueva);
    return of({
      ...actualizado,
      vendedor: USUARIOS.find(u => u.id === actualizado.vendedor_id),
    }).pipe(delay(300));
  }

  crearComision(parcial: Partial<Comision>): Observable<Comision> {
    const nueva: Comision = {
      id: `com_new_${Date.now()}`,
      pedido_id: '',
      vendedor_id: '',
      porcentaje: 3,
      monto_usd: 0,
      pagada: false,
      created_at: new Date().toISOString(),
      ...parcial,
    };
    this._comisiones$.next([...this._comisiones$.getValue(), nueva]);
    return of(nueva).pipe(delay(150));
  }

  actualizarComision(id: string, cambios: Partial<Comision>): Observable<Comision> {
    const lista = this._comisiones$.getValue();
    const idx = lista.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Comision ${id} no existe`);
    const actual = lista[idx];
    const porcentaje = cambios.porcentaje ?? actual.porcentaje;
    const monto_usd  = cambios.monto_usd ?? (actual.pedido ? actual.pedido.total_usd * porcentaje / 100 : actual.monto_usd);
    const actualizado: Comision = {
      ...actual,
      ...cambios,
      porcentaje,
      monto_usd,
      porcentaje_original: actual.porcentaje_original ?? actual.porcentaje,
      editado_por_admin: true,
    };
    const nueva = [...lista];
    nueva[idx] = actualizado;
    this._comisiones$.next(nueva);
    return of(actualizado).pipe(delay(150));
  }

  marcarComisionPagada(id: string, pagada: boolean): Observable<Comision> {
    const lista = this._comisiones$.getValue();
    const idx = lista.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Comision ${id} no existe`);
    const actualizado: Comision = {
      ...lista[idx],
      pagada,
      fecha_pago_comision: pagada ? new Date().toISOString().slice(0, 10) : undefined,
    };
    const nueva = [...lista];
    nueva[idx] = actualizado;
    this._comisiones$.next(nueva);
    return of(actualizado).pipe(delay(100));
  }

  agregarItemsPedido(pedidoId: string, items: Omit<import('../models').PedidoItem, 'id' | 'pedido_id'>[]): void {
    const mapped = items.map((item, i) => ({
      ...item,
      id: `item_new_${Date.now()}_${i}`,
      pedido_id: pedidoId,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ITEMS as any[]).push(...mapped);
  }

  actualizarProducto(id: string, cambios: Partial<Producto>): Observable<Producto> {
    const prods = this._productos$.getValue();
    const idx = prods.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    const updated = { ...prods[idx], ...cambios };
    const nueva = [...prods];
    nueva[idx] = updated;
    this._productos$.next(nueva);
    return of(updated).pipe(delay(150));
  }

  ajustarStock(productoId: string, cantidad: number, notas: string): Observable<Producto> {
    const prods = this._productos$.getValue();
    const idx = prods.findIndex(p => p.id === productoId);
    if (idx === -1) throw new Error('Producto no encontrado');
    const updated = { ...prods[idx], stock_actual: Math.max(0, prods[idx].stock_actual + cantidad) };
    const nueva = [...prods]; nueva[idx] = updated;
    this._productos$.next(nueva);
    const mov: InventarioMovimiento = {
      id: `mov_${Date.now()}`, producto_id: productoId, tipo: 'ajuste',
      cantidad, notas, created_at: new Date().toISOString(),
    };
    this._movimientos$.next([...this._movimientos$.getValue(), mov]);
    return of(updated).pipe(delay(150));
  }

  crearLote(parcial: Partial<LoteFabricacion>): Observable<LoteFabricacion> {
    const nuevo: LoteFabricacion = {
      id: `lot_${Date.now()}`, cantidad_planificada: 0, cantidad_producida: 0,
      status: 'planificado', tipo: 'botas', created_at: new Date().toISOString(), ...parcial,
    };
    this._lotes$.next([...this._lotes$.getValue(), nuevo]);
    return of(nuevo).pipe(delay(150));
  }

  actualizarLote(id: string, cambios: Partial<LoteFabricacion>): Observable<LoteFabricacion> {
    const lista = this._lotes$.getValue();
    const idx = lista.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lote no encontrado');
    const actualizado = { ...lista[idx], ...cambios };
    const nueva = [...lista]; nueva[idx] = actualizado;
    this._lotes$.next(nueva);
    return of(actualizado).pipe(delay(150));
  }

  completarLote(id: string, cantidadProducida: number, productoId: string): Observable<LoteFabricacion> {
    const lista = this._lotes$.getValue();
    const idx = lista.findIndex(l => l.id === id);
    if (idx === -1) throw new Error('Lote no encontrado');
    const actualizado = { ...lista[idx], cantidad_producida: cantidadProducida, status: 'completado' as const };
    const nueva = [...lista]; nueva[idx] = actualizado;
    this._lotes$.next(nueva);
    const prods = this._productos$.getValue();
    const pidx = prods.findIndex(p => p.id === productoId);
    if (pidx !== -1) {
      const np = [...prods]; np[pidx] = { ...prods[pidx], stock_actual: prods[pidx].stock_actual + cantidadProducida };
      this._productos$.next(np);
    }
    const mov: InventarioMovimiento = {
      id: `mov_${Date.now()}`, producto_id: productoId, tipo: 'entrada_fabricacion',
      cantidad: cantidadProducida, referencia_id: id, notas: `Lote ${id} completado`,
      created_at: new Date().toISOString(),
    };
    this._movimientos$.next([...this._movimientos$.getValue(), mov]);
    return of(actualizado).pipe(delay(150));
  }

  crearMaterial(parcial: Partial<Material>): Observable<Material> {
    const nuevo: Material = {
      id: `mat_${Date.now()}`, nombre: '', unidad: 'unidad', stock_actual: 0, ...parcial,
    };
    this._materiales$.next([...this._materiales$.getValue(), nuevo]);
    return of(nuevo).pipe(delay(150));
  }

  actualizarMaterial(id: string, cambios: Partial<Material>): Observable<Material> {
    const lista = this._materiales$.getValue();
    const idx = lista.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('Material no encontrado');
    const actualizado = { ...lista[idx], ...cambios };
    const nueva = [...lista]; nueva[idx] = actualizado;
    this._materiales$.next(nueva);
    return of(actualizado).pipe(delay(150));
  }

  registrarCompraMateria(materialId: string, cantidad: number, proveedor: string, precioTotal: number): Observable<Material> {
    const lista = this._materiales$.getValue();
    const idx = lista.findIndex(m => m.id === materialId);
    if (idx === -1) throw new Error('Material no encontrado');
    const actualizado = { ...lista[idx], stock_actual: lista[idx].stock_actual + cantidad };
    const nueva = [...lista]; nueva[idx] = actualizado;
    this._materiales$.next(nueva);
    return of(actualizado).pipe(delay(200));
  }

  crearProveedor(parcial: Partial<Proveedor>): Observable<Proveedor> {
    const nuevo: Proveedor = {
      id: `prov_${Date.now()}`, nombre: '', activo: true, ...parcial,
    };
    this._proveedores$.next([...this._proveedores$.getValue(), nuevo]);
    return of(nuevo).pipe(delay(150));
  }

  actualizarProveedor(id: string, cambios: Partial<Proveedor>): Observable<Proveedor> {
    const lista = this._proveedores$.getValue();
    const idx = lista.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proveedor no encontrado');
    const actualizado = { ...lista[idx], ...cambios };
    const nueva = [...lista]; nueva[idx] = actualizado;
    this._proveedores$.next(nueva);
    return of(actualizado).pipe(delay(150));
  }

  // ─── Validación de bloqueo por inactividad de pago (> 60 días) ───────────────

  verificarBloqueoCliente(clienteId: string): Observable<{
    bloqueado: boolean;
    diasSinAbono: number;
    pedidosPendientes: Pedido[];
  }> {
    return combineLatest([this._pedidos$, this._pagos$, this._cuentas$]).pipe(
      map(([pedidos, pagos, cuentas]) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const pendientes = pedidos.filter(
          p => p.cliente_id === clienteId &&
               !['cancelado', 'borrador'].includes(p.status) &&
               calcularSaldoPedido(p, pagos) > 0.009,
        );

        let maxDiasSinAbono = 0;
        const pedidosProblema: Pedido[] = [];

        for (const pedido of pendientes) {
          const pagosPedido = pagos.filter(pg => pg.pedido_id === pedido.id);
          let ultimaFecha: Date;

          if (pagosPedido.length > 0) {
            const fechas = pagosPedido.map(pg => new Date(pg.fecha_pago).getTime());
            ultimaFecha = new Date(Math.max(...fechas));
          } else {
            ultimaFecha = new Date(pedido.created_at);
          }
          ultimaFecha.setHours(0, 0, 0, 0);

          const diasSin = Math.floor((hoy.getTime() - ultimaFecha.getTime()) / (1000 * 60 * 60 * 24));

          if (diasSin > 60) {
            maxDiasSinAbono = Math.max(maxDiasSinAbono, diasSin);
            pedidosProblema.push(enrichPedido(pedido, pagos, cuentas));
          }
        }

        return {
          bloqueado: pedidosProblema.length > 0,
          diasSinAbono: maxDiasSinAbono,
          pedidosPendientes: pedidosProblema,
        };
      }),
    );
  }

  // ─── Mapa de clientes ──────────────────────────────────────────────────────

  getClientesConCoordenadas(vendedorId?: string): Observable<Cliente[]> {
    return this.getClientes(vendedorId).pipe(
      map(clientes => clientes.filter(c => c.activo && c.coordenadas)),
    );
  }

  getRutaOptima(vendedorId: string): Observable<{
    clientes: Cliente[];
    distancia_total_km: number;
    tiempo_estimado_min: number;
    monto_total_cobrar_usd: number;
  }> {
    return this.getClientesConCoordenadas(vendedorId).pipe(
      map(clientes => {
        const fabrica = { lat: 10.5050, lng: -66.8300 };
        const ordenados = this._ordenarRutaNN(clientes, fabrica);
        const distancia = this._calcularDistanciaRuta([fabrica, ...ordenados.map(c => c.coordenadas!)]);
        return {
          clientes: ordenados,
          distancia_total_km: Math.round(distancia * 111 * 10) / 10,
          tiempo_estimado_min: Math.round(distancia * 111 * 3),
          monto_total_cobrar_usd: ordenados.reduce((s, c) => s + (c.monto_total_adeudado ?? 0), 0),
        };
      }),
    );
  }

  private _ordenarRutaNN(clientes: Cliente[], origen: { lat: number; lng: number }): Cliente[] {
    const pendientes = [...clientes];
    const ruta: Cliente[] = [];
    let posActual = origen;
    while (pendientes.length > 0) {
      let masNear = 0;
      let distMin = Infinity;
      pendientes.forEach((c, i) => {
        const dist = Math.hypot(c.coordenadas!.lat - posActual.lat, c.coordenadas!.lng - posActual.lng);
        if (dist < distMin) { distMin = dist; masNear = i; }
      });
      ruta.push(pendientes.splice(masNear, 1)[0]);
      posActual = ruta[ruta.length - 1].coordenadas!;
    }
    return ruta;
  }

  private _calcularDistanciaRuta(puntos: { lat: number; lng: number }[]): number {
    let total = 0;
    for (let i = 0; i < puntos.length - 1; i++) {
      total += Math.hypot(puntos[i + 1].lat - puntos[i].lat, puntos[i + 1].lng - puntos[i].lng);
    }
    return total;
  }
}
