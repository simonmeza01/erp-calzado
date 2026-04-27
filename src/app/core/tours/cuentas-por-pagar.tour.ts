import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getCuentasPorPagarTourSteps(): StepOptions[] {
  return [
    {
      id: 'cuentas-intro',
      title: 'Cuentas por Pagar',
      text: '<p>Este módulo muestra todos los pedidos pendientes de cobro, organizados por urgencia de vencimiento. Te permite hacer seguimiento y contactar a los clientes con deuda.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'cuentas-exportar',
      title: 'Exportar reporte',
      text: '<p>Descarga el listado completo de cuentas por vencer en formato CSV para trabajar con él en Excel u otras herramientas.</p>',
      attachTo: { element: '[data-tour="cuentas-exportar"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'cuentas-urgencia',
      title: 'Tarjetas por urgencia',
      text: '<p>Estas tarjetas agrupan los pedidos por nivel de urgencia: vencidos, próximos a vencer (menos de 3 días), esta semana y más adelante. Haz clic en una para filtrar la tabla.</p>',
      attachTo: { element: '[data-tour="cuentas-urgencia"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'cuentas-tabla',
      title: 'Tabla de cuentas',
      text: '<p>La tabla detalla cada cuenta pendiente con el cliente, estado/ciudad, monto adeudado, fecha de vencimiento y alerta de urgencia. Puedes filtrar también por estado venezolano. El ícono de correo te permite contactar al cliente directamente.</p>',
      attachTo: { element: '[data-tour="cuentas-tabla"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
