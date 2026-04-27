import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getMapaTourSteps(): StepOptions[] {
  return [
    {
      id: 'mapa-intro',
      title: 'Mapa de Clientes',
      text: '<p>Visualiza la ubicación de tus clientes en el mapa y planifica tu ruta de visitas del día. Puedes filtrar por vendedor y ver diferentes modos de visualización.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'mapa-panel',
      title: 'Panel de clientes',
      text: '<p>Este panel muestra la lista de clientes en el mapa. Puedes seleccionar un vendedor para ver solo su cartera y usar los filtros rápidos para encontrar clientes específicos.</p>',
      attachTo: { element: '[data-tour="mapa-panel"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'mapa-modos',
      title: 'Modos de visualización',
      text: '<p>Cambia entre diferentes vistas: <strong>Pines</strong> (ubicaciones individuales), <strong>Ruta</strong> (trazado de ruta optimizada), <strong>Calor</strong> (concentración de clientes) y <strong>Sin visitar</strong> (clientes pendientes de visita).</p>',
      attachTo: { element: '[data-tour="mapa-modos"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'mapa-container',
      title: 'Mapa interactivo',
      text: '<p>Usa el mapa para navegar por las zonas. Haz clic en cualquier marcador para ver la información del cliente. Puedes hacer zoom con la rueda del mouse o los controles del mapa.</p>',
      attachTo: { element: '#map-container', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
