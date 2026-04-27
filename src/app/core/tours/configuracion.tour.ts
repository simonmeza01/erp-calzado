import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getConfiguracionTourSteps(): StepOptions[] {
  return [
    {
      id: 'configuracion-intro',
      title: 'Configuración del sistema',
      text: '<p>Esta sección muestra la configuración general del sistema: datos de la empresa, tasa BCV activa y la información del usuario en sesión.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'configuracion-empresa',
      title: 'Datos de la empresa',
      text: '<p>Aquí se muestran los datos registrados de la empresa: nombre, RIF, dirección y contacto. Estos datos aparecen en los documentos generados por el sistema.</p>',
      attachTo: { element: '[data-tour="configuracion-empresa"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'configuracion-bcv',
      title: 'Tasa BCV',
      text: '<p>Muestra la tasa de cambio BCV actual que el sistema usa para convertir entre USD y Bs. Esta tasa se actualiza automáticamente desde la API del BCV.</p>',
      attachTo: { element: '[data-tour="configuracion-bcv"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'configuracion-usuario',
      title: 'Usuario en sesión',
      text: '<p>Información del usuario actualmente conectado: nombre, correo y rol. El rol define qué módulos y acciones puedes realizar en el sistema.</p>',
      attachTo: { element: '[data-tour="configuracion-usuario"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
