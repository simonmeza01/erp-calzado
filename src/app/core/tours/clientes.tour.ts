import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getClientesTourSteps(): StepOptions[] {
  return [
    {
      id: 'clientes-intro',
      title: 'Módulo de Clientes',
      text: '<p>Aquí administras toda tu cartera de clientes: puedes consultar su información, deuda total, días de mora, historial de pedidos y datos de ubicación.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'clientes-nuevo',
      title: 'Agregar nuevo cliente',
      text: '<p>Haz clic en este botón para registrar un nuevo cliente. Podrás ingresar su razón social, RIF, dirección, teléfono, estado y ciudad de Venezuela, y asignarle un vendedor. El código de cliente se genera automáticamente.</p>',
      attachTo: { element: '[data-tour="clientes-nuevo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'clientes-filtros',
      title: 'Filtros de búsqueda',
      text: '<p>Usa estos filtros para encontrar clientes rápidamente. Puedes buscar por nombre, código (CLI-XXXX) o RIF, filtrar por estado (Distrito Capital, Miranda, Carabobo…), vendedor asignado o estado de cuenta.</p>',
      attachTo: { element: '[data-tour="clientes-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'clientes-tabla',
      title: 'Lista de clientes',
      text: '<p>Aquí ves todos tus clientes con su código, estado/ciudad, deuda total y días de mora. Los clientes con monto en rojo tienen deuda pendiente; los marcados "Al día" están al corriente. La columna "Mora" muestra los días vencidos máximos.</p>',
      attachTo: { element: '[data-tour="clientes-tabla"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'clientes-acciones',
      title: 'Acciones por cliente',
      text: '<p>Cada fila tiene tres acciones: <strong>Ver detalle</strong> (historial completo), <strong>Nuevo pedido</strong> (crear un pedido para ese cliente) y <strong>Editar</strong> (modificar sus datos).</p>',
      attachTo: { element: '[data-tour="clientes-tabla"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
