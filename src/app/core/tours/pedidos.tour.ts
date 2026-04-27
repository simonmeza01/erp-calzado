import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getPedidosTourSteps(): StepOptions[] {
  return [
    {
      id: 'pedidos-intro',
      title: 'Módulo de Pedidos',
      text: '<p>Aquí gestionas todos los pedidos de la empresa. Puedes crear nuevos pedidos, hacer seguimiento de su estado, registrar pagos y gestionar devoluciones.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'pedidos-nuevo',
      title: 'Crear nuevo pedido',
      text: '<p>Usa este botón para crear un nuevo pedido. El proceso es paso a paso: primero seleccionas el cliente y condiciones, luego agregas los productos y finalmente confirmas.</p>',
      attachTo: { element: '[data-tour="pedidos-nuevo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'pedidos-filtros',
      title: 'Filtros y búsqueda',
      text: '<p>Filtra pedidos por estado (borrador, aprobado, en preparación, etc.), vendedor, rango de fechas o busca directamente por número o cliente. El botón "Solo los míos" muestra únicamente tus pedidos.</p>',
      attachTo: { element: '[data-tour="pedidos-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'pedidos-lista',
      title: 'Lista de pedidos',
      text: '<p>Cada pedido muestra su número, cliente, monto, estado actual y fecha de vencimiento. Los pedidos con alerta naranja están próximos a vencer.</p>',
      attachTo: { element: '[data-tour="pedidos-lista"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'pedidos-estados',
      title: 'Ciclo de vida de un pedido',
      text: `<p>Los pedidos siguen este flujo:</p>
             <ol style="margin-top:6px;padding-left:16px;line-height:1.8">
               <li><strong>Borrador</strong> → en edición</li>
               <li><strong>En aprobación</strong> → pendiente de autorización</li>
               <li><strong>Aprobado</strong> → listo para preparar</li>
               <li><strong>En preparación</strong> → siendo empacado</li>
               <li><strong>Despachado</strong> → en camino</li>
               <li><strong>Entregado</strong> → completado</li>
             </ol>`,
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
