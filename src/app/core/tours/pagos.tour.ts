import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getPagosTourSteps(): StepOptions[] {
  return [
    {
      id: 'pagos-intro',
      title: 'Registrar Pago',
      text: '<p>Desde aquí puedes registrar los pagos recibidos de clientes. Selecciona el pedido, el tipo de pago y el monto para dejarlo asentado en el sistema.</p>',
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'pagos-form',
      title: 'Formulario de pago',
      text: `<p>Completa los campos del pago:</p>
             <ul style="margin-top:6px;padding-left:16px;line-height:1.8">
               <li><strong>Pedido:</strong> selecciona el pedido que se está pagando</li>
               <li><strong>Tipo:</strong> efectivo, transferencia o cheque</li>
               <li><strong>Moneda:</strong> USD o Bs</li>
               <li><strong>Monto:</strong> la cantidad recibida</li>
               <li><strong>Banco:</strong> entidad bancaria (para transferencias)</li>
             </ul>`,
      attachTo: { element: '[data-tour="pagos-form"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];
}
