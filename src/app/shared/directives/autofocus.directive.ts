import { afterNextRender, Directive, ElementRef, inject, input } from '@angular/core';

// Directive appAutofocus pour focus automatiquement le champ titre sur la page création
@Directive({
  selector: '[appAutofocus]',
})
export class AutofocusDirective {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly enabled = input(true, { alias: 'appAutofocus' });

  constructor() {
    afterNextRender(() => {
      if (this.enabled()) {
        this.elementRef.nativeElement.focus({ preventScroll: true });
      }
    });
  }
}
