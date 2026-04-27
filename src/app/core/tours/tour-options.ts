import type { StepOptions, StepOptionsButton, Tour } from 'shepherd.js';

export const defaultStepOptions: StepOptions = {
  cancelIcon: { enabled: true },
  scrollTo: { behavior: 'smooth', block: 'center' },
};

export const tourButtons = {
  back: {
    classes: 'shepherd-btn-back',
    text: '← Anterior',
    action(this: Tour) { this.back(); },
  } satisfies StepOptionsButton,
  next: {
    classes: 'shepherd-btn-next',
    text: 'Siguiente →',
    action(this: Tour) { this.next(); },
  } satisfies StepOptionsButton,
  done: {
    classes: 'shepherd-btn-next',
    text: '¡Entendido!',
    action(this: Tour) { this.next(); },
  } satisfies StepOptionsButton,
  cancel: {
    classes: 'shepherd-btn-cancel',
    text: 'Saltar tour',
    action(this: Tour) { this.cancel(); },
  } satisfies StepOptionsButton,
};
