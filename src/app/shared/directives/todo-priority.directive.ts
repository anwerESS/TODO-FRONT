import { Directive, HostBinding, input } from '@angular/core';

import { TodoPriority } from '../../core/models/todo-priority.enum';

// Directive appTodoPriority pour centraliser les classes/attributs CSS de priorité.
@Directive({
  selector: '[appTodoPriority]',
})
export class TodoPriorityDirective {
  readonly priority = input<TodoPriority | 'ALL' | null | undefined>(undefined, {
    alias: 'appTodoPriority',
  });

  @HostBinding('attr.data-priority')
  get dataPriority(): TodoPriority | null {
    const priority = this.priority();
    return priority && priority !== 'ALL' ? priority : null;
  }

  @HostBinding('class.priority-pill--low')
  get isLowPriority(): boolean {
    return this.priority() === TodoPriority.LOW;
  }

  @HostBinding('class.priority-pill--medium')
  get isMediumPriority(): boolean {
    return this.priority() === TodoPriority.MEDIUM;
  }

  @HostBinding('class.priority-pill--high')
  get isHighPriority(): boolean {
    return this.priority() === TodoPriority.HIGH;
  }
}
