import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getInventarioTourSteps(): StepOptions[] {
  return [
    {
      id: 'inventario-intro',
      title: 'Módulo de Inventario',
      text: '<p>Controla el stock de productos disponibles. Puedes ver el estado de cada referencia, filtrar por talla o color y registrar ajustes de inventario.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'inventario-alertas',
      title: 'Tarjetas de alerta',
      text: '<p>Estas tres tarjetas te muestran: productos sin stock, productos bajo el mínimo y el total de referencias. Haz clic en cada una para filtrar el inventario automáticamente.</p>',
      attachTo: { element: '[data-tour="inventario-alertas"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'inventario-filtros',
      title: 'Filtros de inventario',
      text: '<p>Filtra por nombre, talla, color o estado (disponible / sin stock / bajo mínimo). También puedes cambiar entre vista de tarjetas o tabla según tu preferencia.</p>',
      attachTo: { element: '[data-tour="inventario-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'inventario-productos',
      title: 'Catálogo de productos',
      text: '<p>Aquí ves cada referencia con su talla, color, stock actual y stock mínimo. Los productos en rojo están agotados; los en amarillo están por debajo del mínimo.</p>',
      attachTo: { element: '[data-tour="inventario-productos"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'inventario-ajuste',
      title: 'Ajuste de stock',
      text: '<p>Como administrador, puedes ajustar el stock manualmente haciendo clic en el ícono de ajuste de cada producto. Indica si es una entrada o salida y el motivo.</p>',
      attachTo: { element: '[data-tour="inventario-productos"]', on: 'left' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'inventario-movimientos',
      title: 'Historial de movimientos',
      text: '<p>El enlace "Movimientos" te lleva al historial completo de entradas y salidas de inventario, con fechas, cantidades y motivos de cada ajuste.</p>',
      attachTo: { element: '[data-tour="inventario-movimientos-link"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
