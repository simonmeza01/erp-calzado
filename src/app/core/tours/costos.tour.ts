import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getCostosTourSteps(): StepOptions[] {
  return [
    {
      id: 'costos-intro',
      title: 'Costos y Utilidad',
      text: '<p>Este módulo te da visibilidad completa sobre la <strong>rentabilidad real</strong> del negocio. Aquí puedes gestionar los costos de fabricación por producto y ver la utilidad neta de cada pedido después de restar IVA, costos y comisiones.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'costos-kpis',
      title: 'Indicadores de rentabilidad',
      text: '<p>Las cuatro tarjetas resumen: <strong>Ventas totales</strong> (precio de venta bruto), <strong>Utilidad neta</strong> (lo que realmente queda), <strong>Margen promedio</strong> (en % sobre ventas) y <strong>Costo total</strong> de fabricación acumulado.</p>',
      attachTo: { element: '[data-tour="costos-kpis"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'costos-tab-utilidad',
      title: 'Utilidad por pedido',
      text: '<p>La primera pestaña muestra la <strong>tabla de rentabilidad por pedido</strong>. Para cada pedido activo verás el desglose: precio de venta, IVA descontado, costo de fabricación descontado, comisión descontada, y el resultado final de <strong>Utilidad Neta</strong> con su margen en porcentaje.</p>',
      attachTo: { element: '[data-tour="costos-tabla-utilidad"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'costos-margen-colores',
      title: 'Semáforo de margen',
      text: '<p>El porcentaje de margen usa un código de colores: <span style="color:#059669">verde ≥ 30%</span> (excelente), <span style="color:#2563eb">azul ≥ 15%</span> (bueno), <span style="color:#d97706">ámbar ≥ 0%</span> (ajustado) y <span style="color:#dc2626">rojo</span> (pérdida). Úsalo para identificar pedidos problemáticos.</p>',
      attachTo: { element: '[data-tour="costos-tabla-utilidad"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'costos-tab-productos',
      title: 'Editor de costos de productos',
      text: '<p>La segunda pestaña te permite actualizar el <strong>costo de fabricación por unidad</strong> de cada producto. Modifica el valor en la columna "Costo USD" — el margen bruto del producto se actualiza al instante. Cuando termines, haz clic en <strong>"Guardar cambios"</strong> para confirmar.</p>',
      attachTo: { element: '[data-tour="costos-editor-productos"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'costos-formula',
      title: 'Fórmula de utilidad',
      text: '<p>La utilidad neta se calcula como:<br><br><strong>Utilidad = Precio Venta − IVA − Costo Fabricación − Comisión</strong><br><br>Para que el cálculo sea preciso, asegúrate de que los productos tengan costos actualizados y de que cada pedido tenga su comisión registrada.</p>',
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
