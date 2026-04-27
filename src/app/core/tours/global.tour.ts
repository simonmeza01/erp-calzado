import type { StepOptions } from 'shepherd.js';
import { tourButtons } from './tour-options';

export function getGlobalTourSteps(rol: string): StepOptions[] {
  const isVendedor = rol === 'vendedor';
  const isAdmin    = rol === 'admin';

  const steps: StepOptions[] = [
    {
      id: 'global-bienvenida',
      title: '👢 ¡Bienvenido a BootERP!',
      text: `<p>Este es el sistema de gestión para tu empresa de calzado.</p>
             <p style="margin-top:8px">Este breve tour te mostrará las partes principales de la aplicación para que puedas comenzar a usarla rápidamente.</p>`,
      buttons: [tourButtons.cancel, tourButtons.next],
    },
    {
      id: 'global-sidebar',
      title: 'Menú de navegación',
      text: '<p>Aquí encuentras todos los módulos disponibles según tu rol. Haz clic en cualquier sección para navegar entre ellas.</p>',
      attachTo: { element: '[data-tour="sidebar-nav"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-sidebar-bcv',
      title: 'Tasa BCV',
      text: '<p>Este indicador muestra la tasa de cambio oficial del Banco Central de Venezuela. Se actualiza automáticamente y se usa en todos los cálculos en bolívares.</p>',
      attachTo: { element: '[data-tour="sidebar-bcv"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-sidebar-user',
      title: 'Tu perfil',
      text: '<p>Aquí ves tu nombre y rol dentro del sistema. El rol determina qué módulos y acciones tienes disponibles.</p>',
      attachTo: { element: '[data-tour="sidebar-user"]', on: 'right' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-header-title',
      title: 'Título de página',
      text: '<p>Siempre sabrás en qué módulo estás gracias al título que se muestra aquí.</p>',
      attachTo: { element: '[data-tour="header-title"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-header-notifications',
      title: 'Notificaciones',
      text: '<p>El ícono de campana te avisa cuando hay pedidos próximos a vencer o situaciones que requieren tu atención. El número en rojo indica alertas pendientes.</p>',
      attachTo: { element: '[data-tour="header-notifications"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-header-help',
      title: 'Botón de ayuda',
      text: '<p>¡Este botón es tu mejor amigo! Haz clic aquí en cualquier momento para ver el tutorial del módulo actual o repetir este tour general.</p>',
      attachTo: { element: '[data-tour="header-help"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-header-user',
      title: 'Menú de usuario',
      text: '<p>Haz clic en tus iniciales para ver opciones de cuenta. Desde aquí puedes cerrar sesión de forma segura.</p>',
      attachTo: { element: '[data-tour="header-user-menu"]', on: 'bottom' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-content',
      title: 'Área de trabajo',
      text: '<p>Todo el contenido de cada módulo aparece aquí. Las tablas, formularios, gráficos y demás elementos de cada sección se cargan en esta área central.</p>',
      attachTo: { element: '[data-tour="main-content"]', on: 'top' },
      buttons: [tourButtons.back, tourButtons.next],
    },
    {
      id: 'global-fin',
      title: '¡Listo para empezar!',
      text: `<p>Ya conoces lo básico de BootERP. Cada módulo tiene su propio tutorial detallado que puedes activar con el botón <strong>?</strong> del encabezado.</p>
             <p style="margin-top:8px">¡Comienza explorando ${isVendedor ? 'tus <strong>Clientes</strong>' : isAdmin ? 'el <strong>Dashboard</strong>' : 'los <strong>Pedidos</strong>'}!</p>`,
      buttons: [tourButtons.back, tourButtons.done],
    },
  ];

  return steps;
}
