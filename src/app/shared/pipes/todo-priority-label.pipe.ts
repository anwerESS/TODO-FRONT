import { Pipe, PipeTransform } from '@angular/core';

import { TodoPriority } from '../../core/models/todo-priority.enum';

@Pipe({
  name: 'todoPriorityLabel',
})
export class TodoPriorityLabelPipe implements PipeTransform {
  transform(priority: TodoPriority | 'ALL' | null | undefined): string {
    switch (priority) {
      case TodoPriority.LOW:
        return 'Low';
      case TodoPriority.MEDIUM:
        return 'Medium';
      case TodoPriority.HIGH:
        return 'High';
      case 'ALL':
        return 'All priorities';
      case null:
      case undefined:
        return 'No priority';
    }
  }
}
