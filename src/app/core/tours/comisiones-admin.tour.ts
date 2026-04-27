import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getComisionesAdminTourSteps(): StepOptions[] {
  return [
    {
      id: 'comisiones-admin-intro',
      title: 'Gestión de Comisiones',
      text: '<p>Como administrador tienes control total sobre las comisiones de todos los vendedores. Puedes ver el resumen global, ajustar porcentajes individualmente, marcar comisiones como pagadas y configurar las tasas por método de pago.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'comisiones-admin-kpis',
      title: 'Resumen global',
      text: '<p>Estas cuatro tarjetas muestran el panorama completo: <strong>Total generado</strong> en comisiones, monto ya <strong>pagado a vendedores</strong>, monto aún <strong>pendiente de pago</strong> y el conteo de registros totales.</p>',
      attachTo: { element: '[data-tour="comisiones-admin-kpis"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-admin-filtros',
      title: 'Filtros avanzados',
      text: '<p>Filtra por <strong>vendedor</strong>, <strong>estado de pago</strong> (pagada o pendiente) y <strong>método de pago</strong> que originó la comisión. Combínalos para encontrar registros específicos rápidamente.</p>',
      attachTo: { element: '[data-tour="comisiones-admin-filtros"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-admin-tabla',
      title: 'Tabla de comisiones',
      text: '<p>Cada fila muestra el pedido, cliente, vendedor, método de pago y los porcentajes. La columna <strong>"% Original"</strong> es el calculado automáticamente y <strong>"% Final"</strong> es el que aplica actualmente. Si un admin lo modificó aparece el ícono de edición.</p>',
      attachTo: { element: '[data-tour="comisiones-admin-tabla"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-admin-editar',
      title: 'Editar porcentaje',
      text: '<p>Haz clic en el botón de lápiz de cualquier fila para editar el <strong>porcentaje de comisión final</strong>. El monto en USD se recalcula automáticamente. Solo el administrador puede hacer este ajuste; el vendedor verá el porcentaje original tachado junto al nuevo.</p>',
      attachTo: { element: '[data-tour="comisiones-admin-tabla"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-admin-pagada',
      title: 'Marcar como pagada',
      text: '<p>El toggle <strong>"Pagada"</strong> en cada fila controla si ya le transferiste la comisión al vendedor. Al activarlo se registra la fecha de pago automáticamente. El vendedor verá el estado actualizado en su vista de "Mis Comisiones".</p>',
      attachTo: { element: '[data-tour="comisiones-admin-tabla"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'comisiones-admin-config',
      title: 'Configuración de tasas',
      text: '<p>Esta sección te permite definir los porcentajes de comisión para cada método de pago. Hay dos columnas: <strong>"Sin descuento"</strong> (cuando el pedido no tuvo descuentos) y <strong>"Con descuento"</strong> (cuando hubo descuentos aplicados, generalmente menor). Los cambios aplican a las comisiones futuras.</p>',
      attachTo: { element: '[data-tour="comisiones-admin-config"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
