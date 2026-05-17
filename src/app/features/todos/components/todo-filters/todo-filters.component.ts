import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { TodoPriority } from '../../../../core/models/todo-priority.enum';
import { TodoPriorityDirective } from '../../../../shared/directives/todo-priority.directive';
import { TodoPriorityLabelPipe } from '../../../../shared/pipes/todo-priority-label.pipe';

export type TodoCompletionFilter = 'all' | 'active' | 'completed';
export type TodoPriorityFilter = TodoPriority | 'ALL';

export interface TodoFilters {
  search: string;
  priority: TodoPriorityFilter;
  completion: TodoCompletionFilter;
}

export const DEFAULT_TODO_FILTERS: TodoFilters = {
  search: '',
  priority: 'ALL',
  completion: 'all',
};

@Component({
  selector: 'app-todo-filters',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TodoPriorityDirective,
    TodoPriorityLabelPipe,
  ],
  templateUrl: './todo-filters.component.html',
  styleUrl: './todo-filters.component.scss',
})
export class TodoFiltersComponent {
  private readonly formBuilder = inject(FormBuilder);

  readonly filtersChange = output<TodoFilters>();
  readonly priorities = Object.values(TodoPriority);

  readonly form = this.formBuilder.nonNullable.group({
    search: DEFAULT_TODO_FILTERS.search,
    priority: DEFAULT_TODO_FILTERS.priority,
    completion: DEFAULT_TODO_FILTERS.completion,
  });

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.emitFilters());
  }

  reset(): void {
    this.form.reset(DEFAULT_TODO_FILTERS);
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit(this.form.getRawValue());
  }
}
