import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getDashboardTourSteps(): StepOptions[] {
  return [
    {
      id: 'dashboard-intro',
      title: 'Dashboard — Visión general',
      text: '<p>El Dashboard te muestra un resumen ejecutivo de la situación de la empresa: ventas, cuentas por cobrar, inventario y rendimiento por vendedor.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'dashboard-filtros',
      title: 'Filtros de período',
      text: '<p>Selecciona el mes y año que deseas analizar. Todos los indicadores y gráficos se actualizan según el período seleccionado.</p>',
      attachTo: { element: '[data-tour="dashboard-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'dashboard-kpis',
      title: 'Indicadores clave (KPIs)',
      text: '<p>Aquí verás de un vistazo las ventas del período, el total cobrado, las cuentas pendientes y otros indicadores críticos del negocio.</p>',
      attachTo: { element: '[data-tour="dashboard-kpis"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'dashboard-graficos',
      title: 'Gráficos de ventas',
      text: '<p>El gráfico de barras muestra las ventas por período y el circular desglosa la distribución. Pasa el cursor sobre las barras para ver los detalles.</p>',
      attachTo: { element: '[data-tour="dashboard-graficos"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'dashboard-cuentas',
      title: 'Cuentas por vencer',
      text: '<p>Listado rápido de los pedidos más urgentes próximos a su fecha de vencimiento. Haz clic en cualquiera para ir directamente al detalle del pedido.</p>',
      attachTo: { element: '[data-tour="dashboard-cuentas-vencer"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'dashboard-vendedores',
      title: 'Rendimiento por vendedor',
      text: '<p>Compara el desempeño de cada vendedor: pedidos registrados, monto vendido y deuda acumulada de su cartera de clientes.</p>',
      attachTo: { element: '[data-tour="dashboard-vendedores"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
