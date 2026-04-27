import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getComprasTourSteps(): StepOptions[] {
  return [
    {
      id: 'compras-intro',
      title: 'Módulo de Compras',
      text: '<p>Gestiona la compra de materias primas y el catálogo de proveedores. También incluye una herramienta de planificación MRP para calcular materiales necesarios.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'compras-tabs',
      title: 'Secciones de compras',
      text: '<p>El módulo está dividido en tres pestañas: <strong>Materiales</strong> (historial de compras), <strong>Proveedores</strong> (directorio) y <strong>MRP</strong> (planificación de materiales).</p>',
      attachTo: { element: '[data-tour="compras-tabs"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'compras-materiales',
      title: 'Registro de compras',
      text: '<p>En la pestaña de Materiales puedes ver todas las compras realizadas y registrar nuevas. Cada compra queda asentada con proveedor, material, cantidad y costo.</p>',
      attachTo: { element: '[data-tour="compras-contenido"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'compras-mrp',
      title: 'Planificación MRP',
      text: '<p>La pestaña MRP calcula cuántos materiales necesitas para producir una cantidad determinada de pares. Ingresa el número de pares y el sistema te mostrará qué comprar.</p>',
      attachTo: { element: '[data-tour="compras-contenido"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
