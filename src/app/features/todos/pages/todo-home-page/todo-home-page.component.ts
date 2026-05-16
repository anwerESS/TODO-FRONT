import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

import { TodoService } from '../../../../core/services/todo.service';
import {
  DEFAULT_TODO_FILTERS,
  TodoFilters,
  TodoFiltersComponent,
} from '../../components/todo-filters/todo-filters.component';
import { TodoListItemComponent } from '../../components/todo-list-item/todo-list-item.component';

@Component({
  selector: 'app-todo-home-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    RouterLink,
    TodoFiltersComponent,
    TodoListItemComponent,
  ],
  templateUrl: './todo-home-page.component.html',
  styleUrl: './todo-home-page.component.scss',
})
export class TodoHomePageComponent {
  private readonly todoService = inject(TodoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly filters = signal<TodoFilters>(DEFAULT_TODO_FILTERS);
  readonly loading = this.todoService.loading;
  readonly error = this.todoService.error;
  readonly totalCount = this.todoService.count;
  readonly activeCount = this.todoService.activeCount;
  readonly completedCount = this.todoService.completedCount;

  readonly filteredTodos = computed(() => {
    const filters = this.filters();
    const searchTerm = filters.search.trim().toLowerCase();

    return this.todoService.todos().filter((todo) => {
      const matchesSearch =
        !searchTerm ||
        todo.title.toLowerCase().includes(searchTerm) ||
        (todo.description ?? '').toLowerCase().includes(searchTerm);

      const matchesPriority = filters.priority === 'ALL' || todo.priority === filters.priority;
      const matchesCompletion =
        filters.completion === 'all' ||
        (filters.completion === 'completed' ? todo.completed : !todo.completed);

      return matchesSearch && matchesPriority && matchesCompletion;
    });
  });

  constructor() {
    this.reloadTodos();
  }

  reloadTodos(): void {
    this.todoService
      .loadTodos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  updateFilters(filters: TodoFilters): void {
    this.filters.set(filters);
  }

  deleteTodo(id: number): void {
    this.todoService
      .remove(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  toggleCompleted(id: number): void {
    this.todoService
      .toggleCompleted(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }
}
