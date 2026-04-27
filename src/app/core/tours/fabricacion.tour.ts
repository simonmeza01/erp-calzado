import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getFabricacionTourSteps(): StepOptions[] {
  return [
    {
      id: 'fabricacion-intro',
      title: 'Módulo de Fabricación',
      text: '<p>Aquí gestionas los lotes de producción. Puedes crear órdenes de fabricación, hacer seguimiento del avance y completar lotes cuando la producción finalice.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'fabricacion-alerta',
      title: 'Alerta de materiales',
      text: '<p>Si hay materias primas con stock insuficiente para producir, aparece esta alerta con un enlace directo al inventario para que puedas gestionarlo.</p>',
      attachTo: { element: '[data-tour="fabricacion-alerta"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'fabricacion-nuevo',
      title: 'Nuevo lote de producción',
      text: '<p>Haz clic aquí para crear un nuevo lote. Define el tipo de producto (botas o PVC), las fechas de inicio y entrega, y la cantidad a producir.</p>',
      attachTo: { element: '[data-tour="fabricacion-nuevo"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'fabricacion-lotes',
      title: 'Lotes en producción',
      text: '<p>Cada tarjeta representa un lote activo con su progreso, fechas y estado. Desde aquí puedes iniciar la producción, actualizar el avance y marcar el lote como completado.</p>',
      attachTo: { element: '[data-tour="fabricacion-lotes"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
