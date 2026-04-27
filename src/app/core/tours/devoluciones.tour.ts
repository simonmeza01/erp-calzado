import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getDevolucionesTourSteps(): StepOptions[] {
  return [
    {
      id: 'devoluciones-intro',
      title: 'Módulo de Devoluciones',
      text: '<p>Aquí ves el registro de todas las devoluciones realizadas por los clientes. Las devoluciones se generan desde el detalle de un pedido entregado.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'devoluciones-lista',
      title: 'Lista de devoluciones',
      text: '<p>Cada devolución muestra el cliente, los productos devueltos, el motivo, el estado (pendiente / procesada / rechazada) y el monto de crédito generado a favor del cliente.</p>',
      attachTo: { element: '[data-tour="devoluciones-lista"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'devoluciones-nota',
      title: '¿Cómo registrar una devolución?',
      text: '<p>Para registrar una devolución nueva, ve al <strong>detalle del pedido</strong> correspondiente y usa el botón "Registrar devolución". Las devoluciones solo se pueden hacer sobre pedidos ya entregados.</p>',
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
