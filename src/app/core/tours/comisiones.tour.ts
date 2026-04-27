import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getComisionesTourSteps(): StepOptions[] {
  return [
    {
      id: 'comisiones-intro',
      title: 'Mis Comisiones',
      text: '<p>Aquí puedes consultar todas tus comisiones generadas por ventas cobradas. El sistema las calcula <strong>automáticamente</strong> cuando un pedido queda pagado en su totalidad, aplicando el porcentaje según el método de pago utilizado.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'comisiones-resumen',
      title: 'Resumen financiero',
      text: '<p>Tres tarjetas resumen tu situación: <strong>Total ganado</strong> (todas las comisiones del historial), <strong>Cobradas</strong> (ya te las pagaron) y <strong>Por cobrar</strong> (pendientes de pago por la empresa).</p>',
      attachTo: { element: '[data-tour="comisiones-resumen"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-filtros',
      title: 'Filtros de consulta',
      text: '<p>Filtra tus comisiones por <strong>estado</strong> (pendiente o cobrada) o por <strong>método de pago</strong> que originó la comisión (transferencia, efectivo USD/Bs., retención). Cada método tiene tasas distintas.</p>',
      attachTo: { element: '[data-tour="comisiones-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-lista',
      title: 'Detalle por pedido',
      text: '<p>Cada fila muestra el <strong>pedido y cliente</strong> que originó la comisión, el <strong>porcentaje aplicado</strong> (si el administrador lo modificó verás el valor original tachado), las etiquetas de método de pago y si hubo descuentos, y finalmente el <strong>monto en USD</strong>. Las comisiones ya pagadas muestran la fecha de cobro.</p>',
      attachTo: { element: '[data-tour="comisiones-lista"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
